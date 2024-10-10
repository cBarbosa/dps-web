import { InfoIcon } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import SearchForm from './components/search-form'

export default function FillOutPage() {
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
			</div>
		</div>
	)
}
