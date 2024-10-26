import { DateAfter } from './../../node_modules/react-day-picker/src/types/Matchers'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function isValidDate(date: Date) {
	return date instanceof Date && !isNaN(date.getTime())
}
