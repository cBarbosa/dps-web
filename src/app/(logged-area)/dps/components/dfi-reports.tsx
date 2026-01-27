'use client'

import React, { ReactNode, useCallback, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import {
	deleteArchive,
	getProposalArchiveByUid,
	getProposalDocumentsByUid,
	postStatus,
} from '../actions'
import {
	DeleteIcon,
	FileTextIcon,
	MailIcon,
	SendIcon,
	ThumbsDownIcon,
	ThumbsUpIcon,
	Trash2Icon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createPdfUrlFromBase64, DialogShowArchive } from './dialog-archive'
import UploadReport from './upload-report'
import DialogAlertComp from '@/components/ui/alert-dialog-comp'
import LoadingScreen from '@/components/loading-creen'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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

export default function DfiReports({
	token,
	uid,
	userRole,
	dfiStatus,
	requireUpload,
	proposalHistory,
	onConfirm: onConfirmProp,
}: {
	token: string
	uid: string
	userRole?: string
	dfiStatus?: number
	requireUpload?: boolean
	proposalHistory?: Array<{
		description: string;
		statusId: number;
		created: string;
	}>
	onConfirm?: () => void
}) {
	const [data, setData] = React.useState<DocumentType[]>([])
	const [isModalOpen, setIsModalOpen] = React.useState(false)
	const [pdfUrl, setPdfUrl] = React.useState<string | undefined>(undefined)
	const [isFinishing, setIsFinishing] = React.useState(false)
	const [origin, setOrigin] = React.useState('')

	const [isLoadingReports, setIsLoadingReports] = React.useState(false)
	const [rejectJustification, setRejectJustification] = React.useState('')

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
		const proposalResponse = await getProposalDocumentsByUid(token, uid, 'DFI')

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
			body: 'Confirma o envio de laudos DFI?',
			onConfirm: changeStatus,
		})

		async function changeStatus() {
			setAlertDialog({
				open: false,
			})
			setIsFinishing(true)

				const justification = rejectJustification?.trim()
				const description = `Aguardando análise DFI${
					justification ? `: ${justification}` : ''
				}`

			const response = await postStatus(
				token,
				uid,
				29,
					description,
				'DFI'
			)

			if (response) {
				if (response.success) {
					onConfirmProp?.()
					reloadReports()
				} else {
					setAlertDialog({
						open: true,
						title: 'Erro',
						body: 'Ocorreu um erro ao concluir envio de laudos.',
					})
				}
			} else {
				setAlertDialog({
					open: true,
					title: 'Erro',
					body: 'Ocorreu um erro ao concluir envio de laudos (sem resposta).',
				})
			}

			setIsFinishing(false)
		}
	}

	const reviewReport = useCallback(
		async function (isApproved: boolean) {
			setAlertDialog({
				open: true,
				title: `Confirmação de ${isApproved ? 'Aprovação' : 'Reprovação'}`,
				body: isApproved ? (
					<>
						Confirma a{' '}
						<span className="text-base font-semibold text-primary">
							APROVAÇÃO
						</span>{' '}
						da análise de DFI?
					</>
				) : (
					<>
						Confirma a{' '}
						<span className="text-base font-semibold text-destructive">
							REPROVAÇÃO
						</span>{' '}
						da análise de DFI?
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

				const newStatus = isApproved ? 35 : 36
				const statusText = isApproved ? 'APROVADA' : 'NEGADA'
				const justification = !isApproved ? rejectJustification?.trim() : ''
				const description = `Análise de DFI concluída: ${statusText}${
					justification ? ` - ${justification}` : ''
				}`

				const response = await postStatus(
					token,
					uid,
					newStatus,
					description,
					'DFI'
				)

				if (response) {
					if (response.success) {
						onConfirmProp?.()
						if (isApproved) {
							setTimeout(() => {
								onConfirmProp?.()
							}, 1500)
						}
						reloadReports()
						setRejectJustification('')
					} else {
						setAlertDialog({
							open: true,
							title: 'Erro',
							body: 'Ocorreu um erro ao concluir análise de DFI',
						})
					}
				} else {
					setAlertDialog({
						open: true,
						title: 'Erro',
						body: 'Ocorreu um erro ao concluir análise de DFI (sem resposta)',
					})
				}

				setIsFinishing(false)
			}
		},
		[onConfirmProp, rejectJustification, reloadReports, token, uid]
	)

	const reportDeleteArchive = useCallback(
		async function (archiveUid: string) {
			const handleDeleteFile = async () => {
				console.log('Iniciando exclusão do arquivo:', archiveUid);
				
				setAlertDialog({
					open: false
				});

				setIsFinishing(true);

				try {
					console.log('Chamando deleteArchive com:', { token: token ? 'presente' : 'ausente', archiveUid });
					
					const response = await deleteArchive(
						token,
						archiveUid
					);

					console.log('Resposta do deleteArchive:', response);

					if (response) {
						if (response.success) {
							console.log('Arquivo deletado com sucesso');
							onConfirmProp?.();
							reloadReports();
						} else {
							console.error('Erro na resposta:', response.message);
							setAlertDialog({
								open: true,
								title: 'Erro ao Deletar Arquivo',
								body: response.message || 'Erro ao deletar arquivo',
							});
						}
					} else {
						console.error('Resposta nula do deleteArchive');
						setAlertDialog({
							open: true,
							title: 'Erro de Conexão',
							body: 'Não foi possível conectar com o servidor. Verifique sua conexão e tente novamente.',
						});
					}
				} catch (error) {
					console.error('Erro ao deletar arquivo:', error);
					setAlertDialog({
						open: true,
						title: 'Erro',
						body: 'Ocorreu um erro inesperado ao deletar o arquivo.',
					});
				} finally {
					setIsFinishing(false);
				}
			};

			setAlertDialog({
				open: true,
				title: `Confirmação de deleção de arquivo`,
				body:
					<>
						Confirma a{' '}
						<span className="text-base font-semibold text-destructive">
							DELEÇÃO
						</span>{' '}
						do arquivo?
					</>,
				onConfirm: handleDeleteFile,
			});
		},
		[reloadReports, token, onConfirmProp]
	);

	const showReportApproval =
		userRole &&
		dfiStatus &&
		dfiStatus === 29 &&
		(userRole.toLowerCase() === 'subscritor' ||
			userRole.toLowerCase() === 'admin')

	// Verifica se a proposta já foi assinada (status 21 no histórico)
	const hasBeenSigned = proposalHistory?.some(h => h.statusId === 21) ?? false

	const isVendedor = userRole?.toLowerCase() === 'vendedor' || userRole?.toLowerCase() === 'vendedor-sup'
	const isAdminOrSubscritor = 
		userRole?.toLowerCase() === 'admin' ||
		userRole?.toLowerCase() === 'subscritor' ||
		userRole?.toLowerCase() === 'subscritor-sup'

	const showUploadReport =
		userRole &&
		requireUpload &&
		(userRole.toLowerCase() === 'vendedor' ||
			userRole.toLowerCase() === 'vendedor-sup' ||
			userRole.toLowerCase() === 'admin') &&
		// Vendedores só podem incluir laudo DFI se a proposta já foi assinada (status 21 no histórico)
		// Admin, subscritor e subscritor-sup não precisam dessa verificação
		(isAdminOrSubscritor || isVendedor)

	return (
		<div className="p-5 w-full max-w-7xl mx-auto bg-white rounded-3xl">
			<div className="flex justify-between gap-5">
				<h4 className="basis-1 grow text-lg text-primary mb-2">Laudos DFI</h4>
				{showReportApproval && (
					<div className="flex gap-2 mb-3">
						<Button
							variant="default"
							onClick={() => reviewReport(true)}
							disabled={isFinishing}
						>
							<ThumbsUpIcon className="mr-2" size={18} />
							Aprovar laudo DFI
						</Button>
						<Button
							variant="destructive"
							onClick={() => reviewReport(false)}
							disabled={isFinishing}
						>
							<ThumbsDownIcon className="mr-2" size={18} />
							Reprovar laudo DFI
						</Button>
						<UploadReport
							token={token}
							proposalUid={uid}
							reportDescription={'Laudo DFI'}
							onSubmit={reloadReports}
							type="DFI"
						/>
					</div>
				)}
				{showUploadReport && (
					<div className="flex gap-2">
						<UploadReport
							token={token}
							proposalUid={uid}
							reportDescription={'Laudo DFI'}
							onSubmit={reloadReports}
							type="DFI"
						/>
						{hasBeenSigned && (<Button
							size="sm"
							onClick={finishReportUpload}
							disabled={data?.length <= 0 || isFinishing}
						>
							<SendIcon size={14} className="mr-2" />
							Concluir
						</Button>)}
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
																							'Subscrição Inteligente: Laudos DFI'
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

												{document.documentName && showReportApproval && (
													<Button
														type="button"
														variant="destructive"
														size="iconSm"
														className="rounded-full text-zinc-200"
														disabled={isFinishing}
														onClick={() => reportDeleteArchive(document.uid)}
													>
														<Trash2Icon
															size={20}
															className="text-foreground p-0.5 hover:text-teal-600"
														/>
													</Button>
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
					<div className="absolute top-0 left-0 w-full h-full bg-white/60">
						<LoadingScreen />
					</div>
				) : null}
			</div>
		</div>
	)
}

export function JustificationTextarea({
	rejectJustification: rejectJustificationProp,
	setRejectJustification: setRejectJustificationProp,
}: {
	rejectJustification: string
	setRejectJustification: (value: string) => void
}) {
	return (
		<div className="mt-2">
			<Label htmlFor="reject-justification-input" className="text-foreground">
				Justificativa:{' '}
				<span className="text-xs text-muted-foreground">(opcional)</span>
			</Label>
			<Textarea
				id="reject-justification-input"
				className="text-foreground"
				value={rejectJustificationProp}
				onChange={e => {
					setRejectJustificationProp(e.target.value)
				}}
			></Textarea>
		</div>
	)
}
