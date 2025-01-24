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
import { DashboardDataType, getFilledDps } from './actions'

export const revalidate = 0 // no cache
// export const maxDuration = 300;
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
	const { session, granted } = await getServerSessionAuthorization()
	const role = (session as any)?.role?.toLowerCase() as
		| Lowercase<ApiRoles>
		| undefined
	const token = (session as any)?.accessToken

	if (!granted) {
		redirect('/logout')
	}

	//@ts-expect-error nome de perfil ainda não definido
	if (role === 'bradesco') {
		redirect('/home')
	}

	const dashboardDataTypes: DashboardDataType[] = [
		'filledDps',
		'pendingSign',
		'pendingDocs',
		'reanalysis',
		'mipSituation',
		'dfiSituation',
	]

	const dashboardDataRaw = await Promise.allSettled([
		getFilledDps(token, 'filledDps'),
		getFilledDps(token, 'pendingSign'),
		getFilledDps(token, 'pendingDocs'),
		getFilledDps(token, 'reanalysis'),
		getFilledDps(token, 'mipSituation'),
		getFilledDps(token, 'dfiSituation'),
	])

	const dashboardData = dashboardDataRaw.reduce(
		(acc, response, i) => {
			if (response.status === 'fulfilled') {
				acc[dashboardDataTypes[i]] = response.value?.data as any
			}

			return acc
		},
		{
			filledDps: null,
			pendingSign: null,
			pendingDocs: null,
			reanalysis: null,
			mipSituation: null,
			dfiSituation: null,
		} as {
			[T in DashboardDataType]:
				| Exclude<Awaited<ReturnType<typeof getFilledDps<T>>>, null>['data']
				| null
		}
	)

	type ChartData = {
		label: string
		value: number
		count: number
		fill: string
		href?: string
	}

	const mipChartData: ChartData[] =
		dashboardData.mipSituation?.map((item, i) => ({
			label: item.Descricao,
			value: item.Percentual,
			count: item.Quantidade,
			total: item.Total,
			fill: `hsl(var(--chart-${i + 1}))`,
			href: `/dashboard/table?status=${item.MipId}`,
		})) ?? []

	if (mipChartData && mipChartData.length > 0) {
		const itemCount = mipChartData.reduce((acc, item) => acc + item.count, 0)
		const mipTotal = dashboardData.mipSituation?.[0]?.Total ?? 0

		if (itemCount < mipTotal) {
			const restCount = mipTotal - itemCount

			mipChartData.push({
				label: 'Outros',
				value: 100 - (100 * restCount) / mipTotal,
				count: restCount,
				fill: 'hsl(var(--chart-6))',
			})
		}
	}

	const dfiChartData: ChartData[] =
		dashboardData.dfiSituation?.map((item, i) => ({
			label: item.Descricao,
			value: item.Percentual,
			count: item.Quantidade,
			fill: `hsl(var(--chart-${i + 1}))`,
			href: `/dashboard/table?dfiStatus=${item.DfiId}`,
		})) ?? []

	if (dfiChartData && dfiChartData.length > 0) {
		const itemCount = dfiChartData.reduce((acc, item) => acc + item.count, 0)
		const dfiTotal = dashboardData.dfiSituation?.[0]?.Total ?? 0

		if (itemCount < dfiTotal) {
			const restCount = dfiTotal - itemCount

			dfiChartData.push({
				label: 'Outros',
				value: 100 - (100 * restCount) / dfiTotal,
				count: restCount,
				fill: `hsl(var(--chart-${dfiChartData.length + 1}))`,
			})
		}
	}

	const chartConfig = {
		value: {
			label: 'Value',
		},
		chrome: {
			label: '1',
			color: 'hsl(var(--chart-1))',
		},
		safari: {
			label: '2',
			color: 'hsl(var(--chart-2))',
		},
		firefox: {
			label: '3',
			color: 'hsl(var(--chart-3))',
		},
		edge: {
			label: '4',
			color: 'hsl(var(--chart-4))',
		},
		other: {
			label: '5',
			color: 'hsl(var(--chart-5))',
		},
	} satisfies ChartConfig

	return (
		<div className="p-5">
			<div className="p-5 w-full max-w-7xl mx-auto bg-white rounded-3xl">
				<div className="grid grid-cols-2 xl:grid-cols-4 gap-8">
					<div className="contents">
						<DonutProgressCard
							label="DPS's preenchidas (mês atual)"
							value={dashboardData.filledDps?.TotalMesAtual}
							change={dashboardData.filledDps?.PercentualCrescimento}
						/>
						<DonutProgressCard
							label="Pend. de Assinatura"
							value={dashboardData.pendingSign?.Apurado}
							chartData={
								dashboardData.pendingSign?.Percentual != null
									? {
											value: dashboardData.pendingSign?.Percentual,
											fill: 'hsl(var(--chart-2))',
									  }
									: undefined
							}
						/>
					</div>
					<div className="contents">
						<DonutProgressCard
							label="Pend. de Documentação"
							value={dashboardData.pendingDocs?.Apurado}
							chartData={
								dashboardData.pendingDocs?.Percentual != null
									? {
											value: dashboardData.pendingDocs?.Percentual,
											fill: 'hsl(var(--chart-3))',
									  }
									: undefined
							}
						/>
						<DonutProgressCard
							label="Em Reanálise"
							value={dashboardData.reanalysis?.TotalReanalise}
							chartData={
								dashboardData.reanalysis?.Percentual != null
									? {
											value: dashboardData.reanalysis?.Percentual,
											fill: 'hsl(var(--chart-4))',
									  }
									: undefined
							}
						/>
					</div>
					<div className="col-span-2">
						<PieChartCard
							title="SLA MIP"
							chartData={{ data: mipChartData, config: chartConfig }}
						/>
					</div>
					<div className="col-span-2">
						<PieChartCard
							title="SLA DFI"
							chartData={{ data: dfiChartData, config: chartConfig }}
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
	else if (
		role === 'admin' ||
		role === 'vendedor-sup' ||
		role === 'subscritor-sup'
	)
		roleBasedData = {
			status: undefined,
			title: "SLA's - Iminência de finalização de prazo de 15 dias",
		}
	else redirect('/logout')

	const data = await getProposals(
		token,
		undefined, //cpf
		undefined, //dfiStatus
		undefined, //produto
		roleBasedData.status, //status
		`asc` // orderBy
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
			riskStatus: item.riskStatus,
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
