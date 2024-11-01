'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { InfoIcon, Trash2Icon } from 'lucide-react'
import Link from 'next/link'

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type DPS = {
	uid: string
	codigo: string
	cpf: string
	dataCadastro: Date
	tipoDoc: 'simples' | 'completa'
	status: DpsStatus
}

type DpsStatus = {
	code: number
	description: string
}

export const columns: ColumnDef<DPS>[] = [
	{
		accessorKey: 'codigo',
		header: 'Cód DPS',
	},
	{
		accessorKey: 'cpf',
		header: 'CPF Proponente',
	},
	{
		accessorKey: 'dataCadastro',
		header: 'Data do Cadastro',
		cell: ({ getValue }) => {
			const date = getValue<Date>()
			return date?.toLocaleDateString('pt-BR', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric',
			})
		},
	},
	{
		accessorKey: 'tipoDoc',
		header: 'Tipo de Documento',
		cell: ({ getValue }) => {
			const type = getValue<'simples' | 'completa'>()
			return type === 'simples' ? 'DPS Simples' : 'DPS Completa'
		},
	},
	{
		accessorKey: 'status',
		header: 'Status',
		cell: ({ getValue }) => {
			const status = getValue<DpsStatus>()

			return <StatusBadge status={status} />
		},
	},
	{
		accessorKey: 'actions',
		header: 'Ações',
		cell: ({ row }) => {
			const codigo = row.original.uid

			return (
				<div className="flex gap-2">
					<Button
						variant="ghost"
						size="iconSm"
						className="rounded-full bg-white"
						asChild
					>
						<Link href={`/dps/details/${codigo}`}>
							<InfoIcon size={20} className="text-foreground" />
						</Link>
					</Button>
					<Button
						type="button"
						variant="destructive"
						size="iconSm"
						className="rounded-full"
					>
						<Trash2Icon size={20} className="text-foreground p-0.5" />
					</Button>
				</div>
			)
		},
	},
]

export default function DpsDataTable({
	data,
	currentPage,
	pageAmount,
}: {
	data: DPS[]
	currentPage: number
	pageAmount: number
}) {
	'use client'
	// const router = useRouter()

	return (
		<div>
			<DataTable
				columns={columns}
				data={data}
				currentPage={currentPage}
				pageAmount={pageAmount}
				getPageUrl={page => {
					const url = new URL(window.location.href)
					url.searchParams.set('page', page.toString())
					console.log('>', url.toString())
					return url.toString()
				}}
			/>
		</div>
	)
}

export function StatusBadge({ status }: { status: DpsStatus }) {
	const badgeProps: {
		variant:
			| 'success'
			| 'warn'
			| 'destructive'
			| 'default'
			| 'secondary'
			| 'outline'
			| null
		className: string
	} = { variant: null, className: 'font-normal text-black' }

	switch (status.code) {
		case 1:
			badgeProps.variant = 'warn'
			break
		case 2:
			badgeProps.variant = 'warn'
			break
		case 3:
			badgeProps.variant = 'warn'
			break
		case 4:
			badgeProps.variant = 'destructive'
			break
		case 5:
			badgeProps.variant = 'success'
			break
		default:
	}

	return (
		<Badge
			variant={badgeProps.variant}
			shape="pill"
			className={badgeProps.className}
		>
			{status.description}
		</Badge>
	)
}
