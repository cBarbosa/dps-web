import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EllipsisVerticalIcon } from 'lucide-react'

export type Interaction = {
	description: string
	status: { id: number; description: string }
	created: Date | string
}

export default function Interactions({ data }: { data: Interaction[] }) {
	const date = new Date()

	return (
		<ul>
			{data.map((interaction, index) => (
				<li
					key={index}
					className="w-full flex justify-between items-center p-2 border rounded-xl"
				>
					<div className="grow-0 basis-10">
						<Badge variant="outline">{index + 1}</Badge>
					</div>
					<div className="pl-5 grow basis-1 text-left">
						{interaction.description}
					</div>

					<div className="grow-0 px-3">
						<Badge variant="warn" shape="pill">
							{interaction.status.description}
						</Badge>
					</div>
					<div className="grow-0 px-3">{formatDate(interaction.created)}</div>
				</li>
			))}
		</ul>
	)

	// return (
	// 	<div>
	// 		<Accordion type="single" collapsible>
	// 			<AccordionItem value="item-1" className="p-2 border rounded-xl">
	// 				<AccordionTrigger hideArrow className="hover:no-underline p-1">
	// 					<div className="grow-0 basis-10">
	// 						<Badge variant="outline">1</Badge>
	// 					</div>
	// 					<div className="pl-5 grow basis-1 text-left">
	// 						Responsáveis notificados para assinatura
	// 					</div>
	// 					<div className="grow basis-1">
	// 						<Badge variant="warn" shape="pill">
	// 							Pend. Assinatura
	// 						</Badge>
	// 					</div>
	// 					<div className="grow basis-1">{formatDate(date)}</div>
	// 					<div>
	// 						<Button variant="ghost" size="icon" className="rounded-full">
	// 							<EllipsisVerticalIcon />
	// 						</Button>
	// 					</div>
	// 				</AccordionTrigger>
	// 				<AccordionContent className="rounded-b-lg bg-gray-100">
	// 					Proponente assinou
	// 				</AccordionContent>
	// 			</AccordionItem>
	// 		</Accordion>
	// 	</div>
	// )
}

function formatDate(date: Date | string) {
	if (typeof date === 'string') {
		date = new Date(date)
	}
	return `${date.getHours().toString().padStart(2, '0')}:${date
		.getMinutes()
		.toString()
		.padStart(2, '0')} - ${date.toLocaleDateString('pt-BR')}`
}
