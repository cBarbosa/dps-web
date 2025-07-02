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
import React, { useEffect, useState, useMemo, useCallback } from 'react'
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
	createDpsProductFormWithAge
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

// Função para criar schema dinâmico baseado na idade
const createDynamicSchema = (proponentAge: number | null) => object({
	operation: dpsOperationForm,
	profile: dpsProfileForm,
	product: createDpsProductFormWithAge(proponentAge),
	address: dpsAddressForm,
})

export const dpsInitialForm = object({
	operation: dpsOperationForm,
	profile: dpsProfileForm,
	product: dpsProductForm,
	address: dpsAddressForm,
})

// Form for co-participant without product data and address data
export const dpsCoparticipantForm = object({
	operation: dpsOperationForm,
	profile: dpsProfileForm,
	// address: dpsAddressForm, // Removido - endereço será o mesmo para toda a operação
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

	// Adicionar estado para submissão
	const [isLoading, setIsLoading] = useState(false)
	const [isLoadingData, setIsLoadingData] = useState(false)
	const [isLoadingOperationData, setIsLoadingOperationData] = useState(false)
	const [isLoadingCoparticipant, setIsLoadingCoparticipant] = useState(false)
	const [fetchingCpfDataCoparticipant, setFetchingCpfDataCoparticipant] = useState(false)
	const [operationDataLoaded, setOperationDataLoaded] = useState(false)
		const [showOtherSections, setShowOtherSections] = useState(false) // Controla a visibilidade das demais seções
	const [showOperationGuidance, setShowOperationGuidance] = useState(false); // Adicionar estado para orientação
	const [isOperationFull, setIsOperationFull] = useState(false)

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

	// Estado para controlar se é o último participante sendo cadastrado
	const [isLastParticipant, setIsLastParticipant] = useState<boolean>(false);

	// Estado para o schema dinâmico baseado na idade
	const [currentSchema, setCurrentSchema] = useState(() => createDynamicSchema(null));

	// Memoizar o resolver para que seja recriado quando o schema mudar
	const currentResolver = useMemo(() => {
		return valibotResolver(currentSchema);
	}, [currentSchema]);

	const {
		handleSubmit,
		getValues,
		trigger,
		setValue,
		watch,
		control,
		reset,
		setError,
		clearErrors,
		formState: { isSubmitting, isSubmitted, errors, ...formStateRest },
	} = useForm<DpsInitialForm>({
		resolver: currentResolver,
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
	
	// Calcular idade do proponente
	const proponentAge = useMemo(() => {
		return calculateAge(watchBirthdate);
	}, [watchBirthdate]);

	// useEffect para atualizar o schema quando a idade mudar
	const memoizedGetValues = useCallback(getValues, []);

	useEffect(() => {
		const newSchema = createDynamicSchema(proponentAge);
		setCurrentSchema(newSchema);
		
		// Forçar revalidação do campo prazo quando a idade mudar
		if (proponentAge !== null && memoizedGetValues().product.deadline) {
			// Usar setTimeout para garantir que o schema seja atualizado primeiro
			setTimeout(() => {
				trigger('product.deadline');
			}, 0);
		}
	}, [proponentAge, trigger, memoizedGetValues]);

	// useEffect para atualizar as opções de prazo baseado na idade
	useEffect(() => {
		if(isProductDisabled) return;

		if (proponentAge === null) return

		switch (true) {
			case proponentAge < 18:
				setPrazosOptions([])
				break
			case proponentAge <= 50:
				setPrazosOptions(prazosOptionsProp)
				break
			case proponentAge <= 55:
				setPrazosOptions(
					prazosOptionsProp.filter(prazo => +getDigits(prazo.label) <= 180)
				)
				break
			case proponentAge <= 60:
				setPrazosOptions(
					prazosOptionsProp.filter(prazo => +getDigits(prazo.label) <= 150)
				)
				break
			case proponentAge <= 65:
				setPrazosOptions(
					prazosOptionsProp.filter(prazo => +getDigits(prazo.label) <= 84)
				)
				break
			case proponentAge <= 80:
				setPrazosOptions(
					prazosOptionsProp.filter(prazo => +getDigits(prazo.label) <= 60)
				)
				break
			default:
				setPrazosOptions([])
				break
		}
	}, [proponentAge, prazosOptionsProp])

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

			// APENAS NOVO PREENCHIMENTO - deve cadastrar como proponente principal (tipo "P")
			
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
				deadlineMonths: Number(v.product.deadline),
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
								zipcode: v.address.zipcode || '', // Usar endereço da operação principal
								street: v.address.street || '',
								number: v.address.number || '',
								complement: v.address.complement || '',
								district: v.address.district || '',
								city: v.address.city || '',
								state: v.address.state || ''
							},
							productId: v.product.product,
							deadlineMonths: Number(v.product.deadline),
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
		} catch (error) {
			console.error('Erro ao processar submissão:', error);
			toast.error('Erro ao processar a submissão. Verifique os dados e tente novamente.');
			setIsLoading(false);
		}
	};

	async function onSubmit(v: DpsInitialForm) {
		try {
			// Usar setIsLoading em vez de setIsSubmitting para controlar o estado de envio
			setIsLoading(true);
			
			// Verificar se a idade permite o preenchimento de DPS
			if (proponentAge !== null && (proponentAge < 18 || proponentAge > 80)) {
				const ageMessage = proponentAge < 18 
					? 'Não é possível contratar DPS para menores de 18 anos.'
					: 'Não é possível contratar DPS para maiores de 80 anos.';
				toast.error(ageMessage);
				setIsLoading(false);
				return;
			}
			
			// Logging para depuração
			console.log("Form submission data:", v);
			
			// NOVA VALIDAÇÃO: Não permitir continuidade de operações existentes
			if (operationDataLoaded && existingMainProponent) {
				toast.error('Não é possível dar continuidade a operações cadastradas previamente. Por favor, inicie uma nova operação.');
				setIsLoading(false);
				return;
			}
			
			// Verificar se há erros no campo percentual de participação
			const percentErrors = formState.errors?.profile?.participationPercentage;
			if (percentErrors) {
				// Se houver erro no percentual, exibir o erro e impedir o envio
				toast.error(typeof percentErrors.message === 'string' ? percentErrors.message : 'Percentual de participação inválido');
					setIsLoading(false);
					return;
				}

			// Validar o percentual de participação antes de salvar
			if (participantsNumber !== '1') {
				const percentValue = v.profile.participationPercentage;
				const validationResult = validateParticipationPercentage(percentValue);
				
				if (!validationResult.valid) {
					// Se a validação falhar, exibir erro e impedir o salvamento
					setError('profile.participationPercentage', {
						type: 'manual',
						message: validationResult.message
					});
					toast.error(validationResult.message);
					setIsLoading(false);
					return;
				}
			}
			
			// Verificar se a seção do produto está desabilitada
			if (isProductDisabled) {
				console.log("Product section is disabled, skipping product validation");
			}
			
			// NOVAS VALIDAÇÕES PARA OPERAÇÕES COM MÚLTIPLOS PARTICIPANTES
			const declaredParticipants = parseInt(v.operation.participantsNumber, 10) || 0;
			
			if (declaredParticipants > 1) {
				// Validação 1: Total de participantes não pode ser maior que o número declarado
				const actualParticipants = 1 + coparticipants.length; // +1 pelo proponente principal
				
				if (actualParticipants > declaredParticipants) {
					toast.error(`Número de participantes cadastrados (${actualParticipants}) excede o número declarado (${declaredParticipants}). Ajuste o número de participantes ou remova co-participantes.`);
					setIsLoading(false);
					return;
				}
				
				// Validação 2: Para operações com múltiplos participantes, todos devem estar cadastrados
				if (actualParticipants !== declaredParticipants) {
					toast.error(`Para operações com ${declaredParticipants} participantes, todos devem estar cadastrados. Atualmente há ${actualParticipants} participante(s). Adicione ${declaredParticipants - actualParticipants} co-participante(s).`);
					setIsLoading(false);
					return;
				}
				
				// Validação 3: A soma dos percentuais deve ser exatamente 100%
				const totalPercentage = calculateTotalParticipation();
				const totalPercentageNumber = parseFloat(totalPercentage.replace('%', '').replace(',', '.'));
				
				if (Math.abs(totalPercentageNumber - 100) > 0.01) { // Permitir pequena diferença por arredondamento
					toast.error(`A soma dos percentuais de participação deve ser exatamente 100%. Total atual: ${totalPercentage}`);
					setIsLoading(false);
					return;
				}
			}
		
		console.log("Proceeding with form submission");
		// Prosseguir apenas com NOVO PREENCHIMENTO (sem continuidade de operações existentes)
		await submitForm(v);
		} catch (error) {
			console.error('Erro ao processar envio do formulário:', error);
			toast.error('Ocorreu um erro ao salvar os dados. Tente novamente.');
			setIsLoading(false);
		}
	}

	// Modificar o diálogo de confirmação para incluir uma verificação de formulário válido
	const showConfirmDialog = (v: DpsInitialForm) => {
		// Verificar se o formulário está completamente preenchido e válido
		const isOperationValid = !!(
			v.operation.operationNumber && 
			v.operation.participantsNumber && 
			v.operation.totalValue
		);
		
		const isProfileValid = !!(
			v.profile.cpf &&
			v.profile.name &&
			v.profile.birthdate &&
			v.profile.email &&
			v.profile.phone &&
			v.profile.gender &&
			v.profile.participationPercentage
		);
		
		const isProductValid = !!(
			v.product.product &&
			v.product.deadline &&
			v.product.propertyType &&
			v.product.mip &&
			v.product.dfi
		);
		
		const isAddressValid = !!(
			v.address.zipcode &&
			v.address.street &&
			v.address.number &&
			v.address.district &&
			v.address.city &&
			v.address.state
		);
		
		const isFormValid = isOperationValid && isProfileValid && isProductValid && isAddressValid;
		
		if (!isFormValid) {
			console.log("Form is not valid, can't show confirmation dialog");
			// Identificar e mostrar mensagem sobre campos faltantes
			if (!isOperationValid) {
				toast.error("Preencha corretamente todos os campos da seção Dados da Operação");
			} else if (!isProfileValid) {
				toast.error("Preencha corretamente todos os campos da seção Dados do Proponente");
			} else if (!isProductValid) {
				toast.error("Preencha corretamente todos os campos da seção Dados do Produto");
			} else if (!isAddressValid) {
				toast.error("Preencha corretamente todos os campos da seção Dados de Endereço");
			}
			return false;
		}
		
		// Se o formulário está válido, armazenar os dados e abrir o diálogo
		setPendingSubmitData(v);
		setIsSubmitPending(true);
		setIsConfirmDialogOpen(true);
		return true;
	};

	// Adicionar um manipulador direto para o botão de submissão
	const handleFormSubmitClick = async () => {
		// Ativar o estado de loading
		setIsLoading(true);

		try {
			// Verificar se o percentual total está dentro do limite (não excede 100%)
			const totalPercentage = calculateTotalParticipation();
			const totalPercentageNumber = parseFloat(totalPercentage.replace('%', '').replace(',', '.'));
			
			if (totalPercentageNumber > 100) {
				toast.error(`O percentual total de participação (${totalPercentage}) excede 100%. Ajuste os percentuais antes de salvar.`);
				setIsLoading(false);
				return;
			}
			
			// Verificar se é o último participante (quando o número de participantes declarados é igual ao número atual)
			const declaredParticipants = parseInt(getValues().operation.participantsNumber, 10) || 0;
			const currentParticipants = coparticipants.length + 1; // +1 pelo proponente principal
			
			// Se for o último participante, o total deve ser exatamente 100%
			if (declaredParticipants === currentParticipants && totalPercentageNumber !== 100) {
				toast.error(`O percentual total deve ser exatamente 100% quando todos os participantes estão cadastrados. Total atual: ${totalPercentage}`);
				setIsLoading(false);
				return;
			}

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
				await onSubmit(formData);
		} else {
			console.log("Form validation failed");
				
				// Desativar o estado de loading se a validação falhar
				setIsLoading(false);
			
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
		} catch (error) {
			console.error("Erro ao processar formulário:", error);
			toast.error("Ocorreu um erro ao processar o formulário. Tente novamente.");
			setIsLoading(false);
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

		// Verificar se o CPF já está cadastrado como participante (proponente principal ou coparticipante)
		const mainProponentCpf = existingMainProponent?.cpf.replace(/\D/g, '') || getValues().profile.cpf.replace(/\D/g, '');

		if (cleanCpf === mainProponentCpf || coparticipants.some(cp => cp.cpf.replace(/\D/g, '') === cleanCpf && (!editingCoparticipantId || cp.id !== editingCoparticipantId))) {
			console.log(`CPF ${cleanCpf} já consta na lista de participantes.`);

			// Definir erro no campo CPF para impedir o prosseguimento
			coparticipantForm.setError('profile.cpf', { 
				type: 'manual', 
				message: `CPF ${cpf} já consta na lista de participantes.` 
			});

			// Limpar dados preenchidos automaticamente para evitar confusão
			coparticipantForm.setValue('profile.name', '');
			coparticipantForm.setValue('profile.birthdate', null as any);
			coparticipantForm.setValue('profile.profession', '');
			coparticipantForm.setValue('profile.gender', '');

			// Mostrar mensagem de erro mas não fechar o diálogo
			toast.error(`CPF ${cpf} já consta na lista de participantes.`);

			return;
		}

		// Limpar qualquer erro existente de CPF se o CPF é válido e único
		coparticipantForm.clearErrors('profile.cpf');

		setIsLoadingCoparticipant(true);

		// Armazenar o CPF como o último consultado
		setLastQueriedCoparticipantCpf(cleanCpf);

		try {
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

				// Preencher os dados do coparticipante com os resultados obtidos
				if (proponentDataRaw?.detalhes.nome) {
					coparticipantForm.setValue('profile.name', proponentDataRaw.detalhes.nome);
				}

				if (proponentDataBirthdate) {
					coparticipantForm.setValue('profile.birthdate', proponentDataBirthdate);
				}

				// if (proponentDataRaw?.detalhes.profissao) {
				// 	coparticipantForm.setValue(
				// 		'profile.profession',
				// 		getProfissionDescription(proponentDataRaw.detalhes.profissao)
				// 	);
				// }

				if (proponentDataRaw?.detalhes.sexo) {
					coparticipantForm.setValue('profile.gender', proponentDataRaw.detalhes.sexo);
				}

				// Atualizar o formulário para refletir as mudanças
				coparticipantForm.trigger();
				console.log("Dados do coparticipante preenchidos com sucesso:", proponentDataRaw);
			} else {
				console.log("Não foram encontrados dados para o CPF:", cpf);
			}
		} catch (error) {
			console.error("Erro ao buscar dados por CPF:", error);
			toast.error("Ocorreu um erro ao buscar dados por CPF. Tente novamente.");
		} finally {
		setIsLoadingCoparticipant(false);
		}
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

		const mainProponent = existingMainProponent;

		// Verificar se o CPF já está cadastrado como participante
		if(coparticipants.find(c => c.cpf.replace(/\D/g, '') === cleanCpf) || mainProponent?.cpf.replace(/\D/g, '') === cleanCpf) {
			console.log(`CPF ${cleanCpf} já consta na lista de participantes, não é possível cadastrar novamente.`);
			
			// Definir erro no campo CPF para impedir o prosseguimento
			setError('profile.cpf', { 
				type: 'manual', 
				message: `CPF ${cpf} já consta na lista de participantes, não é possível cadastrar novamente.` 
			});
			
			// Limpar dados preenchidos automaticamente para evitar confusão
			setValue('profile.name', '');
			setValue('profile.birthdate', null as any);
			setValue('profile.profession', '');
			setValue('profile.gender', '');
			
			// Mostrar mensagem de erro sem fechar diálogos
			toast.error(`CPF ${cpf} já consta na lista de participantes, não é possível cadastrar novamente.`);
			
			return;
		}
		
		// Limpar qualquer erro existente de CPF se o CPF é válido e único
		setError('profile.cpf', { type: 'manual', message: undefined });
		
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
				// address: dpsAddressForm, // Removido - endereço será o mesmo para toda a operação
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
		try {
			await handleAddress(cep, (field, value) => {
			// Usando as propriedades específicas com tipos corretos
			if (field === 'street') setValue('address.street', value);
			if (field === 'city') setValue('address.city', value);
			if (field === 'state') setValue('address.state', value);
			if (field === 'district') setValue('address.district', value);
		});
			
			// Após preencher os dados do endereço, validar os campos
			console.log("Validando campos de endereço após preenchimento automático pelo CEP");
			
			// Disparar validação para os campos preenchidos
			trigger('address.street');
			trigger('address.city');
			trigger('address.state');
			trigger('address.district');
			
			// Validar o formulário de endereço completo
			trigger('address');
			
			// Verificar se há erros após a validação
			const addressErrors = errors.address;
			if (addressErrors) {
				console.log("Erros encontrados na validação do endereço:", addressErrors);
				
				// Informar campos que ainda precisam ser preenchidos
				if (addressErrors.number) {
					toast.error("Por favor, preencha o número do endereço");
				}
			} else {
				console.log("Validação de endereço concluída sem erros");
			}
		} catch (error) {
			console.error("Erro ao carregar ou validar endereço:", error);
		}
	};
	
	const loadCoparticipantAddressByCep = async (cep: string): Promise<void> => {
		// Função removida - co-participantes não precisam mais de endereço separado
		// O endereço do imóvel será o mesmo para toda a operação
		return Promise.resolve();
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
			// Verificar se o CPF já consta como duplicado
			const cpfErrors = coparticipantForm.formState.errors?.profile?.cpf;
			if (cpfErrors) {
				// Se houver erro de CPF, exibir o erro e impedir o envio
				toast.error(typeof cpfErrors.message === 'string' ? cpfErrors.message : 'CPF inválido ou já cadastrado');
				return;
			}
			
			// Se for o último participante, NÃO validar o percentual pois foi preenchido automaticamente
			if (!isLastParticipant) {
				// Verificar se há erros no campo percentual de participação apenas para participantes que não são o último
				const percentErrors = coparticipantForm.formState.errors?.profile?.participationPercentage;
				if (percentErrors) {
					// Se houver erro no percentual, exibir o erro e impedir o envio
					toast.error(typeof percentErrors.message === 'string' ? percentErrors.message : 'Percentual de participação inválido');
					return;
				}
				
				// Validar o percentual de participação antes de salvar apenas se não for o último participante
				const percentValue = formData.profile.participationPercentage;
				const validationResult = validateCoparticipantPercentage(percentValue);
				
				if (!validationResult.valid) {
					// Se a validação falhar, exibir erro e impedir o salvamento
					coparticipantForm.setError('profile.participationPercentage', {
						type: 'manual',
						message: validationResult.message
					});
					toast.error(validationResult.message);
					return;
				}
			}
			
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
				address: {} // Endereço vazio - co-participantes usam o mesmo endereço da operação
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
				}
			});
			// Limpar o último CPF de coparticipante consultado
			setLastQueriedCoparticipantCpf('');
			
			// Limpar o ID do coparticipante sendo editado
			setEditingCoparticipantId(null);
			
			// Resetar o estado do último participante
			setIsLastParticipant(false);
			
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
		});
		
		// Limpar o último CPF consultado para permitir novas consultas
		setLastQueriedCoparticipantCpf('');
		
		// Set the ID of the coparticipant being edited
		setEditingCoparticipantId(coparticipant.id);
		
		// Na edição, sempre permitir alterar o percentual, mesmo que seja o último participante
		setIsLastParticipant(false);
		
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
			// Definir erro no campo CPF para impedir o prosseguimento
			coparticipantForm.setError('profile.cpf', { 
				type: 'manual', 
				message: `Este CPF pertence ao proponente principal. Cada participante deve ter um CPF único.` 
			});
			
			// Mostrar mensagem de erro
			toast.error('Este CPF pertence ao proponente principal. Cada participante deve ter um CPF único.');
			
			// Remover o fechamento automático do diálogo para permitir correção
			// setTimeout(() => {
			//   setIsCoparticipantDialogOpen(false);
			// }, 1500);
			
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
			// Definir erro no campo CPF para impedir o prosseguimento
			coparticipantForm.setError('profile.cpf', { 
				type: 'manual', 
				message: `Este CPF já pertence ao coparticipante "${duplicatedCoparticipant.name}". Cada participante deve ter um CPF único.` 
			});
			
			// Mostrar mensagem de erro
			toast.error(`Este CPF já pertence ao coparticipante "${duplicatedCoparticipant.name}". Cada participante deve ter um CPF único.`);
			
			// Remover o fechamento automático do diálogo para permitir correção
			// setTimeout(() => {
			//   setIsCoparticipantDialogOpen(false);
			// }, 1500);
			
			return false;
		}
		
		// Se o CPF é válido e único, limpar qualquer erro existente
		coparticipantForm.clearErrors('profile.cpf');
		
		return true;
	};

	//useEffect(() => {
		// if (typeof watchBirthdate !== 'undefined' && watchBirthdate !== null) {
			// Calculate age here if needed
		// }
	// }, [watchBirthdate])

	// Função para validar se o percentual de participação é válido (maior que 0 e não excede 100%)
	const validateParticipationPercentage = (value: string) => {
		// Extrair percentual do valor formatado (ex: "25,00%" => 25.00)
		const newPercentage = parseFloat(value.replace('%', '').replace(',', '.')) || 0;
		
		// Verificar se o percentual é maior que zero
		if (newPercentage <= 0) {
			return {
				valid: false, 
				message: 'O percentual deve ser maior que zero',
				availablePercentage: '1,00%'
			};
		}
		
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
	const calculateParticipationValue = (percentage: string, totalValue: string) => {
		const numPercentage = parseFloat(percentage?.replace('%', '').replace(',', '.')) || 0;
		const numValue = parseFloat(totalValue.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
		const participationValue = (numPercentage / 100) * numValue;

		return new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: 'BRL'
		}).format(participationValue);
	};

	// Função para validar se o percentual de participação é válido para coparticipante, considerando o total já alocado
	const validateCoparticipantPercentage = (value: string) => {
		// Extrair percentual do valor formatado (ex: "25,00%" => 25.00)
		const newPercentage = parseFloat(value.replace('%', '').replace(',', '.')) || 0;
		
		// Verificar se o percentual é maior que zero
		if (newPercentage <= 0) {
			return {
				valid: false, 
				message: 'O percentual deve ser maior que zero',
				availablePercentage: ''  // Não sugerir valor
			};
		}
		
		// Calcular a soma dos percentuais já existentes
		let existingTotal = 0;
		
		// Se temos proponente principal existente, incluir seu percentual
		if (existingMainProponent) {
			const mainPercentage = parseFloat(existingMainProponent.participationPercentage.replace('%', '').replace(',', '.')) || 0;
			existingTotal += mainPercentage;
		} else {
			// Caso contrário, usar o percentual do proponente atual
			const mainPercentStr = getValues().profile.participationPercentage || '0,00%';
			const mainPercent = parseFloat(mainPercentStr.replace('%', '').replace(',', '.')) || 0;
			existingTotal += mainPercent;
		}
		
		// Incluir percentuais dos coparticipantes existentes, exceto o que estamos editando atualmente
		coparticipants.forEach(cp => {
			// Pular o coparticipante atual que está sendo editado
			if (editingCoparticipantId && cp.id === editingCoparticipantId) {
				return;
			}
			const cpPercentage = parseFloat(cp.participationPercentage.replace('%', '').replace(',', '.')) || 0;
			existingTotal += cpPercentage;
		});
		
		// Verificar se o novo percentual excederia 100%
		const totalWithNew = existingTotal + newPercentage;
		if (totalWithNew > 100) {
			return {
				valid: false, 
				message: `O percentual excede o limite disponível. Total seria: ${totalWithNew.toFixed(2).replace('.', ',')}%`,
				availablePercentage: ''  // Não sugerir valor
			};
		}
		
		// Verificar o total de participantes informado
		const numParticipants = parseInt(getValues().operation.participantsNumber, 10) || 2;
		// CORREÇÃO: Contar participantes já cadastrados + o que está sendo cadastrado agora (se não for edição)
		const alreadyCadastrated = coparticipants.length + 1; // +1 pelo proponente principal
		const currentParticipants = editingCoparticipantId ? alreadyCadastrated : alreadyCadastrated + 1;
		const participantsLeft = numParticipants - currentParticipants;
		
		// Se este é o último participante (participantsLeft === 0), verificar se o total fecha em 100%
		if (participantsLeft === 0 && !editingCoparticipantId) {
			// Para o último participante, deve completar exatamente 100%
			if (totalWithNew !== 100) {
				return {
					valid: false,
					message: `O último participante deve completar exatamente 100%. Total atual: ${totalWithNew.toFixed(2).replace('.', ',')}%`,
					availablePercentage: ''  // Não sugerir valor
				};
			}
		}
		
		// Se ainda há participantes para cadastrar (participantsLeft > 0), verificar se há espaço para outros
		if (participantsLeft > 0) {
			// Verificar se o percentual deixa pelo menos 1% para cada participante restante
			const minimumPercentageNeeded = participantsLeft * 1; // 1% mínimo por participante
			const remainingPercentage = 100 - totalWithNew;
			
			if (remainingPercentage < minimumPercentageNeeded) {
				return {
					valid: false,
					message: `Percentual muito alto. Necessário deixar pelo menos ${minimumPercentageNeeded}% para os outros ${participantsLeft} participante(s)`,
					availablePercentage: ''  // Não sugerir valor
				};
			}
			
			// Redundância para garantir que nunca exceda 100%
			if (totalWithNew >= 100) {
				return {
					valid: false,
					message: `Não há percentual disponível para os outros ${participantsLeft} participante(s)`,
					availablePercentage: ''  // Não sugerir valor
				};
			}
		}
		
		return { valid: true, message: '', availablePercentage: '' };
	};

	// Manipulador para o campo de percentual no formulário do coparticipante
	const handleCoparticipantPercentageBlur = (value: string) => {
		try {
			if (!value) return;
			
			// Se for o último participante, não validar pois o valor foi preenchido automaticamente
			if (isLastParticipant) {
				console.log("Último participante - validação de percentual ignorada (valor preenchido automaticamente)");
				// Apenas calcular o valor sem validar
				const totalValue = coparticipantForm.getValues().operation.totalValue || '';
				const participationValue = calculateParticipationValue(value, totalValue);
				setCoparticipantParticipationValue(participationValue);
				return;
			}
			
			// Validar o percentual usando a função específica para coparticipantes (apenas se não for o último)
			const coparticipantValidation = validateCoparticipantPercentage(value);
			if (!coparticipantValidation.valid) {
				// Definir erro no campo percentual para impedir o prosseguimento
				coparticipantForm.setError('profile.participationPercentage', {
					type: 'manual',
					message: coparticipantValidation.message
				});
				
				// Mostrar mensagem de erro no toast para feedback adicional
				toast.error(coparticipantValidation.message);
				
				// Manter o foco no campo de percentual até que seja corrigido
				setTimeout(() => {
					const percentInput = document.querySelector('[name="profile.participationPercentage"]') as HTMLInputElement;
					if (percentInput) {
						percentInput.focus();
					}
				}, 100);
			} else {
				// Limpar erro se o valor for válido
				coparticipantForm.setError('profile.participationPercentage', { type: 'manual', message: undefined });
			}
			
			// Sempre calcular o valor com base no percentual informado, mesmo se inválido
			const totalValue = coparticipantForm.getValues().operation.totalValue || '';
			const participationValue = calculateParticipationValue(value, totalValue);
			
			// Atualizar o valor da participação para exibição
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
			const percentValidation = validateParticipationPercentage(value);
			if (!percentValidation.valid) {
				// Definir erro no campo percentual para impedir o prosseguimento
				setError('profile.participationPercentage', {
					type: 'manual',
					message: percentValidation.message
				});
				
				// Mostrar mensagem de erro no toast para feedback adicional
				toast.error(percentValidation.message);
				
				// Manter o foco no campo de percentual até que seja corrigido
				setTimeout(() => {
					const percentInput = document.querySelector('[name="profile.participationPercentage"]') as HTMLInputElement;
					if (percentInput) {
						percentInput.focus();
					}
				}, 100);
			} else {
				// Limpar erro se o valor for válido
				setError('profile.participationPercentage', { type: 'manual', message: undefined });
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
			
			// Calcular informações sobre percentuais já alocados para exibição
			const numParticipants = parseInt(formData.operation.participantsNumber, 10) || 2;
			const currentParticipants = coparticipants.length + 1; // +1 pelo proponente principal
			const participantsLeft = numParticipants - currentParticipants;
			
			// Calcular o percentual total já alocado de forma precisa
			let totalAllocated = 0;
			
			// Se temos proponente principal existente, incluir seu percentual
			if (existingMainProponent) {
				const mainPercentage = parseFloat(existingMainProponent.participationPercentage.replace('%', '').replace(',', '.')) || 0;
				totalAllocated += mainPercentage;
			} else {
				// Adicionar percentual do proponente principal do formulário
				const mainPercentStr = formData.profile.participationPercentage || '0,00%';
				const mainPercent = parseFloat(mainPercentStr.replace('%', '').replace(',', '.')) || 0;
				totalAllocated += mainPercent;
			}
			
			// Adicionar percentuais dos coparticipantes existentes
			coparticipants.forEach(cp => {
				const cpPercent = parseFloat(cp.participationPercentage.replace('%', '').replace(',', '.')) || 0;
				totalAllocated += cpPercent;
			});
			
			// Calcular o percentual exato disponível
			const exactAvailablePercent = 100 - totalAllocated;
			
			// Se é o último participante (participantsLeft === 0), preencher automaticamente com o percentual restante
			if (participantsLeft === 0) {
				// Garantir que o valor seja no mínimo 0,01% e no máximo o disponível
				const remainingPercent = Math.max(0.01, exactAvailablePercent);
				const remainingPercentageFormatted = remainingPercent.toFixed(2).replace('.', ',') + '%';
				
				console.log(`Último participante detectado. Percentual total alocado: ${totalAllocated.toFixed(2)}%, Restante: ${remainingPercent.toFixed(2)}%`);
				
				coparticipantForm.setValue('profile.participationPercentage', remainingPercentageFormatted);
				
				// Calcular e definir o valor da participação
				const totalValue = formData.operation.totalValue || '';
				const participationValue = calculateParticipationValue(remainingPercentageFormatted, totalValue);
				setCoparticipantParticipationValue(participationValue);
				
				// Definir que este é o último participante para desabilitar edição do percentual
				setIsLastParticipant(true);
				
				console.log(`Campo preenchido automaticamente com ${remainingPercentageFormatted} para o último participante`);
			} else {
				// Não é o último participante, deixar vazio para o usuário decidir
				coparticipantForm.setValue('profile.participationPercentage', '');
				setCoparticipantParticipationValue('');
				setIsLastParticipant(false);
				
				console.log(`Não é o último participante. Restam ${participantsLeft} participantes após este.`);
			}
			
			// Limpar outras configurações
			setCoparticipantSuggestedPercentage('');
			
			console.log(`Percentual alocado: ${totalAllocated.toFixed(2)}%, Disponível: ${exactAvailablePercent.toFixed(2)}%, Participantes restantes: ${participantsLeft}`);
			
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
			// Resetar o estado de orientação ao iniciar nova consulta
			setShowOperationGuidance(false);
			setShowOtherSections(false);
			
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

			if (response && response.success && response.data && response.data.length > 0) {
				// OPERAÇÃO EXISTENTE ENCONTRADA - Não permitir continuidade
				toast.error(`A operação ${operationNumber} já possui participantes cadastrados. Por favor, utilize um novo número de operação.`);
				
				// Limpar o campo do número da operação
				setValue('operation.operationNumber', '');
				setLastQueriedOperation('');
				
				// Mostrar orientação para nova operação
				setShowOperationGuidance(true);
				setShowOtherSections(false);
			} else {
				// NOVA OPERAÇÃO - Operação não encontrada ou sem participantes
				setExistingMainProponent(null);
				setOperationDataLoaded(false);
				setIsProductDisabled(false);
				
				// Não mostrar as seções adicionais até que os dados da operação sejam preenchidos
				setShowOtherSections(false);
				
				// Limpar valores de operação carregados previamente
				if (getValues().operation.participantsNumber) {
				setValue('operation.participantsNumber', '');
				setParticipantsNumber('');
				}
				if (getValues().operation.totalValue) {
					setValue('operation.totalValue', '');
			setTotalValue('');
				}
				
				// Liberar os campos para edição
				setValue('operation.isParticipantsNumberReadOnly', '');
				setValue('operation.isTotalValueReadOnly', '');
				
				// Mostrar a mensagem de orientação para o usuário
				setShowOperationGuidance(true);
				
				console.log(`Operação ${operationNumber} disponível para nova operação.`);
			}
		} catch (error) {
			// Erro ao consultar a operação - tratado como nova operação
			console.error('Erro ao buscar dados da operação:', error);
			setExistingMainProponent(null);
			setOperationDataLoaded(false);
			setIsProductDisabled(false);
			
			// Mostrar a mensagem de orientação para o usuário
			setShowOperationGuidance(true);
			setShowOtherSections(false);
			
			// Garantir que os campos estejam habilitados para edição
			setValue('operation.isParticipantsNumberReadOnly', '');
			setValue('operation.isTotalValueReadOnly', '');
			
			// Limpar valores de operação carregados previamente
			if (getValues().operation.participantsNumber) {
			setValue('operation.participantsNumber', '');
			setParticipantsNumber('');
			}
			if (getValues().operation.totalValue) {
				setValue('operation.totalValue', '');
			setTotalValue('');
			}
			
			console.log('Operação disponível para novo preenchimento.');
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

	// Componente auxiliar para o botão Salvar com loading
	const SaveButton = ({ isSubmitting, isLoading }: { isSubmitting: boolean, isLoading: boolean }) => {
		const handleSaveClick = async () => {
			// Verificar se a idade permite o preenchimento de DPS
			if (proponentAge !== null && (proponentAge < 18 || proponentAge > 80)) {
				const ageMessage = proponentAge < 18 
					? 'Não é possível contratar DPS para menores de 18 anos.'
					: 'Não é possível contratar DPS para maiores de 80 anos.';
				toast.error(ageMessage);
				return;
			}
			
			const isValid = await trigger()
			if (isValid) {
				// Usar handleSubmit diretamente em vez de onSubmit
				handleSubmit(onSubmit)()
			}
		}

		const isAgeRestricted = proponentAge !== null && (proponentAge < 18 || proponentAge > 80);

		return (
			<Button 
				type="button" 
				className="w-40" 
				disabled={isSubmitting || isLoading || isAgeRestricted}
				onClick={handleSaveClick}
			>
				{isSubmitting || isLoading ? (
					<>
						Salvando
						<Loader2Icon className="ml-2 h-4 w-4 animate-spin" />
					</>
				) : isAgeRestricted ? "Bloqueado" : "Salvar"}
			</Button>
		)
	}
	
	// ... código existente continua

	// Criar uma função para determinar qual mensagem de erro mostrar
	const getErrorMessage = (section: keyof DpsInitialForm) => {
		const sectionErrors = errors[section];
		if (!sectionErrors || Object.keys(sectionErrors).length === 0) return null;
		
		switch(section) {
			case 'operation':
				return "Preencha corretamente todos os campos da seção Dados da Operação";
			case 'profile':
				return "Preencha corretamente todos os campos da seção Dados do Proponente";
			case 'product':
				return "Preencha corretamente todos os campos da seção Dados do Produto";
			case 'address':
				return "Preencha corretamente todos os campos da seção Dados de Endereço";
			default:
				return "Há campos obrigatórios não preenchidos";
		}
	};

	// Função para iniciar o formulário de coparticipante
	const startCoparticipantForm = () => {
		saveAndAddCoparticipant();
	};

	// Modificar o botão para adicionar co-participante apenas quando o formulário é válido
	const AddCoparticipantButtonOrMessage = () => {
		// Verificar se o número de participantes declarados permite adicionar mais
		const declaredParticipants = parseInt(getValues().operation.participantsNumber, 10) || 0;
		const currentParticipants = coparticipants.length + 1; // +1 pelo proponente principal
		
		// Verificar se o botão de adicionar deve ser mostrado
		if (currentParticipants < declaredParticipants && declaredParticipants > 1) {
			// O botão é habilitado se dados da operação estão completos
			const operationComplete = areOperationFieldsComplete();
			
			return (
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<div>
								<Button
									type="button"
									variant="outline"
									onClick={() => startCoparticipantForm()}
									disabled={!operationComplete || isSubmitting || isLoading}
									className="flex items-center gap-2"
								>
									Adicionar Co-participante
								</Button>
							</div>
						</TooltipTrigger>
						<TooltipContent>
							{!operationComplete ? 
								<p>Preencha os dados da operação (número da operação, participantes e valor total) para adicionar um co-participante</p> :
								<p>Clique para adicionar um co-participante</p>
							}
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			);
		}
		
		return null;
	};

	// ... restante do código continua

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

	// Criar uma função para validar se todos os campos da operação estão preenchidos
	const areOperationFieldsComplete = () => {
		const formData = getValues();
		return !!(
			formData.operation.operationNumber && 
			formData.operation.participantsNumber && 
			formData.operation.totalValue &&
			formData.operation.totalValue !== 'R$ '
		);
	};
	
	// Ouvir mudanças nos campos da operação para mostrar as seções adicionais quando estiverem completos
	useEffect(() => {
		// Se a mensagem de orientação estiver sendo exibida e os campos forem preenchidos
		if (showOperationGuidance && areOperationFieldsComplete()) {
			// Exibir as seções adicionais
			setShowOtherSections(true);
		}
	}, [
		watch('operation.operationNumber'),
		watch('operation.participantsNumber'),
		watch('operation.totalValue'),
		showOperationGuidance
	]);

	const calculateTotalValue = () => {
		const totalOperationValue = getValues().operation.totalValue;
		let totalValue = 0;

		// Adicionar valor do proponente principal se existir
		if (existingMainProponent) {
			const percentage = parseFloat(existingMainProponent.participationPercentage.replace('%', '').replace(',', '.')) || 0;
			totalValue += (percentage / 100) * parseFloat(totalOperationValue.replace(/[^\d,]/g, '').replace(',', '.'));
		} else if (getValues().profile.name) {
			const percentage = parseFloat(getValues().profile.participationPercentage?.replace('%', '').replace(',', '.')) || 0;
			totalValue += (percentage / 100) * parseFloat(totalOperationValue.replace(/[^\d,]/g, '').replace(',', '.'));
		}

		// Adicionar valores dos coparticipantes
		coparticipants.forEach(coparticipant => {
			const percentage = parseFloat(coparticipant.participationPercentage.replace('%', '').replace(',', '.')) || 0;
			totalValue += (percentage / 100) * parseFloat(totalOperationValue.replace(/[^\d,]/g, '').replace(',', '.'));
		});

		// Formatar o valor total como moeda
		return new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: 'BRL'
		}).format(totalValue);
	};

	return (
		<form
			className="pb-12 flex flex-col gap-8 relative"
			onSubmit={handleSubmit(onSubmit)}
		>
			{/* Overlay de loading */}
			{(isLoading || isSubmitting) && (
				<div className="absolute inset-0 bg-white/70 z-50 flex flex-col items-center justify-center">
					<Loader2Icon className="h-12 w-12 animate-spin text-primary mb-4" />
					<p className="text-lg font-medium text-primary">Processando dados, aguarde...</p>
				</div>
			)}

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
				
				{!showOperationGuidance && !showOtherSections && participantsNumber && (
					<div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
						<p className="text-red-700 font-medium">
							Esta operação já possui {participantsNumber} participante(s) cadastrado(s).
						</p>
					</div>
				)}

				{/* Mensagem de orientação quando a operação não for encontrada */}
				{showOperationGuidance && !showOtherSections && (
					<div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
						<p className="text-blue-700 font-medium">
							Operação não encontrada. Preencha os demais dados da operação para continuar.
						</p>
						<p className="text-blue-600 text-sm mt-1">
							Após preencher o número de participantes e o valor total da operação, as demais seções do formulário serão exibidas.
						</p>
					</div>
				)}
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
						{/* Alerta de idade restritiva */}
						{proponentAge !== null && (proponentAge < 18 || proponentAge > 80) && (
							<div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
								<div className="flex items-center">
									<div className="h-5 w-5 text-red-500 mr-2">⚠️</div>
									<p className="text-red-700 font-medium">
										{proponentAge < 18 
											? `Proponente menor de idade (${proponentAge} anos)`
											: `Proponente acima da idade permitida (${proponentAge} anos)`
										}
									</p>
								</div>
								<p className="text-red-600 text-sm mt-2">
									O preenchimento de DPS é permitido apenas para proponentes com idade entre 18 e 80 anos.
								</p>
							</div>
						)}
						
						<DpsProductForm
							control={control}
							formState={formState}
							prazosOptions={prazosOptions}
							productOptions={productOptions}
							tipoImovelOptions={tipoImovelOptions}
							disabled={isSubmitting || isLoading || isProductDisabled}
							proponentAge={proponentAge}
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
									<div>Valor</div>
									<div></div>
								</div>
								
								{getValues().profile.name && (
									<div className="grid grid-cols-5 gap-4 py-3 px-4 border-b hover:bg-gray-50">
										<div className="font-medium">{getValues().profile.name}</div>
										<div>{getValues().profile.cpf}</div>
										<div>{getValues().profile.participationPercentage || '0,00%'}</div>
										<div>{calculateParticipationValue(getValues().profile.participationPercentage || '0,00%', getValues().operation.totalValue)}</div>
										<div></div>
									</div>
								)}
								
								{coparticipants.map((coparticipant) => (
									<div key={coparticipant.id} className="grid grid-cols-5 gap-4 py-3 px-4 border-b hover:bg-gray-50">
										<div className="font-medium">{coparticipant.name}</div>
										<div>{coparticipant.cpf}</div>
										<div>{coparticipant.participationPercentage}</div>
										<div>{calculateParticipationValue(coparticipant.participationPercentage, getValues().operation.totalValue)}</div>
										<div className="flex justify-end gap-2">
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
										</div>
									</div>
								))}
							</div>
							
							<div className="flex justify-between mt-6 pt-4 border-t">
								<div className="flex gap-8">
									<div>
										<span className="font-medium">Total alocado:</span>
										<span className="ml-2">{calculateTotalParticipation()}</span>
									</div>
									<div>
										<span className="font-medium">Valor total alocado:</span>
										<span className="ml-2">{calculateTotalValue()}</span>
									</div>
								</div>
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

					<form onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						// Não fazer nada aqui, o botão agora chama a função diretamente
					}} className="space-y-8">
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

						{/* Informações sobre percentuais já alocados */}
						<div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-200">
							<h3 className="text-blue-700 font-medium mb-2">Informações sobre percentuais de participação</h3>
							
							<div className="grid grid-cols-2 gap-4 mb-2">
								<div>
									<p className="text-blue-600 text-sm">Total já alocado</p>
									<p className="font-medium">{calculateTotalParticipation()}</p>
								</div>
								<div>
									<p className="text-blue-600 text-sm">Disponível para alocação</p>
									<p className="font-medium">
										{(100 - parseFloat(calculateTotalParticipation().replace('%', '').replace(',', '.'))).toFixed(2).replace('.', ',')}%
									</p>
								</div>
							</div>
							
							{/* Mostrar informação sobre participantes restantes */}
							{(() => {
								const numParticipants = parseInt(coparticipantForm.getValues().operation.participantsNumber, 10) || 2;
								const currentParticipants = coparticipants.length + 1; // +1 pelo proponente principal
								const participantsLeft = numParticipants - currentParticipants;
								
								if (participantsLeft > 1) {
									return (
										<p className="text-blue-600 text-sm">
											Restam {participantsLeft} participantes a serem cadastrados após este.
										</p>
									);
								} else if (participantsLeft === 1 && !editingCoparticipantId) {
									return (
										<p className="text-blue-600 text-sm mt-2">
											<strong>Este é o último participante.</strong> O percentual total deve completar 100%.
										</p>
									);
								} else if (editingCoparticipantId) {
									return (
										<p className="text-blue-600 text-sm mt-2">
											Você está editando um participante existente. Certifique-se que o total permanecerá em 100%.
										</p>
									);
								}
								return null;
							})()}
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
							isLastParticipant={isLastParticipant}
						/>

						{/* DpsAddressForm removido - co-participantes usam o mesmo endereço da operação
						<DpsAddressForm
							control={coparticipantForm.control}
							formState={coparticipantForm.formState}
							cepDataLoader={loadCoparticipantAddressByCep}
							disabled={isLoadingCoparticipant}
						/>
						*/}

						<DialogFooter>
							<Button 
								type="button" 
								variant="outline" 
								onClick={() => setIsCoparticipantDialogOpen(false)}
							>
								Cancelar
							</Button>
							<Button 
								type="button" 
								disabled={isLoadingCoparticipant || fetchingCpfDataCoparticipant}
								onClick={async () => {
									// Chamar manualmente a validação e submissão do formulário de coparticipante
									const isValid = await coparticipantForm.trigger();
									if (isValid) {
										const formData = coparticipantForm.getValues();
										await handleCoparticipantSubmit(formData);
									}
								}}
							>
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
								`Participantes informados nesta operação: ${parseInt(pendingSubmitData.operation.participantsNumber, 10) || 0}, Cadastrados até o momento: ${existingMainProponent ? (1 + coparticipants.length + 1) : (coparticipants.length + 1)}.` 
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
