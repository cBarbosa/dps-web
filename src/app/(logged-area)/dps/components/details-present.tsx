'use client'
import React, { ReactNode, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { GoBackButton } from '@/components/ui/go-back-button'
import {
	Building2Icon,
	CalendarIcon,
	CheckIcon,
	CopyIcon,
	DollarSignIcon,
	IdCardIcon,
	LucideAlertOctagon,
	PhoneIcon,
	SquareArrowUpRightIcon,
	ThumbsDownIcon,
	ThumbsUpIcon,
	Trash2Icon,
	Undo2Icon,
	UserRoundIcon,
} from 'lucide-react'
import {
	getProposalByUid,
	getProposalSignByUid,
	putProposalAnalysis,
	putProposalReview,
	putProposalCancel,
} from '../actions'
import {
	cn,
	formatCpf
} from '@/lib/utils'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Interactions from './interactions'
import MedReports from './med-reports'
import {
	createPdfUrlFromBase64,
	DialogShowArchive
} from './dialog-archive'
import { useSession } from 'next-auth/react'
import { DataCard } from '../../components/data-card'
import DfiReports from './dfi-reports'
import AddressProposal from './address-proposal'
import DialogReanalisys from './dialog-reanalisys'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger
} from '@/components/ui/accordion'

export type ProposalDataType = NonNullable<
	Awaited<ReturnType<typeof getProposalByUid>>
>['data']

export const statusDescriptionDict: Record<number, string> = {
	4: 'Aguardando análise DPS',
	5: 'Aguardando inclusão de complementos solicitado pelo subscritor médico',
	10: 'Aguardando preenchimento da DPS',
	19: 'DPS Cadastrada',
	20: 'DPS Enviada para assinatura',
	21: 'DPS Assinada',
	22: 'DPS Recusada',
	23: 'DPS Cancelada por decurso',
	30: 'DPS Avaliada',
	31: 'Complemento solicitado',
	32: 'Complemento enviado',
	33: 'Enviado para subscrição',
	34: 'DFI Avaliada',
	38: 'Processo finalizado',
	40: 'Processo em reanálise',
	41: 'Processo reanalisado',
	42: 'MIP Avaliada',
	52: 'Processo enviado para revisão',
	53: 'Processo revisado',
	54: 'Processo enviado para exclusão',
	55: 'Processo enviado para exclusão',
	56: 'Processo excluído'
}

const DetailsPresent = ({
	proposalData: proposalDataProp,
	token,
	uid,
	propertyTypeDescription,
	participants,
}: {
	token: string
	uid: string
	proposalData: ProposalDataType
	propertyTypeDescription?: string
	participants?: Array<{
		uid: string;
		contractNumber: string;
		operationValue: number;
		totalParticipants: number;
		percentageParticipation: number;
		financingParticipation: number;
		participantType: "P" | "C";
		productId: number;
		deadlineId?: number;
		deadlineMonths?: number;
		propertyTypeId: number;
		capitalMIP: number;
		capitalDFI: number;
		customer: {
			name: string;
			document: string;
		};
		product: {
			uid: string;
			name: string;
			description: string;
		};
	}> | null
}) => {
	const session = useSession()
	const router = useRouter()
	const role = (
		(session.data as any)?.role as string | undefined
	)?.toLowerCase()

	const [proposalData, setProposalData] =
		React.useState<ProposalDataType>(proposalDataProp)
	const [isModalOpen, setIsModalOpen] = React.useState(false)
	const [pdfUrl, setPdfUrl] = React.useState<string | undefined>(undefined)
	const [alertDialog, setAlertDialog] = React.useState<{
		open: boolean
		title?: string
		body?: ReactNode
		onConfirm?: () => void
		confirmText?: string
		hideCancel?: boolean
	}>({
		open: false,
	})

	const proposalSituation = proposalData?.status
	const proposalSituationDFI = proposalData?.dfiStatus

	const refetchProposalData = useCallback(
		async function () {
			const response = await getProposalByUid(token, uid)
			if (response) {
				setProposalData(response.data)
			}
		},
		[token, uid]
	)

	const handleViewArchive = React.useCallback(async () => {
		setIsModalOpen(opt => true)

		const response = await getProposalSignByUid(token, uid)

		if (!response) return

		setPdfUrl(createPdfUrlFromBase64(response.data))
	}, [token, uid])

	const handleCopyLink = React.useCallback(() => {
		/**
		 * Generates a shareable link to this DPS page and copies it to the clipboard.
		 * Shows a success dialog when copied or an error dialog if copying fails.
		 */
		// Create the URL for the current page
		const baseUrl = window.location.origin;
		const url = `${baseUrl}/external/fill-out/form/${uid}`;

		// Copy to clipboard
		navigator.clipboard.writeText(url)
			.then(() => {
				// Show success dialog
				setAlertDialog({
					open: true,
					title: 'Link copiado',
					body: (
						<p>O link para este processo foi copiado para a área de transferência.</p>
					),
				})
			})
			.catch(err => {
				console.error('Erro ao copiar link:', err)
				setAlertDialog({
					open: true,
					title: 'Erro',
					body: (
						<p>Não foi possível copiar o link. Por favor, tente novamente.</p>
					),
				})
			})
	}, [uid]);

	const handleCopyParticipantLink = React.useCallback((participantUid: string) => {
		const baseUrl = window.location.origin;
		const url = `${baseUrl}/external/fill-out/form/${participantUid}`;

		// Copy to clipboard
		navigator.clipboard.writeText(url)
			.then(() => {
				// Show success dialog
				setAlertDialog({
					open: true,
					title: 'Link copiado',
					body: (
						<p>O link para este participante foi copiado para a área de transferência.</p>
					),
				})
			})
			.catch(err => {
				console.error('Erro ao copiar link:', err)
				setAlertDialog({
					open: true,
					title: 'Erro',
					body: (
						<p>Não foi possível copiar o link. Por favor, tente novamente.</p>
					),
				})
			})
	}, []);

	const reportAnalisys = React.useCallback(
		async function (action: `REOPEN`) {
			setAlertDialog({
				open: true,
				title: `Confirmação abertura de reanálise`,
				body: (
					<>
						Confirma a{' '}
						<span className="text-base font-semibold text-primary">
							REABERTURA DA ANÁLISE
						</span>{' '}
						do processo?
					</>
				),
				onConfirm: handleReanalisys,
				confirmText: 'Reabrir',
			})

			async function handleReanalisys() {
				setAlertDialog({
					open: false,
				})

				const response = await putProposalAnalysis(token, uid, {
					Action: action,
					IsApproved: false,
				})

				if (response) {
					if (response.success) {
						refetchProposalData()
					} else {
						setAlertDialog({
							open: true,
							title: 'Erro',
							body: response.message,
						})
					}
				} else {
					setAlertDialog({
						open: true,
						title: 'Erro',
						body: 'Ocorreu um erro ao alterar o processo',
					})
				}
			}
		},
		[token, refetchProposalData, uid]
	)

	const reportApprovalAnalisys = React.useCallback(
		async function (isApproved: boolean, action: `APPROVE` | `REFUSE`) {
			setAlertDialog({
				open: true,
				title: `Confirmação de ${
					isApproved ? 'Aprovação' : 'Reprovação'
				} de processo de reanálise`,
				body: isApproved ? (
					<>
						Confirma a{' '}
						<span className="text-base font-semibold text-primary">
							APROVAÇÃO
						</span>{' '}
						do processo?
					</>
				) : (
					<>
						Confirma a{' '}
						<span className="text-base font-semibold text-destructive">
							REPROVAÇÃO
						</span>{' '}
						do processo?
					</>
				),
				onConfirm: handleReanalisys,
				confirmText: 'Confirmar',
			})

			async function handleReanalisys() {
				setAlertDialog({
					open: false,
				})

				const response = await putProposalAnalysis(token, uid, {
					Action: action,
					IsApproved: isApproved,
				})

				if (response) {
					if (response.success) {
						refetchProposalData()
					} else {
						setAlertDialog({
							open: true,
							title: 'Erro',
							body: response.message,
						})
					}
				} else {
					setAlertDialog({
						open: true,
						title: 'Erro',
						body: 'Ocorreu um erro ao processar as informações.',
					})
				}
			}
		},
		[token, refetchProposalData, uid]
	)

	const reportReviewDps = React.useCallback(
		async function (isApproved: boolean, action: `APPROVE` | `REFUSE`) {
			setAlertDialog({
				open: true,
				title: `Confirmação de ${
					isApproved ? 'Aprovação' : 'Reprovação'
				} de processo de revisão`,
				body: isApproved ? (
					<>
						Confirma a{' '}
						<span className="text-base font-semibold text-primary">
							APROVAÇÃO
						</span>{' '}
						do processo?
					</>
				) : (
					<>
						Confirma a{' '}
						<span className="text-base font-semibold text-destructive">
							REPROVAÇÃO
						</span>{' '}
						do processo?
					</>
				),
				onConfirm: handleReviewDps,
				confirmText: 'Confirmar',
			});

			async function handleReviewDps() {
				setAlertDialog({
					open: false,
				});

				const response = await putProposalReview(token, uid, {
					Action: action,
					IsApproved: isApproved,
				});

				if (response) {
					if (response.success) {
						refetchProposalData();
					} else {
						setAlertDialog({
							open: true,
							title: 'Erro',
							body: response.message,
						});
					}
				} else {
					setAlertDialog({
						open: true,
						title: 'Erro',
						body: 'Ocorreu um erro ao processar as informações.',
					});
				}
			}
		},
		[token, refetchProposalData, uid]
	);

	const reportCancelDps = React.useCallback(
		async function () {
			setAlertDialog({
				open: true,
				title: 'Confirmação de Exclusão',
				body: (
					<>
						Confirma a{' '}
						<span className="text-base font-semibold text-destructive">
							SOLICITAÇÃO DE EXCLUSÃO
						</span>{' '}
						do processo?
					</>
				),
				onConfirm: handleCancelDps,
				confirmText: 'Confirmar Exclusão',
			});

			async function handleCancelDps() {
				setAlertDialog({
					open: false,
				});

				const response = await putProposalCancel(token, uid, {
					Action: 'CANCEL',
					IsApproved: false,
				});

				if (response) {
					if (response.success) {
						setAlertDialog({
							open: true,
							title: 'Exclusão Realizada',
							body: (
								<p>A solicitação de exclusão foi registrada com sucesso. O processo foi enviado para exclusão.</p>
							),
							onConfirm: () => router.push('/dashboard'),
							confirmText: 'Voltar ao Dashboard',
							hideCancel: true,
						});
					} else {
						setAlertDialog({
							open: true,
							title: 'Erro',
							body: response.message,
						});
					}
				} else {
					setAlertDialog({
						open: true,
						title: 'Erro',
						body: 'Ocorreu um erro ao processar a solicitação de exclusão.',
					});
				}
			}
		},
		[token, uid, router]
	);

	const reportConfirmCancelDps = React.useCallback(
		async function () {
			setAlertDialog({
				open: true,
				title: 'Confirmação de Cancelamento',
				body: (
					<>
						Confirma o{' '}
						<span className="text-base font-semibold text-destructive">
							CANCELAMENTO
						</span>{' '}
						do processo?
					</>
				),
				onConfirm: handleConfirmCancelDps,
				confirmText: 'Confirmar Cancelamento',
			});

			async function handleConfirmCancelDps() {
				setAlertDialog({
					open: false,
				});

				const response = await putProposalCancel(token, uid, {
					Action: 'CANCEL',
					IsApproved: true,
				});

				if (response) {
					if (response.success) {
						setAlertDialog({
							open: true,
							title: 'Cancelamento Realizado',
							body: (
								<p>{response.message}</p>
							),
							onConfirm: () => router.push('/dashboard'),
							confirmText: 'Voltar ao Dashboard',
							hideCancel: true,
						});
					} else {
						setAlertDialog({
							open: true,
							title: 'Erro',
							body: response.message,
						});
					}
				} else {
					setAlertDialog({
						open: true,
						title: 'Erro',
						body: 'Ocorreu um erro ao processar a confirmação de cancelamento.',
					});
				}
			}
		},
		[token, uid, router]
	);

	const calculateDaysBetween = (
		dateString?: string,
		thresholdDays: number = 10
	): boolean => {
		try {
			if (!dateString) throw new Error('Date string cannot be undefined.')

			// Convert the input string to a Date object
			const inputDate = new Date(dateString)

			// Validate the input date
			if (isNaN(inputDate.getTime()))
				throw new Error(
					"Invalid date format. Please provide a valid date string (e.g., 'YYYY-MM-DDTHH:mm:ss.sss')."
				)

			// Get the current date
			const currentDate = new Date()

			// Calculate the difference in time (milliseconds)
			const timeDifference = currentDate.getTime() - inputDate.getTime()

			// Convert the difference from milliseconds to days
			const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24))

			console.log(`Days difference: ${daysDifference}`)
			// Return whether the difference exceeds the threshold
			return daysDifference > thresholdDays
		} catch (error) {
			console.error(error)
			return false
		}
	}

const lastSituation: number | undefined =
		proposalData.history?.at(0)?.statusId

	const showFillOutAlert: boolean | undefined =
		(role === 'vendedor' || role === 'vendedor-sup') &&
		(proposalSituation.id === 5 ||
			proposalSituation.id === 10 ||
			proposalData.uploadMIP ||
			proposalData.uploadDFI)

	const showMipAlertMinToMedic: boolean | undefined =
		role === 'subscritor-med' &&
		proposalData.status.id === 4 &&
		proposalData.capitalMIP >= 3000000 &&
		proposalData.capitalMIP < 5000000
	const showMipAlertCompleteToMedic: boolean | undefined =
		role === 'subscritor-med' &&
		proposalData.status.id === 4 &&
		proposalData.capitalMIP > 5000000
	const showDfiAlertToSubscriber: boolean | undefined =
		role === 'subscritor' && proposalData.dfiStatus?.id === 29
	const showReanalisys: boolean =
		role === 'vendedor-sup' &&
		proposalData.riskStatus === 'REFUSED' &&
		proposalData.closed === undefined &&
		!calculateDaysBetween(proposalData.refused, 15)
	const showAproveAnalisysDps: boolean =
		role === 'subscritor-sup' &&
		proposalData.riskStatus === 'REOPENED' &&
		proposalData.closed === undefined
	const showReviewDps: boolean =
		role === 'subscritor-sup' &&
		proposalData.riskStatus === 'REVIEW' &&
		proposalData.closed === undefined

	const showCopyLink =  proposalSituation.id === 10 && !proposalData?.riskStatus;
	const showCancelButton = (proposalSituation.id === 10 || proposalSituation.id === 20) && !proposalData?.riskStatus;
	const showConfirmCancelButton = role === 'vendedor-sup' && proposalData?.riskStatus === 'CANCELED' && !proposalData.closed;

	return (
		<div className="flex flex-col gap-5 p-5">
			<div className="px-5 py-7 w-full max-w-7xl mx-auto bg-white rounded-3xl">
				<div className="w-full flex justify-between">
					<GoBackButton>
						<Undo2Icon className="mr-2" />
						Voltar
					</GoBackButton>
					<span className="font-mono text-sm text-gray-500">
						{proposalData.contractNumber ?? proposalData.code}
					</span>
				</div>

				<div className="mx-5 mt-2">
					<div className="w-full flex justify-between items-center">
						<div className={``}>
							<h4 className="text-lg text-primary">
								Situação Processo
								<Badge
									shape="pill"
									variant={
										!proposalData?.riskStatus
											? `warn`
											: proposalData?.riskStatus === `APPROVED`
												? `success`
												: proposalData?.riskStatus === `REVIEW`
													? `warn`
													: `destructive`
									}
									className={cn(
										'ml-4',
										proposalData?.riskStatus === `APPROVED`
											? `text-zinc-600`
											: `text-white`
									)}
								>
									{!proposalData?.riskStatus
										? `Em andamento`
										: proposalData?.riskStatus === `APPROVED`
											? `Aprovado`
											: proposalData?.riskStatus === `REVIEW`
												? `Em análise pela seguradora`
												: proposalData?.riskStatus === `CANCELED`
													? `Cancelado`
													: `Recusado`
									}
								</Badge>
							</h4>
						</div>
						<div className={``}>
							<h4 className="text-lg text-primary">
								Situação MIP
								<Badge
									shape="pill"
									variant={
										proposalSituation?.description === `DPS Aprovada`
											? `success`
											: proposalSituation?.description === `DPS Reprovada`
											? `destructive`
											: `warn`
									}
									className={cn(
										'ml-4',
										proposalSituation?.description === `DPS Aprovada`
											? `text-zinc-600`
											: `text-white`
									)}
								>
									{proposalSituation?.description ?? 'Estado desconhecido'}
								</Badge>
							</h4>
						</div>
						{proposalSituationDFI?.description && (
							<div className={``}>
								<h4 className="text-lg text-primary">
									Situação DFI
									<Badge
										shape="pill"
										variant={
											proposalSituationDFI?.description === `Laudo DFI aprovado`
												? `success`
												: proposalSituationDFI?.description ===
												  `Laudo DFI reprovado`
												? `destructive`
												: `warn`
										}
										className={cn(
											'ml-4',
											proposalSituationDFI?.description === `Laudo DFI aprovado`
												? `text-zinc-600`
												: `text-white`
										)}
									>
										{proposalSituationDFI?.description ?? 'Estado desconhecido'}
									</Badge>
								</h4>
							</div>
						)}
					</div>

					<h5 className="text-xl my-4">Produto: {proposalData.product.name}</h5>

					<div className="flex gap-6 justify-between items-center">
						<div className="mt-4 flex gap-5 text-muted-foreground">
							{proposalData.deadLine && (
								<DetailDataCard
									label="Prazo"
									value={proposalData.deadLine?.description}
								>
									<CalendarIcon />
								</DetailDataCard>
							)}

							{propertyTypeDescription && (
								<DetailDataCard
									label="Tipo Imóvel"
									value={propertyTypeDescription}
								>
									<Building2Icon />
								</DetailDataCard>
							)}

							{proposalData.capitalDFI && (
								<DetailDataCard
									label="Valor DFI"
									value={
										proposalData.capitalDFI &&
										Intl.NumberFormat('pt-BR', {
											style: 'currency',
											currency: 'BRL',
										}).format(proposalData.capitalDFI)
									}
								>
									<DollarSignIcon />
								</DetailDataCard>
							)}

							{proposalData.capitalMIP && (
								<DetailDataCard
									label="Valor da contratação"
									value={
										proposalData.capitalMIP &&
										Intl.NumberFormat('pt-BR', {
											style: 'currency',
											currency: 'BRL',
										}).format(proposalData.capitalMIP)
									}
								>
									<DollarSignIcon />
								</DetailDataCard>
							)}

							{proposalData.deadlineMonths && (
								<DetailDataCard
									label="Prazo"
									value={`${proposalData.deadlineMonths} meses`}
								>
									<CalendarIcon />
								</DetailDataCard>
							)}
						</div>

						<div className="flex flex-col gap-3">
							<Button
								onClick={handleViewArchive}
								disabled={
									proposalSituation?.id === 10 || proposalSituation.id === 3
								}
							>
								Visualizar DPS
							</Button>
							{showCopyLink && (
								<Button
									variant="outline"
									onClick={handleCopyLink}
								>
									<CopyIcon className="mr-2" size={18} />
									Copiar Link
								</Button>
							)}
							{showCancelButton && (
								<Button
									variant="destructive"
									onClick={reportCancelDps}
								>
									<Trash2Icon className="mr-2" size={18} />
									Solicitar Exclusão
								</Button>
							)}
							{showConfirmCancelButton && (
								<Button
									variant="destructive"
									onClick={reportConfirmCancelDps}
								>
									<CheckIcon className="mr-2" size={18} />
									Confirmar Cancelamento
								</Button>
							)}
							{showReanalisys && (
								<Button
									variant={`secondary`}
									onClick={() => reportAnalisys(`REOPEN`)}
								>
									<LucideAlertOctagon className="mr-2" size={18} />
									Reanálise
								</Button>
							)}
							{showAproveAnalisysDps && (
								<div className="flex gap-2 mb-3">
									<Button
										variant="default"
										onClick={() => reportApprovalAnalisys(true, `APPROVE`)}
									>
										<ThumbsUpIcon className="mr-2" size={18} />
										Aprovar
									</Button>
									<Button
										variant="destructive"
										onClick={() => reportApprovalAnalisys(false, `REFUSE`)}
									>
										<ThumbsDownIcon className="mr-2" size={18} />
										Reprovar
									</Button>
								</div>
							)}
							{showReviewDps && (
								<div className="flex gap-2 mb-3">
									<Button
										variant="default"
										onClick={() => reportReviewDps(true, `APPROVE`)}
									>
										<ThumbsUpIcon className="mr-2" size={18} />
										Aprovar
									</Button>
									<Button
										variant="destructive"
										onClick={() => reportReviewDps(false, `REFUSE`)}
									>
										<ThumbsDownIcon className="mr-2" size={18} />
										Reprovar
									</Button>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			<div className="px-5 py-7 w-full max-w-7xl mx-auto bg-white rounded-3xl">
				<div className="mx-5 mt-2">
					<h4 className="text-lg text-primary">Detalhes do Proponente</h4>

					<h5 className="text-xl mt-4 mb-8">
						{proposalData.customer.name}{' '}
						<span className="text-base text-muted-foreground">
							{' '}
							- {proposalData.customer.email}
						</span>
					</h5>

					<div className="mt-4 flex gap-5 text-muted-foreground">
						<DetailDataCard
							label="Nascimento"
							value={new Date(
								proposalData.customer.birthdate
							).toLocaleDateString('pt-BR')}
						>
							<CalendarIcon />
						</DetailDataCard>
						<DetailDataCard
							label="CPF"
							value={formatCpf(proposalData.customer.document)}
						>
							<IdCardIcon />
						</DetailDataCard>
						{proposalData.customer.cellphone && (
							<DetailDataCard
								label="Telefone"
								value={proposalData.customer.cellphone}
							>
								<PhoneIcon />
							</DetailDataCard>
						)}

						{proposalData.customer.gender && (
							<DetailDataCard
								label="Sexo"
								value={
									proposalData.customer.gender === 'M'
										? 'Masculino'
										: 'Feminino'
								}
							>
								<UserRoundIcon />
							</DetailDataCard>
						)}
					</div>
				</div>

				{proposalData.addressZipcode && <AddressProposal data={proposalData} />}
			</div>

			{showFillOutAlert && (
				<div className="px-3 py-2 flex flex-row justify-between items-center gap-5 w-full max-w-7xl mx-auto bg-orange-300/40 border border-orange-300/80 rounded-xl">
					<div>
						<h4 className="text-base font-semibold text-orange-600">
							Ações pendentes
						</h4>
						<ul className="ml-5 text-base text-orange-400 list-disc">
							{proposalSituation.id === 5 || proposalSituation.id === 10 ? (
								<li>{statusDescriptionDict[proposalSituation.id]}</li>
							) : null}
							{proposalData.uploadMIP ? (
								<li>{'Upload de laudos/complementos MIP.'}</li>
							) : null}
							{proposalData.uploadDFI ? (
								<li>{'Upload de laudos DFI.'}</li>
							) : null}
							{proposalSituation.id === 25 ? (
								<li>
									Exame de Sangue¹ + Exame de Urina I + Teste Ergométrico +
									Ecocardiograma + ECG
								</li>
							) : null}
							{proposalSituation.id === 26 ? (
								<>
									<li>
										Exame de Sangue¹ + Exame de Urina I + Teste Ergométrico +
										Ecocardiograma + ECG + USG Abdome (Superior) Total e
										próstata
									</li>
									<li>Para Homens acima de 50 anos: Todos acima + PSA</li>
									<li>
										Para Mulheres acima de 50 anos: Todos acima + CA 19-9 + CA
										125 + Papanicolau + US mama
									</li>
								</>
							) : null}
						</ul>
					</div>
					{showCopyLink && (
						<Button
							className="bg-orange-600 hover:bg-orange-500 hover:text-white"
							asChild
						>
							<Link href={`/dps/fill-out/form/${uid}`}>Preencher</Link>
						</Button>
					)}
				</div>
			)}

			{showMipAlertMinToMedic && (
				<div className="px-3 py-2 flex flex-row justify-between items-center gap-5 w-full max-w-7xl mx-auto bg-orange-300/40 border border-orange-300/80 rounded-xl">
					<div>
						<h4 className="text-base font-semibold text-orange-600">
							Ações pendentes
						</h4>
						<ul className="ml-5 text-base text-orange-400 list-disc">
							<li>
								Exame de Sangue¹ + Exame de Urina I + Teste Ergométrico +
								Ecocardiograma + ECG
							</li>
						</ul>
					</div>
				</div>
			)}

			{showMipAlertCompleteToMedic && (
				<div className="px-3 py-2 flex flex-row justify-between items-center gap-5 w-full max-w-7xl mx-auto bg-orange-300/40 border border-orange-300/80 rounded-xl">
					<div>
						<h4 className="text-base font-semibold text-orange-600">
							Ações pendentes
						</h4>
						<ul className="ml-5 text-base text-orange-400 list-disc">
							<li>
								Exame de Sangue¹ + Exame de Urina I + Teste Ergométrico +
								Ecocardiograma + ECG + USG Abdome (Superior) Total e próstata
							</li>
							<li>Para Homens acima de 50 anos: Todos acima + PSA</li>
							<li>
								Para Mulheres acima de 50 anos: Todos acima + CA 19-9 + CA 125 +
								Papanicolau + US mama
							</li>
						</ul>
					</div>
				</div>
			)}

			{showDfiAlertToSubscriber && (
				<div className="px-3 py-2 flex flex-row justify-between items-center gap-5 w-full max-w-7xl mx-auto bg-orange-300/40 border border-orange-300/80 rounded-xl">
					<div>
						<h4 className="text-base font-semibold text-orange-600">
							Ações pendentes
						</h4>
						<ul className="ml-5 text-base text-orange-400 list-disc">
							<li>Necessário validar o laudo DFI inserido.</li>
						</ul>
					</div>
				</div>
			)}

			{(role === `vendedor` ||
				role === `subscritor-med` ||
				role === `admin` ||
				role === `subscritor-sup` ||
				role === `vendedor-sup`) && (
				<MedReports
					token={token}
					uid={uid}
					userRole={role}
					requireUpload={proposalData.uploadMIP}
					dpsStatus={proposalData.status?.id}
					onConfirm={refetchProposalData}
				/>
			)}

			{(role === `vendedor` ||
				role === `subscritor` ||
				role === `admin` ||
				role === `subscritor-sup` ||
				role === `vendedor-sup`) && (
				<DfiReports
					token={token}
					uid={uid}
					userRole={role}
					requireUpload={proposalData.uploadDFI || proposalSituation?.id === 10}
					dfiStatus={proposalData.dfiStatus?.id}
					onConfirm={refetchProposalData}
				/>
			)}

			<Interactions
				token={token}
				uid={uid}
				proposalSituationId={
					lastSituation === 4 && (role === 'SUBSCRITOR' || role === 'ADMIN')
						? lastSituation
						: lastSituation === 5 &&
						  (role === 'SUBSCRITOR-MED' || role === 'ADMIN')
						? lastSituation
						: undefined
				}
				data={proposalData.history ?? []}
				onNewInteraction={refetchProposalData}
			/>

			{participants && participants.length > 1 && (
				<div className="px-5 py-7 w-full max-w-7xl mx-auto bg-white rounded-3xl">
					<Accordion type="single" collapsible>
						<AccordionItem value="item-1" className="border-none">
							<AccordionTrigger className="flex items-center">
								<h4 className="basis-1 grow text-lg text-primary text-left">Participações</h4>
							</AccordionTrigger>
							<AccordionContent>
								{participants.map((participant, index) => (
									<div 
										key={participant.uid} 
										className={`py-4 ${index < participants.length - 1 ? 'border-b border-gray-200' : ''}`}
									>
										<div className="flex justify-between items-center">
											<div className="flex flex-col">
												<span className="text-gray-600 mb-1">
													Coparticipação: {participant.percentageParticipation}%
												</span>
												<span className="text-lg font-medium">
													{participant.customer.name}
												</span>
												<span className="text-gray-600">
													Valor: {Intl.NumberFormat('pt-BR', {
														style: 'currency',
														currency: 'BRL',
													}).format(participant.financingParticipation || 0)}
												</span>
											</div>
											<div className="flex items-center">
												{participant.uid !== uid ? (
													<>
														<Button variant="ghost" className="mr-2" asChild>
															<Link href={`/dps/details/${participant.uid}`}>
																<div className="flex items-center">
																	<SquareArrowUpRightIcon className="mr-2" size={16} />
																	Ir Detalhe
																</div>
															</Link>
														</Button>
														<Button 
															variant="ghost" 
															onClick={() => handleCopyParticipantLink(participant.uid)}
														>
															<div className="flex items-center">
																<CopyIcon className="mr-2" size={16} />
																Copiar link
															</div>
														</Button>
													</>
												) : (
													<span className="text-gray-400 italic">Detalhes atuais</span>
												)}
											</div>
										</div>
									</div>
								))}
							</AccordionContent>
						</AccordionItem>
					</Accordion>
				</div>
			)}

			<DialogShowArchive
				isModalOpen={isModalOpen}
				setIsModalOpen={setIsModalOpen}
				pdfUrl={pdfUrl}
			/>

			<DialogReanalisys
				open={alertDialog.open}
				onOpenChange={() => {
					if (alertDialog.hideCancel) {
						router.push('/dashboard')
					} else {
						setAlertDialog({ open: false })
					}
				}}
				title={alertDialog.title ?? ''}
				onConfirm={alertDialog.onConfirm}
				confirmText={alertDialog.confirmText ?? 'Continuar'}
				hideCancel={alertDialog.hideCancel}
			>
				{alertDialog.body}
			</DialogReanalisys>
		</div>
	)
}

export default DetailsPresent

export function DetailDataCard({
	children,
	label,
	value,
}: {
	children: React.ReactNode
	label: React.ReactNode
	value: React.ReactNode
}) {
	return (
		<DataCard className="flex items-center gap-2">
			<div className="text-green-950">{children}</div>
			<div>
				<p className="text-xs text-primary">{label}</p>
				<p className="text-sm text-green-950">{value}</p>
			</div>
		</DataCard>
	)
}
