import { DateAfter } from './../../node_modules/react-day-picker/src/types/Matchers'
import { clsx, type ClassValue } from 'clsx'
import { BeforeMaskedStateChangeStates } from 'react-input-mask'
import { twMerge } from 'tailwind-merge'

export type ParseInt<T> = T extends `${infer N extends number}` ? N : never

export type RecursivePartial<T> = {
	[P in keyof T]?: RecursivePartial<T[P]>
}

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function isValidDate(date: Date) {
	return date instanceof Date && !isNaN(date.getTime())
}

export function formatCpf(cpf?: string | null) {
	if (!cpf) return ''

	cpf = cpf.replace(/[^\d]/g, '')

	return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export const getBase64 = (file: File) =>
	new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.readAsDataURL(file)
		reader.onload = () => resolve(reader.result as string)
		reader.onerror = reject
	})

/**
 * Format to Brazilian currency
 */
export const maskToBrlCurrency = ({
	nextState,
}: BeforeMaskedStateChangeStates) => {
	const { value } = nextState || {}

	let amountFormatted = value?.replace?.(/\D/g, '')
	amountFormatted = amountFormatted?.replace?.(/^0+/g, '')

	if (amountFormatted?.length === 2) {
		return {
			...nextState,
			value: `R$ ${amountFormatted}`,
			selection: {
				start: amountFormatted.length + 3,
				end: amountFormatted.length + 3,
			},
		}
	}

	const amountFormattedWithComma = amountFormatted?.replace?.(
		/(?=\d{2})(\d{2})$/,
		',$1'
	)
	const amountFormattedWithDot = amountFormattedWithComma?.replace?.(
		/(\d)(?=(\d{3})+(?!\d))/g,
		'$1.'
	)

	if (amountFormattedWithDot) {
		return {
			...nextState,
			value: `R$ ${amountFormattedWithDot}`,
			selection: {
				start: amountFormattedWithDot.length + 3,
				end: amountFormattedWithDot.length + 3,
			},
		}
	}

	return nextState
}

export function maskToDigitsAndSuffix(suffix: string) {
	return ({ nextState }: BeforeMaskedStateChangeStates) => {
		const { value } = nextState || {}

		let amountFormatted = value?.replace?.(/\D/g, '')
		amountFormatted = amountFormatted?.replace?.(/^0+/g, '')

		if (amountFormatted)
			return {
				...nextState,
				value: `${amountFormatted}${suffix}`,
				selection: {
					start: amountFormatted.length,
					end: amountFormatted.length,
				},
			}

		return nextState
	}
}

export function calculateAge(birthday: Date) {
	if (!birthday) return null
	if (!isValidDate(birthday)) return null

	const today = new Date()
	const birthDate = new Date(birthday)
	const age = today.getFullYear() - birthDate.getFullYear()
	const month = today.getMonth() - birthDate.getMonth()
	const day = today.getDate() - birthDate.getDate()

	if (month < 0 || (month === 0 && day < 0)) {
		return age - 1
	} else {
		return age
	}
}

export function getProfissionDescription(input?: string): string {
	if (!input) return ''

	const partes = input.split('-')

	return partes[1]?.trim() ?? ''
}

export function formatToPhone(value: string): string {
	if (!value) return '';
	
	// Remove non-digits
	const digits = value.replace(/\D/g, '');
	
	// Format as (XX) XXXXX-XXXX
	if (digits.length <= 2) {
		return `(${digits}`;
	} else if (digits.length <= 7) {
		return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
	} else {
		return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
	}
}
