'use client'

import React, { useEffect, useState } from 'react'
import DpsProfileForm, { ProfileForm } from './dps-profile-form'
import DpsHealthForm, { HealthForm } from './dps-health-form'
import { UserIcon } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import DpsAttachmentsForm, { AttachmentsForm } from './dps-attachments-form'
import Link from 'next/link'

export const diseaseNames = {
	'1': 'Acidente Vascular Cerebral',
	'2': 'AIDS',
	'3': 'Alzheimer',
	'4': 'Arteriais Crônicas',
	'5': 'Chagas',
	'6': 'Cirrose Hepática e Varizes de Estômago',
	'7': 'Diabetes com complicações',
	'8': 'Enfisema Pulmonar e Asma',
	'9': 'Esclerose Múltipla',
	'10': 'Espondilose Anquilosante',
	'11': 'Hipertensão, Infarto do Miocárdio ou outras doenças cardiocirculatórias',
	'12': 'Insuficiência Coronariana',
	'13': 'L.E.R.',
	'14': 'Lúpus',
	'15': 'Neurológicas ou Psiquiátricas - (vertigem, desmaio, convulsão, dificuldade de fala, doenças ou alterações mentais ou de nervos)',
	'16': 'Parkinson',
	'17': 'Renal Crônica (com ou sem hemodiálise)',
	'18': 'Sequelas de Acidente Vascular Celebral',
	'19': 'Shistosomose',
	'20': 'Tireóide ou outras Doenças Endócrinas com complicações',
	'21': 'Tumores Malignos e Câncer',
}

export type DiseaseKeys = keyof typeof diseaseNames

const DpsForm = ({
	autocompleteData,
	initialProposalData,
	initialHealthData: initialHealthDataProp,
	lmiOptions,
	productOptions,
}: {
	autocompleteData?: {
		cpf?: string
		name?: string
		socialName?: string
		birthdate?: Date | string
		profession?: string
		email?: string
		phone?: string
	}
	initialProposalData?: {
		uid: string
		code: string
		createdAt: string
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
			id: number
			description: string
		}
		status: {
			id: number
			description: string
		}
		lmi: {
			code: number
			description: string
		}
	} | null
	initialHealthData?: {
		code: string
		question: string
		exists: boolean
		created: string
		updated?: string
	}[]
	lmiOptions: { value: string; label: string }[]
	productOptions: { value: string; label: string }[]
}) => {
	const params = useSearchParams()
	const cpf = params.get('cpf') ?? ''
	const lmi = params.get('lmi') ?? ''
	const produto = params.get('produto') ?? ''

	console.log(params)

	const initialHealthData = initialHealthDataProp
		? Object.keys(diseaseNames).reduce((acc, curr) => {
				if (initialHealthDataProp[+curr])
					return {
						...acc,
						[initialHealthDataProp[+curr].code]: {
							has: initialHealthDataProp[+curr].exists ? 'yes' : 'no',
							description: '',
						},
					}
				return acc
		  }, {} as HealthForm)
		: undefined
	console.log('initialHealthDataProp', initialHealthDataProp)

	let initialStep: 'profile' | 'health' | 'attachments' | 'finished'

	if (!initialProposalData) initialStep = 'profile'
	else if (initialProposalData?.status.id === 10) initialStep = 'health'
	else if (initialProposalData?.status.id === 5) initialStep = 'attachments'
	else initialStep = 'finished'

	const [step, setStep] = useState<
		'profile' | 'health' | 'attachments' | 'finished'
	>(initialStep)

	const [dpsData, setDpsData] = useState<{
		profile: ProfileForm | null | undefined
		health: HealthForm | null | undefined
		attachments: AttachmentsForm | null | undefined
	}>({
		profile: initialProposalData?.customer
			? {
					produto: initialProposalData.product.uid,
					lmi: initialProposalData.lmi.code?.toString(),
					cpf: initialProposalData.customer.document,
					name: initialProposalData.customer.name,
					socialName: initialProposalData.customer.socialName ?? '',
					birthdate: new Date(initialProposalData.customer.birthdate),
					profession: '',
					email: initialProposalData.customer.email,
					phone: '',
			  }
			: undefined,
		health: initialHealthData,
		attachments: undefined,
	})

	useEffect(() => {
		if (initialProposalData !== undefined) {
			if (initialProposalData)
				setDpsData(prev => ({
					...prev,
					profile: {
						produto: initialProposalData.product.uid,
						lmi: initialProposalData.lmi.description,
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

	const diseaseList = dpsData.health
		? Object.entries(dpsData.health)
				.filter(([key, value]) => value.has === 'yes')
				.reduce(
					(acc, [currKey, currValue]) => ({
						...acc,
						[currKey]: {
							has: currValue.has === 'yes',
							description: currValue.description ?? '',
						},
					}),
					{}
				)
		: []

	// {
	// 	chagas: { has: true, description: 'teste' },
	// 	ler: { has: true, description: 'teste' },
	// 	neurologicas: { has: true, description: 'teste' },
	// 	tireoide: { has: true, description: 'teste' },
	// }

	function handleProfileSubmit(v: ProfileForm) {
		setDpsData(prev => ({ ...prev, profile: v }))
		setStep('health')
	}
	function handleHealthSubmit(v: HealthForm) {
		setDpsData(prev => ({ ...prev, health: v }))
		const hasSomeDesease = Object.entries(v).some(x => x[1].has === 'yes')
		setStep(hasSomeDesease ? 'attachments' : 'finished')
	}
	function handleAttachmentsSubmit(v: AttachmentsForm) {
		setDpsData(prev => ({ ...prev, attachments: v }))
		setStep('finished')
	}

	let formToDisplay

	if (!dpsData.profile) {
		formToDisplay = (
			<div className="p-9 mt-8 w-full max-w-7xl mx-auto bg-white rounded-3xl">
				<DpsProfileForm
					data={{
						cpf: cpf,
						lmi: lmi,
						produto: produto,
						name: autocompleteData?.name,
						socialName: autocompleteData?.socialName,
						email: autocompleteData?.email,
						birthdate: autocompleteData?.birthdate
							? new Date(autocompleteData.birthdate)
							: undefined,
						profession: autocompleteData?.profession,
						phone: autocompleteData?.phone,
					}}
					lmiOptions={lmiOptions}
					productOptions={productOptions}
					onSubmit={handleProfileSubmit}
				/>
			</div>
		)
	} else if (step === 'health') {
		formToDisplay = (
			<>
				<div className="p-9 mt-8 w-full max-w-7xl mx-auto bg-white rounded-3xl">
					<DpsProfileData data={dpsData.profile} />
				</div>
				<div className="p-9 mt-8 w-full max-w-7xl mx-auto bg-white rounded-3xl">
					<DpsHealthForm
						initialHealthData={dpsData.health}
						proposalUid={initialProposalData?.uid}
						dpsProfileData={dpsData.profile}
						autocomplete={initialHealthDataProp?.[0].updated !== undefined}
						onSubmit={handleHealthSubmit}
					/>
				</div>
			</>
		)
	} else if (step === 'attachments') {
		formToDisplay = (
			<>
				<div className="p-9 mt-8 w-full max-w-7xl mx-auto bg-white rounded-3xl">
					<DpsProfileData data={dpsData.profile} />
				</div>
				<div className="p-9 mt-8 w-full max-w-7xl mx-auto bg-white rounded-3xl">
					<DpsAttachmentsForm
						onSubmit={handleAttachmentsSubmit}
						proposalUid={initialProposalData?.uid}
						dpsProfileData={dpsData.profile}
						setStep={setStep}
						diseaseList={diseaseList}
					/>
				</div>
			</>
		)
	} else if (step === 'finished') {
		formToDisplay = (
			<>
				<div className="p-9 mt-8 w-full max-w-7xl mx-auto bg-white rounded-3xl">
					<DpsProfileData data={dpsData.profile} />
				</div>
				<div className="p-9 mt-8 w-full max-w-7xl mx-auto bg-white rounded-3xl">
					Preenchimento de DPS realizado com sucesso, encaminhado para
					assinatura do proponente.{' '}
					<Link href={`/dps/details/${initialProposalData?.uid}`}>
						Ver detalhes
					</Link>
				</div>
			</>
		)
	}

	return (
		<div className="p-5">
			{/* {dpsData.profile === undefined
				? 'undefined'
				: dpsData.profile === null
				? 'null'
				: 'value'} */}
			{formToDisplay}
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
