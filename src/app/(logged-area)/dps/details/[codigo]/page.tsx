import { Button } from '@/components/ui/button'
import Interactions from '../../components/interactions'
import { Badge } from '@/components/ui/badge'
import { FileTextIcon, Undo2Icon, UserIcon } from 'lucide-react'

export default function DetailPage({ params }: { params: { codigo: string } }) {
	return (
		<div className="flex flex-col gap-5 p-5">
			<div className="p-5 w-full max-w-7xl mx-auto bg-white rounded-3xl">
				<Button variant="link">
					<Undo2Icon className="mr-2" />
					Voltar
				</Button>
				<div className="mx-5 my-3 flex gap-6 justify-between items-center">
					<div>
						<h4 className="text-lg text-primary">Detalhes da DPS</h4>
						<div className="text-sm">
							{params.codigo}
							<Badge shape="pill" variant="warn" className="ml-4">
								Aguar. Análise
							</Badge>
						</div>
						<div className="mt-4 flex gap-5 text-muted-foreground [&>div]:flex [&>div]:gap-2">
							<div>LMI: Entre 1MM e 3MM</div>
							<div>
								<FileTextIcon />
								DPS Completa
							</div>
							<div>
								<UserIcon />
								999.999.999-99
							</div>
						</div>
					</div>
					<Button>Visualizar DPS</Button>
				</div>
			</div>{' '}
			<div className="p-5 w-full max-w-7xl mx-auto bg-white rounded-3xl">
				<Interactions />
			</div>
		</div>
	)
}
