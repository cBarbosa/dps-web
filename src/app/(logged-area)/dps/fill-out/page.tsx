import { InfoIcon } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import SearchForm from './components/search-form'
import DpsForm from './components/dps-form'
import axios from '../../../../lib/axios'
import { redirect } from 'next/navigation'
import { getLmiOptions, getProductList, getProposals } from '../actions'
import DpsDataTable, { DPS } from '../../components/dps-data-table'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import getServerSessionAuthorization from '@/hooks/getServerSessionAuthorization'

export default async function FillOutPage({
	searchParams,
}: {
	searchParams: { page: string; cpf: string; lmi: string; produto: string }
}) {
	const { session, granted } = await getServerSessionAuthorization(['vendedor'])
	const token = (session as any)?.accessToken

	if (!granted) {
		redirect('/dashboard')
	}

	const cpf = searchParams.cpf?.length > 0 ? searchParams.cpf : undefined
	const lmi =
		searchParams.lmi?.length > 0
			? isNaN(+searchParams.lmi)
				? undefined
				: +searchParams.lmi
			: undefined
	const produto =
		searchParams.produto?.length > 0 ? searchParams.produto : undefined

	const urlParams = new URLSearchParams({
		cpf: cpf ?? '',
		produto: produto ?? '',
		lmi: lmi?.toString() ?? '',
	})

	const currentPage = searchParams?.page ? +searchParams.page : 1

	const [data, lmiOptionsRaw, productListRaw] = await Promise.all([
		getProposals(token, cpf, lmi, produto, 10, currentPage),
		getLmiOptions(token),
		getProductList(token),
	])
	console.log('||||||||->>')
	console.dir(data, { depth: Infinity })

	const lmiOptions =
		lmiOptionsRaw?.data.map(item => ({
			value: item.id.toString(),
			label: item.description,
		})) ?? []

	const productOptions =
		productListRaw?.data.map(item => ({
			value: item.uid,
			label: item.name,
		})) ?? []

	const pageAmount = data?.totalItems ? Math.ceil(data?.totalItems / 10) : 1

	if (data === null) return redirect('/dashboard')

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

	let proposalData

	if (cpf && cpf.length >= 11) {
		if (data) {
			proposalData = data.totalItems > 0 ? data.items?.[0] : null
		}
	}

	console.log('proposalData', proposalData)

	return (
		<div className="p-5">
			<div className="px-5 w-full max-w-7xl mx-auto">
				<Alert variant="info" disposable>
					<InfoIcon size={20} className="text-primary-dark/60" />
					<AlertDescription>
						Para abertura da{' '}
						<span className="text-primary-dark/60">DPS eletrônica</span>,
						primeiramente precisamos de alguns dados. Insira o cpf do
						proponente, selecione o produto e o valor da LMI.
					</AlertDescription>
				</Alert>

				<SearchForm lmiOptions={lmiOptions} productOptions={productOptions} />

				{data.totalItems > 0 ? (
					<div className="mt-7 p-5 w-full max-w-7xl mx-auto bg-white rounded-3xl">
						<DpsDataTable
							data={tableRowsData}
							currentPage={currentPage}
							pageAmount={pageAmount}
						/>
					</div>
				) : (
					<div className="flex justify-between items-center mt-7 p-5 rounded-lg bg-white">
						Nenhum proponente encontrado com os filtros informados.
						<Button variant="default" asChild>
							<Link
								href={'/dps/fill-out/form?' + urlParams.toString()}
								className="hover:text-white"
							>
								Novo Proponente
							</Link>
						</Button>
					</div>
				)}
			</div>
		</div>
	)
}
