import React from 'react'
import {
	getPrazosOptions,
	getProductList,
	getProponentDataByCpf,
	getProposals,
	getTipoImovelOptions,
} from '../../actions'
import { redirect } from 'next/navigation'
import getServerSessionAuthorization from '@/hooks/getServerSessionAuthorization'
import DpsInitialForm from '../components/dps-initial-form'
import validateCpf from 'validar-cpf'


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
	// const lmi = isNaN(+searchParams.lmi) ? undefined : +searchParams.lmi
	// const produto = searchParams.produto

	if (cpf && (cpf.length < 11 || !validateCpf(cpf))) redirect('/dps/fill-out')

	const [
		data,
		prazosOptionsRaw,
		tipoImovelOptionsRaw,
		productListRaw,
		proponentDataRaw,
	] = await Promise.all([
		cpf ? getProposals(token, cpf) : null,
		getPrazosOptions(token),
		getTipoImovelOptions(token),
		getProductList(token),
		cpf ? getProponentDataByCpf(cpf) : null,
	])

	console.dir(proponentDataRaw, { depth: Infinity })

	const prazosOptions =
		prazosOptionsRaw?.data.map(item => ({
			value: item.id.toString(),
			label: item.description,
		})) ?? []

	const productOptions =
		productListRaw?.data.map(item => ({
			value: item.uid,
			label: item.name,
		})) ?? []

	const tipoImovelOptions =
		tipoImovelOptionsRaw?.data.map(item => ({
			value: item.id.toString(),
			label: item.description,
		})) ?? []

	let proposalData

	if (cpf && cpf.length >= 11 && data) {
		proposalData = data.totalItems > 0 ? data.items?.[0] : null
	}

	const proponentDataBirthdateAux = proponentDataRaw?.detalhes.nascimento
		? proponentDataRaw?.detalhes.nascimento.split('/')
		: undefined

	const proponentDataBirthdate = proponentDataBirthdateAux
		? new Date(
				Number(proponentDataBirthdateAux[2]),
				Number(proponentDataBirthdateAux[1]) - 1,
				Number(proponentDataBirthdateAux[0])
		  )
		: undefined

	const autocompleteData = {
		cpf: proponentDataRaw?.detalhes.cpf,
		name: proponentDataRaw?.detalhes.nome,
		socialName: undefined,
		birthdate: proponentDataBirthdate,
		gender: proponentDataRaw?.detalhes.sexo,
		email: undefined,
		phone: undefined,
	}

	return (
		// <DpsForm
		// 	initialProposalData={proposalData}
		// 	initialHealthData={healthData?.data}
		// 	lmiOptions={lmiOptions}
		// 	productOptions={productOptions}
		// 	autocompleteData={autocompleteData}
		// />
		<div className="p-5">
			<div className="p-9 mt-8 w-full max-w-7xl mx-auto bg-white rounded-3xl">
				<DpsInitialForm
					data={{
						profile: {
							cpf: cpf,
							name: autocompleteData?.name,
							socialName: autocompleteData?.socialName,
							email: autocompleteData?.email,
							gender: autocompleteData?.gender,
							birthdate: autocompleteData?.birthdate
								? new Date(autocompleteData.birthdate)
								: undefined,

						},
					}}
					prazosOptions={prazosOptions}
					productOptions={productOptions}
					tipoImovelOptions={tipoImovelOptions}
				/>
			</div>
		</div>
	)
}
