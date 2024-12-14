'use client'

import React, { useCallback, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { getProposalArchiveByUid, getProposalDocumentsByUid } from '../actions'
import {
	FileTextIcon,
	SendIcon,
	ThumbsDownIcon,
	ThumbsUpIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createPdfUrlFromBase64, DialogShowArchive } from './dialog-archive'
import UploadReport from './upload-report'
import FileUpload from '@/components/ui/file-upload'

export type DocumentType = {
	uid: string
	documentName: string
	documentUrl: string
	description: string
	created: Date | string
	updated?: Date | string
}

export default function MedReports({
	token,
	uid,
	userRole,
	dpsStatus,
}: {
	token: string
	uid: string
	userRole?: string
	dpsStatus?: number
}) {
	const [data, setData] = React.useState<DocumentType[]>([])
	const [isModalOpen, setIsModalOpen] = React.useState(false)
	const [pdfUrl, setPdfUrl] = React.useState<string | undefined>(undefined)

	const reloadReports = useCallback(async () => {
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
		reloadReports()
	}, [reloadReports])

	function finishReportUpload() {
		//TODO
	}

	const showUploadReport =
		userRole &&
		dpsStatus &&
		dpsStatus === 5 &&
		(userRole.toLowerCase() === 'vendedor' ||
			userRole.toLowerCase() === 'admin')

	return data?.length > 0 ? (
		<div className="p-5 w-full max-w-7xl mx-auto bg-white rounded-3xl">
			<div className="flex justify-between gap-5">
				<h4 className="basis-1 grow text-lg text-primary mb-2">
					Laudos e Complementos Médicos
				</h4>
				{showUploadReport && (
					<div className="flex gap-2">
						<UploadReport
							token={token}
							proposalUid={uid}
							reportDescription={data[0]?.description}
							onSubmit={reloadReports}
						/>
						<Button size="sm" onClick={finishReportUpload}>
							<SendIcon size={14} className="mr-2" />
							Concluir
						</Button>
					</div>
				)}
			</div>
			<ul>
				{data.map((document, index) => {
					if (!document.description) return null

					return (
						<li
							key={index}
							className="w-full flex mt-2 p-3 justify-between items-center border rounded-xl bg-[#F4F7F7]"
						>
							<div className="grow-0 basis-10">
								<Badge
									variant="outline"
									className="text-muted-foreground bg-white"
								>
									{index + 1}
								</Badge>
							</div>

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

							{/* <div className="grow-0 px-3">{formatDate(document?.created)}</div> */}

							{document.documentName && (
								<Button
									className="grow-0 basis-10 text-teal-900 hover:text-teal-600"
									variant={`ghost`}
									onClick={() => handleViewArchive(document.uid)}
								>
									<FileTextIcon className="mr-2" />
									Abrir Arquivo
								</Button>
							)}
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
