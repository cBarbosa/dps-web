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
import { dpsProfileForm, DpsProfileFormType } from './dps-profile-form'
import { postAttachmentFile, signProposal } from '../../actions'
import useAlertDialog from '@/hooks/use-alert-dialog'
import { CheckCircleIcon, CheckIcon, LoaderIcon } from 'lucide-react'

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
	proposalUid,
	dpsProfileData,
	diseaseList: diseaseListProp,
}: {
	onSubmit: (v: AttachmentsForm) => void
	proposalUid: string
	dpsProfileData: DpsProfileFormType
	setStep: (step: 'health' | 'attachments') => void
	diseaseList: Partial<
		Record<DiseaseKeys, { has: boolean; description: string }>
	>
}) => {
	const session = useSession()
	const token = (session.data as any)?.accessToken

	const [isLoading, setIsLoading] = useState(false)

	const [canProceed, setCanProceed] = useState(false)

	const fieldKeyCount = useRef(0)

	const [pickedDiseasesRaw, setPickedDiseases] = useState<
		{ key: number; arr: DiseaseKeys[] }[]
	>([{ key: fieldKeyCount.current, arr: [] }])
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
		disabled: isLoading,
	})

	async function onSubmit(v: AttachmentsForm) {
		console.log('submitting attachments', v)

		//TODO CHECK IF ALL FILES NEEDED ARE UPLOADED
		const res = await signProposal(token, proposalUid)

		if (res) {
			// reset()
			if (res.success) {
				onSubmitProp(v)
			} else {
				//TODO add error alert
				console.error(res.message)
			}
		}

		console.log('saudetop', v)
	}

	const setPickedDiseasesByKey = useCallback(
		(key: number, diseases: DiseaseKeys[]) => {
			setPickedDiseases(prev => {
				const picked = prev.find(v => v.key === key)
				if (!picked) return prev
				picked.arr = diseases
				console.log(prev)
				return [...prev]
			})
		},
		[setPickedDiseases]
	)

	function checkPickedDiseases() {
		console.log('picked >', pickedDiseases)
		console.log('list >', diseaseList)

		const pickedDiseasesFlat = pickedDiseases.flat(2)
		if (
			pickedDiseasesFlat.length === diseaseList.length &&
			diseaseList.every(v => pickedDiseasesFlat.includes(v))
		) {
			console.log('>> ok')
			setCanProceed(true)
		}
	}

	const addFileInput = useCallback(() => {
		fieldKeyCount.current++
		setPickedDiseases(prev => [
			...prev,
			{ key: fieldKeyCount.current, arr: [] },
		])
	}, [setPickedDiseases])

	const removeFileInputByKey = useCallback(
		(key: number) => {
			if (pickedDiseasesRaw.length <= 1) return
			setPickedDiseases(prev => {
				const index = prev.findIndex(v => v.key === key)
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
							key={pickedObj.key}
							token={token}
							dpsProfileData={dpsProfileData}
							proposalUid={proposalUid}
							getValues={getValues}
							options={options}
							inputIndex={pickedObj.key}
							resetField={resetField}
							removeField={removeFileInputByKey}
							setPickedDiseases={setFileDiseases}
							control={control}
							errors={errors}
							isSubmitting={isSubmitting}
							setIsLoading={setIsLoading}
							checkPickedDiseases={checkPickedDiseases}
						/>
					)
				})
			) : (
				<div className="py-4 px-4 border border-gray-200 rounded-lg">
					<div className="text-gray-500">Não é necessário anexar arquivos.</div>
				</div>
			)}

			<Button
				className="w-64"
				onClick={addFileInput}
				disabled={pickedDiseases.flat(2).length === diseaseList.length}
			>
				Adicionar novo arquivo
			</Button>

			<div className="flex gap-5">
				<Button
					variant="outline"
					className="w-40"
					onClick={() => setStep('health')}
					disabled={isSubmitting || isLoading}
				>
					Voltar
				</Button>
				<Button
					type="submit"
					className="w-40"
					disabled={!canProceed || isSubmitting || isLoading}
				>
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
	setIsLoading,
	checkPickedDiseases,
}: {
	token: string
	proposalUid: string
	dpsProfileData: DpsProfileFormType
	options: { label: string; value: string }[]
	setPickedDiseases: (v: DiseaseKeys[]) => void
	removeField: (i: number) => void
	inputIndex: number
	getValues: UseFormGetValues<AttachmentsForm>
	resetField: UseFormResetField<AttachmentsForm>
	control: Control<AttachmentsForm>
	errors: FormState<AttachmentsForm>['errors']
	isSubmitting: boolean
	setIsLoading: (v: boolean) => void
	checkPickedDiseases: () => void
}) {
	const [selected, setSelected] = useState<
		{ label: string; value: DiseaseKeys }[]
	>([])

	const [uploadStatus, setUploadStatus] = useState<
		'none' | 'uploading' | 'uploaded'
	>('none')

	const [uploadedFilename, setUploadedFilename] = useState<string>()

	const alertDialog = useAlertDialog({
		initialContent: {
			title: '',
		},
	})

	async function uploadFile() {
		console.log('attempting upload')
		const fileValue = getValues(`attachments.${inputIndex}.file`)

		const diseaseList = getValues(
			`attachments.${inputIndex}.diseaseList`
		) as DiseaseKeys[]

		if (!fileValue || !diseaseList) return

		const fileBase64 = (await getBase64(fileValue)) as string

		if (!fileBase64) return

		setUploadStatus('uploading')
		setIsLoading(true)

		console.log('uploading')

		const postData = {
			documentName: fileValue.name,
			description:
				'Laudo para as doenças: ' +
				diseaseList.map(disease => diseaseNames[disease]).join(', '),
			stringBase64: fileBase64.split(',')[1],
		}

		console.log('submitting', postData)

		const response = await postAttachmentFile(token, proposalUid, postData)
		// const response = await Promise.resolve({ success: false, message: 'erro' })
		// const response = await Promise.reject(new Error('erro'))

		// // await 1 second to simulate upload time
		// await new Promise(resolve => setTimeout(resolve, 1000))

		console.log('post upload', response)

		if (response) {
			// reset()
			if (response.success) {
				setUploadStatus('uploaded')
				setUploadedFilename(fileValue.name)
				checkPickedDiseases()
				// onSubmitProp(v)
			} else {
				console.error(response.message)
				alertDialog.setContent(
					{
						title: 'Erro ao enviar anexo',
						description: 'Tente novamente.',
					},
					true
				)
				setUploadStatus('none')
			}
		} else {
			alertDialog.setContent(
				{
					title: 'Ocorreu um problema',
					description: 'Arquivo não foi enviado.',
				},
				true
			)
			setUploadStatus('none')
		}
		setIsLoading(false)
		// onSubmitProp(v)
		// console.log('saudetop', v)
	}

	if (uploadStatus === 'uploaded')
		return (
			<UploadCompleted
				diseaseList={selected.map(v => v.label)}
				fileName={uploadedFilename ?? ''}
			/>
		)

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
								className="basis-1/2 w-1/2 max-w-[590px]"
								options={options}
								value={selected}
								valueRenderer={customValueRenderer}
								onChange={(v: { label: string; value: DiseaseKeys }[]) => {
									setSelected(v)
									setPickedDiseases(v.map(v => v.value))
									onChange(v.map(v => v.value))
								}}
								labelledBy="Selecione as doenças deste laudo"
								disabled={isSubmitting || uploadStatus !== 'none'}
							/>

							<Button
								variant="outline"
								onClick={() => {
									removeField(inputIndex)
									onChange(undefined)
									resetField(`attachments.${inputIndex}.diseaseList`)
									resetField(`attachments.${inputIndex}.file`)
								}}
								disabled={isSubmitting || uploadStatus !== 'none'}
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
								disabled={isSubmitting || uploadStatus !== 'none'}
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
				<Button
					className="h-12 mt-3.5"
					onClick={uploadFile}
					disabled={isSubmitting || uploadStatus !== 'none'}
				>
					{uploadStatus === 'none' ? (
						'Fazer upload'
					) : uploadStatus === 'uploading' ? (
						<>
							<LoaderIcon className="animate-spin mr-1" />
							Enviando...
						</>
					) : (
						'Enviado'
					)}
				</Button>
				{alertDialog.dialogComp}
			</div>
		</div>
	)
}

const customValueRenderer = (
	selected: { label: string; value: DiseaseKeys }[],
	options: { label: string; value: DiseaseKeys }[]
) => {
	return selected.length ? selected.map(({ label }) => label).join(', ') : ''
}

export default DpsAttachmentsForm

function UploadCompleted({
	diseaseList,
	fileName,
}: {
	diseaseList: string[]
	fileName: string
}) {
	return (
		<div className="py-1 px-1">
			<div className="flex items-center justify-start gap-5 border p-3 rounded-xl hover:bg-gray-50">
				<div className="basis-0 grow-0">
					<CheckCircleIcon className="text-green-600" size={32} />
				</div>
				<div className="basis-auto grow">
					<p className="text-gray-800 text-base">
						{diseaseList.length > 0
							? `Doenças: ${diseaseList.join(', ')}`
							: 'Nenhuma doença selecionada'}
					</p>
					<p className="text-slate-400 text-sm">Arquivo: {fileName}</p>
				</div>
			</div>
		</div>
	)
}
