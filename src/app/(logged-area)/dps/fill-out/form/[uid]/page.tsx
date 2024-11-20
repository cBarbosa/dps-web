import React from 'react'
import DpsForm from '../../components/dps-form'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options'
import {
	getHealthDataByUid,
	getLmiOptions,
	getProductList,
	getProponentDataByCpf,
	getProposalByUid,
	getProposals,
} from '../../../actions'
import { redirect } from 'next/navigation'
import getServerSessionAuthorization from '@/hooks/getServerSessionAuthorization'

export default async function DpsFormPage({
	params: { uid },
}: {
	params: { uid: string }
}) {
	const { session, granted } = await getServerSessionAuthorization(['vendedor'])
	const token = session?.accessToken ?? ''

	if (!granted) {
		redirect('/dashboard')
	}

	if (!uid) redirect('/dps/fill-out')

	const [proposalDataRaw, healthData] = await Promise.all([
		getProposalByUid(token, uid),
		getHealthDataByUid(token, uid),
	])
	console.log('||||||||->>')
	console.dir(proposalDataRaw, { depth: Infinity })

	if (proposalDataRaw == null || proposalDataRaw.success === false)
		redirect('/dps/fill-out')

	const proposalData = proposalDataRaw.data

	return (
		<DpsForm
			initialProposalData={proposalData}
			initialHealthData={healthData?.data}
		/>
	)
}
