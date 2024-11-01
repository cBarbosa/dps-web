import { Button } from '@/components/ui/button'
import FileInput from '@/components/ui/file-input'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import ShareLine from '@/components/ui/share-line'
import { cn } from '@/lib/utils'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'
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
	array,
	ObjectSchema,
	NonOptionalSchema,
	FileSchema,
} from 'valibot'
import { diseaseNames } from './dps-form'

const diseaseAttachmentSchema = nonOptional(
	file('Arquivo inválido.'),
	'Campo obrigatório.'
)

type DiseaseKeys = keyof typeof diseaseNames

type DiseaseAttachmentSchema = InferInput<typeof diseaseAttachmentSchema>

export type DpsAttachmentsFormSchema = Partial<Record<DiseaseKeys, File>>

const DpsAttachmentsForm = ({
	onSubmit: onSubmitProp,
	setStep,
	diseaseList,
}: {
	onSubmit: (v: DpsAttachmentsFormSchema) => void
	setStep: (step: 'profile' | 'health' | 'attachments') => void
	diseaseList: Partial<
		Record<DiseaseKeys, { has: boolean; description: string }>
	>
}) => {
	const attachmentsSchema = useMemo<
		ObjectSchema<
			Partial<Record<DiseaseKeys, typeof diseaseAttachmentSchema>>,
			undefined
		>
	>(() => {
		const obj: Partial<Record<DiseaseKeys, typeof diseaseAttachmentSchema>> = {}

		Object.keys(diseaseNames).forEach(key => {
			if (diseaseList[key as DiseaseKeys]?.has)
				obj[key as DiseaseKeys] = diseaseAttachmentSchema
		})

		return object(obj)
	}, [diseaseList])

	// type AttachmentsForm = InferInput<typeof attachmentsSchema>

	const {
		handleSubmit,
		getValues,
		trigger,
		setValue,
		control,
		watch,
		formState: { isSubmitting, isSubmitted, errors, ...formState },
	} = useForm<DpsAttachmentsFormSchema>({
		resolver: valibotResolver(attachmentsSchema as any), //TODO
	})

	const router = useRouter()

	async function onSubmit(v: DpsAttachmentsFormSchema) {
		onSubmitProp(v) //TODO
		console.log('saudetop', v)
		router.push('/dashboard')
	}

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className="flex flex-col gap-6 w-full"
		>
			<h3 className="text-primary text-lg">Anexar laudos</h3>
			<div>Faça upload dos laudos das doenças especificadas.</div>
			{Object.keys(diseaseList).length > 0 ? (
				<div className="divide-y">
					{(
						Object.entries(diseaseList) as [
							keyof typeof diseaseList,
							{ has: boolean; description: string }
						][]
					)
						.filter(([, value]) => value)
						.map(([key, { description }]) => (
							<AttachmentField
								name={key}
								label={diseaseNames[key]}
								control={control}
								errors={errors}
								isSubmitting={isSubmitting}
								description={description}
								key={key}
							/>
						))}
				</div>
			) : (
				<div className="py-4 px-4 border border-gray-200 rounded-lg">
					<div className="text-gray-500">Não é necessário anexar arquivos.</div>
				</div>
			)}

			<div className="flex gap-5">
				<Button
					variant="outline"
					className="w-40"
					onClick={() => setStep('health')}
				>
					Voltar
				</Button>
				<Button type="submit" className="w-40">
					Salvar
				</Button>
			</div>
		</form>
	)
}

DpsAttachmentsForm.displayName = 'DpsAttachmentsForm'

function AttachmentField({
	name,
	label,
	description,
	control,
	errors,
	isSubmitting,
}: {
	name: DiseaseKeys
	label: string
	description: string
	control: Control<DpsAttachmentsFormSchema>
	errors: FormState<DpsAttachmentsFormSchema>['errors']
	isSubmitting: boolean
}) {
	// const handleAttachmentAfterChange = useCallback(() => {
	// 	trigger(`${name}`)
	// }, [trigger, name])

	return (
		<div className="py-4 px-4 hover:bg-gray-50">
			<div className="text-gray-500">{label}</div>
			<p className="text-sm text-muted-foreground">{description}</p>
			<div className="flex justify-start gap-5">
				<Controller
					control={control}
					defaultValue={undefined}
					name={`${name}`}
					render={({ field: { onChange, onBlur, value, ref } }) => (
						<div className="basis-1/2">
							<FileInput
								id={name}
								label="Anexar laudo"
								className={cn(
									'w-full mt-3 rounded-lg',
									errors?.[name] &&
										'border-red-500 focus-visible:border-red-500'
								)}
								accept="application/pdf"
								disabled={isSubmitting}
								onChange={onChange}
								// afterChange={handleAttachmentAfterChange}
								onBlur={onBlur}
								value={value}
								ref={ref}
							/>
							<div className="text-xs text-red-500">
								{errors?.[name]?.message}
							</div>
						</div>
					)}
				/>
				<Button className="h-12 mt-3.5">Anexar</Button>
			</div>
		</div>
	)
}

export default DpsAttachmentsForm
