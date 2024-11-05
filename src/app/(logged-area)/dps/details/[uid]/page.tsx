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
import Link from 'next/link'
import NewInteractionDialog from '../../components/new-interaction-dialog'
import DetailsPresent from '../../components/details-present'

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
		// proposalSituationsRaw,
		proposalTypesRaw,
	] = await Promise.all([
		getProposalByUid(token, uid),
		getLmiOptions(token),
		// getProposalSituations(token),
		getProposalTypes(token),
	])
	console.log('----------proposalData')
	console.dir(proposalDataRaw, { depth: Infinity })

	const proposalData = proposalDataRaw?.data
	const lmi = lmiOptionsRaw?.data.find(item => item.id === proposalData?.lmi.id)
	// const proposalSituation = proposalData?.history[0]?.status
	const proposalType = proposalTypesRaw?.data.find(
		item => item.id === proposalData?.type.id
	)

	if (!proposalData) redirect('/dashboard')

	return (
		<DetailsPresent
			token={token}
			uid={uid}
			proposalData={proposalData}
			proposalTypeDescription={proposalType?.description}
			lmiDescription={lmi?.description}
		/>
	)
}
