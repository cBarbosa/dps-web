import { cn } from '@/lib/utils'
import React from 'react'

const ShareLine = ({
	children,
	className,
}: {
	children: React.ReactNode
	className?: string
}) => {
	return (
		<div
			className={cn(
				className,
				'flex justify-between gap-6 [&>*]:grow [&>*]:basis-1'
			)}
		>
			{children}
		</div>
	)
}

export default ShareLine
