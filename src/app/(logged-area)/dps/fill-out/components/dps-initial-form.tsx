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
import { useRouter } from 'next/navigation'
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
import DpsOperationForm, { dpsOperationForm, DpsOperationFormType } from './dps-operation-form'
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
import { Input } from '@/components/ui/input'
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { useState as useStateToast } from 'react'
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

	const [isLoading, setIsLoading] = useState(false)
	const [isLoadingData, setIsLoadingData] = useState(false)
	const [isLoadingOperationData, setIsLoadingOperationData] = useState(false)
	const [isLoadingCoparticipant, setIsLoadingCoparticipant] = useState(false)
	const [fetchingCpfDataCoparticipant, setFetchingCpfDataCoparticipant] = useState(false)
	const [operationDataLoaded, setOperationDataLoaded] = useState(false)
	const [shouldShowOperationSection, setShouldShowOperationSection] = useState(true)

	const [prazosOptions, setPrazosOptions] = useState<
		{ value: string; label: string }[]
	>([])
	
	const [participantsNumber, setParticipantsNumber] = useState<string>('')
	const [totalValue, setTotalValue] = useState<string>('')
	const [participationPercentage, setParticipationPercentage] = useState<string>('')
	const [participationValue, setParticipationValue] = useState<string>('')
	const [coparticipantParticipationValue, setCoparticipantParticipationValue] = useState<string>('')
	const [coparticipantSuggestedPercentage, setCoparticipantSuggestedPercentage] = useState<string>('')
	const [dialogOpen, setDialogOpen] = useState(false)
	const [mainFormData, setMainFormData] = useState<DpsInitialForm | null>(null)
	const [isCoparticipantDialogOpen, setIsCoparticipantDialogOpen] = useState(false)
	const [coparticipants, setCoparticipants] = useState<Coparticipant[]>([])
	const [editingCoparticipantId, setEditingCoparticipantId] = useState<string | null>(null)

	// Adicionar estado para o diálogo de confirmação
	const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
	const [isSubmitPending, setIsSubmitPending] = useState(false);
	const [pendingSubmitData, setPendingSubmitData] = useState<DpsInitialForm | null>(null);

	// Adicionar estado para controlar se o produto deve estar desabilitado
	const [isProductDisabled, setIsProductDisabled] = useState(false);

	// Adicionar este novo estado junto com os outros estados
	const [existingMainProponent, setExistingMainProponent] = useState<{
		name: string;
		cpf: string;
		participationPercentage: string;
		financingParticipation: number;
	} | null>(null);

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
	
	// Form for co-participant
	const {
		handleSubmit: handleSubmitCoparticipant,
		control: controlCoparticipant,
		reset: resetCoparticipant,
		formState: { isSubmitting: isSubmittingCoparticipant, errors: errorsCoparticipant, ...formStateRestCoparticipant },
	} = useForm<DpsCoparticipantForm>({
		resolver: valibotResolver(dpsCoparticipantForm),
		defaultValues: {
			operation: {
				operationNumber: '',
				participantsNumber: '',
				totalValue: '',
			},
			profile: {
				cpf: '',
				name: '',
				birthdate: undefined,
				profession: '',
				email: '',
				phone: '',
				socialName: '',
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
			}
		},
		disabled: isLoadingCoparticipant,
		mode: "onBlur",
		reValidateMode: "onBlur",
	})

	const formState = { ...formStateRest, errors, isSubmitting, isSubmitted }
	const coparticipantFormState = { ...formStateRestCoparticipant, errors: errorsCoparticipant, isSubmitting: isSubmittingCoparticipant }

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

	const router = useRouter()

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
				// Se já existe um proponente principal, enviamos apenas os coparticipantes

				// Array para armazenar todas as propostas de coparticipantes criadas
				const createdProposals = [];
				let allProposalsSaved = true;
				let lastError = '';

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
								address: cp.address || {},
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
								participantType: 'C' as 'C', // Coparticipante - tipagem estrita
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
				
				if (allProposalsSaved) {
					toast.success('Coparticipantes salvos com sucesso!');
					// Redirecionar para a tela de propostas
					router.push('/dps');
				} else {
					toast.error(`Alguns coparticipantes não foram salvos. Último erro: ${lastError}`);
					router.push('/dps');
				}
			} else {
				// Caso normal - enviar proponente principal e coparticipantes
				
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
					address: v.address,
					participantsNumber: v.operation.participantsNumber,
					totalValue: totalValue,
					// Campos para tratamento do proponente principal
					totalParticipants: totalParticipants,
					operationValue: totalValue,
					percentageParticipation: mainPercentage,
					financingParticipation: mainFinancingParticipation,
					participantType: 'P' as 'P', // Proponente principal - tipagem estrita
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
								address: cp.address || {},
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
								participantType: 'C' as 'C', // Coparticipante - tipagem estrita
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
				
				if (allProposalsSaved) {
					toast.success('Proposta e coparticipantes salvos com sucesso!');
					// Redirecionar para a primeira proposta criada (proponente principal)
					router.push('/dps/fill-out/form/' + mainProposalId);
				} else {
					// Mesmo com erros em alguns coparticipantes, redireciona para a proposta principal
					toast.error(`Proposta principal salva, mas alguns coparticipantes não foram salvos. Último erro: ${lastError}`);
					router.push('/dps/fill-out/form/' + mainProposalId);
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
	const handleFormSubmitClick = () => {
		console.log("Manual form submission triggered");
		const formData = getValues();
		console.log("Form data:", formData);
		
		// Verificar se todos os campos necessários estão preenchidos
		if (formData.operation.operationNumber && 
			formData.operation.participantsNumber && 
			formData.operation.totalValue) {
			
			console.log("All required fields are filled, submitting form");
			onSubmit(formData);
		} else {
			console.log("Missing required fields in operation section");
			toast.error("Preencha todos os campos obrigatórios da seção Dados da Operação");
		}
	}

	async function handleSaveAndAddCoparticipation(v: DpsInitialForm) {
		// Store the main form data to copy relevant fields to the coparticipant form
		setMainFormData(v)
		
		// Populate the coparticipant form with operation data
		const numParticipants = parseInt(v.operation.participantsNumber, 10) || 0;
		
		// Open dialog for coparticipant
		setDialogOpen(true)
	}
	
	async function onCoparticipantSubmit(v: DpsCoparticipantForm) {
		setIsLoadingCoparticipant(true)
		// Here you would post the coparticipant data to the backend
		
		console.log('Coparticipant data:', v)
		
		// Simulating API call
		setTimeout(() => {
			resetCoparticipant()
			setDialogOpen(false)
			setIsLoadingCoparticipant(false)
			// After adding coparticipant, refresh the main form or navigate
		}, 1000)
	}
	
	async function getDataByCpfForCoparticipant(cpf: string) {
		if (!validarCpf(cpf)) return
		
		setIsLoadingCoparticipant(true)
		const proponentDataRaw = await getProponentDataByCpf(cpf)
		
		if (proponentDataRaw) {
			// Process data similar to the main form
			const proponentDataBirthdateAux = proponentDataRaw?.detalhes.nascimento
				? proponentDataRaw?.detalhes.nascimento.split('/')
				: undefined

			const proponentDataBirthdate = proponentDataBirthdateAux
				? new Date(
						Number(proponentDataBirthdateAux[2]),
						Number(proponentDataBirthdateAux[1]) - 1,
						Number(proponentDataBirthdateAux[0])
				  )
				: undefined
				
			// Set data in the coparticipant form
			// Similar to the main form but with controlCoparticipant
		}
		
		setIsLoadingCoparticipant(false)
	}

	async function getDataByCpf(cpf: string) {
		if (!validarCpf(cpf)) return

		setIsLoadingData(true)
		const proponentDataRaw = await getProponentDataByCpf(cpf)

		if (proponentDataRaw) {
			const proponentDataBirthdateAux = proponentDataRaw?.detalhes.nascimento
				? proponentDataRaw?.detalhes.nascimento.split('/')
				: undefined

			const proponentDataBirthdate = proponentDataBirthdateAux
				? new Date(
						Number(proponentDataBirthdateAux[2]),
						Number(proponentDataBirthdateAux[1]) - 1,
						Number(proponentDataBirthdateAux[0])
				  )
				: undefined

			const autocompleteData = {
				cpf: proponentDataRaw?.detalhes.cpf,
				name: proponentDataRaw?.detalhes.nome,
				socialName: undefined,
				birthdate: proponentDataBirthdate,
				profession: proponentDataRaw?.detalhes.profissao,
				gender: proponentDataRaw?.detalhes.sexo,
				email: undefined,
				phone: undefined,
			}

			if (autocompleteData.name) setValue('profile.name', autocompleteData.name)
			if (autocompleteData.birthdate)
				setValue('profile.birthdate', autocompleteData.birthdate)
			if (autocompleteData.profession)
				setValue(
					'profile.profession',
					getProfissionDescription(autocompleteData.profession)
				)
			if (autocompleteData.email)
				setValue('profile.email', autocompleteData.email)
			if (autocompleteData.phone)
				setValue('profile.phone', autocompleteData.phone)
			if (autocompleteData.socialName)
				setValue('profile.socialName', autocompleteData.socialName)
			if (autocompleteData.gender)
				setValue('profile.gender', autocompleteData.gender)

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

	const handleCoparticipantSubmit = async (data: DpsCoparticipantForm) => {
		try {
			setIsLoadingCoparticipant(true)
			
			// Process coparticipant form submission
			console.log('Coparticipant form submitted:', data)
			
			// Get the percentage from the form input instead of calculating it
			const participationPercent = data.profile.participationPercentage || '0,00%';
			
			if (editingCoparticipantId) {
				// Update existing coparticipant
				setCoparticipants(prev => prev.map(cp => 
					cp.id === editingCoparticipantId 
						? {
							...cp,
							name: data.profile.name as string || '',
							cpf: data.profile.cpf as string || '',
							participationPercentage: participationPercent,
							profile: data.profile,
							address: data.address
						}
						: cp
				))
				setEditingCoparticipantId(null)
			} else {
				// Add new coparticipant to the list
				const newCoparticipant: Coparticipant = {
					id: Date.now().toString(), // Simple ID generation
					name: data.profile.name as string || '',
					cpf: data.profile.cpf as string || '',
					participationPercentage: participationPercent,
					profile: data.profile,
					address: data.address
				}
				
				setCoparticipants(prev => [...prev, newCoparticipant])
			}
			
			// Close dialog and reset form (except operation data)
			setIsCoparticipantDialogOpen(false)
			coparticipantForm.reset({
				operation: coparticipantForm.getValues().operation,
				profile: {
					cpf: '',
					name: '',
					socialName: '',
					birthdate: undefined,
					profession: '',
					email: '',
					phone: '',
					gender: '',
					participationPercentage: '',
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
			})
			
			toast.success(editingCoparticipantId 
				? 'Co-participante atualizado com sucesso!' 
				: 'Co-participante adicionado com sucesso!'
			)
			setIsLoadingCoparticipant(false)
		} catch (error) {
			console.error(error)
			toast.error('Erro ao adicionar co-participante. Tente novamente.')
			setIsLoadingCoparticipant(false)
		}
	}

	const handleEditCoparticipant = (coparticipant: Coparticipant) => {
		// Set the form values with the coparticipant data
		coparticipantForm.reset({
			operation: getValues().operation,
			profile: coparticipant.profile as DpsProfileFormType,
			address: coparticipant.address as DpsAddressFormType,
		})
		
		// Set the ID of the coparticipant being edited
		setEditingCoparticipantId(coparticipant.id)
		
		// Open the dialog
		setIsCoparticipantDialogOpen(true)
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
			toast.error('Este CPF pertence ao proponente principal. Cada participante deve ter um CPF único.');
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

	const getCoparticipantDataByCpf = async (cpf: string) => {
		try {
			// Verificar se o CPF é válido
			if (!validarCpf(cpf)) {
				toast.error('CPF inválido. Verifique o número informado.');
				return;
			}
			
			// A validação de CPF duplo já é feita pela função validateCpfNotDuplicated
			// Verifica novamente aqui para garantir que o fluxo seja interrompido
			if (!validateCpfNotDuplicated(cpf)) {
				// Limpar o campo CPF após validação falhar
				coparticipantForm.setValue('profile.cpf', '');
				return;
			}
			
			setFetchingCpfDataCoparticipant(true);
			
			// Implement CPF data fetching for co-participant
			// This is just a placeholder - implement actual API call
			await new Promise(resolve => setTimeout(resolve, 500));
			
			// Example auto-filling data
			coparticipantForm.setValue('profile.name', 'Nome do Co-participante');
			coparticipantForm.setValue('profile.email', 'coparticipante@example.com');
			
			setFetchingCpfDataCoparticipant(false);
		} catch (error) {
			console.error(error);
			toast.error('Erro ao buscar dados do CPF. Tente novamente.');
			setFetchingCpfDataCoparticipant(false);
		}
	}

	useEffect(() => {
		if (typeof watchBirthdate !== 'undefined' && watchBirthdate !== null) {
			// Calculate age here if needed
		}
	}, [watchBirthdate])

	// Função para validar se o percentual de participação excede 100%
	const validateParticipationPercentage = (value: string) => {
		// Extrair percentual do valor formatado (ex: "25,00%" => 25.00)
		const newPercentage = parseFloat(value.replace('%', '').replace(',', '.')) || 0;
		
		// Calcular a soma dos percentuais já existentes
		let existingTotal = 0;
		
		// Percentual do proponente principal
		const profilePercentage = getValues().profile.participationPercentage || '';
		const mainPercentage = parseFloat(profilePercentage.replace('%', '').replace(',', '.')) || 0;
		existingTotal += mainPercentage;
		
		// Percentuais dos coparticipantes (excluindo o que está sendo editado)
		coparticipants.forEach(cp => {
			// Se estiver editando, não soma o percentual atual do coparticipante
			if (editingCoparticipantId && cp.id === editingCoparticipantId) {
				return;
			}
			
			const cpPercentage = parseFloat(cp.participationPercentage.replace('%', '').replace(',', '.')) || 0;
			existingTotal += cpPercentage;
		});
		
		// Verifica se o novo percentual faria o total exceder 100%
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
			
			// Validar se o percentual excede 100%
			const validation = validateParticipationPercentage(value);
			if (!validation.valid) {
				toast.error(validation.message);
				// Sugerir o valor máximo disponível
				setValue('profile.participationPercentage', validation.availablePercentage);
				
				// Usar o novo valor para calcular
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

	// Função para buscar os dados da operação pelo número
	const fetchOperationData = async (operationNumber: string) => {
		if (!operationNumber || operationNumber.length < 2) {
			return;
		}

		try {
			setIsLoadingOperationData(true);
			console.log(`Buscando dados da operação ${operationNumber}`);
			
			// Fazer a chamada para a API
			const response = await getParticipantsByOperation(token, operationNumber);
			
			if (response && response.success) {
				// Se encontrou dados da operação
				const participantData = response.data;
				
				if (participantData && participantData.length > 0) {
					// Existem participantes cadastrados - ocultar seção de dados da operação
					setShouldShowOperationSection(false);
					
					// Usando o primeiro registro para dados da operação
					const mainData = participantData[0];
					
					// Preencher os dados da operação (mesmo que ocultos, precisamos para submit)
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
					
					// Preencher dados do produto (se vierem na resposta)
					// Verificação segura para cada campo do produto
					if ('productId' in mainData && mainData.productId) {
						setValue('product.product', String(mainData.productId));
					}
					if ('deadlineId' in mainData && mainData.deadlineId) {
						setValue('product.deadline', String(mainData.deadlineId));
					}
					if ('propertyTypeId' in mainData && mainData.propertyTypeId) {
						setValue('product.propertyType', String(mainData.propertyTypeId));
					}
					if ('capitalMIP' in mainData && mainData.capitalMIP) {
						const capitalMIPValue = Number(mainData.capitalMIP);
						if (!isNaN(capitalMIPValue)) {
							const mipFormatted = maskToBrlCurrency({
								nextState: {
									value: Math.floor(capitalMIPValue * 100).toString(),
									selection: { start: 0, end: 0 }
								},
								previousState: {
									value: "",
									selection: { start: 0, end: 0 }
								},
								currentState: {
									value: `R$ ${Math.floor(capitalMIPValue * 100).toString()}`,
									selection: { start: 0, end: 0 }
								}
							})?.value || "";
							setValue('product.mip', mipFormatted);
						}
					}
					if ('capitalDFI' in mainData && mainData.capitalDFI) {
						const capitalDFIValue = Number(mainData.capitalDFI);
						if (!isNaN(capitalDFIValue)) {
							const dfiFormatted = maskToBrlCurrency({
								nextState: {
									value: Math.floor(capitalDFIValue * 100).toString(),
									selection: { start: 0, end: 0 }
								},
								previousState: {
									value: "",
									selection: { start: 0, end: 0 }
								},
								currentState: {
									value: `R$ ${Math.floor(capitalDFIValue * 100).toString()}`,
									selection: { start: 0, end: 0 }
								}
							})?.value || "";
							setValue('product.dfi', dfiFormatted);
						}
					}
					
					// Variável para rastrear se encontramos um proponente principal
					let foundMainProponent = false;
					
					// Carregar os participantes na lista
					const newCoparticipants: Coparticipant[] = [];
					
					// Calcular o percentual total usado e o disponível
					let totalPercentageUsed = 0;
					
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
						
						// Compatibilidade com API: verificar se temos customer ou Customer
						let customerData = undefined;
						if ('customer' in participant && participant.customer) {
							customerData = participant.customer;
						} else if (participant && typeof participant === 'object') {
							// Usar casting explícito para acessar propriedades não tipadas
							const anyParticipant = participant as any;
							if (anyParticipant.Customer) {
								customerData = anyParticipant.Customer;
							}
						}
						
						if (!customerData) {
							console.error('Dados do cliente não encontrados no participante:', participant);
							return;
						}
						
						// Compatibilidade com API: verificar se temos name ou Name
						const customerName = typeof customerData === 'object' && customerData !== null
							? ('name' in customerData 
								? String(customerData.name) 
								: ('Name' in customerData ? String((customerData as any).Name) : ''))
							: '';
						
						// Compatibilidade com API: verificar se temos document
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
							
							// Não atribuímos mais valores ao formulário principal
						} else if (participant.participantType === 'C') {
							// É um coparticipante - continua igual
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
					
					// Calcular percentual disponível para novos coparticipantes
					const availablePercentage = 100 - totalPercentageUsed;
					
					// Se encontramos um proponente principal, estamos adicionando um coparticipante
					if (foundMainProponent) {
						toast.success(`Dados da operação ${operationNumber} carregados com sucesso! Existem ${newCoparticipants.length} coparticipante(s) e um proponente principal já cadastrados. Percentual disponível: ${availablePercentage.toFixed(2).replace('.', ',')}%`);
						
						// Configura para mostrar a tela de participantes e desabilitar apenas os campos do produto (não do proponente)
						setOperationDataLoaded(true); // Mantemos isso para exibir a lista de participantes
						setIsProductDisabled(true); // Apenas o produto deve ser desabilitado
						
						// Preparar sugestão de percentual para o novo coparticipante
						// Verifica se ainda há espaço para mais participantes
						if (availablePercentage > 0) {
							const declaredParticipants = parseInt(mainData.totalParticipants.toString(), 10) || 0;
							const participantsRegistered = 1 + newCoparticipants.length; // Proponente + coparticipantes existentes
							const participantsLeft = declaredParticipants - participantsRegistered;
							
							if (participantsLeft > 0) {
								// Se ainda faltam coparticipantes, sugerir divisão igual do percentual disponível
								const suggestedPercentage = (availablePercentage / participantsLeft).toFixed(2).replace('.', ',') + '%';
								setCoparticipantSuggestedPercentage(suggestedPercentage);
								
								// Se ainda não temos todos os participantes declarados, sugerir adicionar coparticipante
								if (participantsRegistered < declaredParticipants) {
									setTimeout(() => {
										toast.success(`Ainda faltam ${participantsLeft} coparticipante(s). Clique em "Adicionar Coparticipante" para continuar.`);
									}, 1500);
								}
							} else {
								toast.success(`Todos os participantes já estão cadastrados (${participantsRegistered}/${declaredParticipants}).`);
							}
						} else {
							toast.error(`Atenção: Não há percentual disponível para novos coparticipantes. O total já atinge 100%.`);
						}
					} else {
						// Não encontramos um proponente principal
						toast.success(`Operação ${operationNumber} encontrada, mas sem proponente principal. Preencha os dados do proponente principal.`);
						// Habilitar os campos da operação para permitir edição
						setOperationDataLoaded(false);
						setIsProductDisabled(false);
						setShouldShowOperationSection(true); // Mostrar a seção quando não tem proponente principal
					}
				} else {
					// Retornou success, mas sem participantes 
					toast.success(`Operação ${operationNumber} encontrada, mas sem participantes cadastrados. Preencha os dados do proponente principal.`);
					// Habilitar os campos da operação para permitir edição
					setOperationDataLoaded(false);
					setIsProductDisabled(false);
					setShouldShowOperationSection(true);
				}
			} else {
				// Se não encontrou dados ou ocorreu erro
				// Reinicializar campos
				setValue('operation.participantsNumber', '');
				setValue('operation.totalValue', '');
				setParticipantsNumber('');
				setTotalValue('');
				setOperationDataLoaded(false);
				setIsProductDisabled(false);
				setShouldShowOperationSection(true);
			}
		} catch (error) {
			console.error('Erro ao buscar dados da operação:', error);
			// No caso de erro, garantir que os campos estejam habilitados
			setOperationDataLoaded(false);
			setIsProductDisabled(false);
			setShouldShowOperationSection(true);
		} finally {
			setIsLoadingOperationData(false);
		}
	};

	// Componente auxiliar para o botão Salvar com tooltip
	const SaveButton = ({ 
		isSubmitting, 
		isLoading, 
		isOperationComplete 
	}: { 
		isSubmitting: boolean;
		isLoading: boolean;
		isOperationComplete: boolean;
	}) => {
		const isDisabled = isSubmitting || isLoading || !isOperationComplete;
		
		console.log("SaveButton rendering with:");
		console.log("- isSubmitting:", isSubmitting);
		console.log("- isLoading:", isLoading);
		console.log("- isOperationComplete:", isOperationComplete);
		console.log("- Button disabled:", isDisabled);

		// Verificar os valores dos campos da operação
		const operationValues = {
			operationNumber: getValues().operation.operationNumber,
			participantsNumber: getValues().operation.participantsNumber,
			totalValue: getValues().operation.totalValue,
		};
		console.log("Operation values:", operationValues);

		return (
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<div>
							<Button
								type="button" // Mudamos para button para evitar a submissão padrão do formulário
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
					{!isOperationComplete && (
						<TooltipContent>
							<p>Preencha todos os campos da seção "Dados da Operação" para habilitar o salvamento</p>
						</TooltipContent>
					)}
				</Tooltip>
			</TooltipProvider>
		);
	};

	return (
		<form
			onSubmit={e => {
				console.log("Form submission event triggered");
				console.log("Form values:", getValues());
				console.log("Form errors:", formState.errors);
				
				// Chamar o manipulador do formulário
				 handleSubmit(onSubmit)(e);
			}}
			className={cn(
				'flex flex-col gap-6 w-full',
				isLoading ? 'opacity-60 pointer-events-none' : ''
			)}
		>
			<toast.ToastContainer />
			{shouldShowOperationSection && (
				<div className="p-9 w-full max-w-7xl mx-auto bg-white rounded-3xl">
					<DpsOperationForm
						data={data?.operation as Partial<DpsOperationFormType>}
						control={control}
						formState={formState}
						onParticipantsChange={setParticipantsNumber}
						onTotalValueChange={setTotalValue}
						onOperationNumberBlur={fetchOperationData}
						isLoadingOperationData={isLoadingOperationData}
						disabled={false}
					/>
				</div>
			)}
			
			{operationDataLoaded && (coparticipants.length > 0 || getValues().profile.name) && (
				<div className="p-9 w-full max-w-7xl mx-auto bg-white rounded-3xl mt-6">
					<h3 className="text-primary text-xl font-medium mb-4">Participantes da Operação</h3>
					
					<div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
						<p className="text-blue-700">
							Esta operação já possui {coparticipants.length + (existingMainProponent ? 1 : 0)} participante(s) cadastrado(s).
							Preencha o formulário abaixo para adicionar um novo coparticipante.
						</p>
						{existingMainProponent && (
							<p className="text-blue-700 mt-2">
								<strong>Atenção:</strong> O proponente principal já existe. Seus dados serão mantidos e você está adicionando apenas um novo coparticipante.
							</p>
						)}
					</div>
					
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
						<div className="grid grid-cols-4 gap-4 py-2 px-4 bg-gray-100 rounded-t-lg font-medium text-gray-600">
							<div>Nome</div>
							<div>CPF</div>
							<div>Participação</div>
							<div>Tipo</div>
						</div>
						
						{existingMainProponent ? (
							<div className="grid grid-cols-4 gap-4 py-3 px-4 border-b hover:bg-gray-50">
								<div className="font-medium">{existingMainProponent.name}</div>
								<div>{existingMainProponent.cpf}</div>
								<div>{existingMainProponent.participationPercentage}</div>
								<div className="text-primary">Proponente</div>
							</div>
						) : getValues().profile.name && (
							<div className="grid grid-cols-4 gap-4 py-3 px-4 border-b hover:bg-gray-50">
								<div className="font-medium">{getValues().profile.name}</div>
								<div>{getValues().profile.cpf}</div>
								<div>{getValues().profile.participationPercentage || '0,00%'}</div>
								<div className="text-primary">Proponente</div>
							</div>
						)}
						
						{coparticipants.map((coparticipant) => (
							<div key={coparticipant.id} className="grid grid-cols-4 gap-4 py-3 px-4 border-b hover:bg-gray-50">
								<div className="font-medium">{coparticipant.name}</div>
								<div>{coparticipant.cpf}</div>
								<div>{coparticipant.participationPercentage}</div>
								<div className="text-primary">Coparticipante</div>
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

			<div className="p-9 w-full max-w-7xl mx-auto bg-white rounded-3xl">
				<DpsProfileForm
					data={data?.profile as Partial<DpsProfileFormType>}
					control={control as any}
					formState={formState}
					getDataByCpf={getDataByCpf}
					disabled={isLoadingData}
					participationPercentage={participationPercentage}
					participationValue={participationValue}
					onParticipationPercentageBlur={handleParticipationPercentageBlur}
				/>
			</div>

			<div className="p-9 w-full max-w-7xl mx-auto bg-white rounded-3xl">
				<DpsProductForm
					data={data?.product as Partial<DpsProductFormType>}
					prazosOptions={prazosOptions}
					productOptions={productOptions}
					tipoImovelOptions={tipoImovelOptions}
					control={control}
					formState={formState}
					disabled={isProductDisabled}
				/>
			</div>
			
			<div className="p-9 w-full max-w-7xl mx-auto bg-white rounded-3xl">
				<DpsAddressForm
					data={data?.address as Partial<DpsAddressFormType>}
					control={control as any}
					formState={formState}
					cepDataLoader={loadAddressByCep}
					disabled={false}
				/>
			</div>
			
			<div className="flex gap-4 mt-10">
				<SaveButton 
					isSubmitting={isSubmitting} 
					isLoading={isLoading} 
					isOperationComplete={!!(
						getValues().operation.operationNumber && 
						getValues().operation.participantsNumber && 
						getValues().operation.totalValue
					)} 
				/>
				
				{getValues().operation.participantsNumber && 
				 parseInt(getValues().operation.participantsNumber) > 1 && 
				 getValues().operation.operationNumber && 
				 getValues().operation.totalValue && (
					<Button
						type="button"
						className="w-auto"
						disabled={isSubmitting || isLoading}
						onClick={saveAndAddCoparticipant}
					>
						Adicionar Coparticipante
						{isLoading ? (
							<Loader2Icon className="ml-2 h-4 w-4 animate-spin" />
						) : null}
					</Button>
				)}
				
				{/* Botão para forçar o salvamento ignorando as verificações */}
				<Button
					type="button"
					className="w-auto bg-orange-500 hover:bg-orange-600"
					disabled={isSubmitting || isLoading || !(
						getValues().operation.operationNumber && 
						getValues().operation.participantsNumber && 
						getValues().operation.totalValue
					)}
					onClick={() => {
						console.log("Force save button clicked");
						// Chamar diretamente o submitForm com os valores atuais do formulário
						submitForm(getValues());
					}}
				>
					Forçar Salvamento
					{isLoading ? (
						<Loader2Icon className="ml-2 h-4 w-4 animate-spin" />
					) : null}
				</Button>
			</div>
			
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
								disabled={isLoadingCoparticipant}
							>
								Cancelar
							</Button>
							<Button 
								type="submit" 
								disabled={isLoadingCoparticipant}
							>
								{isLoadingCoparticipant ? (
									<>
										<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
										Salvando...
									</>
								) : (
									editingCoparticipantId ? 'Atualizar Co-participante' : 'Salvar Co-participante'
								)}
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
						<DialogTitle>Confirmar submissão</DialogTitle>
						<DialogDescription>
							{pendingSubmitData && (() => {
								// Calcular corretamente o número atual de participantes
								const declaredParticipants = parseInt(pendingSubmitData.operation.participantsNumber, 10) || 0;
								
								// O problema acontece quando o usuário informa um número (declaredParticipants)
								// e o número real de participantes é diferente (currentRegisteredParticipants + 1)
								
								// Participantes já cadastrados antes da operação atual
								// - Se existingMainProponent: são os coparticipantes existentes + o proponente principal
								// - Se não: são apenas os coparticipantes, pois o proponente principal está sendo cadastrado agora
								
								let currentRegisteredParticipants;
								if (existingMainProponent) {
									// Com proponente principal existente: proponente (1) + coparticipantes já cadastrados
									currentRegisteredParticipants = 1 + coparticipants.length;
								} else {
									// Sem proponente principal existente: apenas coparticipantes cadastrados
									currentRegisteredParticipants = coparticipants.length;
								}
								
								// Adicionar +1 para o participante que está sendo cadastrado agora
								const totalAfterSubmission = currentRegisteredParticipants + 1;
								
								// Texto simples da mensagem sem detalhes entre parênteses
								return `Você informou ${declaredParticipants} participantes no total, mas serão ${totalAfterSubmission}. Deseja continuar mesmo assim?`;
							})()}
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

function getDigits(value: string) {
	return value.replace(/[^0-9]/g, '')
}
