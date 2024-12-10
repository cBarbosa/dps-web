import { Input } from '@/components/ui/input'
import DpsDataTable, { DPS } from '../../components/dps-data-table'
import { ListFilterIcon, SearchIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
// import { getProposals } from './actions'
import { redirect } from 'next/navigation'
import { getProposals } from '../../dps/actions'
import getServerSessionAuthorization, {
	ApiRoles,
} from '@/hooks/getServerSessionAuthorization'

export const revalidate = 0 // no cache
// export const maxDuration = 300;
export const dynamic = 'force-dynamic'

export default async function DashboardTablePage({
	searchParams,
}: {
	searchParams: { page: string; cpf: string }
}) {
	const { session, granted } = await getServerSessionAuthorization()
	const token = (session as any)?.accessToken
	const role = (session as any)?.role?.toLowerCase() as
		| Lowercase<ApiRoles>
		| undefined

	const currentPage = searchParams?.page ? +searchParams.page : 1
	const cpf = searchParams?.cpf

	let status
	if (role === 'vendedor') status = undefined
	else if (role === 'subscritor') status = 4
	else if (role === 'subscritor-med') status = 5
	else if (role === 'admin') status = undefined
	else redirect('/logout')

	const data = await getProposals(
		token,
		cpf, //cpf
		undefined, //lmi
		undefined, //produto
		status, //status
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
			codigo: item.code,
			cpf: item.customer.document,
			dataCadastro: item?.created && new Date(item.created),
			tipoDoc: item.type?.description,
			status: item.status,
		}
	})

	async function filterResults(formData: FormData) {
		'use server'
		const cpfRaw = formData.get('cpf')
		const cpf = cpfRaw?.toString().replace(/[^\d]/g, '')

		redirect(`/dashboard?cpf=${cpf}`)
	}

	return (
		<div className="p-5">
			<div className="p-5 w-full max-w-7xl mx-auto bg-white rounded-3xl">
				<form action={filterResults} className="mb-3 flex gap-5 items-center">
					<>
						<Input
							name="cpf"
							placeholder="Pesquisar CPF"
							className="w-72 p-5 rounded-full bg-gray-150 border-none"
							icon={<SearchIcon size={20} className="text-gray-500" />}
							iconOffset={2}
							mask="999.999.999-99"
						/>
						<Button
							type="submit"
							variant="round"
							className="w-10 h-10 p-0 text-muted-foreground bg-gray-150 hover:bg-gray-200"
						>
							<ListFilterIcon size={20} />
						</Button>
					</>
				</form>
				<DpsDataTable
					data={tableRowsData}
					currentPage={currentPage}
					pageAmount={pageAmount}
				/>
			</div>
		</div>
	)
}
