import { Button } from '@/components/ui/button'
import Interactions from '../../components/interactions'
import { Badge } from '@/components/ui/badge'
import { FileTextIcon, Undo2Icon, UserIcon } from 'lucide-react'
import {
	getLmiOptions,
	getProposalByUid,
	getProposalSituations,
	getProposalTypes,
} from '../../actions'
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options'
import { getServerSession } from 'next-auth'
import { redirect, useRouter } from 'next/navigation'
import { formatCpf } from '@/lib/utils'
import { GoBackButton } from '@/components/ui/go-back-button'

export default async function DetailPage({
	params: { uid },
}: {
	params: { uid: string }
}) {
	const session = await getServerSession(authOptions)
	const token = (session as any)?.accessToken

	const [
		proposalDataRaw,
		lmiOptionsRaw,
		proposalSituationsRaw,
		proposalTypesRaw,
	] = await Promise.all([
		getProposalByUid(token, uid),
		getLmiOptions(token),
		getProposalSituations(token),
		getProposalTypes(token),
	])
	console.log('----------proposalData')
	console.dir(proposalDataRaw, { depth: Infinity })

	const proposalData = proposalDataRaw?.data
	const lmi = lmiOptionsRaw?.data.find(item => item.id === proposalData?.lmi.id)
	const proposalSituation = proposalSituationsRaw?.data.find(
		item => item.id === proposalData?.type.id
	)
	const proposalType = proposalTypesRaw?.data.find(
		item => item.id === proposalData?.type.id
	)

	if (!proposalData) redirect('/dashboard')

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
							<div>LMI: {lmi?.description}</div>
							<div>
								<FileTextIcon />
								{proposalType?.description}
							</div>
							<div>
								<UserIcon />
								{formatCpf(proposalData.customer.document)}
							</div>
						</div>
					</div>
					<Button>Visualizar DPS</Button>
				</div>
			</div>{' '}
			<div className="p-5 w-full max-w-7xl mx-auto bg-white rounded-3xl">
				<h4 className="text-lg text-primary mb-2">Interações</h4>
				<Interactions data={proposalData.history ?? []} />
			</div>
		</div>
	)
}
