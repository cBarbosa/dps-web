'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { cn } from '@/lib/utils'
import type { OperationAggregateStatus, OperationRow } from '@/utils/operation-aggregation'
import { ColumnDef } from '@tanstack/react-table'
import { InfoIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

function getStatusProps(status: OperationAggregateStatus): {
	label: string
	variant: 'success' | 'warn' | 'destructive'
	className: string
} {
	switch (status) {
		case 'APPROVED':
			return { label: 'Aprovado', variant: 'success', className: 'text-zinc-600' }
		case 'REJECTED':
			return { label: 'Reprovado', variant: 'destructive', className: 'text-white' }
		default:
			return { label: 'Em andamento', variant: 'warn', className: 'text-zinc-600' }
	}
}

export const columns: ColumnDef<OperationRow>[] = [
	{
		accessorKey: 'createdAt',
		header: 'Dt Cadastro',
		cell: ({ getValue }) => {
			const date = getValue<Date | undefined>()
			return date
				? date.toLocaleDateString('pt-BR', {
						day: '2-digit',
						month: '2-digit',
						year: 'numeric',
				  })
				: '-'
		},
	},
	{
		accessorKey: 'operationNumber',
		header: 'Nº Operação',
	},
	{
		accessorKey: 'participantsCount',
		header: () => <div className="w-full text-center">Participações</div>,
		cell: ({ getValue }) => {
			const n = getValue<number>()
			return <div className="w-full text-center">{n}</div>
		},
	},
	{
		accessorKey: 'status',
		header: () => <div className="w-full text-center">Status</div>,
		cell: ({ getValue }) => {
			const status = getValue<OperationAggregateStatus>()
			const props = getStatusProps(status)
			return (
				<div className="w-full flex justify-center">
					<Badge
						variant={props.variant}
						shape="pill"
						className={cn('font-medium', props.className)}
					>
						{props.label}
					</Badge>
				</div>
			)
		},
	},
	{
		accessorKey: 'actions',
		header: 'Ações',
		cell: ({ row }) => {
			const operationNumber = row.original.operationNumber
			return (
				<div className="flex gap-2">
					<Button
						variant="ghost"
						size="iconSm"
						className="rounded-full bg-white"
						asChild
					>
						<Link href={`/dps/operation/${encodeURIComponent(operationNumber)}`}>
							<InfoIcon size={20} className="text-foreground" />
						</Link>
					</Button>
				</div>
			)
		},
	},
]

export default function OperationsDataTable({
	data,
	currentPage,
	pageAmount,
}: {
	data: OperationRow[]
	currentPage: number
	pageAmount: number
}) {
	'use client'
	const pathname = usePathname()
	const searchParams = useSearchParams()

	return (
		<div>
			<DataTable
				columns={columns}
				data={data}
				currentPage={currentPage}
				pageAmount={pageAmount}
				getPageUrl={page => {
					const paramsObj = Object.fromEntries(searchParams)
					const newSearchParams = new URLSearchParams(paramsObj)
					newSearchParams.set('page', page.toString())
					const newUri = pathname + '?' + newSearchParams.toString()
					return newUri
				}}
			/>
		</div>
	)
}


