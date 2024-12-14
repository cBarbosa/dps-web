/*
 */
import { InfoIcon, PlusIcon } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import SearchForm from './components/search-form'
import { redirect } from 'next/navigation'
import {
	getLmiOptions,
	getProductList,
	getProposals,
	getTipoImovelOptions,
} from '../actions'
import DpsDataTable, { DPS } from '../../components/dps-data-table'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import getServerSessionAuthorization from '@/hooks/getServerSessionAuthorization'

export const revalidate = 0 // no cache
// export const maxDuration = 300;
export const dynamic = 'force-dynamic'

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

	const allowSearch = !!cpf

	const urlParams = new URLSearchParams({
		cpf: cpf ?? '',
		// produto: produto ?? '',
		// lmi: lmi?.toString() ?? '',
	})

	const currentPage = searchParams?.page ? +searchParams.page : 1

	const status = undefined // se quiser valor fixo 10;
	const data = allowSearch
		? await getProposals(token, cpf, lmi, produto, status, currentPage)
		: { totalItems: 0, items: [] }

	console.dir(data, { depth: Infinity })

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

				<SearchForm />

				{data.totalItems > 0 ? (
					<div className="mt-7 p-5 w-full max-w-7xl mx-auto bg-white rounded-3xl">
						<div className="text-right">
							<Button variant="default" className="ml-auto" asChild>
								<Link
									href={'/dps/fill-out/form?' + urlParams.toString()}
									className="hover:text-white"
								>
									<PlusIcon size={20} className="mr-2" />
									Preencher nova DPS
								</Link>
							</Button>
						</div>
						<DpsDataTable
							data={tableRowsData}
							currentPage={currentPage}
							pageAmount={pageAmount}
						/>
					</div>
				) : (
					<div className="flex justify-between items-center mt-7 p-5 rounded-lg bg-white">
						{allowSearch ? (
							<>
								Nenhuma DPS encontrada com os filtros informados.
								<Button variant="default" asChild>
									<Link
										href={'/dps/fill-out/form?' + urlParams.toString()}
										className="hover:text-white"
									>
										Preencher nova DPS
									</Link>
								</Button>
							</>
						) : (
							'Informe os filtros para buscar proponentes.'
						)}
					</div>
				)}
			</div>
		</div>
	)
}
