import React, { useEffect } from 'react'
import { Label } from './label'
import { cn, getBase64 } from '@/lib/utils'
import { UploadCloudIcon, XIcon } from 'lucide-react'
import { Button } from './button'

const FileUpload = React.forwardRef<
	HTMLInputElement,
	React.HTMLAttributes<HTMLInputElement> & {
		multiple?: boolean
		disabled?: boolean
		label?: string
		value?: File | File[]
		accept?: string
		wrapperClassName?: string
		asFormData?: boolean
		onChange?: (files?: File[] | File) => void
		afterChange?: (args: any) => void
		onUpload?: (files?: File[] | File) => void
	}
>(
	(
		{
			className,
			wrapperClassName,
			multiple,
			disabled,
			label,
			value,
			onChange,
			afterChange,
			onUpload,
			...props
		},
		ref
	) => {
		const [files, setFiles] = React.useState<File[]>(
			value ? (Array.isArray(value) ? value : [value]) : []
		)

		if (!label) {
			label = multiple ? 'Selecionar arquivos' : 'Selecionar arquivo'
		}

		const inputRef = React.useRef<HTMLInputElement | null>(null)

		useEffect(() => {
			const newValue = value ? (Array.isArray(value) ? value : [value]) : []
			setFiles(newValue)

			if (value === undefined && inputRef.current) inputRef.current.value = ''

			// onChange?.(newValue.length > 1 ? newValue : newValue[0])
			onChange?.(value)
		}, [value, onChange, ref])

		useEffect(() => {
			afterChange?.(files.length > 1 ? files : files[0])
		}, [files, afterChange])

		function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
			const { files: targetFiles } = e.target
			const files = Array.from(targetFiles || [])
			setFiles(files)

			onChange?.(multiple ? files : files[0])
		}

		function clearSelection(e: React.MouseEvent<HTMLButtonElement>) {
			e.preventDefault()
			setFiles([])
			onChange?.([])
			if (inputRef.current) {
				inputRef.current.files = null
				inputRef.current.value = ''
			}
		}

		async function handleFileUpload(e: React.MouseEvent<HTMLButtonElement>) {
			e.preventDefault()
			console.log('uploading', files)

			if (files.length > 0) {
				// const filesBase64 = files.map(
				// 	async file => (await getBase64(file)) as string
				// )

				onUpload?.(files)

				//TODO formData upload
			}
		}

		const fileListText = files.reduce(
			(acc, file, i) => acc + file.name + (i !== files.length - 1 ? ', ' : ''),
			''
		)

		return (
			<div className="inline-flex items-center gap-1">
				<Label
					className={cn(
						'cursor-pointer group inline-block w-fit max-w-[200px]',
						wrapperClassName
					)}
					title={fileListText || undefined}
				>
					<div
						className={cn(
							'flex flex-col sm:flex-row gap-2 justify-between items-center w-full pl-2 pr-1 py-1 rounded-xl font-semibold bg-white border border-gray-300',
							disabled
								? 'cursor-not-allowed opacity-50'
								: 'cursor-pointer group-hover:border-primary',
							className
						)}
					>
						<span className="leading-5 text-md text-ellipsis overflow-x-hidden whitespace-nowrap">
							{files.length > 0 ? fileListText : label}
						</span>
						<div className="w-7">
							{files.length > 0 ? (
								<Button
									variant={'ghost'}
									className="p-0 h-fit"
									onClick={clearSelection}
									disabled={disabled}
								>
									<XIcon size={20} />
								</Button>
							) : (
								<UploadCloudIcon size={20} />
							)}
						</div>
					</div>
					<input
						{...props}
						disabled={disabled}
						multiple={multiple}
						onChange={handleSelect}
						type="file"
						className="hidden"
						ref={el => {
							inputRef.current = el
							if (typeof ref === 'function') ref(el)
						}}
					/>
				</Label>
				{files.length > 0 && (
					<Button
						className="px-2 py-1 h-full"
						disabled={disabled}
						onClick={handleFileUpload}
					>
						Enviar
					</Button>
				)}
			</div>
		)
	}
)

FileUpload.displayName = 'FileInput'

export default FileUpload
