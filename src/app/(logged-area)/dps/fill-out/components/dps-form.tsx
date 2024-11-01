'use client'
import React, { useEffect, useState } from 'react'
import DpsProfileForm, { ProfileForm } from './dps-profile-form'
import DpsHealthForm, { HealthForm } from './dps-health-form'
import { UserIcon } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

const DpsForm = ({
	initialProposalData,
}: {
	initialProposalData?: {
		uid: string
		code: string
		customer: {
			uid: string
			document: string
			name: string
			socialName?: string | null
			email: string
			birthdate: string
		}
		product: {
			uid: string
			name: string
		}
		type: {
			description: string
		}
		status: {
			description: string
		}
		lmi: {
			description: string
		}
	} | null
}) => {
	const params = useSearchParams()
	const cpf = params.get('cpf') ?? ''
	const lmi = params.get('lmi') ?? ''
	const produto = params.get('produto') ?? ''

	// const [step, setStep] = useState(
	// 	initialProposalData === null ? 'profile' : 'health'
	// )

	// useEffect(() => {
	// 	console.log('effect', [token, cpf, lmi, produto, initialProposalData])
	// 	if (initialProposalData && initialProposalData.customer.document === cpf) {
	// 		return
	// 	}
	// 	if (cpf && cpf.length >= 11) {
	// 		console.log('SEARCHING PROPOSALS')
	// 		getProposals(token, cpf, lmi, produto, 1, 10)
	// 			.then(response => {
	// 				console.log('response', response)

	// 				const customer = response.items[0]?.customer

	// 				if (customer)
	// 					setDpsData(prev => ({
	// 						...prev,
	// 						profile: {
	// 							cpf: customer.document,
	// 							name: customer.name,
	// 							socialName: customer.name,
	// 							birthdate: new Date(customer.birthdate),
	// 							profession: '',
	// 							email: customer.email,
	// 							phone: '',
	// 						},
	// 					}))
	// 				else setDpsData(prev => ({ ...prev, profile: null }))
	// 			})
	// 			.catch(err => {
	// 				setDpsData(prev => ({
	// 					...prev,
	// 					profile: undefined,
	// 				}))
	// 				console.log(err)
	// 			})
	// 	}
	// }, [token, cpf, lmi, produto, initialProposalData])

	const [dpsData, setDpsData] = useState<{
		profile: ProfileForm | null | undefined
		health: HealthForm | null | undefined
	}>({
		profile: initialProposalData?.customer
			? {
					cpf: initialProposalData.customer.document,
					name: initialProposalData.customer.name,
					socialName: initialProposalData.customer.socialName ?? '',
					birthdate: new Date(initialProposalData.customer.birthdate),
					profession: '',
					email: initialProposalData.customer.email,
					phone: '',
			  }
			: undefined,
		health: undefined,
	})

	useEffect(() => {
		if (initialProposalData !== undefined) {
			if (initialProposalData)
				setDpsData(prev => ({
					...prev,
					profile: {
						cpf: initialProposalData.customer.document,
						name: initialProposalData.customer.name,
						socialName: initialProposalData.customer.name,
						birthdate: new Date(initialProposalData.customer.birthdate),
						profession: '',
						email: initialProposalData.customer.email,
						phone: '',
					},
				}))
			else setDpsData(prev => ({ ...prev, profile: null }))
		} else setDpsData(prev => ({ ...prev, profile: undefined }))
	}, [initialProposalData])

	function handleProfileSubmit(v: ProfileForm) {
		setDpsData(prev => ({ ...prev, profile: v }))
		// setStep('health')
	}
	function handleHealthSubmit(v: HealthForm) {
		setDpsData(prev => ({ ...prev, health: v }))
	}

	return (
		<div>
			{dpsData.profile === undefined
				? 'undefined'
				: dpsData.profile === null
				? 'null'
				: 'value'}
			{dpsData.profile !== undefined &&
				(dpsData.profile === null ? (
					<div className="p-9 mt-8 w-full max-w-7xl mx-auto bg-white rounded-3xl">
						<DpsProfileForm
							data={{
								cpf: cpf,
							}}
							onSubmit={handleProfileSubmit}
						/>
					</div>
				) : (
					<>
						<div className="p-9 mt-8 w-full max-w-7xl mx-auto bg-white rounded-3xl">
							<DpsProfileData data={dpsData.profile} />
						</div>
						<div className="p-9 mt-8 w-full max-w-7xl mx-auto bg-white rounded-3xl">
							<DpsHealthForm onSubmit={handleHealthSubmit} />
						</div>
					</>
				))}
		</div>
	)
}

function DpsProfileData({ data }: { data: ProfileForm }) {
	return (
		<div className="px-3">
			<h3 className="text-primary text-lg">Dados do Proponente</h3>

			<div className="flex gap-4 my-4">
				<UserIcon size={48} className="grow-0 mr-2 text-primary" />
				<div className="grow">
					<div className="flex gap-5 text-muted-foreground text-sm">
						<span>CPF: {data.cpf}</span>
						<span>
							Nascimento: {data.birthdate.toLocaleDateString('pt-BR')}
						</span>
					</div>
					<span className="text-lg font-semibold">{data.name}</span>
				</div>
				<span className="grow-0 text-xs text-muted-foreground">
					*dados recuperados automaticamente
				</span>
			</div>
		</div>
	)
}

export default DpsForm
