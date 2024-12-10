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

export const revalidate = 0 // no cache
// export const maxDuration = 300;
export const dynamic = 'force-dynamic'

export default async function DashboardPage({
	searchParams,
}: {
	searchParams: { page: string; cpf: string }
}) {
	const { session, granted } = await getServerSessionAuthorization()
	const role = (session as any)?.role?.toLowerCase() as
		| Lowercase<ApiRoles>
		| undefined

	const chartData = [
		{ label: 'Anexar Documentação', value: 0, fill: 'hsl(var(--chart-1))' },
		{ label: 'Em Análise', value: 0, fill: 'hsl(var(--chart-2))' },
		{ label: 'Assinada', value: 55, fill: 'hsl(var(--chart-3))' },
		{ label: 'Aceita', value: 35, fill: 'hsl(var(--chart-4))' },
		{
			label: 'Pendente de Assinatura',
			value: 10,
			fill: 'hsl(var(--chart-5))',
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
							title="SLA DPS"
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

				<div></div>
			</div>
		</div>
	)
}
