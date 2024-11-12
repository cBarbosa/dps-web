import { Input } from '@/components/ui/input'
import DpsDataTable, { DPS } from '../../components/dps-data-table'
import { ListFilterIcon, SearchIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getProposals } from '../actions'
import { redirect } from 'next/navigation'
import getServerSessionAuthorization from '@/hooks/getServerSessionAuthorization'

export default async function SubscriptionMedPage({
	searchParams,
}: {
	searchParams: { page: string }
}) {
	const { session, granted } = await getServerSessionAuthorization([
		'subscritor',
	])
	const token = (session as any)?.accessToken

	// const data: DPS[] = [
	// 	{
	// 		codigo: 'INV-10022024-001',
	// 		cpf: '875.896.857-89',
	// 		dataCadastro: new Date('2024-09-15T00:00:00-03:00'),
	// 		tipoDoc: 'simples',
	// 		status: {
	// 			code: 1,
	// 			description: 'Aguardando análise',
	// 		},
	// 	},
	// 	{
	// 		codigo: 'INV-10022024-002',
	// 		cpf: '123.252.548-89',
	// 		dataCadastro: new Date('2024-09-15T00:00:00-03:00'),
	// 		tipoDoc: 'simples',
	// 		status: {
	// 			code: 1,
	// 			description: 'Aguardando análise',
	// 		},
	// 	},
	// 	{
	// 		codigo: 'INV-10022024-003',
	// 		cpf: '123.252.857-89',
	// 		dataCadastro: new Date('2024-08-11T00:00:00-03:00'),
	// 		tipoDoc: 'completa',
	// 		status: {
	// 			code: 1,
	// 			description: 'Aguardando análise',
	// 		},
	// 	},
	// 	{
	// 		codigo: 'INV-10022024-004',
	// 		cpf: '000.252.548-89',
	// 		dataCadastro: new Date('2024-05-01T00:00:00-03:00'),
	// 		tipoDoc: 'completa',
	// 		status: {
	// 			code: 1,
	// 			description: 'Aguardando análise',
	// 		},
	// 	},
	// 	{
	// 		codigo: 'INV-10022024-009',
	// 		cpf: '123.087.548-89',
	// 		dataCadastro: new Date('2024-10-15T00:00:00-03:00'),
	// 		tipoDoc: 'completa',
	// 		status: {
	// 			code: 1,
	// 			description: 'Aguardando análise',
	// 		},
	// 	},
	// ]

	const currentPage = searchParams?.page ? +searchParams.page : 1

	const dataRaw = await getProposals(
		token,
		undefined,
		undefined,
		undefined,
		4,
		currentPage
	)

	if (!dataRaw) return redirect('/dashboard')

	console.log('~~~~dataRaw', dataRaw)

	const data: DPS[] = dataRaw.items?.map((item: any) => {
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
		console.log('filtering', cpf)

		redirect(`/dps/subscription?cpf=${cpf}`)
	}

	return (
		<div className="p-5">
			<div className="p-5 w-full max-w-7xl mx-auto bg-white rounded-3xl">
				<div className="flex justify-start items-center gap-6 mt-2 mb-7">
					<h2 className="text-xl text-primary">Painel de subscrição</h2>
					<span className="text-muted-foreground text-sm">
						Aqui listamos todas as DPS&apos;s preenchidas em nossa plataforma.
					</span>
				</div>
				<form action={filterResults} className="mb-3 flex gap-5 items-center">
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
				</form>
				<DpsDataTable data={data} currentPage={1} pageAmount={1} />
			</div>
		</div>
	)
}
