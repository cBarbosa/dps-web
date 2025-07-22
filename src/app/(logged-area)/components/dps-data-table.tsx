'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { Progress } from '@/components/ui/progress'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn, formatCpf } from '@/lib/utils'
import { ColumnDef } from '@tanstack/react-table'
import { InfoIcon, Trash2Icon } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type DPS = {
	uid: string
	codigo: string
	cpf: string
	dataCadastro: Date
	tipoDoc: 'simples' | 'completa'
	status: DpsStatus
	dfiStatus?: DpsStatus,
	riskStatus?: string
}

type DpsStatus = {
	id?: number
	code: number
	description: string
}

export const columns: ColumnDef<DPS>[] = [
	{
		accessorKey: 'dataCadastro',
		header: 'Dt Cadastro',
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
		accessorKey: 'codigo',
		header: 'Nº Operação',
	},
	{
		accessorKey: 'cpf',
		header: 'CPF Proponente',
		cell: ({ getValue, row }) => {
			const cpf = getValue<string>();

			return formatCpf(cpf)
		},
	},
	{
		accessorKey: 'dataCadastro',
		header: () => <div className="w-full text-center">SLA</div>,
		cell: ({ getValue, row }) => {
			const date = getValue<Date>()

			const riskStatus = row.original['riskStatus'];

			if(riskStatus)
				return <div className='w-full flex justify-center'>
					<Badge
						variant={riskStatus === 'APPROVED'
							? `success`
							: riskStatus === 'REVIEW'
								? `warn`
								:`destructive`
							}
						shape="pill"
						className={
							cn(`font-medium`,
								riskStatus === 'APPROVED'
									? `text-zinc-600`
									: riskStatus === 'REVIEW'
										? `text-zinc-600`
										:`text-white`
							)}
					>
						{(riskStatus === `APPROVED`
							? `Aprovado`
							: riskStatus === `REFUSED`
								? `Recusado`
								: riskStatus === `REVIEW`
										? `Revisão`
										: riskStatus === `CANCELED`
											? `Cancelado`
											: `-`
							)}
					</Badge>
				</div>;

			const days14inMs = 14 * 24 * 60 * 60 * 1000
			const endDate = new Date(date.getTime() + days14inMs)

			const remaining = endDate?.getTime() - Date.now()
			// if (remaining > days14inMs) {
			// 	return date?.toLocaleDateString('pt-BR', {
			// 		day: '2-digit',
			// 		month: '2-digit',
			// 		year: 'numeric',
			// 	})
			// }

			return <ProgressBar value={Math.round((1 - remaining / days14inMs) * 100)} />
		},
	},
	// {
	// 	accessorKey: 'tipoDoc',
	// 	header: 'Tipo de Documento',
	// 	cell: ({ getValue }) => {
	// 		const type = getValue<'simples' | 'completa'>()
	// 		return type === 'simples' ? 'DPS Simples' : 'DPS Completa'
	// 	}
	// },
	{
		accessorKey: 'status',
		header: () => <div className="w-full text-center">Status MIP</div>,
		cell: ({ getValue }) => {
			const status = getValue<DpsStatus>()

			if(!status)
				return (<div>-</div>)

			return (
				<div className='flex justify-center'>
					<StatusBadge
						status={{
							code: status.id ?? 0,
							description: status.description,
						}}
					/>
				</div>
			)
		},
	},
	{
		accessorKey: 'dfiStatus',
		header: () => <div className="w-full text-center">Status DFI</div>,
		cell: ({ getValue }) => {
			const status = getValue<DpsStatus>()

			if(!status)
				return (<div className='text-center'>-</div>)

			return (
				<div className='flex justify-center'>
					<StatusBadge
						status={{
							code: status.id ?? 0,
							description: status.description,
						}}
					/>
				</div>
			)
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
					{/* <Button
						type="button"
						variant="destructive"
						size="iconSm"
						className="rounded-full"
					>
						<Trash2Icon size={20} className="text-foreground p-0.5" />
					</Button> */}
				</div>
			)
		},
	},
]

function ProgressBar({ value }: { value: number }) {
	const colors = [
		[85, 212, 129],
		[17, 144, 249],
		[249, 133, 17],
		[249, 17, 20],
	]

	if (value < 0) value = 0
	if (value > 100) value = 100

	const transitionRange = 100 / (colors.length - 1)

	const colorInterval = value / transitionRange

	const transitionStart = Math.floor(colorInterval)

	const r = colors[transitionStart][0]
	const g = colors[transitionStart][1]
	const b = colors[transitionStart][2]

	const bg = `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`

	return (
		<TooltipProvider delayDuration={0}>
			<Tooltip>
				<TooltipTrigger asChild>
					<div className="px-4 py-2 cursor-pointer">
						<Progress
							className="h-1.5 w-full min-w-20"
							value={value}
							color={bg}
						/>
					</div>
				</TooltipTrigger>
				<TooltipContent>
					<p>{value}%</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	)
}

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
	} = { variant: null, className: 'font-normal text-black line-clamp-1' }

	switch (status.code) {
		case 3:
			badgeProps.variant = 'outline'
			break
		case 5:
			badgeProps.variant = 'success'
			break
		case 6:
			badgeProps.variant = 'success'
			break
		case 24:
			badgeProps.variant = 'destructive';
			break;
		case 35:
			badgeProps.variant = 'success';
			break;
		case 36:
			badgeProps.variant = 'destructive';
			break;
		case 37:
			badgeProps.variant = 'destructive'
			break
		default:
			badgeProps.variant = 'warn'
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
