import React, { useCallback, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import ShareLine from '@/components/ui/share-line'
import { cn } from '@/lib/utils'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { isFhePoupexProduct, isHomeEquityProduct, isMagHabitacionalProduct, getDpsTypeByCapital } from '@/constants'

import {
	Control,
	Controller,
	FormState,
	useForm,
	UseFormSetValue,
	UseFormTrigger,
} from 'react-hook-form'
import {
	InferInput,
	literal,
	object,
	variant,
	pipe,
	nonEmpty,
	string,
	optional,
	check,
} from 'valibot'
import { postHealthDataByUid, postMagHabitacionalAutoApproval } from '../../actions'
import { useSession } from 'next-auth/react'
import { Loader2Icon } from 'lucide-react'
import {
	diseaseNamesHomeEquity,
	diseaseNamesHabitacional,
	diseaseNamesMagHabitacionalSimplified,
	diseaseNamesMagHabitacionalComplete
} from './dps-form';

const diseaseSchema = variant(
	'has',
	[
		object({
			has: literal('yes'),
			description: pipe(string(), nonEmpty('Campo obrigatório.')),
			// attachment: nonOptional(file('Arquivo inválido.'), 'Campo obrigatório.'),
		}),
		object({
			has: literal('no'),
			description: optional(string(), 'Não é necessário preencher.'),
			// attachment: undefined_('Não é necessário um arquivo.'),
		}),
	],
	'Campo obrigatório'
)

const productSchemaTop = {
	'1': diseaseSchema,
	'2': diseaseSchema,
	'3': diseaseSchema,
	'4': diseaseSchema,
	'5': diseaseSchema,
	'6': diseaseSchema,
	'7': diseaseSchema,
	'8': diseaseSchema,
	'9': diseaseSchema,
	'10': diseaseSchema,
	'11': diseaseSchema,
	'12': diseaseSchema,
	'13': diseaseSchema,
	'14': diseaseSchema,
	'15': diseaseSchema,
	'16': diseaseSchema,
	'17': diseaseSchema,
	'18': diseaseSchema,
	'19': diseaseSchema,
	'20': diseaseSchema,
	'21': diseaseSchema,
}

const productYelum = {
	'1': diseaseSchema,
	'2': diseaseSchema,
	'3': diseaseSchema,
	'4': diseaseSchema,
	'5': diseaseSchema,
	'6': diseaseSchema,
	telefoneContato: diseaseSchema,
}

const productYelumNovo = {
	'1': diseaseSchema,
	'2': diseaseSchema,
	'3': diseaseSchema,
	'4': diseaseSchema,
	'5': diseaseSchema,
	'6': diseaseSchema,
	'7': diseaseSchema,
	'8': diseaseSchema,
	'9': diseaseSchema,
	'10': diseaseSchema,
	'11': diseaseSchema,
	'12': diseaseSchema,
	'13': diseaseSchema,
	'14': diseaseSchema,
	'15': diseaseSchema,
	'16': diseaseSchema,
	'17': diseaseSchema,
	'18': diseaseSchema,
	'19': diseaseSchema,
	'20': diseaseSchema,
	'21': diseaseSchema,
	'22': diseaseSchema,
	'23': diseaseSchema,
	'24': diseaseSchema,
	'25': diseaseSchema
};

const productHdiHomeEquity = {
	'1': diseaseSchema,
	'2': diseaseSchema,
	'3': diseaseSchema,
	'4': diseaseSchema,
	'5': diseaseSchema,
	'6': diseaseSchema,
	'7': diseaseSchema,
	'8': diseaseSchema,
	'9': diseaseSchema,
	'10': diseaseSchema,
	'11': diseaseSchema,
	'12': diseaseSchema,
	'13': diseaseSchema,
	'14': diseaseSchema,
	'15': diseaseSchema,
	'16': diseaseSchema,
	'17': diseaseSchema,
	'18': diseaseSchema,
	'19': diseaseSchema,
	'20': diseaseSchema,
	'21': diseaseSchema,
	'22': diseaseSchema,
	'23': diseaseSchema,
	'24': diseaseSchema,
	'25': diseaseSchema,
	'26': diseaseSchema
};

// Schema para campo de texto simples (usado em DPS simplificada MAG Habitacional)
const textFieldSchema = optional(string(), '')

// Schema para campo de texto obrigatório (altura e peso no MAG Habitacional completo)
const requiredTextFieldSchema = string('Preencha o campo')

// Schema para DPS Simplificada MAG Habitacional (radio Sim/Não + textarea condicional)
const productMagHabitacionalSimplified = {
	'1': variant(
		'has',
		[
			object({
				has: literal('yes'),
				description: pipe(string('Preencha o campo'), nonEmpty('Preencha o campo'))
			}),
			object({
				has: literal('no'),
				description: optional(string(), '')
			}),
		],
		'Escolha a opção'
	)
};

// Schema para DPS Completa MAG Habitacional (10 yes/no + 2 texto obrigatório)
const productMagHabitacionalComplete = {
	'1': diseaseSchema, // Sim/Não
	'2': diseaseSchema, // Sim/Não
	'3': diseaseSchema, // Sim/Não
	'4': diseaseSchema, // Sim/Não
	'5': diseaseSchema, // Sim/Não
	'6': diseaseSchema, // Sim/Não
	'7': diseaseSchema, // Sim/Não
	'8': diseaseSchema, // Sim/Não
	'9': diseaseSchema, // Sim/Não - COVID
	'10': diseaseSchema, // Sim/Não - Sequelas COVID
	'11': requiredTextFieldSchema, // Texto obrigatório - Altura
	'12': requiredTextFieldSchema  // Texto obrigatório - Peso
};

const healthForm = object(productYelumNovo)
const healthFormHomeEquity = object(productHdiHomeEquity)
const healthFormMagHabitacionalSimplified = object(productMagHabitacionalSimplified)
const healthFormMagHabitacionalComplete = object(productMagHabitacionalComplete)

export type HealthForm = InferInput<typeof healthForm>
export type HealthFormHdiHomeEquity = InferInput<typeof healthFormHomeEquity>
export type HealthFormMagHabitacionalSimplified = InferInput<typeof healthFormMagHabitacionalSimplified>
export type HealthFormMagHabitacionalComplete = InferInput<typeof healthFormMagHabitacionalComplete>

const DpsHealthForm = ({
	onSubmit: onSubmitProp,
	proposalUid,
	productName,
	initialHealthData,
	autocomplete = false,
	capitalMIP,
	dpsType,
}: {
	onSubmit: (v: HealthForm | HealthFormHdiHomeEquity | HealthFormMagHabitacionalSimplified | HealthFormMagHabitacionalComplete) => void
	proposalUid: string
	productName: string
	autocomplete?: boolean
	initialHealthData?: HealthForm | HealthFormHdiHomeEquity | HealthFormMagHabitacionalSimplified | HealthFormMagHabitacionalComplete | null
	capitalMIP?: number
	dpsType?: 'simplified' | 'complete'
}) => {
	const session = useSession()
	const token = (session.data as any)?.accessToken

	const [submittingForm, setSubmittingForm] = React.useState(false)

	// Determinar tipo de DPS para MAG Habitacional
	const isMagHabitacional = isMagHabitacionalProduct(productName);
	const magDpsType = dpsType || (isMagHabitacional && capitalMIP ? getDpsTypeByCapital(productName, capitalMIP) : 'complete');
	
	// Selecionar schema apropriado
	const getSchema = () => {
		if (isMagHabitacional) {
			return magDpsType === 'simplified' ? healthFormMagHabitacionalSimplified : healthFormMagHabitacionalComplete;
		}
		if (isHomeEquityProduct(productName) || isFhePoupexProduct(productName)) {
			return healthFormHomeEquity;
		}
		return healthForm;
	};

	const {
		handleSubmit,
		getValues,
		trigger,
		setValue,
		control,
		reset,
		watch,
		formState: { isSubmitting, isSubmitted, errors, ...formState },
	} = useForm<HealthForm | HealthFormHdiHomeEquity | HealthFormMagHabitacionalSimplified | HealthFormMagHabitacionalComplete>({
		resolver: valibotResolver(getSchema()),
		defaultValues: autocomplete ? initialHealthData ?? undefined : undefined,
		disabled: submittingForm,
	})

	async function onSubmit(v: HealthForm | HealthFormHdiHomeEquity | HealthFormMagHabitacionalSimplified | HealthFormMagHabitacionalComplete) {
		console.log('Form submission started (internal)', v)
		setSubmittingForm(true)

		// Função auxiliar para obter texto da questão
		const getQuestionText = (key: string): string => {
			if (isMagHabitacional) {
				if (magDpsType === 'simplified') {
					return diseaseNamesMagHabitacionalSimplified[key as keyof typeof diseaseNamesMagHabitacionalSimplified] || '';
				} else {
					return diseaseNamesMagHabitacionalComplete[key as keyof typeof diseaseNamesMagHabitacionalComplete] || '';
				}
			}
			if (isHomeEquityProduct(productName) || isFhePoupexProduct(productName)) {
				return diseaseNamesHomeEquity[key as keyof typeof diseaseNamesHomeEquity] || '';
			}
			return diseaseNamesHabitacional[key as keyof typeof diseaseNamesHabitacional] || '';
		};

		const postData = Object.entries(v).map(([key, value]) => {
			// Para MAG Habitacional simplificada, value é objeto com has e description
			if (isMagHabitacional && magDpsType === 'simplified') {
				const val = value as { has: string; description: string };
				return {
					code: key,
					question: getQuestionText(key),
					exists: val.has === 'yes' || !!(val.description && val.description.trim() !== ''),
					created: new Date().toISOString(),
					description: val.description || '',
				};
			}
			
		// Para MAG Habitacional completa, alguns campos são texto puro
		if (isMagHabitacional && magDpsType === 'complete') {
			// Questões 11-12 são texto puro (Altura e Peso) - NÃO positivam a DPS
			if (['11', '12'].includes(key)) {
				return {
					code: key,
					question: getQuestionText(key),
					exists: false, // Sempre false para não positivar
					created: new Date().toISOString(),
					description: (value as string) || '',
				};
			}
			// Questões 1-10 são yes/no
			return {
				code: key,
				question: getQuestionText(key),
				exists: (value as any).has === 'yes',
				created: new Date().toISOString(),
				description: (value as any).description || '',
			};
		}
			
			// Para outros produtos (formato padrão)
			return {
				code: key,
				question: getQuestionText(key),
				exists: (value as any).has === 'yes',
				created: new Date().toISOString(),
				description: (value as any).description || '',
			};
		})

		console.log('postData', postData)

		try {
			const response = await postHealthDataByUid(token, proposalUid, postData)

			if (response) {
				if (response.success) {
					// Verificar se é MAG Habitacional e DPS não está positivada
					if (isMagHabitacional) {
						// Para simplificada, verificar se has === 'yes'
						// Para completa, verificar se exists === true
						const hasPositiveAnswers = magDpsType === 'simplified'
							? (v as any)['1']?.has === 'yes'
							: postData.some(item => item.exists === true);
						
						if (!hasPositiveAnswers) {
							// DPS não positivada - tentar aprovação automática
							try {
								const autoApprovalResponse = await postMagHabitacionalAutoApproval(token, proposalUid);
								if (autoApprovalResponse?.success) {
									console.log('DPS aprovada automaticamente para MAG Habitacional');
								} else {
									console.warn('Não foi possível aprovar automaticamente:', autoApprovalResponse?.message);
								}
							} catch (autoApprovalError) {
								console.error('Erro ao tentar aprovação automática:', autoApprovalError);
								// Continuar com o fluxo normal mesmo se a aprovação automática falhar
							}
						}
					}
					
					reset()
					setSubmittingForm(false)
					onSubmitProp(v)
				} else {
					//TODO add error alert
					console.error('Failed to post health data (internal):', response.message)
					setSubmittingForm(false)
				}
			} else {
				// Tratar caso onde response é null/undefined
				console.error('Nenhuma resposta recebida do servidor')
				setSubmittingForm(false)
			}
		} catch (error) {
			console.error('Erro ao enviar dados de saúde:', error)
			setSubmittingForm(false)
		}
	}

	const productTypeDiseaseNames = isHomeEquityProduct(productName) || isFhePoupexProduct(productName);

	// Obter questões apropriadas baseado no produto e tipo de DPS
	const getQuestions = () => {
		if (isMagHabitacional) {
			if (magDpsType === 'simplified') {
				return Object.keys(diseaseNamesMagHabitacionalSimplified);
			} else {
				return Object.keys(diseaseNamesMagHabitacionalComplete);
			}
		}
		if (productTypeDiseaseNames) {
			return Object.keys(healthFormHomeEquity.entries);
		}
		return Object.keys(healthForm.entries);
	};

	const getQuestionLabel = (key: string): string => {
		if (isMagHabitacional) {
			if (magDpsType === 'simplified') {
				return diseaseNamesMagHabitacionalSimplified[key as keyof typeof diseaseNamesMagHabitacionalSimplified] || '';
			} else {
				return diseaseNamesMagHabitacionalComplete[key as keyof typeof diseaseNamesMagHabitacionalComplete] || '';
			}
		}
		if (productTypeDiseaseNames) {
			return diseaseNamesHomeEquity[key as keyof typeof diseaseNamesHomeEquity] || '';
		}
		return diseaseNamesHabitacional[key as keyof typeof diseaseNamesHabitacional] || '';
	};

	const questions = getQuestions();
	const isSimplifiedMag = isMagHabitacional && magDpsType === 'simplified';
	const isCompleteMag = isMagHabitacional && magDpsType === 'complete';

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className="flex flex-col gap-6 w-full"
		>
			<h3 className="text-primary text-lg">Formulário Saúde {productName}</h3>
			{isMagHabitacional && magDpsType === 'simplified' ? (
				<div>
					Preencha o formulário abaixo para declarar sua saúde.
				</div>
			) : (
				<div>
					Sofreu nos últimos cinco anos ou sofre atualmente de uma das doenças
					específicas abaixo? Se sim, descreva nos campos abaixo.
				</div>
			)}
			<div className="divide-y">
				{questions.map(key => {
					// Para MAG Habitacional simplificada, renderizar radio + textarea condicional
					if (isSimplifiedMag) {
						return (
							<MagSimplifiedField
								key={key}
								name={key}
								label={getQuestionLabel(key)}
								control={control}
								watch={watch}
								errors={errors}
								isSubmitting={isSubmitting || submittingForm}
								trigger={trigger}
								setValue={setValue}
							/>
						);
					}
					
					// Para MAG Habitacional completa, questões 11-12 são texto obrigatório
					if (isCompleteMag && ['11', '12'].includes(key)) {
						return (
							<MagTextField
								key={key}
								name={key}
								label={getQuestionLabel(key)}
								control={control}
								errors={errors}
								isSubmitting={isSubmitting || submittingForm}
								required={true}
							/>
						);
					}
					
					// Para outras questões (yes/no)
					return (
						<DiseaseField
							key={key}
							name={key as any}
							label={getQuestionLabel(key)}
							control={control}
							watch={watch}
							errors={errors}
							isSubmitting={isSubmitting || submittingForm}
							trigger={trigger}
							setValue={setValue}
						/>
					);
				})}
			</div>

			<div className="flex justify-start items-center gap-5">
				<Button
					type="submit"
					className="w-40"
					disabled={submittingForm || isSubmitting}
					onClick={() => console.log('Button clicked (internal)!', { submittingForm, isSubmitting })}
				>
					Salvar
					{(isSubmitting || submittingForm) && (
						<Loader2Icon className="w-4 h-4 ml-2 animate-spin" />
					)}
				</Button>
				{errors ? (
					<div className="text-red-500">
						{Object.keys(errors).length > 0
							? 'Preencha todos os campos'
							: ''}
					</div>
				) : null}
			</div>
		</form>
	)
}

DpsHealthForm.displayName = 'DpsHealthForm'

function DiseaseField({
	name,
	label,
	control,
	watch,
	errors,
	isSubmitting,
	trigger,
	setValue,
}: {
	name: keyof HealthForm | keyof HealthFormHdiHomeEquity | keyof HealthFormMagHabitacionalComplete
	label: string
	control: Control<HealthForm | HealthFormHdiHomeEquity | HealthFormMagHabitacionalSimplified | HealthFormMagHabitacionalComplete>
	watch: any
	errors: FormState<HealthForm | HealthFormHdiHomeEquity | HealthFormMagHabitacionalSimplified | HealthFormMagHabitacionalComplete>['errors']
	isSubmitting: boolean
	trigger: UseFormTrigger<HealthForm | HealthFormHdiHomeEquity | HealthFormMagHabitacionalSimplified | HealthFormMagHabitacionalComplete>
	setValue: UseFormSetValue<HealthForm | HealthFormHdiHomeEquity | HealthFormMagHabitacionalSimplified | HealthFormMagHabitacionalComplete>
}) {
	const has = watch(`${name}.has`)

	// const handleAttachmentAfterChange = useCallback(() => {
	// 	trigger(`${name}.attachment`)
	// }, [trigger, name])

	const handleDescriptionChange = useCallback(() => {
		trigger(`${name}.description` as any)
	}, [trigger, name])

	const hasInputRef = useRef<HTMLElement | null>(null)
	function handleValidShake(check: boolean) {
		if (check && hasInputRef.current) {
			console.log('TEM ERRO', hasInputRef.current)
			hasInputRef.current.style.animation = 'horizontal-shaking 0.25s backwards'
			setTimeout(() => {
				if (hasInputRef.current) hasInputRef.current.style.animation = ''
			}, 250)
		}
		return check
	}

	useEffect(() => {
		handleValidShake(!!(errors as any)[name]?.has)
	}, [errors, name])

	return (
		<ShareLine className="py-4 px-4 hover:bg-gray-50">
			<div>
				<div className="text-gray-500">{label}</div>
				<Controller<any>
					control={control}
					defaultValue={''}
					name={`${name}.description`}
					render={({ field: { onChange, onBlur, value, ref } }) => (
						<>
							<Input
								id={name}
								placeholder="Descreva"
								className={cn(
									'w-full p-4 h-12 mt-3 rounded-lg',
									(errors as any)?.[name]?.description &&
										'border-red-500 focus-visible:border-red-500'
								)}
								disabled={isSubmitting || has !== 'yes'}
								onChange={e => {
									handleDescriptionChange()
									onChange(e)
								}}
								onBlur={onBlur}
								value={value}
								ref={ref}
							/>
							<div className="text-xs text-red-500">
								{(errors as any)?.[name]?.description?.message}
							</div>
						</>
					)}
				/>
			</div>

			<Controller<any>
				control={control}
				defaultValue={undefined}
				name={`${name}.has`}
				render={({ field: { onChange, onBlur, value, ref, ...field } }) => {
					function handleChange(v: 'yes' | 'no') {
						onChange(v)
						requestAnimationFrame(() => {
							trigger(`${name}.description` as any)
						})
					}

					return (
						<RadioGroup
							onValueChange={handleChange}
							defaultValue={value}
							className="flex flex-row justify-end items-start gap-5"
							ref={r => {
								hasInputRef.current = r
								ref(r)
							}}
						>
							<div className={(errors as any)?.[name]?.has && 'text-red-500'}>
								<RadioGroupItem
									value="yes"
									id={`${name}-yes`}
									className={(errors as any)?.[name]?.has && 'border-red-500'}
								/>
								<label htmlFor={`${name}-yes`} className="pl-2 cursor-pointer">
									Sim
								</label>
							</div>
							<div className={(errors as any)?.[name]?.has && 'text-red-500'}>
								<RadioGroupItem
									value="no"
									id={`${name}-no`}
									className={(errors as any)?.[name]?.has && 'border-red-500'}
								/>
								<label htmlFor={`${name}-no`} className="pl-2 cursor-pointer">
									Não
								</label>
							</div>
						</RadioGroup>
					)
				}}
			/>
		</ShareLine>
	)
}

// Componente para campos de texto simples (usado em MAG Habitacional simplificada e campos de texto da completa)
function MagTextField({
	name,
	label,
	control,
	errors,
	isSubmitting,
	required = false,
}: {
	name: string
	label: string
	control: Control<any>
	errors: FormState<any>['errors']
	isSubmitting: boolean
	required?: boolean
}) {
	return (
		<ShareLine className="py-4 px-4 hover:bg-gray-50">
			<div className="w-full">
				<div className="text-gray-500 mb-3">
					{label}
					{required && <span className="text-red-500 ml-1">*</span>}
				</div>
				<Controller
					control={control}
					name={name}
					render={({ field: { onChange, onBlur, value, ref } }) => (
						<>
							<Input
								id={name}
								placeholder="Digite sua resposta"
								className={cn(
									'w-full p-4 h-12 rounded-lg',
									(errors as any)?.[name] && 'border-red-500 focus-visible:border-red-500'
								)}
								disabled={isSubmitting}
								onChange={onChange}
								onBlur={onBlur}
								value={typeof value === 'string' ? value : ''}
								ref={ref}
							/>
							<div className="text-xs text-red-500 mt-1">
								{(errors as any)?.[name]?.message}
							</div>
						</>
					)}
				/>
			</div>
		</ShareLine>
	)
}

// Componente para DPS Simplificada MAG Habitacional (radio Sim/Não + textarea condicional)
function MagSimplifiedField({
	name,
	label,
	control,
	watch,
	errors,
	isSubmitting,
	trigger,
	setValue,
}: {
	name: string
	label: string
	control: Control<any>
	watch: any
	errors: FormState<any>['errors']
	isSubmitting: boolean
	trigger: UseFormTrigger<any>
	setValue: UseFormSetValue<any>
}) {
	const hasValue = watch(`${name}.has`)
	const descriptionValue = watch(`${name}.description`)

	const hasInputRef = useRef<HTMLElement | null>(null)

	function handleValidShake(check: boolean) {
		if (check && hasInputRef.current) {
			hasInputRef.current.style.animation = 'horizontal-shaking 0.25s backwards'
			setTimeout(() => {
				if (hasInputRef.current) hasInputRef.current.style.animation = ''
			}, 250)
		}
		return check
	}

	useEffect(() => {
		handleValidShake(!!(errors as any)[name]?.has)
	}, [errors, name])

	const handleRadioChange = useCallback((value: 'yes' | 'no') => {
		// Se mudar para "Não", limpar a descrição
		if (value === 'no') {
			setValue(`${name}.description`, '')
		}
		// Trigger validation do campo description
		setTimeout(() => {
			trigger(`${name}.description` as any)
		}, 0)
	}, [trigger, name, setValue])

	return (
		<ShareLine className="py-4 px-4 hover:bg-gray-50">
			<div className="w-full">
				<div className="text-gray-500 mb-3">{label}</div>

				{/* Radio Group Sim/Não */}
				<Controller
					control={control}
					name={`${name}.has`}
					render={({ field: { onChange, onBlur, value, ref } }) => (
						<div className="mb-4">
							<RadioGroup
								onValueChange={(v) => {
									handleRadioChange(v as 'yes' | 'no')
									onChange(v)
								}}
								value={value}
								className="flex flex-row items-center gap-6"
								ref={r => {
									hasInputRef.current = r
									ref(r)
								}}
							>
								<div className={`flex items-center space-x-2 ${((errors as any)?.[name]?.has || (errors as any)?.[name]?.message) && 'text-red-500'}`}>
									<RadioGroupItem
										value="yes"
										id={`${name}-yes`}
										className={((errors as any)?.[name]?.has || (errors as any)?.[name]?.message) && 'border-red-500'}
									/>
									<label htmlFor={`${name}-yes`} className="cursor-pointer">
										Sim
									</label>
								</div>
								<div className={`flex items-center space-x-2 ${((errors as any)?.[name]?.has || (errors as any)?.[name]?.message) && 'text-red-500'}`}>
									<RadioGroupItem
										value="no"
										id={`${name}-no`}
										className={((errors as any)?.[name]?.has || (errors as any)?.[name]?.message) && 'border-red-500'}
									/>
									<label htmlFor={`${name}-no`} className="cursor-pointer">
										Não
									</label>
								</div>
							</RadioGroup>
							<div className="text-xs text-red-500 mt-1">
								{(errors as any)?.[name]?.has?.message || (errors as any)?.[name]?.message}
							</div>
						</div>
					)}
				/>

				{/* Textarea condicional - só mostra quando "Sim" é selecionado */}
				{hasValue === 'yes' && (
					<div className="mt-4">
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Descrição <span className="text-red-500">*</span>
						</label>
						<Controller
							control={control}
							name={`${name}.description`}
							render={({ field: { onChange, onBlur, value, ref } }) => (
								<>
									<Textarea
										id={`${name}-description`}
										placeholder="Descreva em detalhes..."
										className={cn(
											'w-full p-4 min-h-[100px] rounded-lg resize-none',
											(errors as any)?.[name]?.description && 'border-red-500 focus-visible:border-red-500'
										)}
										disabled={isSubmitting}
										onChange={onChange}
										onBlur={onBlur}
										value={typeof value === 'string' ? value : ''}
										ref={ref}
									/>
									<div className="text-xs text-red-500 mt-1">
										{(errors as any)?.[name]?.description?.message}
									</div>
								</>
							)}
						/>
					</div>
				)}
			</div>
		</ShareLine>
	)
}

export default DpsHealthForm
