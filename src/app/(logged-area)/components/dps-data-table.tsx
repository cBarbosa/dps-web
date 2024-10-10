'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { InfoIcon, Trash2Icon } from 'lucide-react'

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type DPS = {
	codigo: string
	cpf: string
	dataCadastro: Date
	tipoDoc: 'simples' | 'completa'
	status: DpsStatus
}

type DpsStatus = 'pendente' | 'assinada' | 'analise' | 'aceita' | 'anexar'

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
			return date.toLocaleDateString('pt-BR', {
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
			const codigo = row.getValue('codigo')

			return (
				<div className="flex gap-2">
					<Button
						variant="ghost"
						size="iconSm"
						className="rounded-full bg-white"
					>
						<InfoIcon size={20} className="text-foreground" />
					</Button>
					<Button variant="destructive" size="iconSm" className="rounded-full">
						<Trash2Icon size={20} className="text-foreground p-0.5" />
					</Button>
				</div>
			)
		},
	},
]

export default function DpsDataTable({ data }: { data: DPS[] }) {
	return (
		<div>
			<DataTable columns={columns} data={data} />
		</div>
	)
}

export function StatusBadge({ status }: { status: DpsStatus }) {
	switch (status) {
		case 'pendente':
			return (
				<Badge className="rounded-full font-normal shadow-none text-black bg-yellow-500 hover:bg-yellow-500/80">
					Pend. Assinatura
				</Badge>
			)
		case 'assinada':
			return (
				<Badge className="rounded-full font-normal shadow-none text-black bg-yellow-500 hover:bg-yellow-500/80">
					DPS Assinada
				</Badge>
			)
		case 'analise':
			return (
				<Badge className="rounded-full font-normal shadow-none text-black bg-primary hover:bg-primary/80">
					Em Análise
				</Badge>
			)
		case 'aceita':
			return (
				<Badge className="rounded-full font-normal shadow-none text-black bg-green-300 hover:bg-green-300/80">
					DPS Aceita
				</Badge>
			)
		case 'anexar':
			return (
				<Badge className="rounded-full font-normal shadow-none text-black bg-destructive hover:bg-destructive/80">
					Anexar Documentação
				</Badge>
			)
	}
}
