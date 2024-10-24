import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import ShareLine from '@/components/ui/share-line'
import { cn } from '@/lib/utils'
import { valibotResolver } from '@hookform/resolvers/valibot'
import React from 'react'
import { Control, Controller, FormState, useForm } from 'react-hook-form'
import {
	boolean,
	email,
	InferInput,
	nonEmpty,
	object,
	pipe,
	string,
} from 'valibot'

const healthForm = object({
	avc: object({
		has: string(),
		description: string(),
	}),

	aids: object({
		has: string(),
		description: string(),
	}),
	alzheimer: object({
		has: string(),
		description: string(),
	}),
	arteriais: object({
		has: string(),
		description: string(),
	}),
	chagas: object({
		has: string(),
		description: string(),
	}),
	cirrose: object({
		has: string(),
		description: string(),
	}),
	diabetes: object({
		has: string(),
		description: string(),
	}),
	enfisema: object({
		has: string(),
		description: string(),
	}),
	esclerose: object({
		has: string(),
		description: string(),
	}),
	espondilose: object({
		has: string(),
		description: string(),
	}),
	hipertensao: object({
		has: string(),
		description: string(),
	}),
	insuficiencia: object({
		has: string(),
		description: string(),
	}),
	ler: object({
		has: string(),
		description: string(),
	}),
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
		reset,
		watch,
		formState: { isSubmitting, isSubmitted, ...formState },
	} = useForm<HealthForm>({
		resolver: valibotResolver(healthForm),
	})

	async function onSubmit(v: HealthForm) {
		onSubmitProp(v)
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
					formState={formState}
					isSubmitting={isSubmitting}
				/>

				<DiseaseField
					name="aids"
					label="AIDS"
					control={control}
					watch={watch}
					formState={formState}
					isSubmitting={isSubmitting}
				/>

				<DiseaseField
					name="alzheimer"
					label="Alzheimer"
					control={control}
					watch={watch}
					formState={formState}
					isSubmitting={isSubmitting}
				/>

				<DiseaseField
					name="arteriais"
					label="Arteriais Crônicas"
					control={control}
					watch={watch}
					formState={formState}
					isSubmitting={isSubmitting}
				/>

				<DiseaseField
					name="chagas"
					label="Chagas"
					control={control}
					watch={watch}
					formState={formState}
					isSubmitting={isSubmitting}
				/>

				<DiseaseField
					name="cirrose"
					label="Cirrose Hepática e Varizes de Estômago"
					control={control}
					watch={watch}
					formState={formState}
					isSubmitting={isSubmitting}
				/>

				<DiseaseField
					name="diabetes"
					label="Diabetes com complicações"
					control={control}
					watch={watch}
					formState={formState}
					isSubmitting={isSubmitting}
				/>

				<DiseaseField
					name="enfisema"
					label="Enfisema Pulmonar e Asma"
					control={control}
					watch={watch}
					formState={formState}
					isSubmitting={isSubmitting}
				/>

				<DiseaseField
					name="esclerose"
					label="Esclerose Múltipla"
					control={control}
					watch={watch}
					formState={formState}
					isSubmitting={isSubmitting}
				/>

				<DiseaseField
					name="espondilose"
					label="Espondilose Anquilosante"
					control={control}
					watch={watch}
					formState={formState}
					isSubmitting={isSubmitting}
				/>

				<DiseaseField
					name="hipertensao"
					label="Hipertensão, Infarto do Miocárdio ou outras doenças cardiocirculatórias"
					control={control}
					watch={watch}
					formState={formState}
					isSubmitting={isSubmitting}
				/>

				<DiseaseField
					name="insuficiencia"
					label="Insuficiência Coronariana"
					control={control}
					watch={watch}
					formState={formState}
					isSubmitting={isSubmitting}
				/>

				<DiseaseField
					name="ler"
					label="L.E.R."
					control={control}
					watch={watch}
					formState={formState}
					isSubmitting={isSubmitting}
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
	formState,
	isSubmitting,
}: {
	name: keyof HealthForm
	label: string
	control: Control<HealthForm>
	watch: any
	formState: Omit<FormState<HealthForm>, 'isSubmitting' | 'isSubmitted'>
	isSubmitting: boolean
}) {
	return (
		<ShareLine className="py-4">
			<Controller
				control={control}
				defaultValue=""
				name={`${name}.description`}
				render={({ field: { onChange, onBlur, value, ref } }) => (
					<label>
						<div className="text-gray-500">{label}</div>
						<Input
							id={name}
							type="text"
							placeholder={watch(`${name}.has`) === 'yes' ? 'Descreva' : ''}
							className={cn(
								'w-full px-4 py-6 rounded-lg',
								formState.errors?.[name]?.description &&
									'border-red-500 focus-visible:border-red-500'
							)}
							autoComplete={name}
							disabled={isSubmitting || watch(`${name}.has`) !== 'yes'}
							onChange={onChange}
							onBlur={onBlur}
							value={value}
							ref={ref}
						/>
						<div className="text-xs text-red-500">
							{formState.errors?.[name]?.description?.message}
						</div>
					</label>
				)}
			/>

			<Controller
				control={control}
				defaultValue={undefined}
				name={`${name}.has`}
				render={({ field: { onChange, onBlur, value, ref } }) => (
					<RadioGroup
						onValueChange={onChange}
						defaultValue={value}
						className="flex flex-row justify-end items-start gap-5"
					>
						<div>
							<RadioGroupItem value="yes" id={`${name}-yes`} className="mr-1" />
							<label htmlFor={`${name}-yes`}>Sim</label>
						</div>
						<div>
							<RadioGroupItem value="no" id={`${name}-no`} className="mr-1" />
							<label htmlFor={`${name}-no`}>Não</label>
						</div>
					</RadioGroup>
				)}
			/>
		</ShareLine>
	)
}

export default DpsHealthForm
