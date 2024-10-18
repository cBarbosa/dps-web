'use client'

import {
	ColumnDef,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from '@tanstack/react-table'

import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationFirst,
	PaginationItem,
	PaginationLast,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from './pagination'

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[]
	data: TData[]
	currentPage?: number
	pageAmount?: number
	getPageUrl?: (page: number) => string
	onPageChange?: (page: number) => void
}

export function DataTable<TData, TValue>({
	columns,
	data,
	currentPage,
	pageAmount,
	getPageUrl,
	onPageChange,
}: DataTableProps<TData, TValue>) {
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
	})

	return (
		<Table>
			<TableHeader>
				{table.getHeaderGroups().map(headerGroup => (
					<TableRow key={headerGroup.id}>
						{headerGroup.headers.map(header => {
							return (
								<TableHead key={header.id}>
									{header.isPlaceholder
										? null
										: flexRender(
												header.column.columnDef.header,
												header.getContext()
										  )}
								</TableHead>
							)
						})}
					</TableRow>
				))}
			</TableHeader>
			<TableBody>
				{table.getRowModel().rows?.length ? (
					table.getRowModel().rows.map(row => (
						<TableRow
							key={row.id}
							data-state={row.getIsSelected() && 'selected'}
						>
							{row.getVisibleCells().map(cell => (
								<TableCell key={cell.id}>
									{flexRender(cell.column.columnDef.cell, cell.getContext())}
								</TableCell>
							))}
						</TableRow>
					))
				) : (
					<TableRow>
						<TableCell colSpan={columns.length} className="h-24 text-center">
							No results.
						</TableCell>
					</TableRow>
				)}
			</TableBody>
			{pageAmount && currentPage ? (
				<TableFooter>
					<TableRow>
						<TableCell colSpan={columns.length}>
							<TablePagination
								currentPage={currentPage}
								pageAmount={pageAmount}
								getPageUrl={getPageUrl}
								onPageChange={onPageChange}
							/>
						</TableCell>
					</TableRow>
				</TableFooter>
			) : null}
		</Table>
	)
}

export function TablePagination({
	currentPage,
	pageAmount,
	getPageUrl,
	onPageChange,
}: {
	currentPage: number
	pageAmount: number
	getPageUrl?: (page: number) => string
	onPageChange?: (page: number) => void
}) {
	if (pageAmount <= 1) {
		return null
	}

	let pageButtons: JSX.Element[] = []

	if (pageAmount <= 5) {
		pageButtons = Array.from({ length: pageAmount }, (_, i) => (
			<PaginationItem key={i}>
				<PaginationLink
					onClick={() => onPageChange?.(i + 1)}
					href={getPageUrl?.(i + 1)}
					isActive={currentPage === i + 1}
				>
					{i + 1}
				</PaginationLink>
			</PaginationItem>
		))
	} else {
		if (currentPage <= 3) {
			pageButtons = Array.from({ length: 3 }, (_, i) => (
				<PaginationItem key={i}>
					<PaginationLink
						onClick={() => onPageChange?.(i + 1)}
						href={getPageUrl?.(i + 1)}
						isActive={currentPage === i + 1}
					>
						{i + 1}
					</PaginationLink>
				</PaginationItem>
			))

			pageButtons.push(
				<PaginationItem>
					<PaginationEllipsis />
				</PaginationItem>
			)

			pageButtons.push(
				<PaginationItem>
					<PaginationLink
						href={getPageUrl?.(pageAmount)}
						onClick={() => onPageChange?.(pageAmount)}
					>
						{pageAmount}
					</PaginationLink>
				</PaginationItem>
			)
		} else if (currentPage > pageAmount - 3) {
			pageButtons.push(
				<PaginationItem>
					<PaginationLink
						href={getPageUrl?.(1)}
						onClick={() => onPageChange?.(1)}
					>
						1
					</PaginationLink>
				</PaginationItem>
			)

			pageButtons.push(
				<PaginationItem>
					<PaginationEllipsis />
				</PaginationItem>
			)

			pageButtons.push(
				...Array.from({ length: 3 }, (_, i) => {
					const page = pageAmount - 2 + i
					return (
						<PaginationItem key={i}>
							<PaginationLink
								onClick={() => onPageChange?.(page)}
								href={getPageUrl?.(page)}
								isActive={currentPage === page}
							>
								{page}
							</PaginationLink>
						</PaginationItem>
					)
				})
			)
		} else {
			pageButtons.push(
				<PaginationItem>
					<PaginationLink
						href={getPageUrl?.(1)}
						onClick={() => onPageChange?.(1)}
					>
						1
					</PaginationLink>
				</PaginationItem>
			)

			pageButtons.push(
				<PaginationItem>
					<PaginationEllipsis />
				</PaginationItem>
			)

			pageButtons.push(
				...Array.from({ length: 3 }, (_, i) => {
					const page = currentPage - 1 + i
					return (
						<PaginationItem key={i}>
							<PaginationLink
								onClick={() => onPageChange?.(page)}
								href={getPageUrl?.(page)}
								isActive={currentPage === page}
							>
								{page}
							</PaginationLink>
						</PaginationItem>
					)
				})
			)

			pageButtons.push(
				<PaginationItem>
					<PaginationEllipsis />
				</PaginationItem>
			)

			pageButtons.push(
				<PaginationItem>
					<PaginationLink
						href={getPageUrl?.(pageAmount)}
						onClick={() => onPageChange?.(pageAmount)}
					>
						{pageAmount}
					</PaginationLink>
				</PaginationItem>
			)
		}
	}

	return (
		<Pagination className="w-full flex justify-end">
			<PaginationContent>
				<PaginationItem>
					<PaginationFirst
						href={getPageUrl?.(1)}
						disabled={currentPage === 1}
					/>
				</PaginationItem>
				<PaginationItem>
					<PaginationPrevious
						href={getPageUrl?.(currentPage - 1)}
						disabled={currentPage === 1}
					/>
				</PaginationItem>

				{pageButtons}

				{/* <PaginationItem>
					<PaginationEllipsis />
				</PaginationItem>

				<PaginationItem>
					<PaginationLink href="#">10</PaginationLink>
				</PaginationItem> */}

				<PaginationItem>
					<PaginationNext
						href={getPageUrl?.(currentPage + 1)}
						disabled={currentPage === pageAmount}
					/>
				</PaginationItem>
				<PaginationItem>
					<PaginationLast
						href={getPageUrl?.(pageAmount)}
						disabled={currentPage === pageAmount}
					/>
				</PaginationItem>
			</PaginationContent>
		</Pagination>
	)
}
