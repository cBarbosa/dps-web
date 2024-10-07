import { cn } from '@/lib/utils'
import { forwardRef, useState } from 'react'
import { Input, InputProps } from './input'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { Button } from './button'

const InputPassword = forwardRef<HTMLInputElement, InputProps>(
	({ ...props }, ref) => {
		const [showPassword, setShowPassword] = useState(false)

		return (
			<div className="relative">
				<Input
					{...props}
					type={showPassword ? 'text' : 'password'}
					className={cn(props.className, 'pr-11 w-full')}
					ref={ref}
				/>
				<button
					type="button"
					className="absolute right-3 top-1/2 -translate-y-1/2"
					onClick={() => setShowPassword(v => !v)}
				>
					{showPassword ? (
						<EyeOffIcon className="text-slate-500" />
					) : (
						<EyeIcon className="text-slate-500" />
					)}
				</button>
			</div>
		)
	}
)
InputPassword.displayName = 'InputPassword'

export default InputPassword
