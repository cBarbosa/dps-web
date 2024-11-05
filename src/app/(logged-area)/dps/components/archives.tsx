'use client';

import { Badge } from '@/components/ui/badge'
import { useEffect, useState } from 'react'
import { getProposalDocumentsByUid } from '../actions'

export type DocumentType = {
	uid: string
    documentName: string
    documentUrl: string
    description: string
	created: Date | string
    updated?: Date | string
};

export const formatDate = (date: Date | string) => {
	if (!date) return null
	if (typeof date === 'string') {
		date = new Date(date)
	}
	return `${date.getHours().toString().padStart(2, '0')}:${date
		.getMinutes()
		.toString()
		.padStart(2, '0')} - ${date.toLocaleDateString('pt-BR')}`
};

export default function Archives({
	token,
	uid,
	proposalSituationId,
}: {
	proposalSituationId?: number
	token: string
	uid: string
}) {
	const [data, setData] = useState<DocumentType[]>([]);

	async function reloadInteractions() {
		const proposalResponse = await getProposalDocumentsByUid(token, uid);

		if (!proposalResponse) return;

		const newDocuments = proposalResponse?.data;

		setData(newDocuments)
	};

    useEffect(()=> {
        reloadInteractions();
    }, []);

	return data?.length > 0 ? (
		<div className="p-5 w-full max-w-7xl mx-auto bg-white rounded-3xl">
			<div className="flex justify-between gap-5">
				<h4 className="basis-1 grow text-lg text-primary mb-2">Laudos e Complementos</h4>
				{/* <div className="flex justify-center basis-1 grow">
					{proposalSituationId === 5 ? (
						<Button size="sm">
							<UploadIcon size={14} className="mr-2" />
							Upload complemento
						</Button>
					) : null}
				</div> */}
				{/* <div className="flex justify-end basis-1 grow">
					{proposalSituationId === 4 ? (
						<NewInteractionDialog
							token={token}
							uid={uid}
							status={5}
							onSubmit={reloadInteractions}
						/>
					) : null}
					{proposalSituationId === 5 ? (
						<UploadComplement
							token={token}
							proposalUid={uid}
							interactionDescription={data[0]?.description}
							onSubmit={reloadInteractions}
						/>
					) : null}
				</div> */}
			</div>
			<ul>
				{data.map((document, index) => {
					if (!document.description) return null

					return (
						<li
							key={index}
							className="w-full flex mt-2 justify-between items-center p-2 border rounded-xl"
						>
							<div className="grow-0 basis-10">
								<Badge variant="outline">{index + 1}</Badge>
							</div>
							<div className="pl-5 grow basis-1 text-left">
								{document?.description}
							</div>

							<div className="grow-0 px-3">
								<Badge variant="warn" shape="pill">
									{document.documentName}
								</Badge>
							</div>
							<div className="grow-0 px-3">
								{formatDate(document?.created)}
							</div>
						</li>
					)
				})}
			</ul>
		</div>
	) : (
		<div className="p-5 w-full max-w-7xl mx-auto bg-white rounded-3xl">
			<div className="flex justify-between gap-5">
				<h4 className="text-lg text-primary mb-2">Laudos e Complementos</h4>
			</div>
			<div className="text-muted-foreground">Nenhuma documentação registrada</div>
		</div>
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
