'use client'

import React, { useCallback, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { getProposalArchiveByUid, getProposalDocumentsByUid } from '../actions'
import { CloudDownloadIcon } from 'lucide-react'
import { formatDate } from './interactions'
import { Button } from '@/components/ui/button'
import { createPdfUrlFromBase64, DialogShowArchive } from './dialog-archive'

export type DocumentType = {
	uid: string
	documentName: string
	documentUrl: string
	description: string
	created: Date | string
	updated?: Date | string
}

export default function Archives({
	token,
	uid,
}: {
	token: string
	uid: string
}) {
	const [data, setData] = React.useState<DocumentType[]>([])
	const [isModalOpen, setIsModalOpen] = React.useState(false)
	const [pdfUrl, setPdfUrl] = React.useState<string | undefined>(undefined)

	const reloadInteractions = useCallback(async () => {
		const proposalResponse = await getProposalDocumentsByUid(token, uid)

		if (!proposalResponse) return

		const newDocuments = proposalResponse?.data

		setData(newDocuments)
	}, [token, uid, setData])

	const handleViewArchive = useCallback(
		async (documentUid: string) => {
			setIsModalOpen(opt => true)

			const response = await getProposalArchiveByUid(token, uid, documentUid)

			if (!response) return

			setPdfUrl(createPdfUrlFromBase64(response.data))
		},
		[token, uid]
	)

	useEffect(() => {
		reloadInteractions()
	}, [reloadInteractions])

	return data?.length > 0 ? (
		<div className="p-5 w-full max-w-7xl mx-auto bg-white rounded-3xl">
			<div className="flex justify-between gap-5">
				<h4 className="basis-1 grow text-lg text-primary mb-2">
					Laudos e Complementos
				</h4>
			</div>
			<ul>
				{data.map((document, index) => {
					if (!document.description) return null

					return (
						<li
							key={index}
							className="w-full flex mt-2 justify-between items-center p-2 border rounded-xl"
						>
							{document.documentName && (
								<Button
									className="grow-0 basis-10 text-teal-900 hover:text-teal-600"
									variant={`ghost`}
									onClick={() => handleViewArchive(document.uid)}
								>
									{/* <Badge variant="outline">{index + 1}</Badge> */}
									<CloudDownloadIcon className="m-2" />
								</Button>
							)}

							<div className="pl-5 grow basis-1 text-left">
								{document?.description}
							</div>

							{document.documentName && (
								<div className="grow-0 px-3">
									<Badge variant="warn" shape="pill">
										{document.documentName}
									</Badge>
								</div>
							)}
							<div className="grow-0 px-3">{formatDate(document?.created)}</div>
						</li>
					)
				})}
			</ul>
			<DialogShowArchive
				isModalOpen={isModalOpen}
				setIsModalOpen={setIsModalOpen}
				pdfUrl={pdfUrl}
			/>
		</div>
	) : (
		<div className="p-5 w-full max-w-7xl mx-auto bg-white rounded-3xl">
			<div className="flex justify-between gap-5">
				<h4 className="text-lg text-primary mb-2">Laudos e Complementos</h4>
			</div>
			<div className="text-muted-foreground">
				Nenhuma documentação registrada
			</div>
		</div>
	)
}
