import React from 'react'
import DpsForm from '../components/dps-form'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options'
import {
	getHealthDataByUid,
	getLmiOptions,
	getProductList,
	getProponentDataByCpf,
	getProposals,
} from '../../actions'
import { redirect } from 'next/navigation'
import getServerSessionAuthorization from '@/hooks/getServerSessionAuthorization'

export default async function DpsFormPage({
	searchParams,
}: {
	searchParams: { cpf: string; lmi: string; produto: string }
}) {
	const { session, granted } = await getServerSessionAuthorization(['vendedor'])
	const token = session?.accessToken ?? ''

	if (!granted) {
		redirect('/dashboard')
	}

	const cpf = searchParams.cpf
	const lmi = isNaN(+searchParams.lmi) ? undefined : +searchParams.lmi
	const produto = searchParams.produto

	if (!cpf || !produto || !lmi) redirect('/dps/fill-out')

	const [data, lmiOptionsRaw, productListRaw, proponentDataRaw] =
		await Promise.all([
			cpf && lmi && produto ? getProposals(token, cpf, lmi, produto) : null,
			getLmiOptions(token),
			getProductList(token),
			cpf ? getProponentDataByCpf(cpf) : null,
		])
	console.log('||||||||->>')
	console.dir(proponentDataRaw, { depth: Infinity })

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

	if (cpf && cpf.length >= 11 && data) {
		proposalData = data.totalItems > 0 ? data.items?.[0] : null
	}

	const healthData = proposalData?.uid
		? await getHealthDataByUid(token, proposalData.uid)
		: undefined

	/*

						produto: initialProposalData.product.uid,
						lmi: initialProposalData.lmi.description,
						cpf: initialProposalData.customer.document,
						name: initialProposalData.customer.name,
						socialName: initialProposalData.customer.name,
						birthdate: new Date(initialProposalData.customer.birthdate),
						profession: '',
						email: initialProposalData.customer.email,
						phone: '',

		*/

	// @ts-expect-error known issue
	const proponentDataBirthdateAux = proponentDataRaw?.detalhes?.nascimento
		? // @ts-expect-error known issue
		  proponentDataRaw.detalhes.nascimento.split('/')
		: undefined
	const proponentDataBirthdate = proponentDataBirthdateAux
		? new Date(
				proponentDataBirthdateAux[2],
				proponentDataBirthdateAux[1] - 1,
				proponentDataBirthdateAux[0]
		  )
		: undefined

	const autocompleteData = {
		// @ts-expect-error known issue
		cpf: proponentDataRaw?.detalhes?.cpf,
		// @ts-expect-error known issue
		name: proponentDataRaw?.detalhes?.nome,
		socialName: undefined,
		birthdate: proponentDataBirthdate,
		// @ts-expect-error known issue
		profession: proponentDataRaw.detalhes?.profissao,
		email: undefined,
		phone: undefined,
	}

	console.log('autocompleteData', autocompleteData)

	return (
		<DpsForm
			initialProposalData={proposalData}
			initialHealthData={healthData?.data}
			lmiOptions={lmiOptions}
			productOptions={productOptions}
			autocompleteData={autocompleteData}
		/>
	)
}
