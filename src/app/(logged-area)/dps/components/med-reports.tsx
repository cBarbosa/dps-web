'use client'

import React, { ReactNode, useCallback, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import {
	getProposalArchiveByUid,
	getProposalDocumentsByUid,
	postStatus,
} from '../actions'
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
import DialogAlertComp from '@/components/ui/alert-dialog-comp'
import { AlertDialog } from '@radix-ui/react-alert-dialog'
import LoadingScreen from '@/components/loading-creen'
import RequestComplement from './request-complement'

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
	requireUpload,
	onConfirm: onConfirmProp,
}: {
	token: string
	uid: string
	userRole?: string
	dpsStatus?: number
	requireUpload?: boolean
	onConfirm?: () => void
}) {
	const [data, setData] = React.useState<DocumentType[]>([])
	const [isModalOpen, setIsModalOpen] = React.useState(false)
	const [pdfUrl, setPdfUrl] = React.useState<string | undefined>(undefined)

	const [isFinishing, setIsFinishing] = React.useState(false)

	const [isLoadingReports, setIsLoadingReports] = React.useState(false)

	const [alertDialog, setAlertDialog] = React.useState<{
		open: boolean
		title?: string
		body?: ReactNode
		onConfirm?: () => void
	}>({
		open: false,
	})

	const reloadReports = useCallback(async () => {
		setIsLoadingReports(true)
		const proposalResponse = await getProposalDocumentsByUid(token, uid, 'MIP')

		if (!proposalResponse) return

		const newDocuments = proposalResponse?.data ?? []

		setData(newDocuments)
		setIsLoadingReports(false)
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

	async function finishReportUpload() {
		setAlertDialog({
			open: true,
			title: 'Confirmação',
			body: 'Confirma o envio de laudos e complementos médicos?',
			onConfirm: changeStatus,
		})

		async function changeStatus() {
			setAlertDialog({
				open: false,
			})
			setIsFinishing(true)

			const response = await postStatus(
				token,
				uid,
				4,
				'Aguardando análise DPS',
				'MIP'
			)

			if (response) {
				if (response.success) {
					onConfirmProp?.()
					reloadReports()
				} else {
					setAlertDialog({
						open: true,
						title: 'Erro',
						body: 'Ocorreu um erro ao concluir envio de laudos e complementos.',
					})
				}
			} else {
				setAlertDialog({
					open: true,
					title: 'Erro',
					body: 'Ocorreu um erro ao concluir envio de laudos e complementos (sem resposta).',
				})
			}

			setIsFinishing(false)
		}
	}

	async function reviewReport(isApproved: boolean) {
		setAlertDialog({
			open: true,
			title: `Confirmação de ${isApproved ? 'Aprovação' : 'Reprovação'}`,
			body: isApproved ? (
				<>
					Confirma a{' '}
					<span className="text-base font-semibold text-primary">
						APROVAÇÃO
					</span>{' '}
					da análise de MIP?
				</>
			) : (
				<>
					Confirma a{' '}
					<span className="text-base font-semibold text-destructive">
						REPROVAÇÃO
					</span>{' '}
					da análise de MIP?
				</>
			),
			onConfirm: changeStatus,
		})

		async function changeStatus() {
			setAlertDialog({
				open: false,
			})
			setIsFinishing(true)

			const newStatus = isApproved ? 6 : 37

			const response = await postStatus(
				token,
				uid,
				newStatus,
				'Análise de MIP concluída',
				'MIP'
			)

			if (response) {
				if (response.success) {
					onConfirmProp?.()
					reloadReports()
				} else {
					setAlertDialog({
						open: true,
						title: 'Erro',
						body: 'Ocorreu um erro ao concluir análise de MIP',
					})
				}
			} else {
				setAlertDialog({
					open: true,
					title: 'Erro',
					body: 'Ocorreu um erro ao concluir análise de MIP (sem resposta)',
				})
			}

			setIsFinishing(false)
		}
	}

	const showReportApproval =
		userRole &&
		dpsStatus &&
		dpsStatus === 4 &&
		(userRole.toLowerCase() === 'subscritor-med' ||
			userRole.toLowerCase() === 'admin')

	const showUploadReport =
		userRole &&
		requireUpload &&
		(userRole.toLowerCase() === 'vendedor' ||
			userRole.toLowerCase() === 'admin')

	return (
		<div className="p-5 w-full max-w-7xl mx-auto bg-white rounded-3xl">
			<div className="flex justify-between gap-5">
				<h4 className="basis-1 grow text-lg text-primary mb-2">
					Laudos e Complementos Médicos
				</h4>
				{showReportApproval && (
					<div className="flex gap-2 mb-3">
						<RequestComplement
							token={token}
							proposalUid={uid}
							onSubmit={onConfirmProp}
						/>
						<Button
							variant="default"
							onClick={() => reviewReport(true)}
							disabled={isFinishing}
						>
							<ThumbsUpIcon className="mr-2" size={18} />
							Aprovar DPS
						</Button>
						<Button
							variant="destructive"
							onClick={() => reviewReport(false)}
							disabled={isFinishing}
						>
							<ThumbsDownIcon className="mr-2" size={18} />
							Reprovar DPS
						</Button>
					</div>
				)}
				{showUploadReport && (
					<div className="flex gap-2">
						<UploadReport
							token={token}
							proposalUid={uid}
							reportDescription={'Laudo/Complemento MIP'}
							onSubmit={reloadReports}
							disabled={isFinishing}
							type="MIP"
						/>
						<Button
							size="sm"
							onClick={finishReportUpload}
							disabled={data?.length <= 0 || isFinishing}
						>
							<SendIcon size={14} className="mr-2" />
							Concluir
						</Button>
					</div>
				)}
			</div>
			<div className="relative">
				{data?.length > 0 ? (
					<>
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
					</>
				) : (
					<div className="text-muted-foreground">
						Nenhuma documentação registrada
					</div>
				)}

				<DialogShowArchive
					isModalOpen={isModalOpen}
					setIsModalOpen={setIsModalOpen}
					pdfUrl={pdfUrl}
				/>
				<DialogAlertComp
					open={alertDialog.open}
					onOpenChange={() => setAlertDialog({ open: false })}
					title={alertDialog.title ?? ''}
					onConfirm={alertDialog.onConfirm}
				>
					{alertDialog.body}
				</DialogAlertComp>

				{isLoadingReports ? (
					<div className="absolute inset-0 w-full h-full bg-white/60">
						<LoadingScreen />
					</div>
				) : null}
			</div>
		</div>
	)
}
