import { Button } from '@/components/ui/button'
import FileInput from '@/components/ui/file-input'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import ShareLine from '@/components/ui/share-line'
import { cn } from '@/lib/utils'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { useRouter } from 'next/navigation'
import React, { useCallback } from 'react'
import {
	Control,
	Controller,
	FormState,
	useForm,
	UseFormSetValue,
	UseFormTrigger,
} from 'react-hook-form'
import {
	file,
	InferInput,
	literal,
	undefined_,
	object,
	variant,
	nonNullish,
	pipe,
	nonOptional,
	nonEmpty,
	string,
	optional,
} from 'valibot'

const diseaseSchema = variant(
	'has',
	[
		object({
			has: literal('yes'),
			description: pipe(string(), nonEmpty('Campo obrigatório.')),
			attachment: nonOptional(file('Arquivo inválido.'), 'Campo obrigatório.'),
		}),
		object({
			has: literal('no'),
			description: optional(string(), 'Não é necessário preencher.'),
			attachment: undefined_('Não é necessário um arquivo.'),
		}),
	],
	'Campo obrigatório'
)

const healthForm = object({
	avc: diseaseSchema,
	aids: diseaseSchema,
	alzheimer: diseaseSchema,
	arteriais: diseaseSchema,
	chagas: diseaseSchema,
	cirrose: diseaseSchema,
	diabetes: diseaseSchema,
	enfisema: diseaseSchema,
	esclerose: diseaseSchema,
	espondilose: diseaseSchema,
	hipertensao: diseaseSchema,
	insuficiencia: diseaseSchema,
	ler: diseaseSchema,
	lupus: diseaseSchema,
	neurologicas: diseaseSchema,
	parkinson: diseaseSchema,
	renal: diseaseSchema,
	sequelas: diseaseSchema,
	shistosomose: diseaseSchema,
	tireoide: diseaseSchema,
	tumores: diseaseSchema,
})

export type HealthForm = InferInput<typeof healthForm>

const diseaseNames: Record<keyof HealthForm, string> = {
	avc: 'Acidente Vascular Cerebral',
	aids: 'AIDS',
	alzheimer: 'Alzheimer',
	arteriais: 'Arteriais Crônicas',
	chagas: 'Chagas',
	cirrose: 'Cirrose Hepática e Varizes de Estômago',
	diabetes: 'Diabetes com complicações',
	enfisema: 'Enfisema Pulmonar e Asma',
	esclerose: 'Esclerose Múltipla',
	espondilose: 'Espondilose Anquilosante',
	hipertensao:
		'Hipertensão, Infarto do Miocárdio ou outras doenças cardiocirculatórias',
	insuficiencia: 'Insuficiência Coronariana',
	ler: 'L.E.R.',
	lupus: 'Lúpus',
	neurologicas:
		'Neurológicas ou Psiquiátricas - (vertigem, desmaio, convulsão, dificuldade de fala, doenças ou alterações mentais ou de nervos)',
	parkinson: 'Parkinson',
	renal: 'Renal Crônica (com ou sem hemodiálise)',
	sequelas: 'Sequelas de Acidente Vascular Celebral',
	shistosomose: 'Shistosomose',
	tireoide: 'Tireóide ou outras Doenças Endócrinas com complicações',
	tumores: 'Tumores Malignos e Câncer',
}

const DpsHealthForm = ({
	onSubmit: onSubmitProp,
}: {
	onSubmit: (v: HealthForm) => void
}) => {
	const {
		handleSubmit,
		getValues,
		trigger,
		setValue,
		control,
		watch,
		formState: { isSubmitting, isSubmitted, errors, ...formState },
	} = useForm<HealthForm>({
		resolver: valibotResolver(healthForm),
	})

	const router = useRouter()

	async function onSubmit(v: HealthForm) {
		onSubmitProp(v)
		console.log('saudetop', v)
		router.push('/dashboard')
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

	const handleAttachmentAfterChange = useCallback(() => {
		trigger(`${name}.attachment`)
	}, [trigger, name])

	const handleDescriptionChange = useCallback(() => {
		trigger(`${name}.description`)
	}, [trigger, name])

	return (
		<ShareLine className="py-4 px-4 hover:bg-gray-50">
			<div>
				<div className="text-gray-500">{label}</div>
				<Controller
					control={control}
					defaultValue={undefined}
					name={`${name}.attachment`}
					render={({ field: { onChange, onBlur, value, ref } }) => (
						<>
							<FileInput
								id={name}
								label="Anexar laudo"
								className={cn(
									'w-full mt-3 rounded-lg',
									errors?.[name]?.attachment &&
										'border-red-500 focus-visible:border-red-500'
								)}
								accept="application/pdf"
								disabled={isSubmitting || has !== 'yes'}
								onChange={onChange}
								afterChange={handleAttachmentAfterChange}
								onBlur={onBlur}
								value={value}
								ref={ref}
							/>
							<div className="text-xs text-red-500">
								{errors?.[name]?.attachment?.message}
							</div>
						</>
					)}
				/>
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
							trigger(`${name}.attachment`)
							trigger(`${name}.description`)
						})

						if (v === 'no') setValue(`${name}.attachment`, undefined)
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
