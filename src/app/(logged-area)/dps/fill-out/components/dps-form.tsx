'use client'

import React, { useState } from 'react'
import DpsHealthForm, { HealthForm, HealthFormHdiHomeEquity, HealthFormMagHabitacionalSimplified, HealthFormMagHabitacionalComplete } from './dps-health-form'
import { UserIcon } from 'lucide-react'
import { useParams } from 'next/navigation'
import DpsAttachmentsForm, { AttachmentsForm } from './dps-attachments-form'
import Link from 'next/link'
import MedReports from '../../components/med-reports'
import { useSession } from 'next-auth/react'
import { DpsInitialForm } from './dps-initial-form'
import { ProposalByUid, signProposal } from '../../actions'
import { isFhePoupexProduct, isHomeEquityProduct, isMagHabitacionalProduct, getDpsTypeByCapital } from '@/constants'


export const diseaseNamesHomeEquity = {
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
	'21': 'Tumores malignos e Câncer',
	'22': 'Tem deficiência de órgãos, membros ou sentidos? Se SIM, especificar abaixo qual é o grau de deficiência e redução.',
	'23': 'Nos últimos cinco anos, submeteu-se a tratamento cirúrgico, cateterismo ou hospitalizou-se por período superior a dez dias; realizou ourealiza exames de controle de qualquer natureza por uma ou mais vezes ao ano pela mesma doença? Se sim, especificar.',
	'24': 'Encontra-se aposentado por invalidez? Se SIM, especifique no campo abaixo a natureza ou causa da invalidez e o ano em que passou areceber o benefício da Previdência Social.',
	'25': 'Pratica de forma amadora ou profissional, esporte(s) radical(is) ou perigoso(s)? Se SIM, informar qual(is) e sua periodicidade?',
	'26': 'Está de acordo para entrarmos em contato telefônico referente ao seu estado de saúde, se necessário? Se sim, preencher com o número de telefone (DDD+número)',
};

export const diseaseNamesHabitacional = {
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
};

/* export const diseaseNames = {
	'1': 'Sofre ou sofreu nos últimos cinco anos de doença que o tenha levado ao médico entre duas ou mais vezes no decorrer deste período eutilizado medicação para o controle dessa doença? Se sim, especificar e detalhar.',
	'2': 'Tem deficiência de órgãos, membros ou sentidos? Se SIM, especificar abaixo qual é o grau de deficiência e redução.',
	'3': 'Nos últimos cinco anos, submeteu-se a tratamento cirúrgico, cateterismo ou hospitalizou-se por período superior a dez dias; realizou ourealiza exames de controle de qualquer natureza por uma ou mais vezes ao ano pela mesma doença? Se sim, especificar.',
	'4': 'Encontra-se aposentado por invalidez? Se SIM, especifique no campo abaixo a natureza ou causa da invalidez e o ano em que passou areceber o benefício da Previdência Social.',
	'5': 'Pratica de forma amadora ou profissional, esporte(s) radical(is) ou perigoso(s)? Se SIM, informar qual(is) e sua periodicidade?',
	'6': 'Está de acordo para entrarmos em contato telefônico referente ao seu estado de saúde, se necessário? Se sim, preencher com o número de telefone (DDD+número)',
	telefoneContato: 'Telefone de Contato',
}; */

export type DiseaseKeys = keyof typeof diseaseNamesHabitacional;

// DPS Simplificada MAG Habitacional - 1 questão de texto
export const diseaseNamesMagHabitacionalSimplified = {
	'1': 'O proponente apresenta qualquer problema de saúde que afete suas atividades profissionais, esteve internado, fez qualquer cirurgia/biópsia nos últimos três anos ou tem ainda, conhecimento de qualquer condição médica que possa resultar em uma hospitalização ou cirurgia nos próximos meses? Não Em caso afirmativo, especificar.'
};

// DPS Completa MAG Habitacional - 12 questões (10 Sim/Não + 2 texto)
export const diseaseNamesMagHabitacionalComplete = {
	'1': 'Encontra-se com algum problema de saúde ou faz uso de algum medicamento?',
	'2': 'Sofre ou já sofreu de doença crônica ou incurável, doenças do coração, hipertensão, circulatórias, do sangue, diabetes, pulmão, fígado, rins, infarto, acidente vascular cerebral, doenças do aparelho digestivo, algum tipo de hérnia, articulações, qualquer tipo de câncer, ou HIV?',
	'3': 'Sofre ou sofreu de deficiências de órgãos, membros ou sentidos, incluindo doenças ortopédicas ou relacionadas a esforço repetitivo (LER e DORT)?',
	'4': 'Fez alguma cirurgia, biópsia ou esteve internado nos últimos cinco anos? Ou está ciente de alguma condição médica que possa resultar em uma hospitalização ou cirurgia?',
	'5': 'Está afastado(a) do trabalho ou aposentado por doença ou invalidez?',
	'6': 'Pratica paraquedismo, motociclismo, boxe, asa delta, rodeio, alpinismo, voo livre, automobilismo, mergulho ou exerce atividade, em caráter profissional ou amador, a bordo de aeronaves, que não sejam de linhas regulares?',
	'7': 'É fumante? A quanto tempo?',
	'8': 'Apresenta, no momento, sintomas de gripe, febre, cansaço, tosse, coriza, dores pelo corpo, dor de cabeça, dor de garganta, falta de ar, perda de olfato, perda de paladar ou está aguardando resultado do teste da COVID19?',
	'9': 'Foi diagnosticado(a) com infecção pelo novo CORONAVÍRUS ou COVID-19?',
	'10': 'Apresenta, no momento, sequelas do COVID19 diferente de perda de olfato e/ou paladar?',
	'11': 'Qual sua altura (em metros)? Exemplo: 1,80',
	'12': 'Qual o seu peso (em kg)? Exemplo: 80'
};

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

	const productTypeDiseaseNames = isHomeEquityProduct(initialProposalData.product.name) || isFhePoupexProduct(initialProposalData.product.name);

	// Processamento dos dados de saúde inicial baseado no tipo de produto
	const initialHealthData = initialHealthDataProp
		? (() => {
			// Para MAG Habitacional, verificar se é simplificada ou completa
			const isMag = isMagHabitacionalProduct(initialProposalData.product.name);
			const magDpsType = isMag && initialProposalData.capitalMIP
				? getDpsTypeByCapital(initialProposalData.product.name, initialProposalData.capitalMIP)
				: 'complete';

			if (isMag && magDpsType === 'simplified') {
				// Para DPS simplificada, os dados vêm como array de objetos com exists e description
				return initialHealthDataProp.reduce((acc, item) => {
					return {
						...acc,
						[item.code]: {
							has: item.exists ? 'yes' : 'no',
							description: item.description ?? '',
						},
					};
				}, {} as HealthFormMagHabitacionalSimplified);
			} else {
				// Para outros produtos (incluindo MAG completa), usar processamento padrão
				return Object.keys(productTypeDiseaseNames ? diseaseNamesHomeEquity : diseaseNamesHabitacional).reduce((acc, curr, i) => {
					if (initialHealthDataProp[i])
						return {
							...acc,
							[initialHealthDataProp[i].code]: {
								has: initialHealthDataProp[i].exists ? 'yes' : 'no',
								description: initialHealthDataProp[i].description ?? '',
							},
						}
					return acc
				}, {} as HealthForm);
			}
		})()
		: undefined

	let initialStep: 'health' | 'attachments' | 'finished'

	if (initialProposalData.status.id === 10) initialStep = 'health'
	else if (initialProposalData.status.id === 5) initialStep = 'attachments'
	else initialStep = 'finished'

	const [step, setStep] = useState<'health' | 'attachments' | 'finished'>(
		initialStep
	)

	const [dpsData, setDpsData] = useState<{
		uid?: string
		initial: DpsInitialForm
		health: HealthForm | HealthFormHdiHomeEquity | HealthFormMagHabitacionalSimplified | HealthFormMagHabitacionalComplete | null | undefined
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
				participantsNumber: ''
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

	const diseaseList: Partial<Record<DiseaseKeys, { has: boolean; description: string }>> = dpsData.health
		? Object.entries(dpsData.health)
				.filter(([key, value]) => {
					// Para formulários yes/no, verificar se has === 'yes'
					// Para formulários de texto simples (MAG simplificada), verificar se há texto
					if (typeof value === 'string') {
						return value.trim() !== '';
					}
					if (value && typeof value === 'object' && 'has' in value) {
						return value.has === 'yes';
					}
					return false;
				})
				.reduce(
					(acc, [currKey, currValue]) => {
						// Para formulários yes/no
						if (currValue && typeof currValue === 'object' && 'has' in currValue) {
							return {
								...acc,
								[currKey]: {
									has: currValue.has === 'yes',
									description: currValue.description ?? '',
								},
							};
						}
						// Para formulários de texto simples
						if (typeof currValue === 'string') {
							return {
								...acc,
								[currKey]: {
									has: currValue.trim() !== '',
									description: currValue,
								},
							};
						}
						return acc;
					},
					{} as Partial<Record<DiseaseKeys, { has: boolean; description: string }>>
				)
		: {}


		// Omit<HealthForm, '26'>
		async function handleHealthSubmit(v: HealthForm | HealthFormHdiHomeEquity | HealthFormMagHabitacionalSimplified | HealthFormMagHabitacionalComplete) {
			try {
				setDpsData(prev => ({ ...prev, health: v }))
				const responseSign = await signProposal(token, uid)

				if (responseSign?.success) {
					setStep('finished')
				} else {
					console.error('Erro ao assinar proposta:', responseSign?.message)
				}
			} catch (error) {
				console.error('Erro ao submeter formulário:', error)
			}
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
						productName={initialProposalData.product.name}
						autocomplete={initialHealthDataProp?.[0].updated !== undefined}
						onSubmit={handleHealthSubmit}
						capitalMIP={initialProposalData.capitalMIP}
						dpsType={isMagHabitacionalProduct(initialProposalData.product.name) && initialProposalData.capitalMIP 
							? getDpsTypeByCapital(initialProposalData.product.name, initialProposalData.capitalMIP)
							: undefined}
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
