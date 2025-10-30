import { getParticipantsByOperation, getProposalByUid, getTipoImovelOptions } from '../../actions'
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

	// Fetch participants data with individual status
	let participantsData = null
	
	if (proposalData.contractNumber) {
		try {
			const participantsResponse = await getParticipantsByOperation(token, proposalData.contractNumber)
			
			if (participantsResponse?.success && participantsResponse?.data && participantsResponse.data.length > 0) {
				// Buscar status individual de cada participante
				participantsData = await Promise.all(
					participantsResponse.data.map(async (participant: any) => {
						const participantDetail = await getProposalByUid(token, participant.uid)
						return {
							...participant,
							status: participantDetail?.data?.status,
							dfiStatus: participantDetail?.data?.dfiStatus
						}
					})
				)
			}
		} catch (error) {
			console.error('Erro ao buscar participantes:', error)
		}
	}

	return (
		<DetailsPresent
			token={token}
			uid={uid}
			proposalData={proposalData}
			propertyTypeDescription={propertyType?.description}
			participants={participantsData}
		/>
	)
}
