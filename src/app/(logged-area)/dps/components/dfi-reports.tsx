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

export type DocumentType = {
	uid: string
	documentName: string
	documentUrl: string
	description: string
	created: Date | string
	updated?: Date | string
}

export default function DfiReports({
	token,
	uid,
	userRole,
	dfiStatus,
	requireUpload,
	onConfirm: onConfirmProp,
}: {
	token: string
	uid: string
	userRole?: string
	dfiStatus?: number
	requireUpload?: boolean
	onConfirm?: () => void
}) {
	const [data, setData] = React.useState<DocumentType[]>([])
	const [isModalOpen, setIsModalOpen] = React.useState(false)
	const [pdfUrl, setPdfUrl] = React.useState<string | undefined>(undefined)
	const [isFinishing, setIsFinishing] = React.useState(false)

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

			const response = await postStatus(
				token,
				uid,
				29,
				'Aguardando análise DFI',
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

				const response = await postStatus(
					token,
					uid,
					newStatus,
					'Análise de DFI concluída',
					'DFI'
				)

				if (response) {
					if (response.success) {
						onConfirmProp?.()
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

	const showUploadReport =
		userRole &&
		requireUpload &&
		(userRole.toLowerCase() === 'vendedor' ||
			userRole.toLowerCase() === 'vendedor-sup' ||
			userRole.toLowerCase() === 'admin')

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
											<>
											<Button
												className="grow-0 basis-10 text-teal-900 hover:text-teal-600"
												variant={`ghost`}
												onClick={() => handleViewArchive(document.uid)}
											>
												<FileTextIcon className="mr-2" />
												Abrir Arquivo
											</Button>
											{showReportApproval && (
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
											</>
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
	const [justification, setJustification] = React.useState(
		rejectJustificationProp
	)

	useEffect(() => {
		setRejectJustificationProp(justification)
	}, [justification, setRejectJustificationProp])

	return (
		<div className="mt-2">
			<Label htmlFor="reject-justification-input" className="text-foreground">
				Justificativa:{' '}
				<span className="text-xs text-muted-foreground">(opcional)</span>
			</Label>
			<Textarea
				id="reject-justification-input"
				className="text-foreground"
				value={justification}
				onChange={e => {
					setJustification(e.target.value)
				}}
			></Textarea>
		</div>
	)
}
