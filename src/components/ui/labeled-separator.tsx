import { cn } from '@/lib/utils'
import { Separator } from './separator'

export default function LabeledSeparator({
	label,
	orientation = 'horizontal',
	className,
	...props
}: {
	label: string
	orientation?: 'horizontal' | 'vertical'
	className?: string
}) {
	return (
		<div
			className={
				(orientation === 'vertical'
					? 'flex-col h-full justify-center'
					: 'flex-row w-full items-center') + ' flex gap-3'
			}
		>
			<Separator className="shrink" />
			<div className={cn(className, 'grow-0')}>{label}</div>
			<Separator className="shrink" />
		</div>
	)
}
