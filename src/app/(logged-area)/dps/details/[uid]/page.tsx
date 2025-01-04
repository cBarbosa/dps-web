import { getProposalByUid, getTipoImovelOptions } from '../../actions'
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
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
		// proposalSituationsRaw,
		propertyTypesRaw,
	] = await Promise.all([
		getProposalByUid(token, uid),
		// getProposalSituations(token),
		getTipoImovelOptions(token),
	])
	console.dir(proposalDataRaw, { depth: Infinity })

	const proposalData = proposalDataRaw?.data

	// const proposalSituation = proposalData?.history[0]?.status
	const propertyType = propertyTypesRaw?.data.find(
		item => item.id === proposalData?.propertyTypeId
	)

	if (!proposalData) redirect('/dashboard')

	return (
		<DetailsPresent
			token={token}
			uid={uid}
			proposalData={proposalData}
			propertyTypeDescription={propertyType?.description}
		/>
	)
}
