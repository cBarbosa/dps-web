import { Input } from '@/components/ui/input'
import DpsDataTable, { DPS } from '../components/dps-data-table'
import { ListFilterIcon, SearchIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
// import { getProposals } from './actions'
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { getProposals } from '../dps/actions'
import { ApiRoles } from '@/hooks/getServerSessionAuthorization'
import { signOut } from 'next-auth/react'

export default async function DashboardPage({
	searchParams,
}: {
	searchParams: { page: string }
}) {
	const session = await getServerSession(authOptions)
	const token = (session as any)?.accessToken
	const role = (session as any)?.role?.toLowerCase() as
		| Lowercase<ApiRoles>
		| undefined

	const currentPage = searchParams?.page ? +searchParams.page : 1

	let status
	if (role === 'vendedor') status = 10
	if (role === 'subscritor') status = 4
	if (role === 'subscritor-med') status = 5
	if (role === 'admin') status = undefined
	else return signOut()

	const data = await getProposals(
		token,
		undefined, //cpf
		undefined, //lmi
		undefined, //produto
		status, //status
		currentPage
	)
	console.log('||||||||->>')
	console.dir(data, { depth: Infinity })

	if (data === null) return redirect('/dashboard')

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

	// const data: DPS[] = [
	// 	{
	// 		codigo: 'INV-10022024-001',
	// 		cpf: '875.896.857-89',
	// 		dataCadastro: new Date('2024-09-15T00:00:00-03:00'),
	// 		tipoDoc: 'simples',
	// 		status: 'assinada',
	// 	},
	// 	{
	// 		codigo: 'INV-10022024-002',
	// 		cpf: '123.252.548-89',
	// 		dataCadastro: new Date('2024-09-15T00:00:00-03:00'),
	// 		tipoDoc: 'simples',
	// 		status: 'analise',
	// 	},
	// 	{
	// 		codigo: 'INV-10022024-003',
	// 		cpf: '123.252.857-89',
	// 		dataCadastro: new Date('2024-08-11T00:00:00-03:00'),
	// 		tipoDoc: 'completa',
	// 		status: 'aceita',
	// 	},
	// 	{
	// 		codigo: 'INV-10022024-004',
	// 		cpf: '000.252.548-89',
	// 		dataCadastro: new Date('2024-05-01T00:00:00-03:00'),
	// 		tipoDoc: 'completa',
	// 		status: 'anexar',
	// 	},
	// 	{
	// 		codigo: 'INV-10022024-009',
	// 		cpf: '123.087.548-89',
	// 		dataCadastro: new Date('2024-10-15T00:00:00-03:00'),
	// 		tipoDoc: 'completa',
	// 		status: 'pendente',
	// 	},
	// ]

	return (
		<div className="p-5">
			<div className="p-5 w-full max-w-7xl mx-auto bg-white rounded-3xl">
				<div className="mb-3 flex gap-5 items-center">
					<Input
						placeholder="Código DPS"
						className="w-72 p-5 rounded-full bg-gray-150 border-none"
						icon={<SearchIcon size={20} className="text-gray-500" />}
						iconOffset={2}
					/>
					<Button
						variant="round"
						className="w-10 h-10 p-0 text-muted-foreground bg-gray-150 hover:bg-gray-200"
					>
						<ListFilterIcon size={20} />
					</Button>
				</div>
				<DpsDataTable
					data={tableRowsData}
					currentPage={currentPage}
					pageAmount={pageAmount}
				/>
			</div>
		</div>
	)
}
