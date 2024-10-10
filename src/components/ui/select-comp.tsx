'use client'
import { Key, useState } from 'react'
import { Button } from './button'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from './select'

export type SelectProps = React.ComponentProps<typeof Select> & {
	placeholder: string
	options: Array<{ value: string; label: string; disabled?: boolean }>
	triggerClassName?: string
	allowClear?: boolean
}

export default function SelectComp({ allowClear, ...props }: SelectProps) {
	const [resetKey, setResetKey] = useState(+new Date())

	function handleReset() {
		props.onValueChange?.('')
		setResetKey(v => +new Date())
	}

	return (
		<>
			<SelectUi
				{...props}
				reset={allowClear ? handleReset : undefined}
				key={resetKey}
			/>
		</>
	)
}

type SelectUiProps = React.ComponentProps<typeof Select> & {
	placeholder: string
	options: Array<{ value: string; label: string; disabled?: boolean }>
	triggerClassName?: string
	reset?: () => void
}

function SelectUi({
	placeholder,
	options,
	triggerClassName,
	reset,
	...props
}: SelectUiProps) {
	return (
		<Select {...props}>
			<SelectTrigger className={triggerClassName}>
				<SelectValue placeholder={placeholder} />
			</SelectTrigger>
			<SelectContent>
				{reset && (
					<SelectItem value="&___none___&" asChild>
						<Button
							variant="ghost"
							className="w-full justify-start p-2 text-muted-foreground hover:text-muted-foreground"
							onClick={reset}
						>
							Limpar
						</Button>
					</SelectItem>
				)}
				{options.map(option => (
					<SelectItem
						key={option.value}
						value={option.value}
						disabled={option.disabled}
					>
						{option.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	)
}
