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

const DetailsPresent = ({
	proposalData: proposalDataProp,
	token,
	uid,
	proposalTypeDescription,
	lmiDescription,
}: {
	token: string
	uid: string
	lmiDescription?: string
	proposalData: ProposalDataType
	proposalTypeDescription?: string
}) => {
	const session = useSession()
	const role = (session.data as any)?.role

	const [proposalData, setProposalData] =
		React.useState<ProposalDataType>(proposalDataProp)
	const [isModalOpen, setIsModalOpen] = React.useState(false)
	const [pdfUrl, setPdfUrl] = React.useState<string | undefined>(undefined)

	const proposalSituation = proposalData?.history[0]?.status

	console.log('proposalData', proposalData)

	async function refetchProposalData() {
		const response = await getProposalByUid(token, uid)

		if (response) {
			setProposalData(response.data)
		}
	}

	async function sendToEndinFlow() {
		const response = await postStatus(token, uid, 6, 'Formulário aceito')

		console.log('post sendToEndinFlow', response)

		if (response) {
			if (response.success) {
				refetchProposalData()
			} else {
				console.error(response.message)
			}
		}
	}

	const handleViewArchive = React.useCallback(async () => {
		setIsModalOpen(opt => true)

		const response = await getProposalSignByUid(token, uid)

		if (!response) return

		setPdfUrl(createPdfUrlFromBase64(response.data))
	}, [token, uid])

	const lastSituation: {
		id: number
		description: string
	} | null = proposalData.history?.at(0)?.status ?? {
		id: 10,
		description: 'Aguardando Preenchimento do DPS',
	}

	const showFillOutAlert: boolean =
		// lastSituation?.id === 3 ||
		lastSituation?.id === 5 || lastSituation?.id === 10

	return (
		<div className="flex flex-col gap-5 p-5">
			{showFillOutAlert && (
				<div className="px-3 py-2 flex flex-row justify-between items-center gap-5 w-full max-w-7xl mx-auto bg-orange-300/40 border border-orange-300/80 rounded-xl">
					<div>
						<h4 className="text-base font-semibold text-orange-600">
							Ações pendentes
						</h4>
						<p className="ml-3 text-base text-orange-400">
							{lastSituation?.description}
						</p>
					</div>
					{lastSituation?.id === 10 && (
						<Button
							className="bg-orange-600 hover:bg-orange-500 hover:text-white"
							asChild
						>
							<Link href={`/dps/fill-out/form/${uid}`}>Preencher</Link>
						</Button>
					)}
				</div>
			)}

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
						{/* <div className="mt-4 flex gap-5 text-muted-foreground [&>div]:flex [&>div]:gap-2">
						<DataCard>LMI: {lmiDescription}</DataCard>
						<DataCard>
							<FileTextIcon />
							{proposalTypeDescription}
						</DataCard>
						<DataCard>
							<UserIcon />
							{formatCpf(proposalData.customer.document)}
						</DataCard>
					</div> */}
						<div className="mt-4 flex gap-5 text-muted-foreground">
							<DetailDataCard label="Prazo" value={lmiDescription}>
								<CalendarIcon />
							</DetailDataCard>
							<DetailDataCard
								label="Tipo Imóvel"
								value={proposalTypeDescription}
							>
								<Building2Icon />
							</DetailDataCard>
							<DetailDataCard
								label="Valor DFI"
								value={formatCpf(proposalData.customer.document)}
							>
								<DollarSignIcon />
							</DetailDataCard>
							<DetailDataCard
								label="Valor da contratação"
								value={'R$ 320.000,00'}
							>
								<DollarSignIcon />
							</DetailDataCard>
						</div>

						<div className="flex flex-col gap-3">
							{proposalSituation?.id === 4 &&
								(role === 'SUBSCRITOR' || role === 'ADMIN') && (
									<Button onClick={sendToEndinFlow}>
										Enviar para aceitação
									</Button>
								)}

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
						<DetailDataCard label="Telefone" value={'-'}>
							<PhoneIcon />
						</DetailDataCard>
						<DetailDataCard label="Sexo" value={'-'}>
							<UserRoundIcon />
						</DetailDataCard>
					</div>
				</div>
			</div>

			<Interactions
				token={token}
				uid={uid}
				proposalSituationId={
					lastSituation?.id === 4 && (role === 'SUBSCRITOR' || role === 'ADMIN')
						? lastSituation?.id
						: lastSituation?.id === 5 &&
						  (role === 'SUBSCRITOR-MED' || role === 'ADMIN')
						? lastSituation?.id
						: undefined
				}
				data={proposalData.history ?? []}
				onNewInteraction={refetchProposalData}
			/>

			<MedReports
				token={token}
				uid={uid}
				userRole={role}
				dpsStatus={lastSituation.id}
			/>

			<DfiReports
				token={token}
				uid={uid}
				userRole={role}
				dpsStatus={lastSituation.id}
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
