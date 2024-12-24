import { Input } from '@/components/ui/input'
import DpsDataTable, { DPS } from '../components/dps-data-table'
import { ListFilterIcon, SearchIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
// import { getProposals } from './actions'
import { redirect } from 'next/navigation'
import { getProposals } from '../dps/actions'
import getServerSessionAuthorization, {
	ApiRoles,
} from '@/hooks/getServerSessionAuthorization'
import { PieChartCard, DonutProgressCard } from '../components/data-card'
import { ChartConfig } from '@/components/ui/chart'
import Link from 'next/link'

export const revalidate = 0 // no cache
// export const maxDuration = 300;
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
	const { session, granted } = await getServerSessionAuthorization()
	const role = (session as any)?.role?.toLowerCase() as
		| Lowercase<ApiRoles>
		| undefined

	const chartData = [
		{
			label: 'Anexar Documentação',
			value: 0,
			fill: 'hsl(var(--chart-1))',
			href: '/dashboard/table?status=5',
		},
		{
			label: 'Em Análise',
			value: 0,
			fill: 'hsl(var(--chart-2))',
			href: '/dashboard/table?status=4',
		},
		{
			label: 'Assinada',
			value: 55,
			fill: 'hsl(var(--chart-3))',
			href: '/dashboard/table?status=10',
		},
		{
			label: 'Aceita',
			value: 35,
			fill: 'hsl(var(--chart-4))',
			href: '/dashboard/table?status=6',
		},
		{
			label: 'Pendente de Assinatura',
			value: 10,
			fill: 'hsl(var(--chart-5))',
			href: '/dashboard/table?status=3',
		},
	]

	const chartConfig = {
		value: {
			label: 'Value',
		},
		chrome: {
			label: 'Chrome',
			color: 'hsl(var(--chart-1))',
		},
		safari: {
			label: 'Safari',
			color: 'hsl(var(--chart-2))',
		},
		firefox: {
			label: 'Firefox',
			color: 'hsl(var(--chart-3))',
		},
		edge: {
			label: 'Edge',
			color: 'hsl(var(--chart-4))',
		},
		other: {
			label: 'Other',
			color: 'hsl(var(--chart-5))',
		},
	} satisfies ChartConfig

	return (
		<div className="p-5">
			<div className="p-5 w-full max-w-7xl mx-auto bg-white rounded-3xl">
				<div className="grid grid-cols-2 xl:grid-cols-4 gap-8">
					<div className="contents">
						<DonutProgressCard
							label="DPS's preenchidas"
							value={150}
							change={2.4}
						/>
						<DonutProgressCard
							label="Pend. de Assinatura"
							value={150}
							change={2.4}
							chartData={{
								value: 8,
								fill: 'hsl(var(--chart-2))',
							}}
						/>
					</div>
					<div className="contents">
						<DonutProgressCard
							label="Pend. de Documentação"
							value={23}
							chartData={{
								value: 21,
								fill: 'hsl(var(--chart-3))',
							}}
							change={2.2}
						/>
						<DonutProgressCard
							label="Em Reanálise"
							value={5}
							chartData={{
								value: 2,
								fill: 'hsl(var(--chart-4))',
							}}
							change={0.2}
						/>
					</div>
					<div className="col-span-2">
						<PieChartCard
							title="SLA MIP"
							chartData={{ data: chartData, config: chartConfig }}
						/>
					</div>
					<div className="col-span-2">
						<PieChartCard
							title="SLA DFI"
							chartData={{ data: chartData, config: chartConfig }}
						/>
					</div>
				</div>
				<EndingProposalList />
			</div>
		</div>
	)
}

async function EndingProposalList() {
	const { session, granted } = await getServerSessionAuthorization()
	const token = (session as any)?.accessToken
	const role = (session as any)?.role?.toLowerCase() as
		| Lowercase<ApiRoles>
		| undefined

	let roleBasedData: { status?: number; title: string }
	if (role === 'vendedor')
		roleBasedData = {
			status: undefined,
			title: "SLA's - Iminência de finalização de prazo de 15 dias",
		}
	else if (role === 'subscritor')
		roleBasedData = {
			status: undefined,
			title: "SLA's - Iminência de finalização de prazo de 48 Horas",
		}
	else if (role === 'subscritor-med')
		roleBasedData = {
			status: undefined,
			title: "SLA's - Iminência de finalização de prazo de 5 dias úteis",
		}
	// else if (role === 'superior-vendas')
	// 	roleBasedData = {
	// 		status: undefined,
	// 		title: 'Passíveis de reanálise - Menores que 30 dias corridos da recusa',
	// 	}
	else if (role === 'admin')
		roleBasedData = {
			status: undefined,
			title: "SLA's - Iminência de finalização de prazo de 15 dias",
		}
	else redirect('/logout')

	const data = await getProposals(
		token,
		undefined, //cpf
		undefined, //lmi
		undefined, //produto
		roleBasedData.status //status
	)

	if (data === null) return redirect('/logout')

	const tableRowsData: DPS[] = data?.items.map((item: any) => {
		return {
			uid: item.uid,
			codigo: item.code,
			cpf: item.customer.document,
			dataCadastro: item?.created && new Date(item.created),
			tipoDoc: item.type?.description,
			status: item.status,
			dfiStatus: item.dfiStatus,
			riskStatus: item.riskStatus
		}
	})

	return (
		<div className="mt-14">
			<div className="flex gap-5 justify-between">
				<h3 className="text-primary text-lg">{roleBasedData.title}</h3>
				<Button variant="link" className="text-primary font-semibold" asChild>
					<Link href="/dashboard/table">Ver mais</Link>
				</Button>
			</div>
			<DpsDataTable data={tableRowsData} currentPage={0} pageAmount={1} />
		</div>
	)
}
