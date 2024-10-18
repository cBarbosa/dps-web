import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EllipsisVerticalIcon } from 'lucide-react'

export default function Interactions() {
	const date = new Date()
	return (
		<div>
			<h4 className="text-lg text-primary">Interações</h4>

			<Accordion type="single" collapsible>
				<AccordionItem value="item-1" className="p-2 border rounded-xl">
					<AccordionTrigger hideArrow className="hover:no-underline p-1">
						<div className="grow-0 basis-10">
							<Badge variant="outline">1</Badge>
						</div>
						<div className="pl-5 grow basis-1 text-left">
							Responsáveis notificados para assinatura
						</div>
						<div className="grow basis-1">
							<Badge variant="warn" shape="pill">
								Pend. Assinatura
							</Badge>
						</div>
						<div className="grow basis-1">{formatDate(date)}</div>
						<div>
							<Button variant="ghost" size="icon" className="rounded-full">
								<EllipsisVerticalIcon />
							</Button>
						</div>
					</AccordionTrigger>
					<AccordionContent className="rounded-b-lg bg-gray-100">
						Proponente assinou
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</div>
	)
}

function formatDate(date: Date) {
	return `${date.getHours()}:${date.getMinutes()} - ${date.toLocaleDateString(
		'pt-BR'
	)}`
}
