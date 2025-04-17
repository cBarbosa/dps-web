import { Input } from '@/components/ui/input'
import DpsDataTable, { DPS } from '../../components/dps-data-table'
import { SearchIcon } from 'lucide-react'
import { redirect } from 'next/navigation'
import { getProposals } from '../../dps/actions'
import getServerSessionAuthorization, {
	ApiRoles,
} from '@/hooks/getServerSessionAuthorization'
import { SearchFilter } from './search-filter'

export const revalidate = 0 // no cache
// export const maxDuration = 300;
export const dynamic = 'force-dynamic'

export default async function DashboardTablePage({
	searchParams,
}: {
	searchParams: { page: string; cpf: string; operation?: string; status?: string; dfiStatus?: string }
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
	)

	if (data === null) return redirect('/logout')

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

	async function filterResults(formData: FormData) {
		'use server'
		const searchType = formData.get('searchType')?.toString() || 'cpf'
		const searchValue = formData.get('searchValue')?.toString() || ''
	
		if (searchType === 'cpf') {
			const cpf = searchValue.replace(/[^\d]/g, '')
			redirect(`/dashboard/table?cpf=${cpf}`)
		} else if (searchType === 'operation') {
			redirect(`/dashboard/table?operation=${searchValue}`)
		}
	}

	return (
		<div className="p-5">
			<div className="p-5 w-full max-w-7xl mx-auto bg-white rounded-3xl">
				<SearchFilter filterAction={filterResults} />
				<DpsDataTable
					data={tableRowsData}
					currentPage={currentPage}
					pageAmount={pageAmount}
				/>
			</div>
		</div>
	)
}
