'use client'
import { Badge } from '@/components/ui/badge'
import { GoBackButton } from '@/components/ui/go-back-button'
import { FileTextIcon, Undo2Icon, UserIcon } from 'lucide-react'
import React from 'react'
import { getProposalByUid, getProposalTypes, postStatus } from '../actions'
import { formatCpf } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Interactions from './interactions'
import Archives from './archives'

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
	const [proposalData, setProposalData] =
		React.useState<ProposalDataType>(proposalDataProp)

	const proposalSituation = proposalData?.history[0]?.status

	async function refetchProposalData() {
		const response = await getProposalByUid(token, uid)

		if (response) {
			setProposalData(response.data)
		}
	}

	async function sendToEndinFlow() {

		const response = await postStatus(token, uid, 6, "Formulário aceito");

		console.log('post sendToEndinFlow', response)

		if (response) {
			if (response.success) {
				refetchProposalData();
			} else {
				console.error(response.message)
			}
		}
	};

	const lastSituation: {
		id: number
		description: string
	} | null = proposalData.history?.at(0)?.status ?? {
		id: 10,
		description: 'Aguardando Preenchimento do DPS'
	};

	const showAlert: boolean =
		// lastSituation?.id === 3 ||
		lastSituation?.id === 5 || lastSituation?.id === 10

	return (
		<div className="flex flex-col gap-5 p-5">
			<div className="p-5 w-full max-w-7xl mx-auto bg-white rounded-3xl">
				<GoBackButton>
					<Undo2Icon className="mr-2" />
					Voltar
				</GoBackButton>
				<div className="mx-5 my-3 flex gap-6 justify-between items-center">
					<div>
						<h4 className="text-lg text-primary">Detalhes da DPS</h4>
						<div className="text-sm">
							{proposalData.code}
							<Badge shape="pill" variant="warn" className="ml-4">
								{proposalSituation?.description ?? 'Estado desconhecido'}
							</Badge>
						</div>
						<div className="mt-4 flex gap-5 text-muted-foreground [&>div]:flex [&>div]:gap-2">
							<div>LMI: {lmiDescription}</div>
							<div>
								<FileTextIcon />
								{proposalTypeDescription}
							</div>
							<div>
								<UserIcon />
								{formatCpf(proposalData.customer.document)}
							</div>
						</div>
					</div>
					<div className="flex flex-col gap-3">
						{proposalSituation?.id === 4 ? (
							<Button
								onClick={sendToEndinFlow}
							>
								Enviar para aceitação
							</Button>
						) : null}
						<Button>Visualizar DPS</Button>
					</div>
				</div>
			</div>
			{showAlert && (
				<div className="flex flex-row justify-between items-center gap-5 p-5 w-full max-w-7xl mx-auto bg-orange-300/40 border border-orange-300/80 rounded-3xl">
					<div>
						<h4 className="text-lg text-orange-600 mb-2">Ações pendentes</h4>
						<p className="ml-3 text-base text-orange-400">
							{lastSituation?.description}
						</p>
					</div>
					{lastSituation?.id === 10 && (
						<Button
							className="bg-orange-600 hover:bg-orange-500 hover:text-white"
							asChild
						>
							<Link
								href={`/dps/fill-out/form?cpf=${proposalData.customer.document}&produto=${proposalData.product.uid}&lmi=${proposalData.lmi.id}`}
							>
								Preencher
							</Link>
						</Button>
					)}
				</div>
			)}
			<Interactions
				token={token}
				uid={uid}
				proposalSituationId={lastSituation?.id}
				data={proposalData.history ?? []}
				onNewInteraction={refetchProposalData}
			/>

			<Archives
				token={token}
				uid={uid}
				proposalSituationId={lastSituation?.id}
			/>
		</div>
	)
}

export default DetailsPresent
