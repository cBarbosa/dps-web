'use client'

import React, { useState } from 'react'
import DpsHealthForm, { HealthForm } from './dps-health-form'
import { UserIcon } from 'lucide-react'
import { useParams } from 'next/navigation'
import DpsAttachmentsForm, { AttachmentsForm } from './dps-attachments-form'
import Link from 'next/link'
import MedReports from '../../components/med-reports'
import { useSession } from 'next-auth/react'
import { DpsInitialForm } from './dps-initial-form'
import { ProposalByUid, signProposal } from '../../actions'

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
	'21': 'Tem deficiência de órgãos, membros ou sentidos? Se SIM, especificar abaixo qual é o grau de deficiência e redução.',
	'22': 'Nos últimos cinco anos, submeteu-se a tratamento cirúrgico, cateterismo ou hospitalizou-se por período superior a dez dias; realizou ourealiza exames de controle de qualquer natureza por uma ou mais vezes ao ano pela mesma doença? Se sim, especificar.',
	'23': 'Encontra-se aposentado por invalidez? Se SIM, especifique no campo abaixo a natureza ou causa da invalidez e o ano em que passou areceber o benefício da Previdência Social.',
	'24': 'Pratica de forma amadora ou profissional, esporte(s) radical(is) ou perigoso(s)? Se SIM, informar qual(is) e sua periodicidade?',
	'25': 'Está de acordo para entrarmos em contato telefônico referente ao seu estado de saúde, se necessário? Se sim, preencher com o número de telefone (DDD+número)',
	telefoneContato: 'Telefone de Contato',
}

/* export const diseaseNames = {
	'1': 'Sofre ou sofreu nos últimos cinco anos de doença que o tenha levado ao médico entre duas ou mais vezes no decorrer deste período eutilizado medicação para o controle dessa doença? Se sim, especificar e detalhar.',
	'2': 'Tem deficiência de órgãos, membros ou sentidos? Se SIM, especificar abaixo qual é o grau de deficiência e redução.',
	'3': 'Nos últimos cinco anos, submeteu-se a tratamento cirúrgico, cateterismo ou hospitalizou-se por período superior a dez dias; realizou ourealiza exames de controle de qualquer natureza por uma ou mais vezes ao ano pela mesma doença? Se sim, especificar.',
	'4': 'Encontra-se aposentado por invalidez? Se SIM, especifique no campo abaixo a natureza ou causa da invalidez e o ano em que passou areceber o benefício da Previdência Social.',
	'5': 'Pratica de forma amadora ou profissional, esporte(s) radical(is) ou perigoso(s)? Se SIM, informar qual(is) e sua periodicidade?',
	'6': 'Está de acordo para entrarmos em contato telefônico referente ao seu estado de saúde, se necessário? Se sim, preencher com o número de telefone (DDD+número)',
	telefoneContato: 'Telefone de Contato',
}; */

export type DiseaseKeys = keyof typeof diseaseNames

const DpsForm = ({
	initialProposalData,
	initialHealthData: initialHealthDataProp,
}: {
	initialProposalData: ProposalByUid
	initialHealthData?: {
		code: string
		question: string
		exists: boolean
		created: string
		updated?: string
		description?: string
	}[]
}) => {
	const session = useSession()
	const token = (session.data as any)?.accessToken

	const params = useParams<{ uid: string }>()
	const uid = params.uid

	const initialHealthData = initialHealthDataProp
		? Object.keys(diseaseNames).reduce((acc, curr, i) => {
				if (initialHealthDataProp[i])
					return {
						...acc,
						[initialHealthDataProp[i].code]: {
							has: initialHealthDataProp[i].exists ? 'yes' : 'no',
							description: initialHealthDataProp[i].description ?? '',
						},
					}
				return acc
		  }, {} as HealthForm)
		: undefined

	let initialStep: 'health' | 'attachments' | 'finished'
	console.log('>:>>', initialProposalData)

	if (initialProposalData.status.id === 10) initialStep = 'health'
	else if (initialProposalData.status.id === 5) initialStep = 'attachments'
	else initialStep = 'finished'

	const [step, setStep] = useState<'health' | 'attachments' | 'finished'>(
		initialStep
	)

	const [dpsData, setDpsData] = useState<{
		uid?: string
		initial: DpsInitialForm
		health: HealthForm | null | undefined
		attachments: AttachmentsForm | null | undefined
	}>({
		uid: initialProposalData.uid,
		initial: {
			profile: {
				cpf: initialProposalData.customer.document,
				name: initialProposalData.customer.name,
				socialName: initialProposalData.customer.socialName ?? '',
				birthdate: new Date(initialProposalData.customer.birthdate),
				profession: '',
				email: initialProposalData.customer.email,
				phone: '',
				gender: '',
				participationPercentage: '100,00%',
			},
			product: {
				product: initialProposalData.product.uid,
				deadline: initialProposalData.deadLineId?.toString() ?? '',
				mip: '',
				dfi: '',
				propertyType: ''
			},
			operation: {
				operationNumber: '',
				participantsNumber: '',
				totalValue: ''
			},
			address: {
				zipcode: '',
				state: '',
				city: '',
				district: '',
				street: '',
				number: '',
				complement: ''
			}
		},
		health: initialHealthData,
		attachments: undefined,
	})

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

	async function handleHealthSubmit(v: HealthForm) {
		setDpsData(prev => ({ ...prev, health: v }))

		const responseSign = await signProposal(token, uid)
		console.log('post signProposal', responseSign)
		if (!responseSign) console.log(responseSign) //TODO add error alert

		setStep('finished')
	}
	function handleAttachmentsSubmit(v: AttachmentsForm) {
		setDpsData(prev => ({ ...prev, attachments: v }))
		setStep('finished')
	}

	let formToDisplay;

	if (step === 'health') {
		formToDisplay = (
			<>
				<div className="p-9 mt-8 w-full max-w-7xl mx-auto bg-white rounded-3xl">
					<DpsProfileData data={dpsData.initial.profile} />
				</div>
				<div className="p-9 mt-8 w-full max-w-7xl mx-auto bg-white rounded-3xl">
					<DpsHealthForm
						initialHealthData={dpsData.health}
						proposalUid={initialProposalData.uid}
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
					<DpsProfileData data={dpsData.initial.profile} />
				</div>
				<div className="p-9 my-8 w-full max-w-7xl mx-auto bg-white rounded-3xl">
					<DpsAttachmentsForm
						onSubmit={handleAttachmentsSubmit}
						proposalUid={initialProposalData.uid}
						dpsProfileData={dpsData.initial.profile}
						setStep={setStep}
						diseaseList={diseaseList}
					/>
				</div>

				<MedReports token={token} uid={uid} />
			</>
		)
	} else if (step === 'finished') {
		formToDisplay = (
			<>
				<div className="p-9 mt-8 w-full max-w-7xl mx-auto bg-white rounded-3xl">
					<DpsProfileData data={dpsData.initial.profile} />
				</div>
				<div className="p-9 mt-8 w-full max-w-7xl mx-auto bg-white rounded-3xl">
					Preenchimento de DPS realizado com sucesso, encaminhado para
					assinatura do proponente.{' '}
					<Link href={`/dps/details/${dpsData.uid}`}>Ver detalhes</Link>
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

function DpsProfileData({
	data,
}: {
	data: { cpf: string; name: string; birthdate: Date }
}) {
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
				<span className="grow-0 text-xs text-muted-foreground hidden">
					*dados recuperados automaticamente
				</span>
			</div>
		</div>
	)
}

export default DpsForm
