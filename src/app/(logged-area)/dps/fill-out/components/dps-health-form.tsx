import React, { useCallback, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import ShareLine from '@/components/ui/share-line'
import { cn } from '@/lib/utils'
import { valibotResolver } from '@hookform/resolvers/valibot'

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
} from 'valibot'
import { postHealthDataByUid } from '../../actions'
import { useSession } from 'next-auth/react'
import { Loader2Icon } from 'lucide-react'
import {
	diseaseNamesHomeEquity,
	diseaseNamesHabitacional
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

const healthForm = object(productYelumNovo)
const healthFormHomeEquity = object(productHdiHomeEquity)

export type HealthForm = InferInput<typeof healthForm>
export type HealthFormHdiHomeEquity = InferInput<typeof healthFormHomeEquity>

const DpsHealthForm = ({
	onSubmit: onSubmitProp,
	proposalUid,
	productName,
	initialHealthData,
	autocomplete = false,
}: {
	onSubmit: (v: HealthForm | HealthFormHdiHomeEquity) => void
	proposalUid: string
	productName: string
	autocomplete?: boolean
	initialHealthData?: HealthForm | HealthFormHdiHomeEquity | null
}) => {
	const session = useSession()
	const token = (session.data as any)?.accessToken

	const [submittingForm, setSubmittingForm] = React.useState(false)

	const {
		handleSubmit,
		getValues,
		trigger,
		setValue,
		control,
		reset,
		watch,
		formState: { isSubmitting, isSubmitted, errors, ...formState },
	} = useForm<HealthForm | HealthFormHdiHomeEquity>({
		resolver: valibotResolver(productName === 'HDI Home Equity' ? healthFormHomeEquity : healthForm),
		defaultValues: autocomplete ? initialHealthData ?? undefined : undefined,
		disabled: submittingForm,
	})

	async function onSubmit(v: HealthForm | HealthFormHdiHomeEquity) {
		console.log('Form submission started (internal)', v)
		setSubmittingForm(true)

		const postData = Object.entries(v).map(([key, value], i) => ({
			code: key,
			question: productName === 'HDI Home Equity'
				? diseaseNamesHomeEquity[key as keyof typeof diseaseNamesHomeEquity]
				: diseaseNamesHabitacional[key as keyof typeof diseaseNamesHabitacional],
			exists: value.has === 'yes',
			created: new Date().toISOString(),
			description: value.description,
		}))

		console.log('postData', postData)

		try {
			const response = await postHealthDataByUid(token, proposalUid, postData)

			if (response) {
				if (response.success) {
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

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className="flex flex-col gap-6 w-full"
		>
			<h3 className="text-primary text-lg">Formulário Saúde {productName}</h3>
			<div>
				Sofreu nos últimos cinco anos ou sofre atualmente de uma das doenças
				específicas abaixo? Se sim, descreva nos campos abaixo.
			</div>
			<div className="divide-y">
			{(Object.keys(productName === 'HDI Home Equity' ? healthFormHomeEquity.entries : healthForm.entries) as (keyof HealthForm)[] | (keyof HealthFormHdiHomeEquity)[]).map(key => (
					<DiseaseField
						name={key}
						label={productName === 'HDI Home Equity'
							? diseaseNamesHomeEquity[key as keyof typeof diseaseNamesHomeEquity]
							: diseaseNamesHabitacional[key as keyof typeof diseaseNamesHabitacional]}
						control={control}
						watch={watch}
						errors={errors}
						isSubmitting={isSubmitting || submittingForm}
						trigger={trigger}
						setValue={setValue}
						key={key}
					/>
				))}
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
						{Object.values(errors).some(v => v.has)
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
	name: keyof HealthForm | keyof HealthFormHdiHomeEquity
	label: string
	control: Control<HealthForm> | Control<HealthFormHdiHomeEquity>
	watch: any
	errors: FormState<HealthForm>['errors'] | FormState<HealthFormHdiHomeEquity>['errors']
	isSubmitting: boolean
	trigger: UseFormTrigger<HealthForm> | UseFormTrigger<HealthFormHdiHomeEquity>
	setValue: UseFormSetValue<HealthForm> | UseFormSetValue<HealthFormHdiHomeEquity>
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

export default DpsHealthForm
