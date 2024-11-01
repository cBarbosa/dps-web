import React from 'react'
import DpsForm from '../components/dps-form'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options'
import { getLmiOptions, getProductList, getProposals } from '../../actions'
import { redirect } from 'next/navigation'

export default async function DpsFormPage({
	searchParams,
}: {
	searchParams: { cpf: string; lmi: string; produto: string }
}) {
	const session = await getServerSession(authOptions)
	const token = (session as any)?.accessToken

	const cpf = searchParams.cpf
	const lmi = isNaN(+searchParams.lmi) ? undefined : +searchParams.lmi
	const produto = searchParams.produto

	const [data, lmiOptionsRaw, productListRaw] = await Promise.all([
		cpf && lmi && produto ? getProposals(token, cpf, lmi, produto) : null,
		getLmiOptions(token),
		getProductList(token),
	])
	console.log('||||||||->>')
	console.dir(data, { depth: Infinity })

	const lmiOptions =
		lmiOptionsRaw?.data.map(item => ({
			value: item.id.toString(),
			label: item.description,
		})) ?? []

	const productOptions =
		productListRaw?.data.map(item => ({
			value: item.uid,
			label: item.name,
		})) ?? []

	let proposalData

	if (cpf && cpf.length >= 11) {
		if (data) {
			proposalData = data.totalItems > 0 ? data.items?.[0] : null
		}
	}
	console.log('proposalData', proposalData)

	return (
		<DpsForm
			initialProposalData={proposalData}
			lmiOptions={lmiOptions}
			productOptions={productOptions}
		/>
	)
}
