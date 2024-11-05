import { Button } from '@/components/ui/button'
import FileInput from '@/components/ui/file-input'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import ShareLine from '@/components/ui/share-line'
import { cn, getBase64 } from '@/lib/utils'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
	Control,
	Controller,
	FormState,
	useForm,
	UseFormGetValues,
	UseFormReset,
	UseFormResetField,
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
	union,
} from 'valibot'
import { DiseaseKeys, diseaseNames } from './dps-form'
import { MultiSelect } from 'react-multi-select-component'
import { useSession } from 'next-auth/react'
import { ProfileForm } from './dps-profile-form'
import { getProposals, postAttachmentFile, signProposal } from '../../actions'

const attachmentsForm = union([
	object({
		attachments: array(
			object({
				diseaseList: array(pipe(string(), nonEmpty('Campo obrigatório.'))),
				file: nonOptional(file(), 'Campo obrigatório.'),
			})
		),
	}),
	object({
		attachments: array(
			object({
				diseaseList: optional(array(string())),
				file: optional(file()),
			})
		),
	}),
])

export type AttachmentsForm = InferInput<typeof attachmentsForm>

const DpsAttachmentsForm = ({
	onSubmit: onSubmitProp,
	setStep,
	proposalUid: proposalUidProp,
	dpsProfileData,
	diseaseList: diseaseListProp,
}: {
	onSubmit: (v: AttachmentsForm) => void
	proposalUid?: string
	dpsProfileData: ProfileForm
	setStep: (step: 'profile' | 'health' | 'attachments') => void
	diseaseList: Partial<
		Record<DiseaseKeys, { has: boolean; description: string }>
	>
}) => {
	const session = useSession()
	const token = (session.data as any)?.accessToken

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

	const [pickedDiseasesRaw, setPickedDiseases] = useState<
		{ key: string; arr: DiseaseKeys[] }[]
	>([{ key: '1', arr: [] }])
	const pickedDiseases = pickedDiseasesRaw.map(v => v.arr)

	const diseaseList = useMemo(() => {
		return Object.entries(diseaseListProp).reduce((acc, [key, value]) => {
			if (value.has) {
				acc.push(key as DiseaseKeys)
			}
			return acc
		}, [] as Array<DiseaseKeys>)
	}, [diseaseListProp])

	const {
		handleSubmit,
		getValues,
		trigger,
		resetField,
		control,
		watch,
		formState: { isSubmitting, isSubmitted, errors, ...formState },
	} = useForm<AttachmentsForm>({
		resolver: valibotResolver(attachmentsForm),
	})

	const router = useRouter()

	async function onSubmit(v: AttachmentsForm) {
		console.log('submitting attachments', v)
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

		//TODO CHECK IF ALL FILES NEEDED ARE UPLOADED

		const res = await signProposal(token, proposalUid)

		if (res) {
			// reset()
			if (res.success) {
				onSubmitProp(v)
			} else {
				console.error(res.message)
			}
		}

		console.log('saudetop', v)

		// router.push('/dashboard')
	}

	const setPickedDiseasesByKey = useCallback(
		(key: string, diseases: DiseaseKeys[]) => {
			setPickedDiseases(prev => {
				return [
					...prev.filter(v => v.key !== key),
					{
						key: key,
						arr: diseases,
					},
				]
			})
		},
		[setPickedDiseases]
	)

	const addFileInput = useCallback(() => {
		setPickedDiseases(prev => [
			...prev,
			{ key: new Date().getTime().toString(), arr: [] },
		])
	}, [setPickedDiseases])

	const removeFileInput = useCallback(
		(index: number) => {
			if (pickedDiseasesRaw.length === 1) return
			setPickedDiseases(prev => {
				return prev.toSpliced(index, 1)
			})
		},
		[setPickedDiseases, pickedDiseasesRaw]
	)

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className="flex flex-col gap-6 w-full"
		>
			<h3 className="text-primary text-lg">Anexar laudos</h3>
			<div>Faça upload dos laudos das doenças especificadas.</div>
			<Button className="w-64" onClick={addFileInput}>
				Adicionar novo arquivo
			</Button>

			{Object.keys(diseaseList).length > 0 ? (
				pickedDiseasesRaw.map((pickedObj, i) => {
					function setFileDiseases(diseases: DiseaseKeys[]) {
						// setPickedDiseases(prev => {
						// 	return [...prev.slice(0, i), diseases, ...prev.slice(i + 1)]
						// })
						setPickedDiseasesByKey(pickedObj.key, diseases)
					}

					const options = diseaseList
						.filter(disease => {
							return !pickedDiseases.toSpliced(i, 1).flat().includes(disease)
						})
						.map(disease => ({
							label: diseaseNames[disease],
							value: disease,
						}))

					return (
						<AttachmentField
							token={token}
							setProposalUid={setProposalUid}
							dpsProfileData={dpsProfileData}
							proposalUid={proposalUid}
							key={pickedObj.key}
							getValues={getValues}
							options={options}
							inputIndex={i}
							resetField={resetField}
							removeField={removeFileInput}
							setPickedDiseases={setFileDiseases}
							control={control}
							errors={errors}
							isSubmitting={isSubmitting}
						/>
					)
				})
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
	token,
	proposalUid,
	setProposalUid,
	options,
	dpsProfileData,
	setPickedDiseases,
	removeField,
	inputIndex,
	control,
	getValues,
	errors,
	resetField,
	isSubmitting,
}: {
	token: string
	proposalUid?: string
	setProposalUid: (v: string) => void
	dpsProfileData: ProfileForm
	options: { label: string; value: string }[]
	setPickedDiseases: (v: DiseaseKeys[]) => void
	removeField: (i: number) => void
	inputIndex: number
	getValues: UseFormGetValues<AttachmentsForm>
	resetField: UseFormResetField<AttachmentsForm>
	control: Control<AttachmentsForm>
	errors: FormState<AttachmentsForm>['errors']
	isSubmitting: boolean
}) {
	const [selected, setSelected] = useState<
		{ label: string; value: DiseaseKeys }[]
	>([])

	const [isUploaded, setIsUploaded] = useState(false)

	async function uploadFile() {
		console.log('attempting upload')
		const fileValue = getValues(`attachments.${inputIndex}.file`)

		const diseaseList = getValues(
			`attachments.${inputIndex}.diseaseList`
		) as DiseaseKeys[]

		if (!fileValue || !diseaseList) return

		const fileBase64 = (await getBase64(fileValue)) as string

		if (!fileBase64) return

		console.log('uploading')
		if (!proposalUid) {
			await getProposals(
				token,
				dpsProfileData.cpf,
				+dpsProfileData.lmi,
				dpsProfileData.produto
			).then(res => {
				if (res?.items[0]?.uid) setProposalUid(res?.items[0]?.uid)
			})

			return
		}

		const postData = {
			documentName: fileValue.name,
			description:
				'Laudo para as doenças: ' +
				diseaseList.map(disease => diseaseNames[disease]).join(', '),
			stringBase64: fileBase64,
		}

		console.log('submitting', postData)

		const response = await postAttachmentFile(token, proposalUid, postData)

		console.log('post upload', response)

		if (response) {
			// reset()
			if (response.success) {
				setIsUploaded(true)
				// onSubmitProp(v)
			} else {
				console.error(response.message)
			}
		}
		// onSubmitProp(v)
		// console.log('saudetop', v)
	}

	return (
		<div className="py-4 px-4 hover:bg-gray-50">
			<div className="flex justify-start gap-5">
				<Controller
					control={control}
					defaultValue={undefined}
					name={`attachments.${inputIndex}.diseaseList`}
					render={({ field: { onChange, onBlur, value, ref } }) => (
						<>
							<MultiSelect
								className="basis-1/2"
								options={options}
								value={selected}
								onChange={(v: { label: string; value: DiseaseKeys }[]) => {
									setSelected(v)
									setPickedDiseases(v.map(v => v.value))
									onChange(v.map(v => v.value))
								}}
								labelledBy="Selecione as doenças deste laudo"
							/>

							<Button
								variant="outline"
								onClick={() => {
									removeField(inputIndex)
									onChange(undefined)
									resetField(`attachments.${inputIndex}.diseaseList`)
									resetField(`attachments.${inputIndex}.file`)
								}}
							>
								Remover
							</Button>
						</>
					)}
				/>
			</div>

			<div className="flex justify-start gap-5">
				<Controller
					control={control}
					defaultValue={undefined}
					name={`attachments.${inputIndex}.file`}
					render={({ field: { onChange, onBlur, value, ref } }) => (
						<div className="basis-1/2">
							<FileInput
								id={`attachments.${inputIndex}.file`}
								label="Anexar laudo"
								className={cn(
									'w-full mt-3 rounded-lg',
									errors?.attachments?.[inputIndex]?.file &&
										'border-red-500 focus-visible:border-red-500'
								)}
								accept="application/pdf"
								disabled={isSubmitting || isUploaded}
								onChange={onChange}
								// afterChange={handleAttachmentAfterChange}
								onBlur={onBlur}
								value={value}
								ref={ref}
							/>
							<div className="text-xs text-red-500">
								{errors?.attachments?.[inputIndex]?.file?.message}
							</div>
						</div>
					)}
				/>
				<Button className="h-12 mt-3.5" onClick={uploadFile}>
					Fazer upload
				</Button>
			</div>
		</div>
	)
}

export default DpsAttachmentsForm
