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
	MailIcon,
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
import { JustificationTextarea } from './dfi-reports'
import { formatDate } from './interactions'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip'

export type DocumentType = {
	uid: string
	documentName: string
	documentUrl: string
	description: string
	createdByUser?: {
		name?: string
		email?: string
	}
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
	const [origin, setOrigin] = React.useState('')

	const [isLoadingReports, setIsLoadingReports] = React.useState(false)
	const [rejectJustification, setRejectJustification] = React.useState('');

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
			setIsModalOpen(true)
			setPdfUrl(undefined) // Limpa URL anterior

			try {
				const response = await getProposalArchiveByUid(token, uid, documentUid)

				if (!response) {
					setAlertDialog({
						open: true,
						title: 'Erro',
						body: 'Não foi possível carregar o arquivo. Tente novamente mais tarde.',
					})
					setIsModalOpen(false)
					return
				}

				// Verifica se success é false (independente do valor de data)
				if (response.success === false) {
					setAlertDialog({
						open: true,
						title: 'Erro',
						body: response.message || 'Erro ao carregar o arquivo.',
					})
					setIsModalOpen(false)
					return
				}

				// Verifica se data é null, undefined ou string vazia
				if (!response.data || response.data === null || response.data.trim() === '') {
					setAlertDialog({
						open: true,
						title: 'Arquivo não encontrado',
						body: 'O arquivo não foi encontrado ou ainda não foi processado.',
					})
					setIsModalOpen(false)
					return
				}

				const pdfUrl = createPdfUrlFromBase64(response.data)
				if (!pdfUrl) {
					setAlertDialog({
						open: true,
						title: 'Erro',
						body: 'Erro ao processar o arquivo PDF. O arquivo pode estar corrompido.',
					})
					setIsModalOpen(false)
					return
				}

				setPdfUrl(pdfUrl)
			} catch (error) {
				console.error('Erro ao visualizar arquivo:', error)
				setAlertDialog({
					open: true,
					title: 'Erro',
					body: 'Ocorreu um erro inesperado ao carregar o arquivo.',
				})
				setIsModalOpen(false)
			}
		},
		[token, uid]
	)

	useEffect(() => {
		reloadReports()
	}, [reloadReports])

	useEffect(() => {
		if (typeof window !== 'undefined') {
			setOrigin(window.location.origin)
		}
	}, [])

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

			try {
				console.log('Iniciando conclusão de envio de laudos e complementos médicos')
				console.log('Dados da proposta:', { 
					uid, 
					dpsStatus, 
					dataLength: data?.length,
					userRole,
					requireUpload,
					showUploadReport: userRole && requireUpload && (userRole.toLowerCase() === 'vendedor' || userRole.toLowerCase() === 'admin')
				})
				
				// Validações antes de tentar atualizar o status
				if (!data || data.length === 0) {
					console.error('Nenhum documento encontrado para enviar')
					setAlertDialog({
						open: true,
						title: 'Erro de Validação',
						body: 'É necessário ter pelo menos um documento carregado para concluir o envio.',
					})
					return
				}

				if (!token) {
					console.error('Token de autenticação não encontrado')
					setAlertDialog({
						open: true,
						title: 'Erro de Autenticação',
						body: 'Sessão expirada. Faça login novamente.',
					})
					return
				}

				if (!uid) {
					console.error('UID da proposta não encontrado')
					setAlertDialog({
						open: true,
						title: 'Erro de Dados',
						body: 'Identificador da proposta não encontrado.',
					})
					return
				}
				
				const response = await postStatus(
					token,
					uid,
					4,
					'Aguardando análise DPS',
					'MIP'
				)

				console.log('Resposta do postStatus:', response)

				if (response) {
					if (response.success) {
						console.log('Status atualizado com sucesso')
						onConfirmProp?.()
						reloadReports()
					} else {
						console.error('Erro na resposta:', response.message)
						
						// Tratamento específico para diferentes tipos de erro
						let errorTitle = 'Erro ao Concluir Envio'
						let errorBody = response.message || 'Ocorreu um erro ao concluir envio de laudos e complementos.'
						
						if (response.message?.includes('não pode ser atualizada')) {
							errorTitle = 'Proposta Não Pode Ser Atualizada'
							errorBody = 'A proposta não pode ser atualizada no momento. Verifique se:\n\n' +
								'• Todos os documentos obrigatórios foram carregados\n' +
								'• A proposta não está em um status que permite esta operação\n' +
								'• Você tem permissão para realizar esta ação\n\n' +
								'Detalhes: ' + response.message
						}
						
						setAlertDialog({
							open: true,
							title: errorTitle,
							body: errorBody,
						})
					}
				} else {
					console.error('Resposta nula do postStatus')
					setAlertDialog({
						open: true,
						title: 'Erro de Conexão',
						body: 'Não foi possível conectar com o servidor. Verifique sua conexão e tente novamente.',
					})
				}
			} catch (error) {
				console.error('Erro ao concluir envio:', error)
				setAlertDialog({
					open: true,
					title: 'Erro Inesperado',
					body: 'Ocorreu um erro inesperado ao concluir envio de laudos e complementos.',
				})
			} finally {
				setIsFinishing(false)
			}
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
					<JustificationTextarea
						rejectJustification={rejectJustification}
						setRejectJustification={setRejectJustification}
					/>
				</>
			),
			onConfirm: changeStatus,
		})

		async function changeStatus() {
			setAlertDialog({
				open: false,
			})
			setIsFinishing(true)

			try {
				const newStatus = isApproved ? 6 : 37
				const statusText = isApproved ? 'APROVADA' : 'NEGADA'
				const justification = !isApproved ? rejectJustification?.trim() : ''
				const description = `Análise de MIP concluída: ${statusText}${
					justification ? ` - ${justification}` : ''
				}`
				console.log(`Iniciando ${isApproved ? 'aprovação' : 'reprovação'} de MIP com status:`, newStatus)

				const response = await postStatus(
					token,
					uid,
					newStatus,
					description,
					'MIP'
				)

				console.log('Resposta do postStatus (review):', response)

				if (response) {
					if (response.success) {
						console.log('Análise de MIP concluída com sucesso')
						onConfirmProp?.()
						if (isApproved) {
							setTimeout(() => {
								onConfirmProp?.()
							}, 1500)
						}
						reloadReports()
					} else {
						console.error('Erro na resposta (review):', response.message)
						setAlertDialog({
							open: true,
							title: 'Erro na Análise',
							body: response.message || 'Ocorreu um erro ao concluir análise de MIP',
						})
					}
				} else {
					console.error('Resposta nula do postStatus (review)')
					setAlertDialog({
						open: true,
						title: 'Erro de Conexão',
						body: 'Não foi possível conectar com o servidor. Verifique sua conexão e tente novamente.',
					})
				}
			} catch (error) {
				console.error('Erro ao concluir análise de MIP:', error)
				setAlertDialog({
					open: true,
					title: 'Erro Inesperado',
					body: 'Ocorreu um erro inesperado ao concluir análise de MIP.',
				})
			} finally {
				setIsFinishing(false)
			}
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
						<ul className="space-y-2">
							{data.map((document, index) => {
								if (!document.description) return null

								return (
									<li
										key={index}
										className="w-full rounded-2xl border bg-white/80 p-4 shadow-sm transition hover:shadow-md"
									>
										<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
											<div className="flex items-start gap-3">
												<Badge
													variant="outline"
													className="text-muted-foreground bg-white"
												>
													{index + 1}
												</Badge>
												<div className="space-y-1">
													<div className="text-sm font-medium text-foreground">
														{document?.description}
													</div>
													{(document?.createdByUser?.name || document?.created) && (
														<div className="text-xs text-muted-foreground">
															{document?.createdByUser?.name ? (
																<TooltipProvider delayDuration={0}>
																	<Tooltip>
																		<TooltipTrigger asChild>
																			<span className="cursor-help underline-offset-2 hover:underline">
																				{document.createdByUser.name}
																			</span>
																		</TooltipTrigger>
																		<TooltipContent className="rounded-lg border border-border/60 bg-white/95 px-3 py-2 text-xs shadow-md">
																			<div className="flex flex-col gap-1.5">
																				<span className="text-foreground font-medium">
																					{document.createdByUser.name}
																				</span>
																				{document.createdByUser.email ? (
																					<a
																						className="inline-flex items-center gap-1 text-primary underline underline-offset-2"
																						href={`mailto:${document.createdByUser.email}?subject=${encodeURIComponent(
																							'Subscrição Inteligente: Laudos e Complementos Médicos'
																						)}&body=${encodeURIComponent(
																							`Segue o link do formulário DPS: ${
																								origin
																									? `${origin}/dps/fill-out/form/${uid}`
																									: `/dps/fill-out/form/${uid}`
																							}`
																						)}`}
																					>
																						<MailIcon className="h-3.5 w-3.5" />
																						{document.createdByUser.email}
																					</a>
																				) : (
																					<span className="text-muted-foreground">
																						Email indisponível
																					</span>
																				)}
																			</div>
																		</TooltipContent>
																	</Tooltip>
																</TooltipProvider>
															) : null}
															{document?.createdByUser?.name && document?.created
																? ' • '
																: null}
															{document?.created ? formatDate(document.created) : null}
														</div>
													)}
												</div>
											</div>

											<div className="flex flex-wrap items-center gap-2">
												{document.documentName && (
													<Badge
														variant="warn"
														shape="pill"
														role="button"
														tabIndex={0}
														title={document.documentName}
														className="max-w-[320px] cursor-pointer select-none gap-2 rounded-md px-3 py-2 text-xs font-normal text-[#556B2F] bg-[#FFF6D6] border border-[#F2E4B6]"
														onClick={() => handleViewArchive(document.uid)}
														onKeyDown={event => {
															if (event.key === 'Enter' || event.key === ' ') {
																event.preventDefault()
																handleViewArchive(document.uid)
															}
														}}
													>
														<FileTextIcon className="h-5 w-5" />
														<span className="truncate">{document.documentName}</span>
													</Badge>
												)}
											</div>
										</div>
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
