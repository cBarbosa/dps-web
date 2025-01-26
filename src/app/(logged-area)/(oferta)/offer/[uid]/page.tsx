import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import React from 'react'
import OfferProfile from '../components/offer-profile'
import { getOfferDataByUid } from '../../actions'

export default async function OfferProfilePage({
	params: { uid },
}: {
	params: { uid: string }
}) {
	const session = await getServerSession(authOptions)
	const token = (session as any)?.accessToken

	const offerDataRaw = await getOfferDataByUid(token, uid)
	console.dir(offerDataRaw, { depth: Infinity })

	const offerData = offerDataRaw?.data

	if (!offerData) redirect('/dashboard')

	return <OfferProfile data={offerData} token={token} uid={uid} />
}
