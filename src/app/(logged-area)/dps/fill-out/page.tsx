import { InfoIcon } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import SearchForm from './components/search-form'
import DpsForm from './components/dps-form'
import axios from '../../../../lib/axios'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options'
import { getProposals } from './actions'

export default async function FillOutPage({
	searchParams,
}: {
	searchParams: { cpf: string; lmi: string; produto: string }
}) {
	const session = await getServerSession(authOptions)
	const token = (session as any)?.accessToken

	const cpf = searchParams.cpf
	const lmi = searchParams.lmi
	const produto = searchParams.produto

	let proposalData

	if (cpf && cpf.length >= 11) {
		const proposals = await getProposals(token, cpf, lmi, produto)

		if (proposals) {
			proposalData = proposals.totalItems > 0 ? proposals.items?.[0] : null
		}

		// try {
		// 	const response = await axios.get('v1/Proposal/all', {
		// 		params: {
		// 			page: 1,
		// 			size: 10,
		// 			document: cpf,
		// 			lmiRange: lmi,
		// 			productUid: produto,
		// 		},
		// 		headers: {
		// 			Authorization: `Bearer ${token}`,
		// 		},
		// 	})
		// 	if (response.data) {
		// 		proposalData =
		// 			response.data.totalItems > 0 ? response.data.items?.[0] : null
		// 	} else {
		// 		throw new Error('Unsuccessful request')
		// 	}
		// } catch (err) {
		// 	console.log(err)

		// 	if ((err as any)?.status === 401) {
		// 		redirect('/logout')
		// 	}
		// }
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

				<SearchForm />

				<DpsForm initialProposalData={proposalData} />
			</div>
		</div>
	)
}
