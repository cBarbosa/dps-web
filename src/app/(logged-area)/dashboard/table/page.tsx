import { Input } from '@/components/ui/input'
import DpsDataTable, { DPS } from '../../components/dps-data-table'
import { SearchIcon } from 'lucide-react'
import { redirect } from 'next/navigation'
import { getProposals } from '../../dps/actions'
import getServerSessionAuthorization, {
	ApiRoles,
} from '@/hooks/getServerSessionAuthorization'
import { SearchFilter } from './search-filter'
import OperationsDataTable from '../../components/operations-data-table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { groupProposalsByOperation } from '@/utils/operation-aggregation'

export const revalidate = 0 // no cache
// export const maxDuration = 300;
export const dynamic = 'force-dynamic'

export default async function DashboardTablePage({
	searchParams,
}: {
	searchParams: {
		page: string
		cpf: string
		operation?: string
		status?: string
		dfiStatus?: string
		view?: 'participacoes' | 'operacoes'
	}
}) {
	const { session, granted } = await getServerSessionAuthorization()
	const token = (session as any)?.accessToken
	const role = (session as any)?.role?.toLowerCase() as
		| Lowercase<ApiRoles>
		| undefined

	const currentPage = searchParams?.page ? +searchParams.page : 1
	const cpf = searchParams?.cpf
	const operation = searchParams?.operation;
	const status = searchParams?.status ? +searchParams.status : undefined
	const dfiStatus = searchParams?.dfiStatus ? +searchParams.dfiStatus : undefined
	const view =
		searchParams?.view ?? (operation ? 'operacoes' : 'participacoes')

	// if (role === 'vendedor') status = undefined
	// else if (role === 'subscritor') status = 4
	// else if (role === 'subscritor-med') status = 5
	// else if (role === 'admin') status = undefined
	// else redirect('/logout')

	const data = await getProposals(
		token,
		cpf, //cpf
		operation, //operation
		dfiStatus, //dfi status
		undefined, //produto
		status, //status
		`desc`, // orderBy
		currentPage
	) ?? {
		totalItems: 0,
		items: []
	}

	// if (data === null) return redirect('/logout')

	const pageAmount = Math.ceil(data?.totalItems / 10)

	if (searchParams?.page && +searchParams.page > pageAmount) {
		return redirect('/dashboard')
	}

	const tableRowsData: DPS[] = data?.items.map((item: any) => {
		return {
			uid: item.uid,
			codigo: item.contractNumber ?? `-`,
			cpf: item.customer.document,
			dataCadastro: item?.created && new Date(item.created),
			tipoDoc: item.type?.description,
			status: item.status,
			dfiStatus: item.dfiStatus,
			riskStatus: item.riskStatus,
		}
	})

	const operationRows = groupProposalsByOperation(data?.items ?? [])

	async function filterResults(formData: FormData) {
		'use server'
		const searchType = formData.get('searchType')?.toString() || 'cpf'
		const searchValue = formData.get('searchValue')?.toString() || ''
	
		if (searchType === 'cpf') {
			const cpf = searchValue.replace(/[^\d]/g, '')
			redirect(`/dashboard/table?cpf=${cpf}&view=participacoes`)
		} else if (searchType === 'operation') {
			redirect(`/dashboard/table?operation=${searchValue}&view=operacoes`)
		}
	}

	function viewHref(nextView: 'participacoes' | 'operacoes'): string {
		const params = new URLSearchParams()
		if (searchParams?.page) params.set('page', String(searchParams.page))
		if (searchParams?.cpf) params.set('cpf', String(searchParams.cpf))
		if (searchParams?.operation) params.set('operation', String(searchParams.operation))
		if (searchParams?.status) params.set('status', String(searchParams.status))
		if (searchParams?.dfiStatus) params.set('dfiStatus', String(searchParams.dfiStatus))
		params.set('view', nextView)
		return `/dashboard/table?${params.toString()}`
	}

	return (
		<div className="p-5">
			<div className="p-5 w-full max-w-7xl mx-auto bg-white rounded-3xl">
				<div className="flex items-center justify-between gap-4">
					<SearchFilter filterAction={filterResults} view={view} />
					<Tabs value={view}>
						<TabsList>
							<TabsTrigger value="participacoes" asChild>
								<a href={viewHref('participacoes')}>Participações</a>
							</TabsTrigger>
							<TabsTrigger value="operacoes" asChild>
								<a href={viewHref('operacoes')}>Operações</a>
							</TabsTrigger>
						</TabsList>
					</Tabs>
				</div>

				{view === 'operacoes' ? (
					<OperationsDataTable
						data={operationRows}
						currentPage={currentPage}
						pageAmount={pageAmount}
					/>
				) : (
					<DpsDataTable
						data={tableRowsData}
						currentPage={currentPage}
						pageAmount={pageAmount}
					/>
				)}
			</div>
		</div>
	)
}
