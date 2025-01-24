import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import React from 'react'
import OfferProfile from '../components/offer-profile'

export default async function OfferProfilePage({
	params: { uid },
}: {
	params: { uid: string }
}) {
	const session = await getServerSession(authOptions)
	const token = (session as any)?.accessToken

	// const [
	// 	proposalDataRaw,
	// 	propertyTypesRaw,
	// ] = await Promise.all([
	// 	null, //getProposalByUid(token, uid),
	// 	null, //getTipoImovelOptions(token),
	// ])
	// console.dir(proposalDataRaw, { depth: Infinity })

	// const proposalData = proposalDataRaw?.data

	// if (!proposalData) redirect('/dashboard')

	return <OfferProfile token={token} uid={uid} />
}
