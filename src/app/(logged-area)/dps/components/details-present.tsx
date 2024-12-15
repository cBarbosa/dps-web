'use client'
import React from 'react'
import { Badge } from '@/components/ui/badge'
import { GoBackButton } from '@/components/ui/go-back-button'
import {
	Building2Icon,
	CalendarIcon,
	DollarSignIcon,
	FileTextIcon,
	IdCardIcon,
	PhoneIcon,
	Undo2Icon,
	UserIcon,
	UserRoundIcon,
} from 'lucide-react'
import { getProposalByUid, getProposalSignByUid, postStatus } from '../actions'
import { formatCpf } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Interactions from './interactions'
import MedReports from './med-reports'
import { createPdfUrlFromBase64, DialogShowArchive } from './dialog-archive'
import { useSession } from 'next-auth/react'
import { DataCard } from '../../components/data-card'
import DfiReports from './dfi-reports'

type ProposalDataType = NonNullable<
	Awaited<ReturnType<typeof getProposalByUid>>
>['data']

export const statusDescriptionDict: Record<number, string> = {
	10: 'Aguardando preenchimento da DPS',
	19: 'DPS Cadastrada',
	20: 'DPS Enviada para assinatura',
	21: 'DPS Assinada',
	22: 'DPS Recusada',
	23: 'DPS Cancelada por decurso',
	30: 'Enviado para avaliação',
	31: 'Complemento solicitado',
	33: 'Enviado para subscrição',
	34: 'DFI Avaliada',
}

const DetailsPresent = ({
	proposalData: proposalDataProp,
	token,
	uid,
	propertyTypeDescription,
}: {
	token: string
	uid: string
	proposalData: ProposalDataType
	propertyTypeDescription?: string
}) => {
	const session = useSession()
	const role = (session.data as any)?.role

	const [proposalData, setProposalData] =
		React.useState<ProposalDataType>(proposalDataProp)
	const [isModalOpen, setIsModalOpen] = React.useState(false)
	const [pdfUrl, setPdfUrl] = React.useState<string | undefined>(undefined)

	const proposalSituation = proposalData?.status

	console.log('proposalData', proposalData)

	async function refetchProposalData() {
		const response = await getProposalByUid(token, uid)

		if (response) {
			setProposalData(response.data)
		}
	}

	const handleViewArchive = React.useCallback(async () => {
		setIsModalOpen(opt => true)

		const response = await getProposalSignByUid(token, uid)

		if (!response) return

		setPdfUrl(createPdfUrlFromBase64(response.data))
	}, [token, uid])

	const lastSituation: number | undefined =
		proposalData.history?.at(0)?.statusId

	const showFillOutAlert: boolean =
		// lastSituation?.id === 3 ||
		proposalSituation.id === 5 ||
		proposalSituation.id === 10 ||
		proposalData.uploadMIP ||
		proposalData.uploadDFI

	return (
		<div className="flex flex-col gap-5 p-5">
			<div className="px-5 py-7 w-full max-w-7xl mx-auto bg-white rounded-3xl">
				<GoBackButton>
					<Undo2Icon className="mr-2" />
					Voltar
				</GoBackButton>

				<div className="mx-5 mt-2">
					<div className="w-full flex justify-between items-center">
						<h4 className="text-lg text-primary">
							Detalhes da DPS
							<Badge shape="pill" variant="warn" className="ml-4">
								{proposalSituation?.description ?? 'Estado desconhecido'}
							</Badge>
						</h4>
						<span className="font-mono text-sm text-gray-500">
							{proposalData.code}
						</span>
					</div>

					<h5 className="text-xl my-4">Produto: {proposalData.product.name}</h5>

					<div className="flex gap-6 justify-between items-center">
						<div className="mt-4 flex gap-5 text-muted-foreground">
							<DetailDataCard
								label="Prazo"
								value={proposalData.deadLine?.description}
							>
								<CalendarIcon />
							</DetailDataCard>
							<DetailDataCard
								label="Tipo Imóvel"
								value={propertyTypeDescription}
							>
								<Building2Icon />
							</DetailDataCard>
							<DetailDataCard
								label="Valor DFI"
								value={Intl.NumberFormat('pt-BR', {
									style: 'currency',
									currency: 'BRL',
								}).format(proposalData.capitalDFI)}
							>
								<DollarSignIcon />
							</DetailDataCard>
							<DetailDataCard
								label="Valor da contratação"
								value={Intl.NumberFormat('pt-BR', {
									style: 'currency',
									currency: 'BRL',
								}).format(proposalData.capitalMIP)}
							>
								<DollarSignIcon />
							</DetailDataCard>
						</div>

						<div className="flex flex-col gap-3">
							<Button
								onClick={handleViewArchive}
								disabled={
									proposalSituation?.id === 10 || proposalSituation.id === 3
								}
							>
								Visualizar DPS
							</Button>
						</div>
					</div>
				</div>
			</div>

			<div className="px-5 py-7 w-full max-w-7xl mx-auto bg-white rounded-3xl">
				<div className="mx-5 mt-2">
					<h4 className="text-lg text-primary">Detalhes do Proponente</h4>

					<h5 className="text-xl mt-4 mb-8">
						{proposalData.customer.name}{' '}
						<span className="text-base text-muted-foreground">
							{' '}
							- {proposalData.customer.email}
						</span>
					</h5>

					<div className="mt-4 flex gap-5 text-muted-foreground">
						<DetailDataCard
							label="Nascimento"
							value={new Date(
								proposalData.customer.birthdate
							).toLocaleDateString('pt-BR')}
						>
							<CalendarIcon />
						</DetailDataCard>
						<DetailDataCard
							label="CPF"
							value={formatCpf(proposalData.customer.document)}
						>
							<IdCardIcon />
						</DetailDataCard>
						<DetailDataCard
							label="Telefone"
							value={proposalData.customer.cellphone}
						>
							<PhoneIcon />
						</DetailDataCard>
						<DetailDataCard
							label="Sexo"
							value={
								proposalData.customer.gender === 'M' ? 'Masculino' : 'Feminino'
							}
						>
							<UserRoundIcon />
						</DetailDataCard>
					</div>
				</div>
			</div>

			{showFillOutAlert && (
				<div className="px-3 py-2 flex flex-row justify-between items-center gap-5 w-full max-w-7xl mx-auto bg-orange-300/40 border border-orange-300/80 rounded-xl">
					<div>
						<h4 className="text-base font-semibold text-orange-600">
							Ações pendentes
						</h4>
						<ul className="ml-5 text-base text-orange-400 list-disc">
							{proposalSituation.id === 5 || proposalSituation.id === 10 ? (
								<li>{statusDescriptionDict[proposalSituation.id]}</li>
							) : null}
							{proposalData.uploadMIP ? (
								<li>{'Upload de laudos/complementos MIP.'}</li>
							) : null}
							{proposalData.uploadDFI ? (
								<li>{'Upload de laudos DFI.'}</li>
							) : null}
							{proposalSituation.id === 25 ? (
								<li>
									Exame de Sangue¹ + Exame de Urina I + Teste Ergométrico +
									Ecocardiograma + ECG
								</li>
							) : null}
							{proposalSituation.id === 26 ? (
								<>
									<li>
										Exame de Sangue¹ + Exame de Urina I + Teste Ergométrico +
										Ecocardiograma + ECG + USG Abdome (Superior) Total e
										próstata
									</li>
									<li>Para Homens acima de 50 anos: Todos acima + PSA</li>
									<li>
										Para Mulheres acima de 50 anos: Todos acima + CA 19-9 + CA
										125 + Papanicolau + US mama
									</li>
								</>
							) : null}
						</ul>
					</div>
					{proposalSituation.id === 10 && (
						<Button
							className="bg-orange-600 hover:bg-orange-500 hover:text-white"
							asChild
						>
							<Link href={`/dps/fill-out/form/${uid}`}>Preencher</Link>
						</Button>
					)}
				</div>
			)}

			<MedReports
				token={token}
				uid={uid}
				userRole={role}
				requireUpload={proposalData.uploadMIP}
				dpsStatus={proposalData.status?.id}
				onConfirm={refetchProposalData}
			/>

			<DfiReports
				token={token}
				uid={uid}
				userRole={role}
				requireUpload={proposalData.uploadDFI}
				dfiStatus={proposalData.dfiStatus?.id}
				onConfirm={refetchProposalData}
			/>

			<Interactions
				token={token}
				uid={uid}
				proposalSituationId={
					lastSituation === 4 && (role === 'SUBSCRITOR' || role === 'ADMIN')
						? lastSituation
						: lastSituation === 5 &&
						  (role === 'SUBSCRITOR-MED' || role === 'ADMIN')
						? lastSituation
						: undefined
				}
				data={proposalData.history ?? []}
				onNewInteraction={refetchProposalData}
			/>

			<DialogShowArchive
				isModalOpen={isModalOpen}
				setIsModalOpen={setIsModalOpen}
				pdfUrl={pdfUrl}
			/>
		</div>
	)
}

export default DetailsPresent

function DetailDataCard({
	children,
	label,
	value,
}: {
	children: React.ReactNode
	label: React.ReactNode
	value: React.ReactNode
}) {
	return (
		<DataCard className="flex items-center gap-2">
			<div className="text-green-950">{children}</div>
			<div>
				<p className="text-xs text-primary">{label}</p>
				<p className="text-sm text-green-950">{value}</p>
			</div>
		</DataCard>
	)
}
