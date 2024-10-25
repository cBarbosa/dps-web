import { Button } from '@/components/ui/button'
import FileInput from '@/components/ui/file-input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import ShareLine from '@/components/ui/share-line'
import { cn } from '@/lib/utils'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { useRouter } from 'next/navigation'
import React from 'react'
import {
	Control,
	Controller,
	FormState,
	useForm,
	UseFormResetField,
	UseFormSetValue,
	UseFormTrigger,
} from 'react-hook-form'
import { file, InferInput, literal, undefined_, object, variant } from 'valibot'

const healthForm = object({
	avc: variant(
		'has',
		[
			object({
				has: literal('yes'),
				attachment: file('Arquivo inválido.'),
			}),
			object({
				has: literal('no'),
				attachment: undefined_(),
			}),
		],
		'Campo obrigatório'
	),

	aids: variant(
		'has',
		[
			object({
				has: literal('yes'),
				attachment: file('Arquivo inválido.'),
			}),
			object({
				has: literal('no'),
				attachment: undefined_(),
			}),
		],
		'Campo obrigatório'
	),
	alzheimer: variant(
		'has',
		[
			object({
				has: literal('yes'),
				attachment: file('Arquivo inválido.'),
			}),
			object({
				has: literal('no'),
				attachment: undefined_(),
			}),
		],
		'Campo obrigatório'
	),
	arteriais: variant(
		'has',
		[
			object({
				has: literal('yes'),
				attachment: file('Arquivo inválido.'),
			}),
			object({
				has: literal('no'),
				attachment: undefined_(),
			}),
		],
		'Campo obrigatório'
	),
	chagas: variant(
		'has',
		[
			object({
				has: literal('yes'),
				attachment: file('Arquivo inválido.'),
			}),
			object({
				has: literal('no'),
				attachment: undefined_(),
			}),
		],
		'Campo obrigatório'
	),
	cirrose: variant(
		'has',
		[
			object({
				has: literal('yes'),
				attachment: file('Arquivo inválido.'),
			}),
			object({
				has: literal('no'),
				attachment: undefined_(),
			}),
		],
		'Campo obrigatório'
	),
	diabetes: variant(
		'has',
		[
			object({
				has: literal('yes'),
				attachment: file('Arquivo inválido.'),
			}),
			object({
				has: literal('no'),
				attachment: undefined_(),
			}),
		],
		'Campo obrigatório'
	),
	enfisema: variant(
		'has',
		[
			object({
				has: literal('yes'),
				attachment: file('Arquivo inválido.'),
			}),
			object({
				has: literal('no'),
				attachment: undefined_(),
			}),
		],
		'Campo obrigatório'
	),
	esclerose: variant(
		'has',
		[
			object({
				has: literal('yes'),
				attachment: file('Arquivo inválido.'),
			}),
			object({
				has: literal('no'),
				attachment: undefined_(),
			}),
		],
		'Campo obrigatório'
	),
	espondilose: variant(
		'has',
		[
			object({
				has: literal('yes'),
				attachment: file('Arquivo inválido.'),
			}),
			object({
				has: literal('no'),
				attachment: undefined_(),
			}),
		],
		'Campo obrigatório'
	),
	hipertensao: variant(
		'has',
		[
			object({
				has: literal('yes'),
				attachment: file('Arquivo inválido.'),
			}),
			object({
				has: literal('no'),
				attachment: undefined_(),
			}),
		],
		'Campo obrigatório'
	),
	insuficiencia: variant(
		'has',
		[
			object({
				has: literal('yes'),
				attachment: file('Arquivo inválido.'),
			}),
			object({
				has: literal('no'),
				attachment: undefined_(),
			}),
		],
		'Campo obrigatório'
	),
	ler: variant(
		'has',
		[
			object({
				has: literal('yes'),
				attachment: file('Arquivo inválido.'),
			}),
			object({
				has: literal('no'),
				attachment: undefined_(),
			}),
		],
		'Campo obrigatório'
	),
	lupus: variant(
		'has',
		[
			object({
				has: literal('yes'),
				attachment: file('Arquivo inválido.'),
			}),
			object({
				has: literal('no'),
				attachment: undefined_(),
			}),
		],
		'Campo obrigatório'
	),
	neurologicas: variant(
		'has',
		[
			object({
				has: literal('yes'),
				attachment: file('Arquivo inválido.'),
			}),
			object({
				has: literal('no'),
				attachment: undefined_(),
			}),
		],
		'Campo obrigatório'
	),
	parkinson: variant(
		'has',
		[
			object({
				has: literal('yes'),
				attachment: file('Arquivo inválido.'),
			}),
			object({
				has: literal('no'),
				attachment: undefined_(),
			}),
		],
		'Campo obrigatório'
	),
	renal: variant(
		'has',
		[
			object({
				has: literal('yes'),
				attachment: file('Arquivo inválido.'),
			}),
			object({
				has: literal('no'),
				attachment: undefined_(),
			}),
		],
		'Campo obrigatório'
	),
	sequelas: variant(
		'has',
		[
			object({
				has: literal('yes'),
				attachment: file('Arquivo inválido.'),
			}),
			object({
				has: literal('no'),
				attachment: undefined_(),
			}),
		],
		'Campo obrigatório'
	),
	shistosomose: variant(
		'has',
		[
			object({
				has: literal('yes'),
				attachment: file('Arquivo inválido.'),
			}),
			object({
				has: literal('no'),
				attachment: undefined_(),
			}),
		],
		'Campo obrigatório'
	),
	tireoide: variant(
		'has',
		[
			object({
				has: literal('yes'),
				attachment: file('Arquivo inválido.'),
			}),
			object({
				has: literal('no'),
				attachment: undefined_(),
			}),
		],
		'Campo obrigatório'
	),
	tumores: variant(
		'has',
		[
			object({
				has: literal('yes'),
				attachment: file('Arquivo inválido.'),
			}),
			object({
				has: literal('no'),
				attachment: undefined_(),
			}),
		],
		'Campo obrigatório'
	),
})

export type HealthForm = InferInput<typeof healthForm>

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
				<DiseaseField
					name="avc"
					label="Acidente Vascular Cerebral"
					control={control}
					watch={watch}
					errors={errors}
					isSubmitting={isSubmitting}
					trigger={trigger}
					setValue={setValue}
				/>
				{watch('avc.has')}

				<DiseaseField
					name="aids"
					label="AIDS"
					control={control}
					watch={watch}
					errors={errors}
					isSubmitting={isSubmitting}
					trigger={trigger}
					setValue={setValue}
				/>

				<DiseaseField
					name="alzheimer"
					label="Alzheimer"
					control={control}
					watch={watch}
					errors={errors}
					isSubmitting={isSubmitting}
					trigger={trigger}
					setValue={setValue}
				/>

				<DiseaseField
					name="arteriais"
					label="Arteriais Crônicas"
					control={control}
					watch={watch}
					errors={errors}
					isSubmitting={isSubmitting}
					trigger={trigger}
					setValue={setValue}
				/>

				<DiseaseField
					name="chagas"
					label="Chagas"
					control={control}
					watch={watch}
					errors={errors}
					isSubmitting={isSubmitting}
					trigger={trigger}
					setValue={setValue}
				/>

				<DiseaseField
					name="cirrose"
					label="Cirrose Hepática e Varizes de Estômago"
					control={control}
					watch={watch}
					errors={errors}
					isSubmitting={isSubmitting}
					trigger={trigger}
					setValue={setValue}
				/>

				<DiseaseField
					name="diabetes"
					label="Diabetes com complicações"
					control={control}
					watch={watch}
					errors={errors}
					isSubmitting={isSubmitting}
					trigger={trigger}
					setValue={setValue}
				/>

				<DiseaseField
					name="enfisema"
					label="Enfisema Pulmonar e Asma"
					control={control}
					watch={watch}
					errors={errors}
					isSubmitting={isSubmitting}
					trigger={trigger}
					setValue={setValue}
				/>

				<DiseaseField
					name="esclerose"
					label="Esclerose Múltipla"
					control={control}
					watch={watch}
					errors={errors}
					isSubmitting={isSubmitting}
					trigger={trigger}
					setValue={setValue}
				/>

				<DiseaseField
					name="espondilose"
					label="Espondilose Anquilosante"
					control={control}
					watch={watch}
					errors={errors}
					isSubmitting={isSubmitting}
					trigger={trigger}
					setValue={setValue}
				/>

				<DiseaseField
					name="hipertensao"
					label="Hipertensão, Infarto do Miocárdio ou outras doenças cardiocirculatórias"
					control={control}
					watch={watch}
					errors={errors}
					isSubmitting={isSubmitting}
					trigger={trigger}
					setValue={setValue}
				/>

				<DiseaseField
					name="insuficiencia"
					label="Insuficiência Coronariana"
					control={control}
					watch={watch}
					errors={errors}
					isSubmitting={isSubmitting}
					trigger={trigger}
					setValue={setValue}
				/>

				<DiseaseField
					name="ler"
					label="L.E.R."
					control={control}
					watch={watch}
					errors={errors}
					isSubmitting={isSubmitting}
					trigger={trigger}
					setValue={setValue}
				/>

				<DiseaseField
					name="lupus"
					label="Lúpus"
					control={control}
					watch={watch}
					errors={errors}
					isSubmitting={isSubmitting}
					trigger={trigger}
					setValue={setValue}
				/>

				<DiseaseField
					name="neurologicas"
					label="Neurológicas ou Psiquiátricas - (vertigem, desmaio, convulsão, dificuldade de fala,
doenças ou alterações mentais ou de nervos)
"
					control={control}
					watch={watch}
					errors={errors}
					isSubmitting={isSubmitting}
					trigger={trigger}
					setValue={setValue}
				/>

				<DiseaseField
					name="parkinson"
					label="Parkinson"
					control={control}
					watch={watch}
					errors={errors}
					isSubmitting={isSubmitting}
					trigger={trigger}
					setValue={setValue}
				/>

				<DiseaseField
					name="renal"
					label="Renal Crônica (com ou sem hemodiálise)"
					control={control}
					watch={watch}
					errors={errors}
					isSubmitting={isSubmitting}
					trigger={trigger}
					setValue={setValue}
				/>

				<DiseaseField
					name="sequelas"
					label="Sequelas de Acidente Vascular Celebral"
					control={control}
					watch={watch}
					errors={errors}
					isSubmitting={isSubmitting}
					trigger={trigger}
					setValue={setValue}
				/>

				<DiseaseField
					name="shistosomose"
					label="Shistosomose"
					control={control}
					watch={watch}
					errors={errors}
					isSubmitting={isSubmitting}
					trigger={trigger}
					setValue={setValue}
				/>

				<DiseaseField
					name="tireoide"
					label="Tireóide ou outras Doenças Endócrinas com complicações"
					control={control}
					watch={watch}
					errors={errors}
					isSubmitting={isSubmitting}
					trigger={trigger}
					setValue={setValue}
				/>

				<DiseaseField
					name="tumores"
					label="Tumores Malignos e Câncer"
					control={control}
					watch={watch}
					errors={errors}
					isSubmitting={isSubmitting}
					trigger={trigger}
					setValue={setValue}
				/>
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

	return (
		<ShareLine className="py-4 px-4 hover:bg-gray-50">
			<Controller
				control={control}
				defaultValue={undefined}
				name={`${name}.attachment`}
				render={({ field: { onChange, onBlur, value, ref } }) => (
					<div>
						<div className="text-gray-500">{label}</div>
						<FileInput
							id={name}
							label="Anexar laudo"
							className={cn(
								'w-full mt-3 rounded-lg',
								errors?.[name]?.attachment &&
									'border-red-500 focus-visible:border-red-500'
							)}
							disabled={isSubmitting || has !== 'yes'}
							onChange={onChange}
							onBlur={onBlur}
							value={value}
						/>
						<div className="text-xs text-red-500">
							{errors?.[name]?.attachment?.message}
						</div>
					</div>
				)}
			/>

			<Controller
				control={control}
				defaultValue={undefined}
				name={`${name}.has`}
				render={({ field: { onChange, onBlur, value, ref, ...field } }) => {
					function handleChange(v: 'yes' | 'no') {
						onChange(v)
						requestAnimationFrame(() => {
							trigger(`${name}.attachment`)
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
