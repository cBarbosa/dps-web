'use client'
import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
	extends React.InputHTMLAttributes<HTMLInputElement> {
	icon?: React.ReactNode
	iconOffset?: number
	mask?: string | Array<string | RegExp>
	maskPlaceholder?: string
	beforeMaskedStateChange?: any
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	(
		{
			className,
			type,
			icon,
			iconOffset = 0,
			mask,
			maskPlaceholder,
			beforeMaskedStateChange,
			...props
		},
		ref
	) => {
		const inputClassName = cn(
			'flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-base transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-ring focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
			className
		);
		
		const inputStyle = icon ? { paddingLeft: 38 + iconOffset + 'px' } : undefined;
		
		// Use dynamic import to avoid SSR issues with ReactInputMask
		const [ReactInputMask, setReactInputMask] = React.useState<any>(null);
		
		React.useEffect(() => {
			if (mask && typeof window !== 'undefined') {
				import('react-input-mask').then((module) => {
					setReactInputMask(() => module.default);
				}).catch(() => {
					// Fallback to regular input if import fails
					setReactInputMask(false);
				});
			}
		}, [mask]);
		
		const InputComp = mask && ReactInputMask ? (
			React.createElement(ReactInputMask, {
				mask,
				maskPlaceholder: maskPlaceholder ?? '',
				beforeMaskedStateChange,
				inputRef: ref,
				className: inputClassName,
				style: inputStyle,
				...props
			})
		) : (
			<input
				type={type}
				className={inputClassName}
				style={inputStyle}
				ref={ref}
				{...props}
			/>
		)

		if (icon) {
			return (
				<div className="relative">
					<div
						className="absolute inset-y-0 left-0 flex items-center"
						style={{ paddingLeft: 8 + iconOffset + 'px' }}
					>
						{icon}
					</div>
					{InputComp}
				</div>
			)
		}

		return InputComp
	}
)
Input.displayName = 'Input'

export { Input }
