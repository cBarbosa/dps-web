import React, { useEffect } from 'react'
import { Label } from './label'
import { cn } from '@/lib/utils'

const FileInput = ({
	className,
	multiple,
	disabled,
	label = 'Localizar no computador',
	value,
	onChange,
	...props
}: React.HTMLAttributes<HTMLInputElement> & {
	multiple?: boolean
	disabled?: boolean
	label?: string
	value?: File | File[]
	onChange?: (files?: File[] | File) => void
}) => {
	const [files, setFiles] = React.useState<File[]>(
		value ? (Array.isArray(value) ? value : [value]) : []
	)

	useEffect(() => {
		const newValue = value ? (Array.isArray(value) ? value : [value]) : []
		setFiles(newValue)

		onChange?.(value)
	}, [value, onChange])

	function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
		const { files: targetFiles } = e.target
		const files = Array.from(targetFiles || [])
		setFiles(files)

		onChange?.(multiple ? files : files[0])
	}

	const fileListText = files.reduce(
		(acc, file, i) => acc + file.name + (i !== files.length - 1 ? ', ' : ''),
		''
	)

	return (
		<Label
			className="cursor-pointer group inline-block w-full max-w-[512px]"
			title={fileListText || undefined}
		>
			<div
				className={cn(
					'flex flex-col sm:flex-row gap-4 justify-between items-center w-full p-4 rounded-xl font-semibold bg-white border border-gray-300',
					disabled
						? 'cursor-auto opacity-50'
						: 'cursor-pointer group-hover:border-primary',
					className
				)}
			>
				<span className="leading-5 text-md text-ellipsis overflow-x-hidden whitespace-nowrap">
					{files.length > 0 ? fileListText : label}
				</span>
				<span
					className={cn(
						'text-sm text-tertiary opacity-70 group-hover:opacity-100 whitespace-nowrap',
						disabled ? 'group-hover:opacity-70' : ''
					)}
				>
					Selecionar arquivo
				</span>
			</div>
			<input
				{...props}
				disabled={disabled}
				multiple={multiple}
				onChange={handleSelect}
				type="file"
				className="hidden"
			/>
		</Label>
	)
}

export default FileInput