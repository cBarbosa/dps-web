import { Button } from '@/components/ui/button'
import FileInput from '@/components/ui/file-input'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import ShareLine from '@/components/ui/share-line'
import { cn } from '@/lib/utils'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect } from 'react'
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
	nonNullish,
	pipe,
	nonOptional,
	nonEmpty,
	string,
	optional,
} from 'valibot'
import { diseaseNames } from './dps-form'
import { getProposals, postHealthDataByUid } from '../../actions'
import { useSession } from 'next-auth/react'
import { ProfileForm } from './dps-profile-form'

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

const healthForm = object({
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
})

export type HealthForm = InferInput<typeof healthForm>

const DpsHealthForm = ({
	onSubmit: onSubmitProp,
	proposalUid: proposalUidProp,
	dpsProfileData,
	initialHealthData,
}: {
	onSubmit: (v: HealthForm) => void
	proposalUid?: string
	dpsProfileData: ProfileForm
	initialHealthData?: HealthForm | null
}) => {
	const session = useSession()
	const token = (session.data as any)?.accessToken

	console.log('>>>initialHealthData', initialHealthData)

	const [proposalUid, setProposalUid] = React.useState<string | undefined>(
		proposalUidProp
	)

	useEffect(() => {
		if (!proposalUid) {
			getProposals(
				token,
				dpsProfileData.cpf,
				+dpsProfileData.lmi,
				dpsProfileData.produto
			).then(res => {
				setProposalUid(res?.items[0]?.uid)
			})
		}
	}, [
		token,
		proposalUid,
		dpsProfileData.cpf,
		dpsProfileData.lmi,
		dpsProfileData.produto,
	])

	const {
		handleSubmit,
		getValues,
		trigger,
		setValue,
		control,
		reset,
		watch,
		formState: { isSubmitting, isSubmitted, errors, ...formState },
	} = useForm<HealthForm>({
		resolver: valibotResolver(healthForm),
		defaultValues: initialHealthData ?? undefined,
	})

	const router = useRouter()

	async function onSubmit(v: HealthForm) {
		if (!proposalUid) {
			await getProposals(
				token,
				dpsProfileData.cpf,
				+dpsProfileData.lmi,
				dpsProfileData.produto
			).then(res => {
				setProposalUid(res?.items[0]?.uid)
			})

			return
		}

		const postData = Object.entries(v).map(([key, value], i) => ({
			code: key,
			question: diseaseNames[key as keyof typeof diseaseNames],
			exists: value.has === 'yes',
			created: new Date().toISOString(),
		}))

		console.log('submitting', token, postData)

		const response = await postHealthDataByUid(token, proposalUid, postData)

		console.log('post proposal', response)

		if (response) {
			reset()
			if (response.success) {
				onSubmitProp(v)
			} else {
				console.error(response.message)
			}
		}
		onSubmitProp(v)
		console.log('saudetop', v)
		// router.push('/dashboard')
	}

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className="flex flex-col gap-6 w-full"
		>
			<h3 className="text-primary text-lg">Formulário Saúde Top+</h3>
			<div>
				Sofreu nos últimos cinco anos ou sofre atualmente de uma das doenças
				específicas abaixo? Se sim, descreva nos campos abaixo.
			</div>
			<div className="divide-y">
				{(Object.keys(healthForm.entries) as (keyof HealthForm)[]).map(
					(key, i) => (
						<DiseaseField
							name={key}
							label={diseaseNames[key]}
							control={control}
							watch={watch}
							errors={errors}
							isSubmitting={isSubmitting}
							trigger={trigger}
							setValue={setValue}
							key={key}
						/>
					)
				)}
			</div>

			<Button type="submit" className="w-40">
				Salvar
			</Button>
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
	name: keyof HealthForm
	label: string
	control: Control<HealthForm>
	watch: any
	errors: FormState<HealthForm>['errors']
	isSubmitting: boolean
	trigger: UseFormTrigger<HealthForm>
	setValue: UseFormSetValue<HealthForm>
}) {
	const has = watch(`${name}.has`)

	// const handleAttachmentAfterChange = useCallback(() => {
	// 	trigger(`${name}.attachment`)
	// }, [trigger, name])

	const handleDescriptionChange = useCallback(() => {
		trigger(`${name}.description`)
	}, [trigger, name])

	return (
		<ShareLine className="py-4 px-4 hover:bg-gray-50">
			<div>
				<div className="text-gray-500">{label}</div>
				<Controller
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
									errors?.[name]?.description &&
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
								{errors?.[name]?.description?.message}
							</div>
						</>
					)}
				/>
			</div>

			<Controller
				control={control}
				defaultValue={undefined}
				name={`${name}.has`}
				render={({ field: { onChange, onBlur, value, ref, ...field } }) => {
					function handleChange(v: 'yes' | 'no') {
						onChange(v)
						requestAnimationFrame(() => {
							trigger(`${name}.description`)
						})
					}

					return (
						<RadioGroup
							onValueChange={handleChange}
							defaultValue={value}
							className="flex flex-row justify-end items-start gap-5"
						>
							<div className={errors?.[name]?.has && 'text-red-500'}>
								<RadioGroupItem
									value="yes"
									id={`${name}-yes`}
									className={errors?.[name]?.has && 'border-red-500'}
								/>
								<label htmlFor={`${name}-yes`} className="pl-2 cursor-pointer">
									Sim
								</label>
							</div>
							<div className={errors?.[name]?.has && 'text-red-500'}>
								<RadioGroupItem
									value="no"
									id={`${name}-no`}
									className={errors?.[name]?.has && 'border-red-500'}
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
