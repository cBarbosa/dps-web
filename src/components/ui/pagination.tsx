import * as React from 'react'
import { cn } from '@/lib/utils'
import { ButtonProps, buttonVariants } from '@/components/ui/button'
import Link from 'next/link'
import {
	ChevronLeftIcon,
	ChevronRightIcon,
	ChevronsLeftIcon,
	ChevronsRightIcon,
	EllipsisIcon,
} from 'lucide-react'

const Pagination = ({ className, ...props }: React.ComponentProps<'nav'>) => (
	<nav
		role="navigation"
		aria-label="pagination"
		className={cn('mx-auto flex w-full justify-center', className)}
		{...props}
	/>
)
Pagination.displayName = 'Pagination'

const PaginationContent = React.forwardRef<
	HTMLUListElement,
	React.ComponentProps<'ul'>
>(({ className, ...props }, ref) => (
	<ul
		ref={ref}
		className={cn('flex flex-row items-center gap-1', className)}
		{...props}
	/>
))
PaginationContent.displayName = 'PaginationContent'

const PaginationItem = React.forwardRef<
	HTMLLIElement,
	React.ComponentProps<'li'>
>(({ className, ...props }, ref) => (
	<li ref={ref} className={cn('', className)} {...props} />
))
PaginationItem.displayName = 'PaginationItem'

type PaginationLinkProps = {
	isActive?: boolean
	disabled?: boolean
} & Pick<ButtonProps, 'size'> &
	React.ComponentProps<'a'>

const PaginationLink = ({
	className,
	isActive,
	href = '',
	size = 'icon',
	disabled = false,
	...props
}: PaginationLinkProps) =>
	!disabled ? (
		<Link
			href={href}
			aria-current={isActive ? 'page' : undefined}
			className={cn(
				buttonVariants({
					variant: isActive ? 'default' : 'secondary',
					size,
				}),
				isActive ? 'hover:text-white' : '',
				className
			)}
			{...props}
		/>
	) : (
		<div
			className={cn(
				buttonVariants({
					variant: isActive ? 'default' : 'secondary',
					size,
				}),
				isActive ? 'hover:text-white' : '',
				'opacity-50',
				className
			)}
		>
			{props.children}
		</div>
	)
PaginationLink.displayName = 'PaginationLink'

const PaginationFirst = ({
	className,
	disabled = false,
	...props
}: React.ComponentProps<typeof PaginationLink>) => (
	<PaginationLink
		aria-label="Ir para primeira anterior"
		size="default"
		className={cn('px-2.5', className)}
		disabled={disabled}
		{...props}
	>
		<ChevronsLeftIcon className="h-4 w-4" />
		<span className="sr-only">Primeira página</span>
	</PaginationLink>
)
PaginationFirst.displayName = 'PaginationFirst'

const PaginationPrevious = ({
	className,
	disabled = false,
	...props
}: React.ComponentProps<typeof PaginationLink>) => (
	<PaginationLink
		aria-label="Ir para página anterior"
		size="default"
		className={cn('px-2.5', className)}
		disabled={disabled}
		{...props}
	>
		<ChevronLeftIcon className="h-4 w-4" />
		<span className="sr-only">Página anterior</span>
	</PaginationLink>
)
PaginationPrevious.displayName = 'PaginationPrevious'

const PaginationNext = ({
	className,
	disabled = false,
	...props
}: React.ComponentProps<typeof PaginationLink>) => (
	<PaginationLink
		aria-label="Ir para próxima página"
		size="default"
		className={cn('px-2.5', className)}
		disabled={disabled}
		{...props}
	>
		<ChevronRightIcon className="h-4 w-4" />
		<span className="sr-only">Próxima página</span>
	</PaginationLink>
)
PaginationNext.displayName = 'PaginationNext'

const PaginationLast = ({
	className,
	disabled = false,
	...props
}: React.ComponentProps<typeof PaginationLink>) => (
	<PaginationLink
		aria-label="Ir para última página"
		size="default"
		className={cn('px-2.5', className)}
		disabled={disabled}
		{...props}
	>
		<ChevronsRightIcon className="h-4 w-4" />
		<span className="sr-only">Última página</span>
	</PaginationLink>
)
PaginationLast.displayName = 'PaginationLast'

const PaginationEllipsis = ({
	className,
	...props
}: React.ComponentProps<'span'>) => (
	<span
		aria-hidden
		className={cn('flex h-9 w-9 items-center justify-center', className)}
		{...props}
	>
		<EllipsisIcon className="h-4 w-4" />
		<span className="sr-only">Mais páginas</span>
	</span>
)
PaginationEllipsis.displayName = 'PaginationEllipsis'

export {
	Pagination,
	PaginationContent,
	PaginationLink,
	PaginationItem,
	PaginationFirst,
	PaginationPrevious,
	PaginationNext,
	PaginationLast,
	PaginationEllipsis,
}
