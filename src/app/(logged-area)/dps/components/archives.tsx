'use client'

import { Badge } from '@/components/ui/badge'
import { useCallback, useEffect, useState } from 'react'
import { getProposalDocumentsByUid } from '../actions'
import { CloudDownloadIcon } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from './interactions'

export type DocumentType = {
	uid: string
	documentName: string
	documentUrl: string
	description: string
	created: Date | string
	updated?: Date | string
}

export const downloadItem = (
	data: string,
	filename: string = 'archive.pdf'
): void => {
	const link = document.createElement('a')

	link.href = `data:application/pdf;base64,${data}`
	link.setAttribute('download', filename)
	document.body.appendChild(link)
	link.click()
	link.parentNode?.removeChild(link)
}

export default function Archives({
	token,
	uid,
	proposalSituationId,
}: {
	proposalSituationId?: number
	token: string
	uid: string
}) {
	const [data, setData] = useState<DocumentType[]>([])

	const reloadInteractions = useCallback(async () => {
		const proposalResponse = await getProposalDocumentsByUid(token, uid)

		if (!proposalResponse) return

		const newDocuments = proposalResponse?.data

		setData(newDocuments)
	}, [token, uid, setData])

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
								<Link
									href={document.documentUrl}
									className="grow-0 basis-10 text-teal-900 hover:text-teal-600"
									target="_blank"
									download
								>
									{/* <Badge variant="outline">{index + 1}</Badge> */}
									<CloudDownloadIcon className="m-2" />
								</Link>
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
