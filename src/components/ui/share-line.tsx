import { cn } from '@/lib/utils'
import React from 'react'

const ShareLine = ({
	children,
	className,
	wrap,
}: {
	children: React.ReactNode
	className?: string
	wrap?: boolean
}) => {
	return (
		<div
			className={cn(
				className,
				'flex justify-between gap-6 [&>*]:grow [&>*]:basis-1',
				wrap && 'flex-wrap'
			)}
		>
			{children}
		</div>
	)
}

export default ShareLine
