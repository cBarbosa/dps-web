'use client'

import { Button } from '@/components/ui/button'
import {
	calculateAge,
	cn,
	getProfissionDescription,
	RecursivePartial,
	maskToBrlCurrency
} from '@/lib/utils'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { useSession } from 'next-auth/react'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { InferInput, object, pipe, string, nonEmpty, optional } from 'valibot'
import { getProponentDataByCpf, postProposal, getAddressByZipcode, getParticipantsByOperation } from '../../actions'
import { useRouter, useSearchParams } from 'next/navigation'
import DpsProfileForm, {
	DpsProfileFormType,
	dpsProfileForm,
} from './dps-profile-form'
import DpsProductForm, {
	convertCapitalValue,
	dpsProductForm,
	DpsProductFormType,
} from './dps-product-form'
import { Loader2Icon } from 'lucide-react'
import DpsAddressForm, {
	dpsAddressForm,
	DpsAddressFormType,
} from './dps-address-form'
import validarCpf from 'validar-cpf'
import DpsOperationForm, { dpsOperationForm } from './dps-operation-form'
import { 
	Dialog, 
	DialogContent, 
	DialogDescription, 
	DialogHeader, 
	DialogTitle, 
	DialogTrigger,
	DialogClose,
	DialogFooter,
} from '@/components/ui/dialog'
import { CheckCircle, XCircle, PencilIcon, TrashIcon } from 'lucide-react'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip'

// Simple toast implementation
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
	return (
		<div 
			className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg flex items-center space-x-2 z-50 ${
				type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
			}`}
		>
			{type === 'success' ? (
				<CheckCircle className="h-5 w-5" />
			) : (
				<XCircle className="h-5 w-5" />
			)}
			<span>{message}</span>
			<button 
				onClick={onClose} 
				className="ml-2" 
				title="Fechar" 
				aria-label="Fechar mensagem"
			>
				<XCircle className="h-4 w-4" />
			</button>
		</div>
	);
};

// Toast context
const useToast = () => {
	const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: 'success' | 'error' }>>([]);

	const removeToast = (id: number) => {
		setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
	};

	const addToast = (message: string, type: 'success' | 'error') => {
		const id = Date.now();
		setToasts((prevToasts) => [...prevToasts, { id, message, type }]);
		
		// Auto remove after 5 seconds
		setTimeout(() => {
			removeToast(id);
		}, type === 'success' ? 3000 : 5000);
		
		return id;
	};

	const success = (message: string) => {
		console.log('SUCCESS:', message);
		return addToast(message, 'success');
	};

	const error = (message: string) => {
		console.error('ERROR:', message);
		return addToast(message, 'error');
	};

	const ToastContainer = () => (
		<div className="toast-container">
			{toasts.map((toast) => (
				<Toast 
					key={toast.id} 
					message={toast.message} 
					type={toast.type} 
					onClose={() => removeToast(toast.id)} 
				/>
			))}
		</div>
	);

	return { success, error, ToastContainer };
};

export const dpsInitialForm = object({
	operation: dpsOperationForm,
	profile: dpsProfileForm,
	product: dpsProductForm,
	address: dpsAddressForm,
})

// Form for co-participant without product data
export const dpsCoparticipantForm = object({
	operation: dpsOperationForm,
	profile: dpsProfileForm,
	address: dpsAddressForm,
})

export type DpsInitialForm = InferInput<typeof dpsInitialForm>
export type DpsCoparticipantForm = InferInput<typeof dpsCoparticipantForm>

// Type for coparticipant list item
type Coparticipant = {
	id: string;
	name: string;
	cpf: string;
	participationPercentage: string;
	profile: Partial<DpsProfileFormType>;
	address: Partial<DpsAddressFormType>;
}

const DpsInitialForm = ({
	data,
	prazosOptions: prazosOptionsProp,
	productOptions,
	tipoImovelOptions,
}: {
	data?: RecursivePartial<DpsInitialForm>
	prazosOptions: {
		value: string
		label: string
	}[]
	productOptions: {
		value: string
		label: string
	}[]
	tipoImovelOptions: {
		value: string
		label: string
	}[]
}) => {
	const session = useSession()
	const token = (session.data as any)?.accessToken
	const toast = useToast();
	const router = useRouter()
	const searchParams = useSearchParams()
	const cpfParam = searchParams.get('cpf')

	// Função auxiliar para extrair apenas dígitos de um string
	const getDigits = (value: string) => {
		return value.replace(/[^0-9]/g, '')
	}

	const [isLoading, setIsLoading] = useState(false)
	const [isLoadingData, setIsLoadingData] = useState(false)
	const [isLoadingOperationData, setIsLoadingOperationData] = useState(false)
	const [isLoadingCoparticipant, setIsLoadingCoparticipant] = useState(false)
	const [fetchingCpfDataCoparticipant, setFetchingCpfDataCoparticipant] = useState(false)
	const [operationDataLoaded, setOperationDataLoaded] = useState(false)
		const [showOtherSections, setShowOtherSections] = useState(false) // Controla a visibilidade das demais seções

	const [prazosOptions, setPrazosOptions] = useState<
		{ value: string; label: string }[]
	>([])
	
	const [participantsNumber, setParticipantsNumber] = useState<string>('')
	const [totalValue, setTotalValue] = useState<string>('')
	const [participationPercentage, setParticipationPercentage] = useState<string>('')
	const [participationValue, setParticipationValue] = useState<string>('')
	const [coparticipantParticipationValue, setCoparticipantParticipationValue] = useState<string>('')
	const [coparticipantSuggestedPercentage, setCoparticipantSuggestedPercentage] = useState<string>('')
	const [isCoparticipantDialogOpen, setIsCoparticipantDialogOpen] = useState(false)
	const [coparticipants, setCoparticipants] = useState<Coparticipant[]>([])
	const [editingCoparticipantId, setEditingCoparticipantId] = useState<string | null>(null)

	// Adicionar estado para o diálogo de confirmação
	const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

	// Adicionar estado para controlar submissão pendente
	const [isSubmitPending, setIsSubmitPending] = useState(false);
	const [pendingSubmitData, setPendingSubmitData] = useState<DpsInitialForm | null>(null);

	// Adicionar estado para controlar se o produto deve estar desabilitado
	const [isProductDisabled, setIsProductDisabled] = useState(false);

	// Adicionar um estado para rastrear o último número de operação consultado
	const [lastQueriedOperation, setLastQueriedOperation] = useState<string>('');

	// Adicionar este novo estado junto com os outros estados
	const [existingMainProponent, setExistingMainProponent] = useState<{
		name: string;
		cpf: string;
		participationPercentage: string;
		financingParticipation: number;
	} | null>(null);

	// Adicionar estados para armazenar o último CPF consultado
	const [lastQueriedCpf, setLastQueriedCpf] = useState<string>('');
	const [lastQueriedCoparticipantCpf, setLastQueriedCoparticipantCpf] = useState<string>('');

	const {
		handleSubmit,
		getValues,
		trigger,
		setValue,
		watch,
		control,
		reset,
		formState: { isSubmitting, isSubmitted, errors, ...formStateRest },
	} = useForm<DpsInitialForm>({
		resolver: valibotResolver(dpsInitialForm),
		defaultValues: {
			operation: {
				operationNumber: '',
				participantsNumber: '',
				totalValue: '',
				// Adicionar valores iniciais para os novos campos
				isParticipantsNumberReadOnly: undefined,
				isTotalValueReadOnly: undefined
			},
			profile: {
				cpf: data?.profile?.cpf ?? '',
				name: data?.profile?.name ?? '',
				birthdate: data?.profile?.birthdate as Date,
				profession: data?.profile?.profession ?? '',
				email: data?.profile?.email ?? '',
				phone: data?.profile?.phone ?? '',
				socialName: data?.profile?.socialName ?? '',
				gender: data?.profile?.gender ?? '',
				participationPercentage: '',
			},
			product: {
				product: '',
				deadline: '',
				mip: '',
				dfi: '',
				propertyType: '',
			},
			address: {
				zipcode: '',
				street: '',
				number: '',
				complement: '',
				district: '',
				city: '',
				state: '',
			}
		},
		disabled: isLoading || isLoadingData,
		mode: "onBlur",
		reValidateMode: "onBlur",
	})
	

	const [autocompletedByCpf, setAutocompletedByCpf] = useState<
		Partial<Record<keyof typeof dpsProfileForm.entries, boolean>>
	>({})

	const formState = { ...formStateRest, errors, isSubmitting, isSubmitted }

	// Remove automatic calculation for participation percentage and value
	useEffect(() => {
		if (participantsNumber && totalValue) {
			// No longer automatically calculate participation percentage here
			// Only calculate default values if no participants have been added yet
			if (coparticipants.length === 0) {
				setParticipationPercentage('')
				setParticipationValue('')
			}
		} else {
			setParticipationPercentage('')
			setParticipationValue('')
		}
	}, [participantsNumber, totalValue, coparticipants.length])
	
	// Watchs para calcular a idade com base na data de nascimento
	const watchBirthdate = watch('profile.birthdate')

	useEffect(() => {
		const age = calculateAge(watchBirthdate)

		if(isProductDisabled) return;

		if (age === null) return

		switch (true) {
			case age < 18:
				setPrazosOptions([])
				break
			case age <= 50:
				setPrazosOptions(prazosOptionsProp)
				break
			case age <= 55:
				setPrazosOptions(
					prazosOptionsProp.filter(prazo => +getDigits(prazo.label) <= 180)
				)
				break
			case age <= 60:
				setPrazosOptions(
					prazosOptionsProp.filter(prazo => +getDigits(prazo.label) <= 150)
				)
				break
			case age <= 65:
				setPrazosOptions(
					prazosOptionsProp.filter(prazo => +getDigits(prazo.label) <= 84)
				)
				break
			case age <= 80:
				setPrazosOptions(
					prazosOptionsProp.filter(prazo => +getDigits(prazo.label) <= 60)
				)
				break
			default:
				setPrazosOptions([])
				break
		}
	}, [watchBirthdate, prazosOptionsProp])

	// Confirmação para continuar com menos participantes
	const handleConfirmSubmit = () => {
		setIsConfirmDialogOpen(false);
		if (pendingSubmitData) {
			submitForm(pendingSubmitData);
			setPendingSubmitData(null);
		}
		setIsSubmitPending(false);
	};

	// Cancelar a submissão
	const handleCancelSubmit = () => {
		setIsConfirmDialogOpen(false);
		setPendingSubmitData(null);
		setIsSubmitPending(false);
		setIsLoading(false);
	};

	// Função separada para o envio efetivo dos dados
	const submitForm = async (v: DpsInitialForm) => {
		console.log("submitForm called with data:", v);
		setIsLoading(true);

		try {
			// Extrair valores necessários para a participação
			const totalValue = convertCapitalValue(v.operation.totalValue) ?? 0;
			const totalParticipants = parseInt(v.operation.participantsNumber, 10) || 0;

			// Verificar se já existe um proponente principal a partir da consulta
			if (existingMainProponent) {
				// CONTINUAÇÃO DE PREENCHIMENTO - deve cadastrar como coparticipante (tipo "C")
				
				// Array para armazenar todas as propostas de coparticipantes criadas
				const createdProposals = [];
				const allProposalsSaved = true;
				const lastError = '';

				// No caso de continuação de preenchimento, não processar coparticipantes adicionais
				// Os coparticipantes só são processados em novo preenchimento
				// Comentado o código abaixo para atender ao requisito:
				/*
				// Enviar cada coparticipante como uma proposta separada
				if (coparticipants.length > 0) {
					for (const cp of coparticipants) {
						try {
							// Calcular o valor de participação do coparticipante
							const cpPercentage = parseFloat(cp.participationPercentage.replace('%', '').replace(',', '.')) || 0;
							const cpFinancingParticipation = (totalValue * cpPercentage) / 100;
							
							// Dados do coparticipante
							const coparticipantData = {
								document: cp.cpf,
								name: cp.profile.name || cp.name,
								socialName: cp.profile.socialName ?? '',
								gender: cp.profile.gender || '',
								cellphone: cp.profile.phone || '',
								email: cp.profile.email || '',
								birthDate: cp.profile.birthdate ? new Date(cp.profile.birthdate).toISOString() : new Date().toISOString(),
								profession: cp.profile.profession ?? '',
								address: {
									zipcode: cp.address.zipcode || '',
									street: cp.address.street || '',
									number: cp.address.number || '',
									complement: cp.address.complement || '',
									district: cp.address.district || '',
									city: cp.address.city || '',
									state: cp.address.state || ''
								},
								productId: v.product.product,
								deadlineId: Number(v.product.deadline),
								propertyTypeId: Number(v.product.propertyType),
								capitalMip: convertCapitalValue(v.product.mip) ?? 0,
								capitalDfi: convertCapitalValue(v.product.dfi) ?? 0,
								contractNumber: v.operation.operationNumber,
								participantsNumber: v.operation.participantsNumber,
								totalValue: totalValue,
								// Campos para tratamento do coparticipante
								totalParticipants: totalParticipants,
								operationValue: totalValue,
								percentageParticipation: cpPercentage,
								financingParticipation: cpFinancingParticipation,
								participantType: 'C', // Sempre "C" para coparticipante em continuação
								typeId: 2, // Mesmo tipo do proponente principal
							};
							
							console.log('Enviando dados do coparticipante para API:', coparticipantData);
							const cpResponse = await postProposal(token, coparticipantData);
							
							if (!cpResponse || !cpResponse.success) {
								console.error(`Erro ao salvar coparticipante ${cp.name}:`, cpResponse?.message || 'Erro desconhecido');
								lastError = `Erro ao salvar coparticipante ${cp.name}: ${cpResponse?.message || 'Erro desconhecido'}`;
								allProposalsSaved = false;
							} else {
								// Adicionar ID da proposta de coparticipante criada
								createdProposals.push(cpResponse.data);
							}
						} catch (cpError) {
							console.error(`Erro ao processar coparticipante ${cp.name}:`, cpError);
							lastError = `Erro ao processar coparticipante ${cp.name}`;
							allProposalsSaved = false;
						}
					}
				}
				*/

				// Agora vamos criar o novo participante (tipo "C")
				try {
					// Calcular percentual e valor do novo coparticipante
					const newCoParticipantPercentage = parseFloat(v.profile.participationPercentage?.replace('%', '').replace(',', '.') || '0');
					const newCoParticipantFinancingParticipation = (totalValue * newCoParticipantPercentage) / 100;

					// Dados do novo coparticipante
					const newCoParticipantData = {
						document: data?.profile?.cpf ?? v.profile.cpf,
						name: v.profile.name,
						socialName: v.profile.socialName ?? '',
						gender: v.profile.gender,
						cellphone: v.profile.phone,
						email: v.profile.email,
						contractNumber: v.operation.operationNumber,
						birthDate: v.profile.birthdate.toISOString(),
						productId: v.product.product,
						profession: v.profile.profession ?? '',
						typeId: 2,
						deadlineId: Number(v.product.deadline),
						propertyTypeId: Number(v.product.propertyType),
						capitalMip: convertCapitalValue(v.product.mip) ?? 0,
						capitalDfi: convertCapitalValue(v.product.dfi) ?? 0,
						address: {
							zipcode: v.address.zipcode || '',
							street: v.address.street || '',
							number: v.address.number || '',
							complement: v.address.complement || '',
							district: v.address.district || '',
							city: v.address.city || '',
							state: v.address.state || ''
						},
						participantsNumber: v.operation.participantsNumber,
						totalValue: totalValue,
						// Campos para tratamento do participante
						totalParticipants: totalParticipants,
						operationValue: totalValue,
						percentageParticipation: newCoParticipantPercentage,
						financingParticipation: newCoParticipantFinancingParticipation,
						participantType: 'C', // Sempre "C" para continuação de preenchimento
					};

					console.log('Enviando dados do novo coparticipante para API:', newCoParticipantData);
					const newCoParticipantResponse = await postProposal(token, newCoParticipantData);

					if (!newCoParticipantResponse || !newCoParticipantResponse.success) {
						console.error(newCoParticipantResponse?.message || 'Erro ao salvar o novo coparticipante');
						toast.error('Erro ao salvar novo coparticipante: ' + (newCoParticipantResponse?.message || 'Erro desconhecido'));
						setIsLoading(false);
						return;
					}

					// ID da proposta do novo coparticipante
					const newCoParticipantId = newCoParticipantResponse.data;
					createdProposals.push(newCoParticipantId);
					
					// Reset do formulário e feedback
					reset();
					setCoparticipants([]);
					setExistingMainProponent(null);
					// Limpar o último CPF consultado para permitir novas consultas
					setLastQueriedCpf('');
					
					if (allProposalsSaved) {
						toast.success('Novo coparticipante e coparticipantes extras salvos com sucesso!');
						// Redirecionar para a tela de propostas
						router.push('/dps/details/' + newCoParticipantId);
					} else {
						toast.error(`Novo coparticipante salvo, mas alguns coparticipantes extras não foram salvos. Último erro: ${lastError}`);
						router.push('/dps/details/' + newCoParticipantId);
					}
				} catch (error) {
					console.error('Erro ao processar novo coparticipante:', error);
					toast.error('Erro ao processar o cadastro do novo coparticipante. Verifique os dados e tente novamente.');
					setIsLoading(false);
				}
			} else {
				// NOVO PREENCHIMENTO - deve cadastrar como proponente principal (tipo "P")
				
				// Calcular percentual do proponente principal
				const mainPercentage = parseFloat(v.profile.participationPercentage?.replace('%', '').replace(',', '.') || '0');
				const mainFinancingParticipation = (totalValue * mainPercentage) / 100;

				// Dados do proponente principal
				const mainProponentData = {
					document: data?.profile?.cpf ?? v.profile.cpf,
					name: v.profile.name,
					socialName: v.profile.socialName ?? '',
					gender: v.profile.gender,
					cellphone: v.profile.phone,
					email: v.profile.email,
					contractNumber: v.operation.operationNumber,
					birthDate: v.profile.birthdate.toISOString(),
					productId: v.product.product,
					profession: v.profile.profession ?? '',
					typeId: 2,
					deadlineId: Number(v.product.deadline),
					propertyTypeId: Number(v.product.propertyType),
					capitalMip: convertCapitalValue(v.product.mip) ?? 0,
					capitalDfi: convertCapitalValue(v.product.dfi) ?? 0,
					address: {
						zipcode: v.address.zipcode || '',
						street: v.address.street || '',
						number: v.address.number || '',
						complement: v.address.complement || '',
						district: v.address.district || '',
						city: v.address.city || '',
						state: v.address.state || ''
					},
					participantsNumber: v.operation.participantsNumber,
					totalValue: totalValue,
					// Campos para tratamento do proponente principal
					totalParticipants: totalParticipants,
					operationValue: totalValue,
					percentageParticipation: mainPercentage,
					financingParticipation: mainFinancingParticipation,
					participantType: 'P', // Sempre "P" para novo preenchimento
				};

				console.log('Enviando dados do proponente principal para API:', mainProponentData);
				const mainResponse = await postProposal(token, mainProponentData);

				if (!mainResponse || !mainResponse.success) {
					console.error(mainResponse?.message || 'Erro ao salvar o proponente principal');
					toast.error('Erro ao salvar proponente principal: ' + (mainResponse?.message || 'Erro desconhecido'));
					setIsLoading(false);
					return;
				}

				// ID da proposta principal criada
				const mainProposalId = mainResponse.data;
				let allProposalsSaved = true;
				let lastError = '';

				// Array para armazenar todas as propostas criadas (principal + coparticipantes)
				const createdProposals = [mainProposalId];

				// Enviar cada coparticipante como uma proposta separada
				if (coparticipants.length > 0) {
					for (const cp of coparticipants) {
						try {
							// Calcular o valor de participação do coparticipante
							const cpPercentage = parseFloat(cp.participationPercentage.replace('%', '').replace(',', '.')) || 0;
							const cpFinancingParticipation = (totalValue * cpPercentage) / 100;
							
							// Dados do coparticipante
							const coparticipantData = {
								document: cp.cpf,
								name: cp.profile.name || cp.name,
								socialName: cp.profile.socialName ?? '',
								gender: cp.profile.gender || '',
								cellphone: cp.profile.phone || '',
								email: cp.profile.email || '',
								birthDate: cp.profile.birthdate ? new Date(cp.profile.birthdate).toISOString() : new Date().toISOString(),
								profession: cp.profile.profession ?? '',
								address: {
									zipcode: cp.address.zipcode || '',
									street: cp.address.street || '',
									number: cp.address.number || '',
									complement: cp.address.complement || '',
									district: cp.address.district || '',
									city: cp.address.city || '',
									state: cp.address.state || ''
								},
								productId: v.product.product,
								deadlineId: Number(v.product.deadline),
								propertyTypeId: Number(v.product.propertyType),
								capitalMip: convertCapitalValue(v.product.mip) ?? 0,
								capitalDfi: convertCapitalValue(v.product.dfi) ?? 0,
								contractNumber: v.operation.operationNumber,
								participantsNumber: v.operation.participantsNumber,
								totalValue: totalValue,
								// Campos para tratamento do coparticipante
								totalParticipants: totalParticipants,
								operationValue: totalValue,
								percentageParticipation: cpPercentage,
								financingParticipation: cpFinancingParticipation,
								participantType: 'C', // Sempre "C" para coparticipantes adicionais
								typeId: 2, // Mesmo tipo do proponente principal
							};
							
							console.log('Enviando dados do coparticipante para API:', coparticipantData);
							const cpResponse = await postProposal(token, coparticipantData);
							
							if (!cpResponse || !cpResponse.success) {
								console.error(`Erro ao salvar coparticipante ${cp.name}:`, cpResponse?.message || 'Erro desconhecido');
								lastError = `Erro ao salvar coparticipante ${cp.name}: ${cpResponse?.message || 'Erro desconhecido'}`;
								allProposalsSaved = false;
							} else {
								// Adicionar ID da proposta de coparticipante criada
								createdProposals.push(cpResponse.data);
							}
						} catch (cpError) {
							console.error(`Erro ao processar coparticipante ${cp.name}:`, cpError);
							lastError = `Erro ao processar coparticipante ${cp.name}`;
							allProposalsSaved = false;
						}
					}
				}

				// Reset do formulário e feedback
				reset();
				setCoparticipants([]);
				setExistingMainProponent(null);
				// Limpar o último CPF consultado para permitir novas consultas
				setLastQueriedCpf('');
				
				if (allProposalsSaved) {
					toast.success('Proposta e coparticipantes salvos com sucesso!');
					// Redirecionar para a primeira proposta criada (proponente principal)
					router.push('/dps/details/' + mainProposalId);
				} else {
					// Mesmo com erros em alguns coparticipantes, redireciona para a proposta principal
					toast.error(`Proposta principal salva, mas alguns coparticipantes não foram salvos. Último erro: ${lastError}`);
					router.push('/dps/details/' + mainProposalId);
				}
			}
		} catch (error) {
			console.error('Erro ao processar submissão:', error);
			toast.error('Erro ao processar a submissão. Verifique os dados e tente novamente.');
			setIsLoading(false);
		}
	};

	async function onSubmit(v: DpsInitialForm) {
		console.log("Form submitted with values:", v);
		console.log("Current isSubmitting state:", isSubmitting);
		console.log("Current isLoading state:", isLoading);
		console.log("Operation fields complete:", !!(
			v.operation.operationNumber && 
			v.operation.participantsNumber && 
			v.operation.totalValue
		));
		
		// Verificar se o número de participantes não excede o informado
		const declaredParticipants = parseInt(v.operation.participantsNumber, 10) || 0;
		
		// Se já existe um proponente principal, contamos apenas os coparticipantes
		let actualParticipants;
		if (existingMainProponent) {
			// Contamos apenas os coparticipantes (não adicionamos +1 para o proponente principal)
			actualParticipants = coparticipants.length;
		} else {
			// Caso normal: contamos o proponente principal (1) + coparticipantes
			actualParticipants = 1 + coparticipants.length;
		}
		
		console.log("Declared participants:", declaredParticipants);
		console.log("Actual participants:", actualParticipants);
		
		if (actualParticipants > declaredParticipants) {
			console.log("Error: Too many participants");
			toast.error(`Não é possível salvar. O número de participantes (${actualParticipants}${existingMainProponent ? ' + 1 proponente principal existente' : ''}) excede o informado em Dados da Operação (${declaredParticipants}). Ajuste o número de participantes ou remova coparticipantes.`);
			return;
		}
		
		// CORREÇÃO: A fórmula estava incorreta, usamos uma forma mais clara
		// Quantos coparticipantes esperamos, com base no número total de participantes declarados
		const expectedCoparticipants = declaredParticipants - 1; // -1 sempre para o proponente principal (existente ou novo)
		console.log("Expected coparticipants:", expectedCoparticipants);
		console.log("Current coparticipants:", coparticipants.length);
		
		// Calcular o número total após submissão (participantes atuais + o que está sendo cadastrado)
		let totalAfterSubmission;
		if (existingMainProponent) {
			// Com proponente principal existente: proponente (1) + coparticipantes já cadastrados + o novo
			totalAfterSubmission = 1 + coparticipants.length + 1;
		} else {
			// Sem proponente principal existente: o novo proponente (1) + coparticipantes cadastrados
			totalAfterSubmission = 1 + coparticipants.length;
		}

		// Verificar se temos menos coparticipantes do que o esperado
		if (declaredParticipants > 1 && coparticipants.length < expectedCoparticipants && declaredParticipants !== totalAfterSubmission) {
			console.log("Warning: Not enough coparticipants, showing confirm dialog");
			// Armazenar os dados do formulário para uso posterior após confirmação
			setPendingSubmitData(v);
			setIsSubmitPending(true);
			// Abrir o diálogo de confirmação em vez de usar window.alert
			setIsConfirmDialogOpen(true);
			return;
		}
		
		console.log("Proceeding with form submission");
		// Se não precisar de confirmação ou após confirmação, continuar com o envio
		await submitForm(v);
	}

	// Adicionar um manipulador direto para o botão de submissão
	const handleFormSubmitClick = async () => {
		console.log("Manual form submission triggered");
		
		// Validar o formulário completo antes de submeter
		const isOperationValid = await trigger("operation");
		const isProfileValid = await trigger("profile");
		const isProductValid = await trigger("product");
		const isAddressValid = await trigger("address");
		
		console.log("Validation results:");
		console.log("- Operation section:", isOperationValid);
		console.log("- Profile section:", isProfileValid);
		console.log("- Product section:", isProductValid);
		console.log("- Address section:", isAddressValid);
		
		// Verificar se todas as seções estão válidas
		if (isOperationValid && isProfileValid && isProductValid && isAddressValid) {
			console.log("All form sections are valid, submitting form");
			const formData = getValues();
			onSubmit(formData);
		} else {
			console.log("Form validation failed");
			
			// Função para rolar para um elemento específico com suavidade
			const scrollToElement = (selector: string) => {
				const element = document.querySelector(selector);
				if (element) {
					element.scrollIntoView({ behavior: 'smooth', block: 'start' });
				}
			};
			
			// Identificar a primeira seção com erro e rolar até ela
			if (!isOperationValid) {
				toast.error("Preencha corretamente todos os campos da seção Dados da Operação");
				scrollToElement('.dps-operation-section');
			} else if (!isProfileValid) {
				toast.error("Preencha corretamente todos os campos da seção Dados do Proponente");
				scrollToElement('.dps-profile-section');
			} else if (!isProductValid) {
				toast.error("Preencha corretamente todos os campos da seção Dados do Produto");
				scrollToElement('.dps-product-section');
			} else if (!isAddressValid) {
				toast.error("Preencha corretamente todos os campos da seção Dados de Endereço");
				scrollToElement('.dps-address-section');
			}
		}
	}
	
	async function getDataByCpfForCoparticipant(cpf: string) {
		// Limpar o CPF para comparação
		const cleanCpf = cpf.replace(/\D/g, '');
		
		// Verificar se é um CPF válido
		if (!validarCpf(cpf)) return;
		
		// Verificar se é o mesmo CPF já consultado anteriormente
		if (cleanCpf === lastQueriedCoparticipantCpf) {
			console.log(`CPF ${cleanCpf} já foi consultado anteriormente para coparticipante. Ignorando consulta duplicada.`);
			return;
		}
		
		setIsLoadingCoparticipant(true);
		
		// Armazenar o CPF como o último consultado
		setLastQueriedCoparticipantCpf(cleanCpf);
		
		const proponentDataRaw = await getProponentDataByCpf(cpf);
		
		setIsLoadingCoparticipant(false);
	}

	async function getDataByCpf(cpf: string) {
		// Limpar o CPF para comparação
		const cleanCpf = cpf.replace(/\D/g, '');
		
		// Verificar se é um CPF válido
		if (!validarCpf(cpf)) return;

		// Verificar se é o mesmo CPF já consultado anteriormente
		if (cleanCpf === lastQueriedCpf) {
			console.log(`CPF ${cleanCpf} já foi consultado anteriormente. Ignorando consulta duplicada.`);
			return;
		}

		console.log('coparticipants', coparticipants)
		console.log('cleanCpf', coparticipants.find(c => c.cpf === cleanCpf))

		const mainProponent = existingMainProponent;

		if(coparticipants.find(c => c.cpf === cleanCpf) || mainProponent?.cpf === cleanCpf) {
			console.log(`CPF ${cleanCpf} já foi consultado anteriormente para coparticipante. Ignorando consulta duplicada.`);
			toast.error(`CPF ${cleanCpf} já consta na lista de participantes, não é possível cadastrar novamente.`);
			setAutocompletedByCpf({});
			return;
		}
		
		setAutocompletedByCpf({});
		setIsLoadingData(true);
		
		// Armazenar o CPF como o último consultado
		setLastQueriedCpf(cleanCpf);
		
		const proponentDataRaw = await getProponentDataByCpf(cpf);

		if (proponentDataRaw) {
			const proponentDataBirthdateAux = proponentDataRaw?.detalhes.nascimento
					? proponentDataRaw?.detalhes.nascimento.split('/')
					: undefined;

			const proponentDataBirthdate = proponentDataBirthdateAux
					? new Date(
							Number(proponentDataBirthdateAux[2]),
							Number(proponentDataBirthdateAux[1]) - 1,
							Number(proponentDataBirthdateAux[0])
					  )
					: undefined;

			const autocompleteData = {
				cpf: proponentDataRaw?.detalhes.cpf,
				name: proponentDataRaw?.detalhes.nome,
				socialName: undefined,
				birthdate: proponentDataBirthdate,
				profession: proponentDataRaw?.detalhes.profissao,
				gender: proponentDataRaw?.detalhes.sexo,
				email: undefined,
				phone: undefined,
			};
			
			if (autocompleteData.name) {
				setValue('profile.name', autocompleteData.name)
				setAutocompletedByCpf(prev => ({
					...prev,
					name: true,
				}))
			}
			if (autocompleteData.birthdate) {
				setValue('profile.birthdate', autocompleteData.birthdate)
				setAutocompletedByCpf(prev => ({
					...prev,
					birthdate: true,
				}))
			}
			if (autocompleteData.profession) {
				setValue(
					'profile.profession',
					getProfissionDescription(autocompleteData.profession)
				)
				setAutocompletedByCpf(prev => ({
					...prev,
					profession: true,
				}))
			}
			if (autocompleteData.email) {
				setValue('profile.email', autocompleteData.email)
				setAutocompletedByCpf(prev => ({
					...prev,
					email: true,
				}))
			}
			if (autocompleteData.phone) {
				setValue('profile.phone', autocompleteData.phone)
				setAutocompletedByCpf(prev => ({
					...prev,
					phone: true,
				}))
			}
			if (autocompleteData.socialName) {
				setValue('profile.socialName', autocompleteData.socialName)
				setAutocompletedByCpf(prev => ({
					...prev,
					socialName: true,
				}))
			}
			if (autocompleteData.gender) {
				setValue('profile.gender', autocompleteData.gender)
				setAutocompletedByCpf(prev => ({
					...prev,
					gender: true,
				}))
			}
		} else {
			console.error('Could not get proponent data by CPF')
		}
		setIsLoadingData(false)
	}

	// Form for co-participant registration
	const coparticipantForm = useForm<DpsCoparticipantForm>({
		resolver: valibotResolver(
			object({
				operation: dpsOperationForm,
				profile: dpsProfileForm,
				address: dpsAddressForm,
			})
		),
		defaultValues: {
			operation: {
				operationNumber: '',
				participantsNumber: '',
				totalValue: '',
			},
			profile: {
				cpf: '',
				name: '',
				socialName: '',
				birthdate: undefined,
				profession: '',
				email: '',
				phone: '',
				gender: '',
			},
			address: {
				zipcode: '',
				state: '',
				city: '',
				district: '',
				street: '',
				number: '',
				complement: '',
			},
		},
		mode: "onBlur",
		reValidateMode: "onBlur",
	})

	// Função original handleAddress restaurada e melhorada para usar a API real
	const handleAddress = async (cep: string, setterFunction: (field: string, value: any) => void) => {
		if (!cep || cep.length < 8) {
			return;
		}
		
		try {
			// Remover caracteres não numéricos
			const cleanCep = cep.replace(/\D/g, '');
			
			// Verificar se o CEP tem 8 dígitos
			if (cleanCep.length !== 8) {
				toast.error('CEP inválido. O CEP deve ter 8 dígitos.');
				return;
			}
			
			console.log(`Buscando endereço para o CEP: ${cleanCep}`);
			
			// Chamada real para a API de CEP usando a função getAddressByZipcode
			const addressData = await getAddressByZipcode(cleanCep);
			
			if (!addressData) {
				toast.error('CEP não encontrado. Verifique o CEP informado.');
				return;
			}
			
			// Preencher os campos com os dados retornados pela API
			setterFunction('street', addressData.logradouro);
			setterFunction('city', addressData.localidade);
			setterFunction('state', addressData.uf);
			setterFunction('district', addressData.bairro);
			
			toast.success('Endereço carregado com sucesso!');
		} catch (error) {
			console.error('Erro ao buscar endereço:', error);
			toast.error('Erro ao buscar endereço. Tente novamente.');
		}
	};

	// Function to load address data by CEP (zipcode)
	const loadAddressByCep = async (cep: string): Promise<void> => {
		return handleAddress(cep, (field, value) => {
			// Usando as propriedades específicas com tipos corretos
			if (field === 'street') setValue('address.street', value);
			if (field === 'city') setValue('address.city', value);
			if (field === 'state') setValue('address.state', value);
			if (field === 'district') setValue('address.district', value);
		});
	};
	
	const loadCoparticipantAddressByCep = async (cep: string): Promise<void> => {
		return handleAddress(cep, (field, value) => {
			// Usando as propriedades específicas com tipos corretos
			if (field === 'street') coparticipantForm.setValue('address.street', value);
			if (field === 'city') coparticipantForm.setValue('address.city', value);
			if (field === 'state') coparticipantForm.setValue('address.state', value);
			if (field === 'district') coparticipantForm.setValue('address.district', value);
		});
	};

	// Add a function to calculate total participation percentage
	const calculateTotalParticipation = () => {
		// Start with the main proponent's percentage
		let total = 0;
		
		// If we have an existing main proponent from the API, use its percentage
		if (existingMainProponent) {
			const mainPercentage = parseFloat(existingMainProponent.participationPercentage.replace('%', '').replace(',', '.')) || 0;
			total += mainPercentage;
		} else {
			// Otherwise, parse the main proponent's percentage from the form if it exists
			const formValues = getValues();
			if (formValues?.profile?.participationPercentage) {
				const mainPercentage = parseFloat(formValues.profile.participationPercentage.replace('%', '').replace(',', '.')) || 0;
				total += mainPercentage;
			}
		}
		
		// Add each coparticipant's percentage
		coparticipants.forEach(cp => {
			if (cp.participationPercentage) {
				const cpPercentage = parseFloat(cp.participationPercentage.replace('%', '').replace(',', '.')) || 0;
				total += cpPercentage;
			}
		});
		
		return total.toFixed(2).replace('.', ',') + '%';
	};

	// Lidar com o formulário do coparticipante
	const handleCoparticipantSubmit = async (formData: any) => {
		try {
			setIsLoadingCoparticipant(true);
			
			// Informações para adicionar à lista de coparticipantes
			const newCoparticipant: Coparticipant = {
				id: editingCoparticipantId || `cp-${Date.now()}`,
				name: formData.profile.name,
				cpf: formData.profile.cpf,
				participationPercentage: formData.profile.participationPercentage,
				profile: {
					...formData.profile
				},
				address: {
					...formData.address
				}
			};
			
			// Verificar se é edição ou adição
			if (editingCoparticipantId) {
				// Atualizar coparticipante existente
				setCoparticipants(prev => prev.map(cp => 
					cp.id === editingCoparticipantId ? newCoparticipant : cp
				));
				toast.success('Co-participante atualizado com sucesso!');
			} else {
				// Adicionar novo coparticipante
				setCoparticipants(prev => [...prev, newCoparticipant]);
				toast.success('Co-participante adicionado com sucesso!');
			}
			
			// Resetar formulário e limpar dados de edição
			coparticipantForm.reset({
				operation: getValues().operation,
				profile: {
					cpf: '',
					name: '',
					birthdate: undefined,
					profession: '',
					email: '',
					phone: '',
					gender: '',
					socialName: '',
					participationPercentage: ''
				},
				address: {
					zipcode: '',
					street: '',
					number: '',
					complement: '',
					district: '',
					city: '',
					state: ''
				}
			});
			// Limpar o último CPF de coparticipante consultado
			setLastQueriedCoparticipantCpf('');
			
			// Limpar o ID do coparticipante sendo editado
			setEditingCoparticipantId(null);
			
			// Fechar o diálogo após salvar
			setIsCoparticipantDialogOpen(false);
			
		} catch (error) {
			console.error('Erro ao salvar co-participante:', error);
			toast.error('Erro ao salvar co-participante. Tente novamente.');
		} finally {
			setIsLoadingCoparticipant(false);
		}
	};

	const handleEditCoparticipant = (coparticipant: Coparticipant) => {
		// Set the form values with the coparticipant data
		coparticipantForm.reset({
			operation: getValues().operation,
			profile: coparticipant.profile as DpsProfileFormType,
			address: coparticipant.address as DpsAddressFormType,
		});
		
		// Limpar o último CPF consultado para permitir novas consultas
		setLastQueriedCoparticipantCpf('');
		
		// Set the ID of the coparticipant being edited
		setEditingCoparticipantId(coparticipant.id);
		
		// Open the dialog
		setIsCoparticipantDialogOpen(true);
	}
	
	const handleDeleteCoparticipant = (id: string) => {
		setCoparticipants(prev => prev.filter(cp => cp.id !== id))
		toast.success('Co-participante removido com sucesso!')
	}
	
	// Função para validar se o CPF já está sendo usado por outro participante
	const validateCpfNotDuplicated = (cpf: string): boolean => {
		// Limpar o CPF para comparação
		const cleanCpf = cpf.replace(/\D/g, '');
		
		// Verificar se é o mesmo CPF do proponente principal
		const mainProponentCpf = getValues().profile.cpf || '';
		const cleanMainCpf = mainProponentCpf.replace(/\D/g, '');
		
		// Se é o mesmo CPF do proponente principal, não é válido
		if (cleanCpf === cleanMainCpf) {
			// toast.error('Este CPF pertence ao proponente principal. Cada participante deve ter um CPF único.');
			// Fechar o popup de coparticipante após um breve delay
			setTimeout(() => {
				setIsCoparticipantDialogOpen(false);
			}, 1500);
			return false;
		}
		
		// Verificar se já existe um coparticipante com esse CPF
		// (exceto o que está sendo editado)
		const duplicatedCoparticipant = coparticipants.find(cp => {
			if (editingCoparticipantId && cp.id === editingCoparticipantId) {
				return false; // Ignorar o coparticipante sendo editado
			}
			const cleanCpCopaticipant = cp.cpf.replace(/\D/g, '');
			return cleanCpCopaticipant === cleanCpf;
		});
		
		if (duplicatedCoparticipant) {
			toast.error(`Este CPF já pertence ao coparticipante "${duplicatedCoparticipant.name}". Cada participante deve ter um CPF único.`);
			// Fechar o popup de coparticipante após um breve delay
			setTimeout(() => {
				setIsCoparticipantDialogOpen(false);
			}, 1500);
			return false;
		}
		
		return true;
	};

	//useEffect(() => {
		// if (typeof watchBirthdate !== 'undefined' && watchBirthdate !== null) {
			// Calculate age here if needed
		// }
	// }, [watchBirthdate])

	// Função para validar se o percentual de participação excede 100%
	const validateParticipationPercentage = (value: string) => {
		// Extrair percentual do valor formatado (ex: "25,00%" => 25.00)
		const newPercentage = parseFloat(value.replace('%', '').replace(',', '.')) || 0;
		
		// Calcular a soma dos percentuais já existentes
		let existingTotal = 0;
		
		// Se temos proponente principal existente, incluir seu percentual
		if (existingMainProponent) {
			const mainPercentage = parseFloat(existingMainProponent.participationPercentage.replace('%', '').replace(',', '.')) || 0;
			existingTotal += mainPercentage;
		}
		
		// Incluir percentuais dos coparticipantes existentes
		coparticipants.forEach(cp => {
			const cpPercentage = parseFloat(cp.participationPercentage.replace('%', '').replace(',', '.')) || 0;
			existingTotal += cpPercentage;
		});
		
		// Verificar se o novo percentual excederia 100%
		const totalWithNew = existingTotal + newPercentage;
		if (totalWithNew > 100) {
			return {
				valid: false, 
				message: `O percentual excede o limite. Total: ${totalWithNew.toFixed(2).replace('.', ',')}%`,
				availablePercentage: (100 - existingTotal).toFixed(2).replace('.', ',') + '%'
			};
		}
		
		return { valid: true, message: '', availablePercentage: '' };
	};

	// Função para calcular o valor com base na porcentagem
	const calculateParticipationValue = (percentage: string, totalValueStr: string) => {
		try {
			if (!percentage || !totalValueStr) {
				return '';
			}
			
			// Extrair a porcentagem como número
			const percentageValue = parseFloat(percentage.replace('%', '').replace(',', '.')) || 0;
			
			// Obter o valor total da operação
			const totalValueNum = convertCapitalValue(totalValueStr) || 0;
			
			// Calcular valor com base na porcentagem e valor total
			const participationValueNum = (totalValueNum * percentageValue) / 100;
			
			// Formatar como moeda
			const valueString = Math.floor(participationValueNum * 100).toString();
			
			// Usar maskToBrlCurrency para formatar o valor
			const result = maskToBrlCurrency({
				nextState: {
					value: valueString,
					selection: { start: 0, end: 0 }
				},
				previousState: {
					value: "",
					selection: { start: 0, end: 0 }
				},
				currentState: {
					value: `R$ ${valueString}`,
					selection: { start: 0, end: 0 }
				}
			});
			
			return result?.value || '';
		} catch (error) {
			console.error('Erro ao calcular participação no financiamento:', error);
			return '';
		}
	};

	// Manipulador para o campo de percentual no formulário do coparticipante
	const handleCoparticipantPercentageBlur = (value: string) => {
		try {
			if (!value) return;
			
			// Validar se o percentual excede 100%
			const validation = validateParticipationPercentage(value);
			if (!validation.valid) {
				toast.error(validation.message);
				// Sugerir o valor máximo disponível
				coparticipantForm.setValue('profile.participationPercentage', validation.availablePercentage);
				
				// Calcular valor da participação com o percentual ajustado
				const totalValue = coparticipantForm.getValues().operation.totalValue || '';
				const participationValue = calculateParticipationValue(validation.availablePercentage, totalValue);
				
				// Aqui não usamos setValue diretamente pois o participationValue não está no schema
				// Vamos apenas guardar o valor para exibir na interface
				setCoparticipantParticipationValue(participationValue);
				return;
			}
			
			// Calcular o valor com base no percentual
			const totalValue = coparticipantForm.getValues().operation.totalValue || '';
			const participationValue = calculateParticipationValue(value, totalValue);
			
			// Armazenar o valor calculado
			setCoparticipantParticipationValue(participationValue);
			
		} catch (error) {
			console.error('Erro ao processar percentual de participação:', error);
		}
	};

	// Manipulador para o campo % Participação do formulário principal
	const handleParticipationPercentageBlur = (value: string) => {
		try {
			if (!value || !totalValue) {
				setParticipationValue('');
				return;
			}
			
			// Para participante único, sempre calcular com base em 100%
			if (participantsNumber === '1') {
				const participationValue = calculateParticipationValue('100,00%', totalValue);
				setParticipationValue(participationValue);
				setValue('profile.participationPercentage', '100,00%');
				return;
			}
			
			// Validar se o percentual excede 100%
			const validation = validateParticipationPercentage(value);
			if (!validation.valid) {
				toast.error(validation.message);
				// Sugerir o valor máximo disponível 
				setValue('profile.participationPercentage', validation.availablePercentage);
				
				// Calcular valor com base no percentual ajustado
				const participationValue = calculateParticipationValue(validation.availablePercentage, totalValue);
				setParticipationValue(participationValue);
				return;
			}
			
			// Calcular valor com base na porcentagem e valor total
			const participationValue = calculateParticipationValue(value, totalValue);
			setParticipationValue(participationValue);
			
			console.log(`Calculado participação no financiamento: ${participationValue} (${value} de ${totalValue})`);
		} catch (error) {
			console.error('Erro ao calcular participação no financiamento:', error);
			setParticipationValue('');
		}
	};

	const saveAndAddCoparticipant = () => {
		try {
			// Pre-populate operation data for the coparticipant form
			const formData = getValues();
			coparticipantForm.setValue('operation', formData.operation);
			
			// Calcular sugestão de percentual com base no número de participantes e participações já existentes
			const numParticipants = parseInt(formData.operation.participantsNumber, 10) || 2;
			const participantsLeft = numParticipants - coparticipants.length - 1; // -1 pelo proponente principal
			
			if (participantsLeft > 0) {
				// Calcular o percentual total já alocado
				let totalAllocated = 0;
				
				// Adicionar percentual do proponente principal
				const mainPercentStr = formData.profile.participationPercentage || '0,00%';
				const mainPercent = parseFloat(mainPercentStr.replace('%', '').replace(',', '.')) || 0;
				totalAllocated += mainPercent;
				
				// Adicionar percentuais dos coparticipantes existentes
				coparticipants.forEach(cp => {
					const cpPercent = parseFloat(cp.participationPercentage.replace('%', '').replace(',', '.')) || 0;
					totalAllocated += cpPercent;
				});
				
				// Calcular o percentual disponível e dividir igualmente entre os participantes restantes
				const availablePercent = 100 - totalAllocated;
				const suggestedPercent = (availablePercent / participantsLeft).toFixed(2).replace('.', ',');
				
				// Definir o percentual sugerido para ser exibido na interface, mas não preencher o campo
				// O campo vai ser inicializado vazio, mas teremos um valor sugerido disponível
				setCoparticipantSuggestedPercentage(suggestedPercent + '%');
				
				// Não definimos o valor no formulário para que o campo comece vazio
				// coparticipantForm.setValue('profile.participationPercentage', suggestedPercent + '%');
				
				// Calculamos o valor de participação mas não definimos no formulário
				const totalValue = formData.operation.totalValue || '';
				const participationValue = calculateParticipationValue(suggestedPercent + '%', totalValue);
				setCoparticipantParticipationValue('');
			}
			
			// Open coparticipant dialog
			setIsCoparticipantDialogOpen(true);
		} catch (error) {
			console.error(error);
			toast.error('Erro ao abrir formulário de co-participante. Tente novamente.');
		}
	};

	// Refinar a função fetchOperationData para tratar os diferentes cenários de consulta
	const fetchOperationData = async (operationNumber: string) => {
		// Validar se o número da operação tem pelo menos 2 caracteres
		if (!operationNumber || operationNumber.length < 2) {
			console.log('Número da operação inválido ou muito curto:', operationNumber);
			return;
		}
		
		// Verificar se é a mesma operação que já foi consultada anteriormente
		if (operationNumber === lastQueriedOperation) {
			console.log(`Operação ${operationNumber} já foi consultada anteriormente. Ignorando consulta duplicada.`);
			return;
		}

		try {
			setIsLoadingOperationData(true);
			console.log(`Buscando dados da operação ${operationNumber}`);
			
			// Armazenar o número da operação como a última consultada
			setLastQueriedOperation(operationNumber);
			
			// Fazer a chamada para a API
			const response = await getParticipantsByOperation(token, operationNumber);
			console.log('response', response)
			// Limpar os coparticipantes existentes
			setCoparticipants([]);
			// Limpar o proponente principal existente
			setExistingMainProponent(null);
			// Limpar o último CPF consultado para permitir novas consultas
			setLastQueriedCpf('');
			// reset();

			if (response && response.success && response.data && response.data.length > 0) {

				// CASO DE CONTINUAÇÃO: Operação existente com participantes
				// Habilitar as seções após consultado os dados da operação
				setShowOtherSections(true);
				
				// Usar o primeiro registro para dados da operação
				const mainData = response.data[0];
				
				// Preencher os dados da operação (somente leitura)
				setValue('operation.participantsNumber', mainData.totalParticipants.toString());
				setParticipantsNumber(mainData.totalParticipants.toString());
				
				// Formatar o valor da operação como moeda
				const totalValueFormatted = maskToBrlCurrency({
					nextState: {
						value: Math.floor(mainData.operationValue * 100).toString(),
						selection: { start: 0, end: 0 }
					},
					previousState: {
						value: "",
						selection: { start: 0, end: 0 }
					},
					currentState: {
						value: `R$ ${Math.floor(mainData.operationValue * 100).toString()}`,
						selection: { start: 0, end: 0 }
					}
				})?.value || "";
				
				setValue('operation.totalValue', totalValueFormatted);
				setTotalValue(totalValueFormatted);
				
				// Bloquear campos "Nº de participantes" e "Valor total da operação" por serem dados de uma operação existente
				// Esta modificação será utilizada pelo componente DpsOperationForm
				setValue('operation.isParticipantsNumberReadOnly', 'true');
				setValue('operation.isTotalValueReadOnly', 'true');

				// Preencher dados do produto (se vierem na resposta) - sempre em modo leitura quando já existe uma operação
				if ('productId' in mainData && mainData.productId) {
					console.log('productId', mainData.productId)
					console.log('productOptions', productOptions)
					setValue('product.product', String(mainData.product?.uid));
				}
				if ('deadlineId' in mainData && mainData.deadlineId) {
					setPrazosOptions(prazosOptionsProp);
					setValue('product.deadline', String(mainData.deadlineId));
				}
				if ('propertyTypeId' in mainData && mainData.propertyTypeId) {
					setValue('product.propertyType', String(mainData.propertyTypeId));
				}
				// Formatar e definir os valores de capital MIP e DFI
				if ('capitalMIP' in mainData) {
					// Alguns serviços retornam capitalMIP, outros capitalMip
					const mipValue = mainData.capitalMIP;

					// Formatar o valor para moeda brasileira
					const formattedMip = maskToBrlCurrency({
						nextState: {
							value: Math.floor(mipValue * 100).toString(),
							selection: { start: 0, end: 0 }
						},
						previousState: {
							value: "",
							selection: { start: 0, end: 0 }
						},
						currentState: {
							value: `R$ ${Math.floor(mipValue * 100).toString()}`,
							selection: { start: 0, end: 0 }
						}
					})?.value || "";
					
					setValue('product.mip', formattedMip);
					console.log('Capital MIP definido a partir do proponente principal:', formattedMip);
				}
				if ('capitalDFI' in mainData) {
					// Alguns serviços retornam capitalMIP, outros capitalMip
					const dfiValue = mainData.capitalDFI;

					// Formatar o valor para moeda brasileira
					const formattedDfi = maskToBrlCurrency({
						nextState: {
							value: Math.floor(dfiValue * 100).toString(),
							selection: { start: 0, end: 0 }
						},
						previousState: {
							value: "",
							selection: { start: 0, end: 0 }
						},
						currentState: {
							value: `R$ ${Math.floor(dfiValue * 100).toString()}`,
							selection: { start: 0, end: 0 }
						}
					})?.value || "";
					
					setValue('product.dfi', formattedDfi);
					console.log('Capital DFI definido a partir do proponente principal:', formattedDfi);
				}

				// Produto sempre desabilitado quando já existe uma operação
				setIsProductDisabled(true);
				
				// Carregar os participantes existentes
				const participantData = response.data;
				const newCoparticipants: Coparticipant[] = [];
				let totalPercentageUsed = 0;
				let foundMainProponent = false;

				// Processar os participantes retornados
				participantData.forEach(participant => {
					// Converter o percentual para string formatada
					const participationValue = Number(participant.percentageParticipation);
					const percentageStr = !isNaN(participationValue) 
						? participationValue.toFixed(2).replace('.', ',') + '%'
						: '0,00%';
					
					// Adicionar ao total de percentual usado
					if (!isNaN(participationValue)) {
						totalPercentageUsed += participationValue;
					}
					
					// Obter dados do cliente
					let customerData = undefined;
					if ('customer' in participant && participant.customer) {
						customerData = participant.customer;
					} else if (participant && typeof participant === 'object') {
						const anyParticipant = participant as any;
						if (anyParticipant.Customer) {
							customerData = anyParticipant.Customer;
						}
					}
					
					if (!customerData) {
						console.error('Dados do cliente não encontrados no participante:', participant);
						return;
					}
					
					// Obter nome e CPF do cliente
					const customerName = typeof customerData === 'object' && customerData !== null
						? ('name' in customerData 
							? String(customerData.name) 
							: ('Name' in customerData ? String((customerData as any).Name) : ''))
						: '';
					
					const customerDocument = typeof customerData === 'object' && customerData !== null && 'document' in customerData 
						? String(customerData.document) 
						: '';
					
					// Verificar se é o proponente principal ou coparticipante
					if (participant.participantType === 'P') {
						// É o proponente principal - já existe
						foundMainProponent = true;
						
						// Armazenar os dados do proponente principal existente no estado
						setExistingMainProponent({
							name: customerName,
							cpf: customerDocument,
							participationPercentage: percentageStr,
							financingParticipation: participant.financingParticipation
						});
						
						/* // Preencher os campos da seção Dados do Produto com os dados do proponente principal
						if ('productId' in participant && participant.productId) {
							setValue('product.product', String(participant.productId));
							console.log('Produto definido a partir do proponente principal:', participant.productId);
						}
						
						if ('deadlineId' in participant && participant.deadlineId) {
							setValue('product.deadline', String(participant.deadlineId));
							console.log('Prazo definido a partir do proponente principal:', participant.deadlineId);
						}
						
						if ('propertyTypeId' in participant && participant.propertyTypeId) {
							setValue('product.propertyType', String(participant.propertyTypeId));
							console.log('Tipo de imóvel definido a partir do proponente principal:', participant.propertyTypeId);
						}
						
						// Formatar e definir os valores de capital MIP e DFI
						if ('capitalMIP' in participant || 'capitalMip' in participant) {
							// Alguns serviços retornam capitalMIP, outros capitalMip
							const anyParticipant = participant as any;
							const mipValue = 'capitalMIP' in participant 
								? anyParticipant['capitalMIP']
								: ('capitalMip' in participant ? anyParticipant['capitalMip'] : 0);
							
							// Formatar o valor para moeda brasileira
							const formattedMip = maskToBrlCurrency({
								nextState: {
									value: Math.floor(mipValue * 100).toString(),
									selection: { start: 0, end: 0 }
								},
								previousState: {
									value: "",
									selection: { start: 0, end: 0 }
								},
								currentState: {
									value: `R$ ${Math.floor(mipValue * 100).toString()}`,
									selection: { start: 0, end: 0 }
								}
							})?.value || "";
							
							setValue('product.mip', formattedMip);
							console.log('Capital MIP definido a partir do proponente principal:', formattedMip);
						}
						
						if ('capitalDFI' in participant || 'capitalDfi' in participant) {
							// Alguns serviços retornam capitalDFI, outros capitalDfi
							const anyParticipant = participant as any;
							const dfiValue = 'capitalDFI' in participant 
								? anyParticipant['capitalDFI']
								: ('capitalDfi' in participant ? anyParticipant['capitalDfi'] : 0);
							
							// Formatar o valor para moeda brasileira
							const formattedDfi = maskToBrlCurrency({
									nextState: {
										value: Math.floor(dfiValue * 100).toString(),
										selection: { start: 0, end: 0 }
									},
									previousState: {
										value: "",
										selection: { start: 0, end: 0 }
									},
									currentState: {
										value: `R$ ${Math.floor(dfiValue * 100).toString()}`,
										selection: { start: 0, end: 0 }
									}
								})?.value || "";
							
							setValue('product.dfi', formattedDfi);
							console.log('Capital DFI definido a partir do proponente principal:', formattedDfi);
						} */
					} else if (participant.participantType === 'C') {
						// É um coparticipante
						newCoparticipants.push({
							id: participant.uid,
							name: customerName,
							cpf: customerDocument,
							participationPercentage: percentageStr,
							profile: {
								name: customerName,
								cpf: customerDocument,
								participationPercentage: percentageStr,
							},
							address: {}
						});
					}
				});
				
				// Atualizar a lista de coparticipantes
				if (newCoparticipants.length > 0) {
					setCoparticipants(newCoparticipants);
				}
				
				// Calcular o percentual disponível
				const availablePercentage = 100 - totalPercentageUsed;
				
				// Verificar o número de participantes na operação
				const declaredParticipants = parseInt(mainData.totalParticipants.toString(), 10) || 0;
				const currentParticipants = participantData.length; // Total de participantes já cadastrados
				
				// Validar se já atingiu o limite de participantes
				if (currentParticipants >= declaredParticipants) {
					// Já atingiu o número máximo de participantes
					setOperationDataLoaded(true);
					
					if (foundMainProponent) {
						toast.error(`A operação já possui ${currentParticipants} participante(s) cadastrado(s), atingindo o limite de ${declaredParticipants}. Não é possível adicionar mais participantes.`);
					} else {
						toast.error(`A operação já possui ${currentParticipants} participante(s) cadastrado(s), mas nenhum proponente principal. Contate o suporte.`);
					}
				} else if (foundMainProponent) {
					// Tem proponente principal e ainda pode adicionar mais participantes
					setOperationDataLoaded(true);
					
					// Ainda pode adicionar mais participantes - configurar o novo coparticipante
					const participantsLeft = declaredParticipants - currentParticipants;
					
					if (availablePercentage > 0) {
						toast.success(`Operação carregada com sucesso. Você está cadastrando um novo coparticipante. Percentual disponível: ${availablePercentage.toFixed(2).replace('.', ',')}%`);
						
						// Sugerir um percentual para o novo coparticipante que pode ser alterado pelo usuário
						const suggestedPercentage = (availablePercentage / participantsLeft).toFixed(2).replace('.', ',') + '%';
						setCoparticipantSuggestedPercentage(suggestedPercentage);
						
						// Se estamos com CPF no URL, configurar o percentual sugerido no formulário
						if (cpfParam) {
							setValue('profile.participationPercentage', suggestedPercentage);
							
							// Calcular o valor sugerido
							const participationValue = calculateParticipationValue(suggestedPercentage, totalValueFormatted);
							setParticipationValue(participationValue);
						}
					} else {
						toast.error(`Atenção: Embora seja possível adicionar mais ${participantsLeft} participante(s), não há percentual disponível (100% já alocado).`);
					}
				} else {
					// Situação anômala - tem participantes mas não tem proponente principal
					setExistingMainProponent(null);
					setOperationDataLoaded(false);
					
					if (currentParticipants > 0) {
						toast.error(`Situação anômala detectada: a operação possui ${currentParticipants} participante(s), mas nenhum proponente principal. Contate o suporte.`);
					} else {
						toast.error(`Situação anômala detectada: a operação não possui participantes. Cadastre o proponente principal.`);
					}
				}
			} else {
				// CASO DE NOVO PREENCHIMENTO: Operação não encontrada ou sem participantes
				setExistingMainProponent(null);
				setOperationDataLoaded(false);
				setIsProductDisabled(false);
				setShowOtherSections(true);
				
				// Garantir que os campos estejam habilitados para edição
				setValue('operation.isParticipantsNumberReadOnly', '');
				setValue('operation.isTotalValueReadOnly', '');
				
				// Resetar os campos de número de participantes e valor total da operação
				setValue('operation.participantsNumber', '');
				setValue('operation.totalValue', '');
				setParticipantsNumber('');
				setTotalValue('');

				if (response && response.success) {
					// Operação existe mas não tem participantes
					toast.success(`Operação ${operationNumber} encontrada, mas sem participantes cadastrados. Preencha os dados do proponente principal.`);
				} else {
					// Operação não encontrada - sem alerta de erro, apenas habilitar seções
					console.log(`Operação ${operationNumber} não encontrada. Configurando para nova operação.`);
					// Remover o toast.error - não mostrar alerta 
				}
			}
		} catch (error) {
			// Erro ao consultar a operação - tratado como novo preenchimento
			console.error('Erro ao buscar dados da operação:', error);
			setExistingMainProponent(null);
			setOperationDataLoaded(false);
			setIsProductDisabled(false);
			setShowOtherSections(true);
			
			// Garantir que os campos estejam habilitados para edição
			setValue('operation.isParticipantsNumberReadOnly', '');
			setValue('operation.isTotalValueReadOnly', '');
			
			// Resetar os campos de número de participantes e valor total da operação
			setValue('operation.participantsNumber', '');
			setValue('operation.totalValue', '');
			setParticipantsNumber('');
			setTotalValue('');
			
			// Sem alerta de erro, apenas log
			console.log('Erro ao buscar dados da operação. Configurando para novo preenchimento.');
		} finally {
			setIsLoadingOperationData(false);
		}
	};

	// Ajustar useEffect para tratar CPF via parâmetro de URL
	useEffect(() => {
		if (cpfParam) {
			// Limpar o último CPF consultado para permitir novas consultas via parâmetro
			setLastQueriedCpf('');
			
			// Se temos CPF via query param, já habilitar todas as seções
			setShowOtherSections(true);
			
			// Preencher o campo CPF e buscar dados se for um CPF válido
			if (validarCpf(cpfParam)) {
				setValue('profile.cpf', cpfParam);
				getDataByCpf(cpfParam);
			} else {
				toast.error(`CPF inválido: ${cpfParam}`);
			}
		} else {
			// Se não tem CPF, começar com as seções desabilitadas
			setShowOtherSections(false);
		}
	}, [cpfParam, setValue]); // Remover getDataByCpf da lista de dependências para evitar erro

	// Componente auxiliar para o botão Salvar com tooltip
	const SaveButton = ({ 
		isSubmitting, 
		isLoading
	}: { 
		isSubmitting: boolean;
		isLoading: boolean;
	}) => {
		// Verificar todos os campos obrigatórios em todas as seções
		const formData = getValues();
		
		// Verificar seção de operação
		const isOperationValid = !!(
			formData.operation.operationNumber && 
			formData.operation.participantsNumber && 
			formData.operation.totalValue
		);
		
		// Verificar seção de proponente (profile)
		const isProfileValid = showOtherSections && !!(
			formData.profile.cpf &&
			formData.profile.name &&
			formData.profile.birthdate &&
			formData.profile.email &&
			formData.profile.phone &&
			formData.profile.gender &&
			formData.profile.participationPercentage
		);
		
		// Verificar seção de produto
		const isProductValid = showOtherSections && !!(
			formData.product.product &&
			formData.product.deadline &&
			formData.product.propertyType &&
			formData.product.mip &&
			formData.product.dfi
		);
		
		// Verificar seção de endereço
		const isAddressValid = showOtherSections && !!(
			formData.address.zipcode &&
			formData.address.street &&
			formData.address.number &&
			formData.address.district &&
			formData.address.city &&
			formData.address.state
		);
		
		// Verificar se todas as seções obrigatórias estão válidas
		const isFormValid = isOperationValid && 
			(!showOtherSections || (isProfileValid && isProductValid && isAddressValid));
		
		// Determinar se o botão deve estar desabilitado
		const isDisabled = isSubmitting || isLoading || !isFormValid;
		
		console.log("SaveButton validation results:");
		console.log("- Operation section:", isOperationValid);
		console.log("- Profile section:", isProfileValid);
		console.log("- Product section:", isProductValid);
		console.log("- Address section:", isAddressValid);
		console.log("- Overall form valid:", isFormValid);
		console.log("- Button disabled:", isDisabled);

		// Determinar qual mensagem de erro mostrar na tooltip
		const getTooltipMessage = () => {
			if (!isOperationValid) {
				return "Preencha todos os campos da seção 'Dados da Operação'";
			} else if (showOtherSections) {
				if (!isProfileValid) {
					return "Preencha todos os campos da seção 'Dados do Proponente'";
				} else if (!isProductValid) {
					return "Preencha todos os campos da seção 'Dados do Produto'";
				} else if (!isAddressValid) {
					return "Preencha todos os campos da seção 'Dados de Endereço'";
				}
			}
			return "Preencha todos os campos obrigatórios para habilitar o salvamento";
		};

		return (
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<div>
							<Button
								type="button"
								className="w-40"
								disabled={isDisabled}
								onClick={() => {
									console.log("Submit button clicked");
									handleFormSubmitClick();
								}}
							>
								Salvar
								{isLoading ? (
									<Loader2Icon className="ml-2 h-4 w-4 animate-spin" />
								) : null}
							</Button>
						</div>
					</TooltipTrigger>
					{isDisabled && !isSubmitting && !isLoading && (
						<TooltipContent>
							<p>{getTooltipMessage()}</p>
						</TooltipContent>
					)}
				</Tooltip>
			</TooltipProvider>
		);
	};

	useEffect(() => {
		// Se o número de participantes for 1, automaticamente define 100% para o proponente principal
		if (participantsNumber === '1') {
			setValue('profile.participationPercentage', '100,00%');
			if (totalValue) {
				const participationValue = calculateParticipationValue('100,00%', totalValue);
				setParticipationValue(participationValue);
			}
		}
	}, [participantsNumber, totalValue, setValue]);

	// Componente para exibir botão de adicionar coparticipante com base nas validações
	const AddCoparticipantButtonOrMessage = () => {
		// Verificar se já temos o número da operação preenchido
		const operationNumber = getValues().operation.operationNumber;
		
		// Não exibir o botão nas seguintes situações:
		// 1. Se estamos processando um CPF por parâmetro
		// 2. Se for continuação de preenchimento (existingMainProponent não é nulo)
		// 3. Se não temos o número da operação preenchido
		if (cpfParam || existingMainProponent || !operationNumber) {
			return null;
		}

		// Lógica de validação para verificar se pode adicionar mais coparticipantes
		const declaredParticipants = parseInt(getValues().operation.participantsNumber, 10) || 0;
		const currentParticipants = coparticipants.length + 1; // +1 pelo proponente principal atual
		const canAddMore = currentParticipants < declaredParticipants;

		if (canAddMore) {
			return (
				<Button
					type="button"
					variant="secondary"
					className="w-60"
					onClick={saveAndAddCoparticipant}
					disabled={isSubmitting || isLoading}
				>
					Adicionar Co-participante
				</Button>
			);
		}
	};

	// Adicionar uma função wrapper para converter o setValue antes de passar para o componente
	const handleSetValueForProfile = (name: string, value: any) => {
		// Nesta função, convertemos o nome do campo para o formato esperado pelo useForm
		if (name.startsWith('profile.')) {
			setValue(name as any, value);
		} else {
			// Se não começar com 'profile.', adicionamos
			setValue(`profile.${name}` as any, value);
		}
	};

	return (
		<form
			className="pb-12 flex flex-col gap-8"
			onSubmit={handleSubmit(onSubmit)}
		>
			{/* Container de toast */}
			<div>
				{toast && typeof toast.ToastContainer === 'function' && <toast.ToastContainer />}
			</div>
		
			{/* Seção de dados da operação - sempre visível */}
			<div className="w-full max-w-7xl mx-auto bg-white rounded-3xl p-9 dps-operation-section">
				<DpsOperationForm
					control={control}
					formState={formState}
					onParticipantsChange={setParticipantsNumber}
					onTotalValueChange={setTotalValue}
					onOperationNumberBlur={fetchOperationData}
					isLoadingOperationData={isLoadingOperationData}
					disabled={isSubmitting || isLoading}
				/>
			</div>

			{/* Restante do formulário só aparece após consultar a operação ou quando temos CPF via param */}
			{showOtherSections && (
				<>
					{/* Seção de dados do proponente */}
					<div className="w-full max-w-7xl mx-auto bg-white rounded-3xl p-9 relative dps-profile-section">
						<DpsProfileForm
							control={control as any}
							formState={formState}
							getDataByCpf={getDataByCpf}
							disabled={isSubmitting || isLoading || isLoadingData}
							participationPercentage={participationPercentage}
							participationValue={participationValue}
							onParticipationPercentageBlur={handleParticipationPercentageBlur}
							isSingleParticipant={participantsNumber === '1'}
							setValue={handleSetValueForProfile} // Usar a função wrapper em vez de setValue diretamente
						/>
					</div>

					{/* Seção de dados do produto */}
					<div className="w-full max-w-7xl mx-auto bg-white rounded-3xl p-9 dps-product-section">
						<DpsProductForm
							control={control}
							formState={formState}
							prazosOptions={prazosOptions}
							productOptions={productOptions}
							tipoImovelOptions={tipoImovelOptions}
							disabled={isSubmitting || isLoading || isProductDisabled}
						/>
					</div>

					{/* Seção de endereço */}
					<div className="w-full max-w-7xl mx-auto bg-white rounded-3xl p-9 dps-address-section">
						<DpsAddressForm
							control={control as any}
							formState={formState}
							cepDataLoader={loadAddressByCep}
							disabled={isSubmitting || isLoading}
						/>
					</div>

					{/* Lista de participantes (visível quando há proponente ou coparticipantes) */}
					{(coparticipants.length > 0 || getValues().profile.name) && (
						<div className="p-9 w-full max-w-7xl mx-auto bg-white rounded-3xl mt-6">
							<h3 className="text-primary text-xl font-medium mb-4">Participantes da Operação</h3>
							
							{operationDataLoaded && (
								<div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
									<p className="text-blue-700">
										Esta operação já possui {coparticipants.length + (existingMainProponent ? 1 : 0)} participante(s) cadastrado(s).
									</p>
									{existingMainProponent && (
										<p className="text-blue-700 mt-2">
											<strong>Atenção:</strong> Seus dados serão mantidos e você está adicionando apenas um novo coparticipante.
										</p>
									)}
								</div>
							)}
							
							<div className="bg-gray-50 rounded-lg p-4 mb-6">
								<h4 className="font-medium mb-3">Detalhes da Operação</h4>
								<div className="grid grid-cols-3 gap-4 mb-4">
									<div>
										<p className="text-gray-500 text-sm">Número da Operação</p>
										<p className="font-medium">{getValues().operation.operationNumber}</p>
									</div>
									<div>
										<p className="text-gray-500 text-sm">Nº de Participante(s)</p>
										<p className="font-medium">{getValues().operation.participantsNumber}</p>
									</div>
									<div>
										<p className="text-gray-500 text-sm">Valor Total da Operação</p>
										<p className="font-medium">{getValues().operation.totalValue}</p>
									</div>
								</div>
							</div>
							
							<div className="space-y-4">
								<div className="grid grid-cols-5 gap-4 py-2 px-4 bg-gray-100 rounded-t-lg font-medium text-gray-600">
									<div>Nome</div>
									<div>CPF</div>
									<div>Participação</div>
									<div>Tipo</div>
									<div></div> {/* Coluna vazia para os botões de ação */}
								</div>
								
								{existingMainProponent ? (
									<div className="grid grid-cols-5 gap-4 py-3 px-4 border-b hover:bg-gray-50">
										<div className="font-medium">{existingMainProponent.name}</div>
										<div>{existingMainProponent.cpf}</div>
										<div>{existingMainProponent.participationPercentage}</div>
										<div className="text-primary">Proponente</div>
										<div></div> {/* Sem botões para o proponente principal */}
									</div>
								) : getValues().profile.name && (
									<div className="grid grid-cols-5 gap-4 py-3 px-4 border-b hover:bg-gray-50">
										<div className="font-medium">{getValues().profile.name}</div>
										<div>{getValues().profile.cpf}</div>
										<div>{getValues().profile.participationPercentage || '0,00%'}</div>
										<div className="text-primary">Proponente</div>
										<div></div> {/* Sem botões para o proponente principal */}
									</div>
								)}
								
								{coparticipants.map((coparticipant) => (
									<div key={coparticipant.id} className="grid grid-cols-5 gap-4 py-3 px-4 border-b hover:bg-gray-50">
										<div className="font-medium">{coparticipant.name}</div>
										<div>{coparticipant.cpf}</div>
										<div>{coparticipant.participationPercentage}</div>
										<div className="text-primary">Coparticipante</div>
										<div className="flex justify-end gap-2">
											{/* Exibir botões de ação apenas quando não for continuação de preenchimento */}
											{!existingMainProponent && (
												<>
													<Button 
														type="button" 
														variant="ghost" 
														size="icon" 
														onClick={() => handleEditCoparticipant(coparticipant)}
													>
														<PencilIcon className="h-4 w-4" />
													</Button>
													<Button 
														type="button" 
														variant="ghost" 
														size="icon" 
														onClick={() => handleDeleteCoparticipant(coparticipant.id)}
													>
														<TrashIcon className="h-4 w-4 text-red-500" />
													</Button>
												</>
											)}
										</div>
									</div>
								))}
							</div>
							
							<div className="flex justify-between mt-6 pt-4 border-t">
								<div className="font-medium">Total alocado:</div>
								<div className="font-medium">{calculateTotalParticipation()}</div>
							</div>
							
							{parseFloat(calculateTotalParticipation().replace('%', '').replace(',', '.')) < 100 && (
								<div className="flex justify-between mt-2 text-green-600">
									<div>Disponível para novo(s) coparticipante(s):</div>
									<div>
										{(100 - parseFloat(calculateTotalParticipation().replace('%', '').replace(',', '.'))).toFixed(2).replace('.', ',')}%
									</div>
								</div>
							)}
						</div>
					)}

					{/* Botões de ação */}
					<div className="flex justify-between w-full max-w-7xl mx-auto mt-6">
						<div>
							<AddCoparticipantButtonOrMessage />
						</div>
						
						<div className="flex gap-4">
							<Button type="button" variant="outline" className="w-40" disabled={isSubmitting || isLoading}>
								Cancelar
							</Button>
							
							<SaveButton 
								isSubmitting={isSubmitting} 
								isLoading={isLoading} 
							/>
						</div>
					</div>
				</>
			)}

			{/* Diálogos e modais */}
			<Dialog
				open={isCoparticipantDialogOpen}
				onOpenChange={setIsCoparticipantDialogOpen}
			>
				<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{editingCoparticipantId ? 'Editar Coparticipante' : 'Cadastro de Co-participante'}</DialogTitle>
						<DialogDescription>
							{editingCoparticipantId ? 'Atualize os dados do co-participante' : 'Preencha os dados do co-participante para esta operação'}
						</DialogDescription>
					</DialogHeader>

					<form onSubmit={coparticipantForm.handleSubmit(handleCoparticipantSubmit)} className="space-y-8">
						<div className="bg-gray-50 p-4 rounded-lg mb-4">
							<h3 className="text-primary text-lg mb-4">Dados da Operação (somente leitura)</h3>
							<div className="grid grid-cols-3 gap-4">
								<div>
									<p className="text-gray-500">Número da Operação</p>
									<p className="font-medium">{coparticipantForm.getValues().operation.operationNumber}</p>
								</div>
								<div>
									<p className="text-gray-500">Nº de Participante(s)</p>
									<p className="font-medium">{coparticipantForm.getValues().operation.participantsNumber}</p>
								</div>
								<div>
									<p className="text-gray-500">Valor Total da Operação</p>
									<p className="font-medium">{coparticipantForm.getValues().operation.totalValue}</p>
								</div>
							</div>
						</div>

						<DpsProfileForm
							control={coparticipantForm.control}
							formState={coparticipantForm.formState}
							getDataByCpf={getDataByCpfForCoparticipant}
							disabled={isLoadingCoparticipant || fetchingCpfDataCoparticipant}
							participationPercentage=""
							participationValue={coparticipantParticipationValue}
							onParticipationPercentageBlur={handleCoparticipantPercentageBlur}
							validateCpf={validateCpfNotDuplicated}
							placeholderPercentage={coparticipantSuggestedPercentage}
						/>

						<DpsAddressForm
							control={coparticipantForm.control}
							formState={coparticipantForm.formState}
							cepDataLoader={loadCoparticipantAddressByCep}
							disabled={isLoadingCoparticipant}
						/>

						<DialogFooter>
							<Button 
								type="button" 
								variant="outline" 
								onClick={() => setIsCoparticipantDialogOpen(false)}
							>
								Cancelar
							</Button>
							<Button type="submit" disabled={isLoadingCoparticipant || fetchingCpfDataCoparticipant}>
								{isLoadingCoparticipant ? (
									<>
										Salvando
										<Loader2Icon className="ml-2 h-4 w-4 animate-spin" />
									</>
								) : "Salvar e voltar"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			<Dialog
				open={isConfirmDialogOpen}
				onOpenChange={setIsConfirmDialogOpen}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Confirmar cadastro</DialogTitle>
						<DialogDescription>
							{pendingSubmitData ? 
								`Você informou ${parseInt(pendingSubmitData.operation.participantsNumber, 10) || 0} participantes no total, mas está cadastrando apenas ${existingMainProponent ? (1 + coparticipants.length + 1) : (coparticipants.length + 1)}. Deseja continuar mesmo assim?` 
								: ''}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button 
							type="button"
							variant="outline" 
							onClick={handleCancelSubmit}
						>
							Cancelar
						</Button>
						<Button 
							type="button"
							onClick={handleConfirmSubmit}
						>
							Continuar
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</form>
	)
}

export default DpsInitialForm
