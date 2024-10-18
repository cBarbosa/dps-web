import { Input } from '@/components/ui/input'
import DpsDataTable, { DPS } from '../../components/dps-data-table'
import { ListFilterIcon, SearchIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SubscriptionPage() {
	const data: DPS[] = [
		{
			codigo: 'INV-10022024-001',
			cpf: '875.896.857-89',
			dataCadastro: new Date('2024-09-15T00:00:00-03:00'),
			tipoDoc: 'simples',
			status: {
				code: 1,
				description: 'Aguardando análise',
			},
		},
		{
			codigo: 'INV-10022024-002',
			cpf: '123.252.548-89',
			dataCadastro: new Date('2024-09-15T00:00:00-03:00'),
			tipoDoc: 'simples',
			status: {
				code: 1,
				description: 'Aguardando análise',
			},
		},
		{
			codigo: 'INV-10022024-003',
			cpf: '123.252.857-89',
			dataCadastro: new Date('2024-08-11T00:00:00-03:00'),
			tipoDoc: 'completa',
			status: {
				code: 1,
				description: 'Aguardando análise',
			},
		},
		{
			codigo: 'INV-10022024-004',
			cpf: '000.252.548-89',
			dataCadastro: new Date('2024-05-01T00:00:00-03:00'),
			tipoDoc: 'completa',
			status: {
				code: 1,
				description: 'Aguardando análise',
			},
		},
		{
			codigo: 'INV-10022024-009',
			cpf: '123.087.548-89',
			dataCadastro: new Date('2024-10-15T00:00:00-03:00'),
			tipoDoc: 'completa',
			status: {
				code: 1,
				description: 'Aguardando análise',
			},
		},
	]

	return (
		<div className="p-5">
			<div className="p-5 w-full max-w-7xl mx-auto bg-white rounded-3xl">
				<div className="flex justify-start items-center gap-6 mt-2 mb-7">
					<h2 className="text-xl text-primary">Painel de subscrição</h2>
					<span className="text-muted-foreground text-sm">
						Aqui listamos todas as DPS&apos;s preenchidas em nossa plataforma.
					</span>
				</div>
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
				<DpsDataTable data={data} currentPage={1} pageAmount={1} />
			</div>
		</div>
	)
}
