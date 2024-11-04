'use client'

import * as React from 'react'

import { isValidDate } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from './input'
import { CalendarIcon } from 'lucide-react'

function DatePicker(
	{
		className,
		onChange,
		onBlur,
		value: valueProp,
		id,
		placeholder = 'Selecione uma data',
		disabled = false,
		...props
	}: {
		className?: string
		onChange?: (date?: Date) => void
		onBlur?: (date?: Date) => void
		value?: Date
		id?: string
		placeholder?: string
		disabled?: boolean
	},
	ref: React.Ref<HTMLInputElement>
) {
	const [date, setDate] = React.useState<Date | undefined>(valueProp)
	const [inputValue, setInputValue] = React.useState(
		valueProp?.toLocaleDateString('pt-BR') ?? ''
	)
	const inputRef = React.useRef<HTMLInputElement>(null)

	function handleOpen(open: boolean) {
		if (open) {
			requestAnimationFrame(() => {
				inputRef.current?.focus()
			})
		}
	}

	function handleDateChange(newDate?: Date) {
		if (newDate == undefined || !isValidDate(newDate)) {
			setDate(undefined)
			setInputValue('')
			onChange?.(undefined)
			return
		}

		setDate(newDate)
		setInputValue(newDate.toLocaleDateString('pt-BR'))

		onChange?.(newDate)
	}

	function handleInputBlur(e: React.ChangeEvent<HTMLInputElement>) {
		const value = e.target.value

		const [day, month, year] = value.split('/')

		const parsedDate = new Date(`${year}-${month}-${day}T00:00:00.000-03:00`)
		console.log('parsed', parsedDate)
		handleDateChange(parsedDate)

		onBlur?.(parsedDate)
	}
	console.log('valueprop', valueProp)

	function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
		const value = e.target.value
		setInputValue(value)

		if (value.length === 10) {
			handleInputBlur(e)
		}
	}

	return (
		<Popover onOpenChange={handleOpen}>
			<PopoverTrigger asChild>
				<>
					<Input
						id={id}
						mask="99/99/9999"
						value={inputValue}
						onChange={handleInputChange}
						onBlur={handleInputBlur}
						placeholder={placeholder}
						// value={date ? date.toLocaleDateString('pt-BR') : ''}
						icon={<CalendarIcon size={16} className="text-muted-foreground" />}
						iconOffset={4}
						className={className}
						ref={inputRef}
						disabled={disabled}
					/>
				</>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					mode="single"
					selected={date}
					defaultMonth={date ?? new Date()}
					month={date ?? new Date()}
					onSelect={handleDateChange}
					initialFocus
					disabled={disabled}
				/>
			</PopoverContent>
		</Popover>
	)
}

export default React.forwardRef(DatePicker)
