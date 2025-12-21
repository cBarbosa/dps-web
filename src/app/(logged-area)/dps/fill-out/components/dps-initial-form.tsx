'use client'

import { Button } from '@/components/ui/button'
import {
	calculateAge,
	cn,
	RecursivePartial,
	maskToBrlCurrency
} from '@/lib/utils'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { useSession } from 'next-auth/react'
import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { InferInput, object, pipe, string, nonEmpty, optional } from 'valibot'
import { getProponentDataByCpf, postProposal, getAddressByZipcode, getParticipantsByOperation } from '../../actions'
import { useRouter, useSearchParams } from 'next/navigation'
import DpsProfileForm, {
	DpsProfileFormType,
	dpsProfileForm,
	createDpsProfileFormWithDeadline,
	createDpsProfileFormWithParticipants,
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
import ShareLine from '@/components/ui/share-line'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import DatePicker from '@/components/ui/date-picker'
import SelectComp from '@/components/ui/select-comp'
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
import { CheckCircle, XCircle, PencilIcon, TrashIcon, AlertTriangleIcon } from 'lucide-react'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import { getMaxAgeByProduct, getFinalAgeWithYearsErrorMessage, validateFinalAgeLimit, isMagHabitacionalProduct } from '@/constants'
import { useProducts } from '@/contexts/products-context'
import { validateFinalAgeLimitHybrid, getFinalAgeWithYearsErrorMessageConfig } from '@/utils/product-validation'

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

// Função para criar schema dinâmico baseado na idade, número de participantes e produto
const createDynamicSchema = (proponentAge: number | null, participantsNumber?: number, productName?: string, birthDate?: Date, products: any[] = []) => object({
	operation: dpsOperationForm,
	profile: createDpsProfileFormWithParticipants(participantsNumber, productName, products),
	product: createDpsProductFormWithAge(proponentAge, productName, birthDate, products),
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
	// totalValue removido - agora usa product.mip como valor total da operação
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

	// Adicionar estado para o diálogo de confirmação de cancelamento
	const [isCancelConfirmDialogOpen, setIsCancelConfirmDialogOpen] = useState(false);

	// Adicionar estado para o modal de participantes faltando
	const [isMissingParticipantsModalOpen, setIsMissingParticipantsModalOpen] = useState(false);
	const [missingParticipantsData, setMissingParticipantsData] = useState<{
		declared: number;
		current: number;
		missing: number;
	} | null>(null);

	// Adicionar estado para o modal de erro de percentual
	const [isPercentageErrorModalOpen, setIsPercentageErrorModalOpen] = useState(false);

	// Adicionar estado para o modal de erro de Alagoas
	const [isAlagoasErrorModalOpen, setIsAlagoasErrorModalOpen] = useState(false);
	const [alagoasErrorCity, setAlagoasErrorCity] = useState('');

	// Adicionar estado para o alerta de locais bloqueados
	const [showBlockedLocationAlert, setShowBlockedLocationAlert] = useState(false);
	const [blockedLocationCity, setBlockedLocationCity] = useState('');
	const [percentageErrorMessage, setPercentageErrorMessage] = useState<string>('');

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

	// Obter produtos do contexto
	const { products } = useProducts();
	
	// Estado para o schema dinâmico baseado na idade e número de participantes
	const [currentSchema, setCurrentSchema] = useState(() => createDynamicSchema(null, undefined, undefined, undefined, products));

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
				isParticipantsNumberReadOnly: undefined,
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
		const mipValue = getValues().product?.mip || '';
		if (participantsNumber && mipValue) {
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
	}, [participantsNumber, getValues().product?.mip, coparticipants.length])
	
	// Watchs para calcular a idade com base na data de nascimento
	const watchBirthdate = watch('profile.birthdate')
	const watchProduct = watch('product.product')
	
	// Função auxiliar para obter nome do produto baseado no UID
	const getProductName = useCallback((productUid: string) => {
		const product = productOptions.find(p => p.value === productUid);
		return product?.label || '';
	}, [productOptions]);
	
	// Calcular idade do proponente
	const proponentAge = useMemo(() => {
		return calculateAge(watchBirthdate);
	}, [watchBirthdate]);

	// useEffect para atualizar o schema quando a idade ou número de participantes mudar
	const memoizedGetValues = useCallback(getValues, []);

	useEffect(() => {
		const participantsNum = parseInt(participantsNumber, 10) || undefined;
		const currentProductName = getProductName(watchProduct);
		const birthDate = watchBirthdate instanceof Date ? watchBirthdate : undefined;
		const newSchema = createDynamicSchema(proponentAge, participantsNum, currentProductName, birthDate, products);
		setCurrentSchema(newSchema);
		
		// Forçar revalidação do campo prazo quando a idade ou produto mudar
		if (proponentAge !== null && memoizedGetValues().product.deadline) {
			// Usar setTimeout para garantir que o schema seja atualizado primeiro
			setTimeout(() => {
				trigger('product.deadline');
			}, 0);
		}
		
		// Forçar revalidação do campo percentual quando o número de participantes mudar
		if (participantsNum && memoizedGetValues().profile.participationPercentage) {
			setTimeout(() => {
				trigger('profile.participationPercentage');
			}, 0);
		}
	}, [proponentAge, participantsNumber, watchProduct, watchBirthdate, trigger, memoizedGetValues, getProductName]);

	// useEffect para atualizar as opções de prazo - agora não filtra por idade
	useEffect(() => {
		if(isProductDisabled) return;
		
		// Sempre usar todas as opções de prazo disponíveis, sem filtrar por idade
		setPrazosOptions(prazosOptionsProp);
	}, [prazosOptionsProp, isProductDisabled]);

	// useEffect para verificar locais bloqueados quando produto ou endereço mudam
	useEffect(() => {
		checkBlockedLocation();
	}, [watchProduct]); // Removido watch address para evitar problemas

	// useEffect para verificar locais bloqueados quando endereço muda
	useEffect(() => {
		const city = watch('address.city');
		const state = watch('address.state');
		if (city || state) {
			checkBlockedLocation();
		}
	}, [watch('address.city'), watch('address.state')]);

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

	// Função para abrir o modal de confirmação de cancelamento
	const handleCancelFormClick = () => {
		setIsCancelConfirmDialogOpen(true);
	};

	// Função para confirmar o cancelamento e resetar o formulário
	const handleConfirmCancelForm = () => {
		// Resetar o formulário para valores iniciais
		reset({
			operation: {
				operationNumber: '',
				participantsNumber: '',
				isParticipantsNumberReadOnly: undefined,
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
		});

		// Limpar todos os estados relacionados
		setCoparticipants([]);
		setExistingMainProponent(null);
		setParticipantsNumber('');
		setParticipationPercentage('');
		setParticipationValue('');
		setCoparticipantParticipationValue('');
		setCoparticipantSuggestedPercentage('');
		setLastQueriedCpf('');
		setLastQueriedCoparticipantCpf('');
		setLastQueriedOperation('');
		setOperationDataLoaded(false);
		setIsProductDisabled(false);
		setShowOtherSections(false);
		setShowOperationGuidance(false);
		setIsOperationFull(false);
		setIsLastParticipant(false);
		setCpfParamPending(null);

		// Fechar o diálogo de confirmação
		setIsCancelConfirmDialogOpen(false);

		// Limpar erros do formulário
		clearErrors();

		// Mostrar mensagem de sucesso
		toast.success('Formulário cancelado com sucesso!');

		// Redirecionar para a página de preenchimento inicial
		router.push('/dps/fill-out');
	};

	// Função para cancelar o cancelamento (não fazer nada)
	const handleCancelCancelForm = () => {
		setIsCancelConfirmDialogOpen(false);
	};

	// Função para abrir o modal de participantes faltando
	const showMissingParticipantsModal = (declared: number, current: number) => {
		const missing = declared - current;
		setMissingParticipantsData({
			declared,
			current,
			missing
		});
		setIsMissingParticipantsModalOpen(true);
	};

	// Função para fechar o modal de participantes faltando
	const closeMissingParticipantsModal = () => {
		setIsMissingParticipantsModalOpen(false);
		setMissingParticipantsData(null);
	};

	// Função separada para o envio efetivo dos dados
	const submitForm = async (v: DpsInitialForm) => {
		console.log("submitForm called with data:", v);
		setIsLoading(true);

		try {
			// Extrair valores necessários para a participação
			const totalValue = convertCapitalValue(v.product.mip) ?? 0;
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
					neighborhood: v.address.district || '',
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
								neighborhood: v.address.district || '',
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

	// Função utilitária para validar idade + prazo
	const validateAgeWithDeadline = (birthdate: Date, deadlineMonths: number, participantType: string, productName?: string): { valid: boolean; message?: string } => {
		if (!productName) {
			// Fallback para compatibilidade
			const today = new Date();
			const age = today.getFullYear() - birthdate.getFullYear();
			const monthDiff = today.getMonth() - birthdate.getMonth();
			const dayDiff = today.getDate() - birthdate.getDate();
			
			const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
			const prazosInYears = deadlineMonths / 12;
			const finalAge = actualAge + prazosInYears;
			
			if (finalAge > 80) {
				return {
					valid: false,
					message: `A idade final do ${participantType} (${Math.round(finalAge)} anos) não pode exceder 80 anos ao fim da operação.`
				};
			}
			return { valid: true };
		}
		
		// Usar a nova validação com meses e dias (híbrida com fallback)
		const isValid = validateFinalAgeLimitHybrid(products, productName, birthdate, deadlineMonths);
		
		if (!isValid) {
			// Calcular idade final aproximada para mensagem
			const today = new Date();
			const age = today.getFullYear() - birthdate.getFullYear();
			const monthDiff = today.getMonth() - birthdate.getMonth();
			const dayDiff = today.getDate() - birthdate.getDate();
			const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
			const prazosInYears = deadlineMonths / 12;
			const finalAge = actualAge + prazosInYears;
			
			// Tentar usar mensagem da configuração, senão usa fallback
			let errorMessage: string;
			if (products.length > 0) {
				const config = products.find(p => 
					p.name === productName || 
					p.configuration?.names.some(n => n.toLowerCase() === productName.toLowerCase())
				)?.configuration;
				if (config) {
					errorMessage = getFinalAgeWithYearsErrorMessageConfig(products, productName, participantType, finalAge);
				} else {
					errorMessage = getFinalAgeWithYearsErrorMessage(productName, participantType, finalAge);
				}
			} else {
				errorMessage = getFinalAgeWithYearsErrorMessage(productName, participantType, finalAge);
			}
			
			return {
				valid: false,
				message: errorMessage
			};
		}
		
		return { valid: true };
	};

	async function onSubmit(v: DpsInitialForm) {
		try {
			// Usar setIsLoading em vez de setIsSubmitting para controlar o estado de envio
			setIsLoading(true);
			
			// Logging para depuração
			console.log("Form submission data:", v);
			
			// Obter nome do produto selecionado
			const currentProductName = getProductName(v.product.product);

			// VALIDAÇÃO ESPECÍFICA PARA MAG HABITACIONAL - ESTADO DE ALAGOAS
			if (isMagHabitacionalProduct(currentProductName) && v.address.state === 'AL') {
				// Lista de bairros proibidos no estado de Alagoas para MAG Habitacional
				const forbiddenDistricts = [
					'Pinheiro',
					'Bebedouro',
					'Bom Parto',
					'Farot',
					'Ponta Grossa',
					'Mutange',
					'Gruta de Lourdes',
					'Vergel do Lago'
				];

				// Verificar se o bairro está na lista de bairros proibidos
				const districtName = v.address.district?.trim();
				if (districtName && forbiddenDistricts.some(forbiddenDistrict =>
					forbiddenDistrict.toLowerCase() === districtName.toLowerCase()
				)) {
					// Definir o bairro que causou o erro para exibir no modal
					setAlagoasErrorCity(districtName);
					// Abrir o modal de erro
					setIsAlagoasErrorModalOpen(true);
					setIsLoading(false);
					return;
				}
			}

			// VALIDAÇÃO DE IDADE + PRAZO
			const deadlineMonths = parseInt(v.product.deadline, 10);
			if (!isNaN(deadlineMonths) && deadlineMonths > 0) {
				// Validar proponente principal
				if (v.profile.birthdate) {
					const proponentValidation = validateAgeWithDeadline(v.profile.birthdate, deadlineMonths, 'proponente principal', currentProductName);
					if (!proponentValidation.valid) {
						toast.error(proponentValidation.message || 'Idade final do proponente excede o limite permitido.');
						setIsLoading(false);
						return;
					}
				}
				
				// Validar coparticipantes
				for (const coparticipant of coparticipants) {
					if (coparticipant.profile.birthdate) {
						const coparticipantValidation = validateAgeWithDeadline(new Date(coparticipant.profile.birthdate), deadlineMonths, 'coparticipante', currentProductName);
						if (!coparticipantValidation.valid) {
							toast.error(`${coparticipantValidation.message} (${coparticipant.name})`);
							setIsLoading(false);
							return;
						}
					}
				}
			}
			
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
				setPercentageErrorMessage(validationResult.message);
				setIsPercentageErrorModalOpen(true);
				setIsLoading(false);
				return;
			}
			}
			
					// Verificar se a seção do produto está desabilitada
		if (isProductDisabled) {
			console.log("Product section is disabled, skipping product validation");
		}
		
		// VALIDAÇÕES OBRIGATÓRIAS PARA TODAS AS OPERAÇÕES
		const declaredParticipants = parseInt(v.operation.participantsNumber, 10) || 0;
		const actualParticipants = 1 + coparticipants.length; // +1 pelo proponente principal
		
		// Validação 1: Verificar se todos os participantes declarados estão cadastrados
		if (actualParticipants < declaredParticipants) {
			const missingParticipants = declaredParticipants - actualParticipants;
			setIsLoading(false);
			// Remover toast error e apenas exibir o modal mais informativo
			showMissingParticipantsModal(declaredParticipants, actualParticipants);
			return;
		}
		
		// Validação 2: Verificar se não há participantes em excesso
		if (actualParticipants > declaredParticipants) {
			setIsLoading(false);
			toast.error(`Número de participantes cadastrados (${actualParticipants}) excede o número declarado (${declaredParticipants}). Ajuste o número de participantes ou remova co-participantes.`);
			return;
		}
		
		// Validação 3: OBRIGATÓRIA - A soma dos percentuais deve ser EXATAMENTE 100% para TODAS as operações
		const totalPercentage = calculateTotalParticipation();
		const totalPercentageNumber = parseFloat(totalPercentage.replace('%', '').replace(',', '.'));
		
		if (Math.abs(totalPercentageNumber - 100) > 0.01) { // Tolerância de 0,01% para arredondamento
			setIsLoading(false);
			
			if (totalPercentageNumber < 100) {
				const missingPercentage = (100 - totalPercentageNumber).toFixed(2).replace('.', ',');
				toast.error(`Percentual de participação incompleto. Total atual: ${totalPercentage}. Faltam ${missingPercentage}% para completar 100%. Ajuste os percentuais antes de salvar.`);
			} else {
				const excessPercentage = (totalPercentageNumber - 100).toFixed(2).replace('.', ',');
				toast.error(`Percentual de participação excede 100%. Total atual: ${totalPercentage}. Reduza ${excessPercentage}% nos percentuais antes de salvar.`);
			}
			return;
		}
		
		// Validação 4: Para participante único, deve ter exatamente 100%
		if (declaredParticipants === 1) {
			const mainPercentage = parseFloat(v.profile.participationPercentage?.replace('%', '').replace(',', '.') || '0');
			if (Math.abs(mainPercentage - 100) > 0.01) {
				setIsLoading(false);
				toast.error(`Para operação com participante único, o percentual deve ser exatamente 100%. Percentual atual: ${mainPercentage.toFixed(2).replace('.', ',')}%`);
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
			v.operation.participantsNumber
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
			const declaredParticipants = parseInt(getValues().operation.participantsNumber, 10) || 0;
			const currentParticipants = coparticipants.length + 1; // +1 pelo proponente principal
			
			// VALIDAÇÕES OBRIGATÓRIAS ANTES DO SALVAMENTO
			
			// Validação 1: Capital MIP deve estar preenchido
			const capitalMipFilled = !!(getValues().product?.mip && getValues().product.mip.trim() !== '');
			if (!capitalMipFilled) {
				toast.error('Preencha o Capital MIP para finalizar a operação.');
				setIsLoading(false);
				return;
			}
			
			// Validação 2: Verificar se todos os participantes declarados estão cadastrados
			if (currentParticipants < declaredParticipants) {
				const missingParticipants = declaredParticipants - currentParticipants;
				setIsLoading(false);
				// Remover toast error e apenas exibir o modal mais informativo
				showMissingParticipantsModal(declaredParticipants, currentParticipants);
				return;
			}
			
			// Validação 3: Verificar se não há participantes em excesso
			if (currentParticipants > declaredParticipants) {
				setIsLoading(false);
				toast.error(`Número de participantes cadastrados (${currentParticipants}) excede o número declarado (${declaredParticipants}). Ajuste o número de participantes ou remova co-participantes.`);
				return;
			}
			
			// Validação 4: OBRIGATÓRIA - O percentual total deve ser EXATAMENTE 100% para TODAS as operações
			const totalPercentage = calculateTotalParticipation();
			const totalPercentageNumber = parseFloat(totalPercentage.replace('%', '').replace(',', '.'));
			
			if (Math.abs(totalPercentageNumber - 100) > 0.01) { // Tolerância de 0,01% para arredondamento
				setIsLoading(false);
				
				if (totalPercentageNumber < 100) {
					const missingPercentage = (100 - totalPercentageNumber).toFixed(2).replace('.', ',');
					toast.error(`Percentual de participação incompleto. Total atual: ${totalPercentage}. Faltam ${missingPercentage}% para completar 100%. Ajuste os percentuais antes de salvar.`);
				} else {
					const excessPercentage = (totalPercentageNumber - 100).toFixed(2).replace('.', ',');
					toast.error(`Percentual de participação excede 100%. Total atual: ${totalPercentage}. Reduza ${excessPercentage}% nos percentuais antes de salvar.`);
				}
				return;
			}
			
			// Validação 5: Para participante único, deve ter exatamente 100%
			if (declaredParticipants === 1) {
				const mainPercentage = parseFloat(getValues().profile.participationPercentage?.replace('%', '').replace(',', '.') || '0');
				if (Math.abs(mainPercentage - 100) > 0.01) {
					setIsLoading(false);
					toast.error(`Para operação com participante único, o percentual deve ser exatamente 100%. Percentual atual: ${mainPercentage.toFixed(2).replace('.', ',')}%`);
					return;
				}
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

				// Limpar erros dos campos que serão preenchidos automaticamente
				console.log('Dados encontrados para o CPF do co-participante. Limpando erros dos campos e preenchendo automaticamente...');

				// Preencher os dados do coparticipante com os resultados obtidos
				if (proponentDataRaw?.detalhes.nome) {
					coparticipantForm.setValue('profile.name', proponentDataRaw.detalhes.nome);
					coparticipantForm.clearErrors('profile.name'); // Limpar erro do campo nome
				}

				if (proponentDataBirthdate) {
					coparticipantForm.setValue('profile.birthdate', proponentDataBirthdate);
					coparticipantForm.clearErrors('profile.birthdate'); // Limpar erro do campo data de nascimento
				}

				// if (proponentDataRaw?.detalhes.profissao) {
				// 	coparticipantForm.setValue(
				// 		'profile.profession',
				// 		getProfissionDescription(proponentDataRaw.detalhes.profissao)
				// 	);
				// 	coparticipantForm.clearErrors('profile.profession'); // Limpar erro do campo profissão
				// }

				if (proponentDataRaw?.detalhes.sexo) {
					coparticipantForm.setValue('profile.gender', proponentDataRaw.detalhes.sexo);
					coparticipantForm.clearErrors('profile.gender'); // Limpar erro do campo sexo
				}

				// Disparar validação dos campos preenchidos para garantir que não há mais erros
				setTimeout(() => {
					if (proponentDataRaw?.detalhes.nome) coparticipantForm.trigger('profile.name');
					if (proponentDataBirthdate) coparticipantForm.trigger('profile.birthdate');
					if (proponentDataRaw?.detalhes.sexo) coparticipantForm.trigger('profile.gender');
				}, 100);

				console.log("Dados do coparticipante preenchidos automaticamente e erros limpos:", proponentDataRaw);
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
		clearErrors('profile.cpf');
		
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
			
			// Limpar erros dos campos que serão preenchidos automaticamente
			console.log('Dados encontrados para o CPF. Limpando erros dos campos e preenchendo automaticamente...');
			
			if (autocompleteData.name) {
				setValue('profile.name', autocompleteData.name)
				clearErrors('profile.name'); // Limpar erro do campo nome
				setAutocompletedByCpf(prev => ({
					...prev,
					name: true,
				}))
			}
			if (autocompleteData.birthdate) {
				setValue('profile.birthdate', autocompleteData.birthdate)
				clearErrors('profile.birthdate'); // Limpar erro do campo data de nascimento
				setAutocompletedByCpf(prev => ({
					...prev,
					birthdate: true,
				}))
			}
			// if (autocompleteData.profession) {
			// 	setValue(
			// 		'profile.profession',
			// 		getProfissionDescription(autocompleteData.profession)
			// 	)
			// 	clearErrors('profile.profession'); // Limpar erro do campo profissão
			// 	setAutocompletedByCpf(prev => ({
			// 		...prev,
			// 		profession: true,
			// 	}))
			// }
			if (autocompleteData.email) {
				setValue('profile.email', autocompleteData.email)
				clearErrors('profile.email'); // Limpar erro do campo email
				setAutocompletedByCpf(prev => ({
					...prev,
					email: true,
				}))
			}
			if (autocompleteData.phone) {
				setValue('profile.phone', autocompleteData.phone)
				clearErrors('profile.phone'); // Limpar erro do campo telefone
				setAutocompletedByCpf(prev => ({
					...prev,
					phone: true,
				}))
			}
			if (autocompleteData.socialName) {
				setValue('profile.socialName', autocompleteData.socialName)
				clearErrors('profile.socialName'); // Limpar erro do campo nome social
				setAutocompletedByCpf(prev => ({
					...prev,
					socialName: true,
				}))
			}
			if (autocompleteData.gender) {
				setValue('profile.gender', autocompleteData.gender)
				clearErrors('profile.gender'); // Limpar erro do campo sexo
				setAutocompletedByCpf(prev => ({
					...prev,
					gender: true,
				}))
			}
			
			// Disparar validação dos campos preenchidos para garantir que não há mais erros
			setTimeout(() => {
				if (autocompleteData.name) trigger('profile.name');
				if (autocompleteData.birthdate) trigger('profile.birthdate');
				if (autocompleteData.email) trigger('profile.email');
				if (autocompleteData.phone) trigger('profile.phone');
				if (autocompleteData.socialName) trigger('profile.socialName');
				if (autocompleteData.gender) trigger('profile.gender');
			}, 100);
			
			console.log("Dados do proponente preenchidos automaticamente e erros limpos:", proponentDataRaw);
		} else {
			console.log('Nenhum dado encontrado para o CPF informado')
		}
		setIsLoadingData(false)
	}

	// Schema dinâmico para coparticipante baseado no prazo da operação
	const coparticipantSchema = useMemo(() => {
		const currentDeadline = getValues().product?.deadline;
		const deadlineMonths = currentDeadline ? parseInt(currentDeadline, 10) : null;
		
		return object({
			operation: dpsOperationForm,
			profile: createDpsProfileFormWithDeadline(deadlineMonths),
			// address: dpsAddressForm, // Removido - endereço será o mesmo para toda a operação
		});
	}, [getValues().product?.deadline]);

	// Form for co-participant registration
	const coparticipantForm = useForm<DpsCoparticipantForm>({
		resolver: valibotResolver(coparticipantSchema),
		defaultValues: {
			operation: {
				operationNumber: '',
				participantsNumber: '',
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
			
			
			// Chamada real para a API de CEP usando a função getAddressByZipcode
			const addressResponse = await getAddressByZipcode(cleanCep);
			
			if (!addressResponse) {
				toast.error('CEP não encontrado. Verifique o CEP informado.');
				return;
			}
			
			// Preencher os campos com os dados retornados pela API
			const addressData = addressResponse;
			setterFunction('street', (addressData.logradouro) as any);
			setterFunction('city', (addressData.localidade) as any);
			setterFunction('state', (addressData.uf) as any);
			setterFunction('district', (addressData.bairro) as any);

			// Não mostrar toast de sucesso se o endereço for bloqueado - o modal já dará o feedback
			const cityName = addressData.localidade?.trim();
			const isBlockedLocation = addressData.uf === 'AL' && cityName && [
				'Pinheiro', 'Bebedouro', 'Bom Parto', 'Farot', 'Ponta Grossa', 'Mutange', 'Gruta de Lourdes', 'Vergel do Lago'
			].some(forbiddenCity => forbiddenCity.toLowerCase() === cityName.toLowerCase());

			if (!isBlockedLocation) {
				toast.success('Endereço carregado com sucesso!');
			}
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
			
			// Disparar validação para os campos preenchidos
			trigger('address.street');
			trigger('address.city');
			trigger('address.state');
			trigger('address.district');
			
			// Validar o formulário de endereço completo
			trigger('address');

			// Verificar se o endereço preenchido está em local bloqueado para MAG Habitacional
			// Aguardar um momento para garantir que os valores foram definidos
			setTimeout(() => {
				checkBlockedLocation();
			}, 100);

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

	// Função para verificar se o endereço atual está em local bloqueado
	const checkBlockedLocation = () => {
		const currentValues = getValues();
		const currentProductName = getProductName(currentValues.product?.product);

		// Verificar se o produto é MAG Habitacional E estamos em Alagoas
		if (isMagHabitacionalProduct(currentProductName) && currentValues.address?.state === 'AL') {
			const forbiddenDistricts = [
				'Pinheiro',
				'Bebedouro',
				'Bom Parto',
				'Farot',
				'Ponta Grossa',
				'Mutange',
				'Gruta de Lourdes',
				'Vergel do Lago'
			];

			// Verificar apenas o bairro (district)
			const districtName = currentValues.address?.district?.trim();

			const isDistrictBlocked = districtName && forbiddenDistricts.some(forbiddenDistrict =>
				forbiddenDistrict.toLowerCase() === districtName.toLowerCase()
			);

			if (isDistrictBlocked) {
				setBlockedLocationCity(districtName || 'Bairro bloqueado');
				setShowBlockedLocationAlert(true);
				// Abrir modal imediatamente quando detectar endereço bloqueado
				setIsAlagoasErrorModalOpen(true);
			} else {
				setShowBlockedLocationAlert(false);
				setBlockedLocationCity('');
				setIsAlagoasErrorModalOpen(false);
			}
		} else {
			// Não é MAG Habitacional ou não está em Alagoas - liberar qualquer endereço
			setShowBlockedLocationAlert(false);
			setBlockedLocationCity('');
			setIsAlagoasErrorModalOpen(false);
		}
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
					setPercentageErrorMessage(validationResult.message);
					setIsPercentageErrorModalOpen(true);
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
				availablePercentage: '0,01%'
			};
		}
		
		// Obter o número de participantes declarados
		const declaredParticipants = parseInt(getValues().operation.participantsNumber, 10) || 1;
		
		// Se há múltiplos participantes (mais de 1), o participante principal não pode ter 100%
		if (declaredParticipants > 1 && newPercentage >= 100) {
			return {
				valid: false,
				message: 'Para operações com múltiplos participantes, o proponente principal não pode ter 100% de participação',
				availablePercentage: '99,00%'
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
		
		// Verificar se o novo percentual excederia 100% (com tolerância de 0,01% para arredondamento)
		const totalWithNew = existingTotal + newPercentage;
		if (totalWithNew > 100.01) {
			return {
				valid: false, 
				message: `O percentual excede o limite. Total: ${totalWithNew.toFixed(2).replace('.', ',')}%`,
				availablePercentage: (100 - existingTotal).toFixed(2).replace('.', ',') + '%'
			};
		}
		
		// Para múltiplos participantes, verificar se deixa espaço mínimo para outros
		if (declaredParticipants > 1) {
			const remainingParticipants = declaredParticipants - 1 - coparticipants.length; // -1 pelo próprio proponente
			const minimumPercentageForOthers = remainingParticipants * 0.01; // Mínimo 0,01% por participante
			const remainingPercentage = 100 - newPercentage;
			
			if (remainingPercentage < minimumPercentageForOthers) {
				return {
					valid: false,
					message: `Percentual muito alto. É necessário deixar pelo menos ${minimumPercentageForOthers.toFixed(2).replace('.', ',')}% para os outros ${remainingParticipants} participante(s)`,
					availablePercentage: (100 - minimumPercentageForOthers).toFixed(2).replace('.', ',') + '%'
				};
			}
			
			// Validação adicional: calcular percentual máximo permitido considerando participantes existentes
			const maxAllowedPercentage = 100 - minimumPercentageForOthers;
			if (newPercentage > maxAllowedPercentage) {
				return {
					valid: false,
					message: `Percentual máximo permitido: ${maxAllowedPercentage.toFixed(2).replace('.', ',')}% (deve sobrar ${minimumPercentageForOthers.toFixed(2).replace('.', ',')}% para ${remainingParticipants} participante(s))`,
					availablePercentage: maxAllowedPercentage.toFixed(2).replace('.', ',') + '%'
				};
			}
		}
		
		return { valid: true, message: '', availablePercentage: '' };
	};

	// Função para calcular o valor com base na porcentagem
	const calculateParticipationValue = (percentage: string) => {
		const numPercentage = parseFloat(percentage?.replace('%', '').replace(',', '.')) || 0;
		// Obter o valor total da operação do Capital MIP
		const totalValue = getValues().product?.mip || '';
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
		
		// Verificar se o novo percentual excederia 100% (com tolerância de 0,01% para arredondamento)
		const totalWithNew = existingTotal + newPercentage;
		if (totalWithNew > 100.01) {
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
			// Para o último participante, deve completar exatamente 100% (com tolerância de 0,01% para arredondamento)
			if (Math.abs(totalWithNew - 100) > 0.01) {
				return {
					valid: false,
					message: `O último participante deve completar exatamente 100%. Total atual: ${totalWithNew.toFixed(2).replace('.', ',')}%`,
					availablePercentage: ''  // Não sugerir valor
				};
			}
		}
		
		// Se ainda há participantes para cadastrar (participantsLeft > 0), verificar se há espaço para outros
		if (participantsLeft > 0) {
			// Verificar se o percentual deixa pelo menos 0,01% para cada participante restante
			const minimumPercentageNeeded = participantsLeft * 0.01; // 0,01% mínimo por participante
			const remainingPercentage = 100 - totalWithNew;
			
			if (remainingPercentage < minimumPercentageNeeded) {
				return {
					valid: false,
					message: `Percentual muito alto. Necessário deixar pelo menos ${minimumPercentageNeeded.toFixed(2).replace('.', ',')}% para os outros ${participantsLeft} participante(s)`,
					availablePercentage: ''  // Não sugerir valor
				};
			}
			
			// Redundância para garantir que nunca exceda 100% (com tolerância de 0,01% para arredondamento)
			if (totalWithNew >= 100.01) {
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
			const participationValue = calculateParticipationValue(value);
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
				
				// Mostrar mensagem de erro no modal para feedback adicional
				setPercentageErrorMessage(coparticipantValidation.message);
				setIsPercentageErrorModalOpen(true);
				
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
		const participationValue = calculateParticipationValue(value);
			
			// Atualizar o valor da participação para exibição
			setCoparticipantParticipationValue(participationValue);
		} catch (error) {
			console.error('Erro ao processar percentual de participação:', error);
		}
	};

	// Manipulador para o campo % Participação do formulário principal
	const handleParticipationPercentageBlur = (value: string) => {
		try {
			const mipValue = getValues().product?.mip || '';
			if (!value || !mipValue) {
				setParticipationValue('');
				return;
			}
			
			// Para participante único, sempre calcular com base em 100%
			if (participantsNumber === '1') {
				const participationValue = calculateParticipationValue('100,00%');
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
				
				// Mostrar mensagem de erro no modal para feedback adicional
				setPercentageErrorMessage(percentValidation.message);
				setIsPercentageErrorModalOpen(true);
				
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
			const participationValue = calculateParticipationValue(value);
			setParticipationValue(participationValue);
			
			const operationValue = getValues().product?.mip || '';
			console.log(`Calculado participação no financiamento: ${participationValue} (${value} de ${operationValue})`);
		} catch (error) {
			console.error('Erro ao calcular participação no financiamento:', error);
			setParticipationValue('');
		}
	};

	// Callback para quando o MIP perde o foco
	const handleMipBlur = (mipValue: string, participationPercentage: string) => {
		if (mipValue && participationPercentage) {
			// Calcular o valor de participação
			const calculatedValue = calculateParticipationValue(participationPercentage);
			setParticipationValue(calculatedValue);
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
				const participationValue = calculateParticipationValue(remainingPercentageFormatted);
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
				// Liberar os campos para edição
				setValue('operation.isParticipantsNumberReadOnly', '');
				
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
			
			// Limpar valores de operação carregados previamente
			if (getValues().operation.participantsNumber) {
			setValue('operation.participantsNumber', '');
			setParticipantsNumber('');
			}
			
			console.log('Operação disponível para novo preenchimento.');
		} finally {
			setIsLoadingOperationData(false);
		}
	};

	// Estado para controlar se o CPF foi definido via parâmetro mas ainda não foi consultado
	const [cpfParamPending, setCpfParamPending] = useState<string | null>(null);

	// Ajustar useEffect para tratar CPF via parâmetro de URL
	useEffect(() => {
		if (cpfParam) {
			// Limpar o último CPF consultado para permitir novas consultas via parâmetro
			setLastQueriedCpf('');
			
			// NÃO habilitar todas as seções ainda - aguardar preenchimento da operação
			setShowOtherSections(false);
			
			// Apenas preencher o campo CPF e marcar como pendente para consulta
			if (validarCpf(cpfParam)) {
				setValue('profile.cpf', cpfParam);
				setCpfParamPending(cpfParam);
				toast.success(`CPF ${cpfParam} definido. Preencha os dados da operação para continuar.`);
			} else {
				toast.error(`CPF inválido: ${cpfParam}`);
				setCpfParamPending(null);
			}
		} else {
			// Se não tem CPF, começar com as seções desabilitadas
			setShowOtherSections(false);
			setCpfParamPending(null);
		}
	}, [cpfParam, setValue]);

	// Componente auxiliar para o botão Salvar com loading
	const SaveButton = ({ isSubmitting, isLoading }: { isSubmitting: boolean, isLoading: boolean }) => {
		const handleSaveClick = async () => {
			const isValid = await trigger()
			if (isValid) {
				// Usar handleSubmit diretamente em vez de onSubmit
				handleSubmit(onSubmit)()
			}
		}

		return (
			<Button 
				type="button" 
				className="w-40" 
				disabled={isSubmitting || isLoading}
				onClick={handleSaveClick}
			>
				{isSubmitting || isLoading ? (
					<>
						Salvando
						<Loader2Icon className="ml-2 h-4 w-4 animate-spin" />
					</>
				) : "Salvar"}
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
		
		// Verificar se o botão de adicionar deve ser mostrado (sempre mostrar se declaredParticipants > 1)
		if (declaredParticipants > 1) {
			// Verificar se dados da operação estão completos
			const operationComplete = areOperationFieldsComplete();
			
			// Verificar se Capital MIP está preenchido
			const capitalMipFilled = !!(getValues().product?.mip && getValues().product.mip.trim() !== '');
			
			// Verificar se ainda há espaço para mais participantes
			const canAddMore = currentParticipants < declaredParticipants;
			
			// Determinar se o botão deve estar habilitado
			const isEnabled = operationComplete && capitalMipFilled && canAddMore && !isSubmitting && !isLoading;
			
			// Determinar a mensagem do tooltip
			let tooltipMessage = '';
			if (!operationComplete) {
				tooltipMessage = 'Preencha os dados da operação (número da operação e participantes) para adicionar um co-participante';
			} else if (!capitalMipFilled) {
				tooltipMessage = 'Preencha o Capital MIP para calcular os percentuais de participação';
			} else if (!canAddMore) {
				tooltipMessage = `Todos os ${declaredParticipants} participantes já foram cadastrados`;
			} else {
				tooltipMessage = 'Clique para adicionar um co-participante';
			}
			
			return (
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<div>
								<Button
									type="button"
									variant="outline"
									onClick={() => startCoparticipantForm()}
									disabled={!isEnabled}
									className="flex items-center gap-2"
								>
									Adicionar Co-participante
								</Button>
							</div>
						</TooltipTrigger>
						<TooltipContent>
							<p>{tooltipMessage}</p>
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
			formData.operation.participantsNumber
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
		showOperationGuidance
	]);

	// Adicionar useEffect para liberar seções quando o número de participantes for preenchido
	useEffect(() => {
		const participantsNum = watch('operation.participantsNumber');
		// Se o número de participantes estiver preenchido e não há CPF via parâmetro, liberar seções
		if (participantsNum && !cpfParam && !showOtherSections) {
			setShowOtherSections(true);
		}
	}, [watch('operation.participantsNumber'), cpfParam, showOtherSections]);

	// useEffect para consultar CPF quando dados da operação estão completos e há CPF pendente
	useEffect(() => {
		// Verificar se há CPF pendente de consulta e se os dados da operação estão completos
		if (cpfParamPending && areOperationFieldsComplete()) {
			console.log(`Dados da operação completos. Consultando CPF: ${cpfParamPending}`);
			
			// Fazer a consulta do CPF
			getDataByCpf(cpfParamPending);
			
			// Liberar as seções para preenchimento
			setShowOtherSections(true);
			
			// Limpar o CPF pendente
			setCpfParamPending(null);
			
			toast.success('Dados da operação preenchidos. Consultando informações do CPF...');
		}
	}, [cpfParamPending, watch('operation.operationNumber'), watch('operation.participantsNumber')]);

	// Função utilitária para obter o valor total da operação (agora vem do Capital MIP)
	const getTotalOperationValue = () => {
		return getValues().product.mip || '';
	};

	const calculateTotalValue = () => {
		const totalOperationValue = getTotalOperationValue();
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
							Após preencher o número de participantes, as demais seções do formulário serão exibidas.
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
							proponentAge={proponentAge}
							participationPercentage={participationPercentage}
							participationValue={participationValue}
							onParticipationPercentageBlur={handleParticipationPercentageBlur}
							onMipBlur={handleMipBlur}
							isSingleParticipant={participantsNumber === '1'}
							isLastParticipant={false}
							setValue={handleSetValueForProfile}
						/>
					</div>

					{/* Seção de endereço */}
					<div className="w-full max-w-7xl mx-auto bg-white rounded-3xl p-9 dps-address-section">
						<DpsAddressForm
							control={control as any}
							formState={formState}
							cepDataLoader={loadAddressByCep}
							disabled={isSubmitting || isLoading}
							onAddressChange={checkBlockedLocation}
						/>

						{/* Alerta para locais bloqueados em Alagoas */}
						{showBlockedLocationAlert && (
							<div className="mt-4">
								<Alert variant="destructive">
									<AlertTriangleIcon className="h-4 w-4" />
									<AlertDescription>
										<strong>Localidade Bloqueada:</strong> O município <strong>{blockedLocationCity}</strong> (AL)
										está localizado em uma área com alto risco de afundamento de solo,
										causado pela operação de mineração da Brasken.
										<br />
										<strong>Operações do produto MAG Habitacional não são permitidas nesta localidade.</strong>
									</AlertDescription>
								</Alert>
							</div>
						)}
					</div>

					{/* Lista de participantes (visível quando há proponente ou coparticipantes e Capital MIP preenchido) */}
					{(coparticipants.length > 0 || getValues().profile.name) && getValues().product?.mip && getValues().product.mip.trim() !== '' && (
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
										<p className="font-medium">{getValues().product?.mip || 'R$ 0,00'}</p>
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
										<div>{calculateParticipationValue(getValues().profile.participationPercentage || '0,00%')}</div>
										<div></div>
									</div>
								)}
								
								{coparticipants.map((coparticipant) => (
									<div key={coparticipant.id} className="grid grid-cols-5 gap-4 py-3 px-4 border-b hover:bg-gray-50">
										<div className="font-medium">{coparticipant.name}</div>
										<div>{coparticipant.cpf}</div>
										<div>{coparticipant.participationPercentage}</div>
										<div>{calculateParticipationValue(coparticipant.participationPercentage)}</div>
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
										<span className={cn(
											"ml-2 font-bold",
											(() => {
												const total = parseFloat(calculateTotalParticipation().replace('%', '').replace(',', '.'));
												if (Math.abs(total - 100) <= 0.01) return "text-green-600";
												if (total < 100) return "text-orange-600";
												return "text-red-600";
											})()
										)}>
											{calculateTotalParticipation()}
										</span>
									</div>
									<div>
										<span className="font-medium">Valor total alocado:</span>
										<span className="ml-2">{calculateTotalValue()}</span>
									</div>
								</div>
							</div>
							
							{(() => {
								const totalPercentageNum = parseFloat(calculateTotalParticipation().replace('%', '').replace(',', '.'));
								const isExact100 = Math.abs(totalPercentageNum - 100) <= 0.01;
								
								// Verificar se o número de participantes também está completo
								const declaredParticipants = parseInt(getValues().operation.participantsNumber, 10) || 0;
								const currentParticipants = (coparticipants.length + 1); // +1 pelo proponente principal
								const allParticipantsRegistered = currentParticipants === declaredParticipants;
								
								if (isExact100 && allParticipantsRegistered) {
									return (
										<div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
											<div className="flex items-center gap-2 text-green-700">
												<CheckCircle className="h-5 w-5" />
												<span className="font-medium">Operação completa - 100% de participação atingido</span>
											</div>
										</div>
									);
								} else if (isExact100 && !allParticipantsRegistered) {
									// Caso especial: 100% atingido mas número de participantes incorreto
									if (currentParticipants < declaredParticipants) {
										const missingParticipants = declaredParticipants - currentParticipants;
										return (
											<div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
												<div className="flex items-center gap-2 text-yellow-700">
													<XCircle className="h-5 w-5" />
													<span className="font-medium">
														100% atingido, mas faltam {missingParticipants} participante(s) para completar a operação
													</span>
												</div>
											</div>
										);
									} else {
										const excessParticipants = currentParticipants - declaredParticipants;
										return (
											<div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
												<div className="flex items-center gap-2 text-red-700">
													<XCircle className="h-5 w-5" />
													<span className="font-medium">
														100% atingido, mas há {excessParticipants} participante(s) em excesso
													</span>
												</div>
											</div>
										);
									}
								} else if (totalPercentageNum < 100) {
									const available = (100 - totalPercentageNum).toFixed(2).replace('.', ',');
									let message = `Operação incompleta - Disponível para alocação: ${available}%`;
									
									// Se todos os participantes estão cadastrados mas o percentual não é 100%
									if (allParticipantsRegistered) {
										message = `Todos os ${declaredParticipants} participante(s) cadastrados, mas faltam ${available}% para completar 100%`;
									}
									
									return (
										<div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
											<div className="flex items-center gap-2 text-orange-700">
												<XCircle className="h-5 w-5" />
												<span className="font-medium">
													{message}
												</span>
											</div>
										</div>
									);
								} else {
									const excess = (totalPercentageNum - 100).toFixed(2).replace('.', ',');
									let message = `Operação excede 100% - Excesso: ${excess}%`;
									
									// Se todos os participantes estão cadastrados mas o percentual excede 100%
									if (allParticipantsRegistered) {
										message = `Todos os ${declaredParticipants} participante(s) cadastrados, mas o total excede 100% em ${excess}%`;
									}
									
									return (
										<div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
											<div className="flex items-center gap-2 text-red-700">
												<XCircle className="h-5 w-5" />
												<span className="font-medium">
													{message}
												</span>
											</div>
										</div>
									);
								}
							})()}
						</div>
					)}

					{/* Botões de ação */}
					<div className="flex justify-between w-full max-w-7xl mx-auto mt-6">
						<div>
							<AddCoparticipantButtonOrMessage />
						</div>
						
						<div className="flex gap-4">
							<Button 
								type="button" 
								variant="outline" 
								className="w-40" 
								disabled={isSubmitting || isLoading}
								onClick={handleCancelFormClick}
							>
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
			
			{/* Modal de erro de percentual */}
			<Dialog
				open={isPercentageErrorModalOpen}
				onOpenChange={setIsPercentageErrorModalOpen}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Erro de Percentual</DialogTitle>
						<DialogDescription>
							{percentageErrorMessage}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button 
							type="button"
							onClick={() => setIsPercentageErrorModalOpen(false)}
						>
							Entendi
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Modal de erro para municípios proibidos em Alagoas */}
			<Dialog
				open={isAlagoasErrorModalOpen}
				onOpenChange={setIsAlagoasErrorModalOpen}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Operação Não Permitida</DialogTitle>
						<DialogDescription>
							Não é possível submeter a operação para o município <strong>{alagoasErrorCity}</strong> (AL)
							no produto MAG Habitacional.
							<br /><br />
							O bairro informado está localizado em um local com alto risco de afundamento
							de solo, causado pela operação de mineração da Brasken.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							type="button"
							onClick={() => setIsAlagoasErrorModalOpen(false)}
						>
							Entendi
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

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
									<p className="font-medium">{getValues().product?.mip || 'R$ 0,00'}</p>
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

						{/* Campos reorganizados para navegação via TAB sequencial */}
						<div className="flex flex-col gap-6 w-full">
							<h3 className="text-primary text-lg">Dados do Proponente</h3>
							
							{/* Primeira linha: CPF e Data de Nascimento */}
							<ShareLine>
								<Controller
									control={coparticipantForm.control}
									name="profile.cpf"
									render={({ field: { onChange, onBlur, value, ref } }: any) => {
										const profileErrors = coparticipantForm.formState.errors?.profile as any;
										const cpfError = profileErrors?.cpf;
										
										return (
											<label>
												<div className="text-gray-500">CPF <span className="text-red-500">*</span></div>
												<div className="relative">
													<Input
														id="coparticipant-cpf"
														type="text"
														placeholder="999.999.999-99"
														mask="999.999.999-99"
														tabIndex={1}
														className={cn(
															'w-full px-4 py-6 rounded-lg',
															cpfError && 'border-red-500 focus-visible:border-red-500',
															isLoadingCoparticipant || fetchingCpfDataCoparticipant ? 'opacity-50 cursor-not-allowed' : ''
														)}
														disabled={isLoadingCoparticipant || fetchingCpfDataCoparticipant}
														autoComplete="cpf"
														onChange={(e) => {
															const formattedValue = e.target.value;
															onChange(formattedValue);
															if (!cpfError?.message) {
																e.currentTarget.classList.remove('border-red-500');
																e.currentTarget.classList.remove('focus-visible:border-red-500');
															}
														}}
														onBlur={(e) => {
															const cpf = e.target.value;
															if (cpf && cpf.replace(/\D/g, '').length === 11) {
																getDataByCpfForCoparticipant(cpf);
															}
															onBlur();
														}}
														value={typeof value === 'string' ? value : ''}
														ref={ref}
													/>
													{(isLoadingCoparticipant || fetchingCpfDataCoparticipant) && (
														<Loader2Icon className="absolute right-3 top-2.5 h-5 w-5 animate-spin" />
													)}
												</div>
												<div className="text-xs text-red-500">{cpfError?.message}</div>
											</label>
										);
									}}
								/>

								<Controller
									control={coparticipantForm.control}
									name="profile.birthdate"
									render={({ field: { onChange, onBlur, value, ref } }: any) => {
										const profileErrors = coparticipantForm.formState.errors?.profile as any;
										const birthdateError = profileErrors?.birthdate;
										
										return (
											<label>
												<div className="text-gray-500">Data de Nascimento <span className="text-red-500">*</span></div>
												<DatePicker
													id="coparticipant-birthdate"
													placeholder="01/01/1999"
													className={cn(
														'w-full px-4 py-6 rounded-lg',
														birthdateError && 'border-red-500 focus-visible:border-red-500'
													)}
													disabled={isLoadingCoparticipant || fetchingCpfDataCoparticipant}
													onChange={onChange}
													onBlur={onBlur}
													value={value instanceof Date ? value : undefined}
													ref={ref}
												/>
												<div className="text-xs text-red-500">{birthdateError?.message}</div>
											</label>
										);
									}}
								/>
							</ShareLine>

							{/* Segunda linha: Nome e Nome Social */}
							<ShareLine>
								<Controller
									control={coparticipantForm.control}
									name="profile.name"
									render={({ field: { onChange, onBlur, value, ref } }: any) => {
										const profileErrors = coparticipantForm.formState.errors?.profile as any;
										const nameError = profileErrors?.name;
										
										return (
											<label>
												<div className="text-gray-500">Nome do Proponente <span className="text-red-500">*</span></div>
												<Input
													id="coparticipant-name"
													type="text"
													placeholder="Nome do proponente"
													tabIndex={3}
													className={cn(
														'w-full px-4 py-6 rounded-lg',
														nameError && 'border-red-500 focus-visible:border-red-500'
													)}
													autoComplete="name"
													disabled={isLoadingCoparticipant || fetchingCpfDataCoparticipant}
													onChange={onChange}
													onBlur={onBlur}
													value={typeof value === 'string' ? value : ''}
													ref={ref}
												/>
												<div className="text-xs text-red-500">{nameError?.message}</div>
											</label>
										);
									}}
								/>

								<Controller
									control={coparticipantForm.control}
									name="profile.socialName"
									render={({ field: { onChange, onBlur, value, ref } }: any) => {
										const profileErrors = coparticipantForm.formState.errors?.profile as any;
										const socialNameError = profileErrors?.socialName;
										
										return (
											<label>
												<div className="text-gray-500">Nome social do Proponente</div>
												<Input
													id="coparticipant-socialName"
													type="text"
													placeholder="Nome social do proponente"
													tabIndex={4}
													className={cn(
														'w-full px-4 py-6 rounded-lg',
														socialNameError && 'border-red-500 focus-visible:border-red-500'
													)}
													autoComplete="socialName"
													disabled={isLoadingCoparticipant || fetchingCpfDataCoparticipant}
													onChange={onChange}
													onBlur={onBlur}
													value={typeof value === 'string' ? value : ''}
													ref={ref}
												/>
												<div className="text-xs text-red-500">{socialNameError?.message}</div>
											</label>
										);
									}}
								/>
							</ShareLine>

							{/* Terceira linha: Atividade Profissional e Email */}
							<ShareLine>
								<Controller
									control={coparticipantForm.control}
									name="profile.profession"
									render={({ field: { onChange, onBlur, value, ref } }: any) => {
										const profileErrors = coparticipantForm.formState.errors?.profile as any;
										const professionError = profileErrors?.profession;
										
										return (
											<label>
												<div className="text-gray-500">Atividade profissional <span className="text-red-500">*</span></div>
												<Input
													id="coparticipant-profession"
													type="text"
													placeholder="Atividade profissional"
													tabIndex={5}
													className={cn(
														'w-full px-4 py-6 rounded-lg',
														professionError && 'border-red-500 focus-visible:border-red-500'
													)}
													autoComplete="profession"
													disabled={isLoadingCoparticipant || fetchingCpfDataCoparticipant}
													onChange={onChange}
													onBlur={onBlur}
													value={typeof value === 'string' ? value : ''}
													ref={ref}
												/>
												<div className="text-xs text-red-500">{professionError?.message}</div>
											</label>
										);
									}}
								/>

								<Controller
									control={coparticipantForm.control}
									name="profile.email"
									render={({ field: { onChange, onBlur, value, ref } }: any) => {
										const profileErrors = coparticipantForm.formState.errors?.profile as any;
										const emailError = profileErrors?.email;
										
										return (
											<label>
												<div className="text-gray-500">E-mail <span className="text-red-500">*</span></div>
												<Input
													id="coparticipant-email"
													type="text"
													placeholder="conta@exemplo.com.br"
													tabIndex={6}
													className={cn(
														'w-full px-4 py-6 rounded-lg',
														emailError && 'border-red-500 focus-visible:border-red-500'
													)}
													autoComplete="email"
													disabled={isLoadingCoparticipant || fetchingCpfDataCoparticipant}
													onChange={onChange}
													onBlur={onBlur}
													value={typeof value === 'string' ? value : ''}
													ref={ref}
												/>
												<div className="text-xs text-red-500">{emailError?.message}</div>
											</label>
										);
									}}
								/>
							</ShareLine>

							{/* Quarta linha: Telefone e Sexo */}
							<ShareLine>
								<Controller
									control={coparticipantForm.control}
									name="profile.phone"
									render={({ field: { onChange, onBlur, value, ref } }: any) => {
										const profileErrors = coparticipantForm.formState.errors?.profile as any;
										const phoneError = profileErrors?.phone;
										
										return (
											<label>
												<div className="text-gray-500">Telefone <span className="text-red-500">*</span></div>
												<Input
													id="coparticipant-phone"
													type="text"
													placeholder="(99) 99999-9999"
													mask="(99) 99999-99999"
													tabIndex={7}
													className={cn(
														'w-full px-4 py-6 rounded-lg',
														phoneError && 'border-red-500 focus-visible:border-red-500'
													)}
													disabled={isLoadingCoparticipant || fetchingCpfDataCoparticipant}
													autoComplete="tel"
													onChange={onChange}
													onBlur={onBlur}
													value={typeof value === 'string' ? value : ''}
													ref={ref}
												/>
												<div className="text-xs text-red-500">{phoneError?.message}</div>
											</label>
										);
									}}
								/>

								<Controller
									control={coparticipantForm.control}
									name="profile.gender"
									render={({ field: { onChange, onBlur, value } }: any) => {
										const profileErrors = coparticipantForm.formState.errors?.profile as any;
										const genderError = profileErrors?.gender;
										
										return (
											<label>
												<div className="text-gray-500">Sexo <span className="text-red-500">*</span></div>
												<SelectComp
													placeholder="Sexo"
													options={[
														{ value: 'M', label: 'Masculino' },
														{ value: 'F', label: 'Feminino' }
													]}
													triggerClassName="p-4 h-12 rounded-lg"
													disabled={isLoadingCoparticipant || fetchingCpfDataCoparticipant}
													onValueChange={(val: string) => {
														onChange(val);
														setTimeout(() => {
															onBlur();
														}, 0);
													}}
													defaultValue={typeof value === 'string' ? value : ''}
												/>
												<div className="text-xs text-red-500">{genderError?.message}</div>
											</label>
										);
									}}
								/>
							</ShareLine>
						</div>

						{/* Campos de Participação para Coparticipante */}
						<div className="flex flex-col gap-6 w-full mt-6">
							<h4 className="text-primary text-lg">Participação na Operação</h4>
							
							<ShareLine>
								<Controller
									control={coparticipantForm.control}
									name="profile.participationPercentage"
									render={({ field: { onChange, onBlur, value } }: any) => {
										const profileErrors = coparticipantForm.formState.errors?.profile as any;
										const participationError = profileErrors?.participationPercentage;
										
										// Verificar se Capital MIP está preenchido no formulário principal
										const mipFilled = getValues().product?.mip && getValues().product.mip.trim() !== '';
										
										// Se for o último participante, renderizar versão somente leitura com valor preenchido
										if (isLastParticipant) {
											return (
												<label>
													<div className="text-gray-500">% Participação <span className="text-red-500">*</span></div>
													<div className="h-12 w-full rounded-lg border border-input bg-blue-50 px-4 flex items-center">
														{typeof value === 'string' ? value : '0,00%'}
													</div>
													<div className="text-xs text-blue-600">
														Preenchido automaticamente - último participante deve completar 100%
													</div>
													<div className="text-xs text-red-500">
														{participationError?.message}
													</div>
												</label>
											);
										}
										
										// Renderizar o componente normal
										return (
											<label>
												<div className="text-gray-500">% Participação <span className="text-red-500">*</span></div>
												<Input
													id="coparticipantParticipationPercentage"
													type="text"
													placeholder="0,00%"
													className={cn(
														'w-full px-4 py-6 rounded-lg',
														participationError && 'border-red-500 focus-visible:border-red-500',
														'border-orange-400 bg-orange-50'
													)}
													disabled={isLoadingCoparticipant || fetchingCpfDataCoparticipant || !mipFilled}
													onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
														// Obtém o valor original do input
														let inputValue = e.target.value;
														
														// Se o usuário está tentando apagar, permita isso
														if (inputValue.length < (value as string || '').length) {
															inputValue = inputValue.replace(/%/g, '');
															onChange(inputValue);
															return;
														}
														
														// Remove tudo exceto dígitos e vírgula
														let rawValue = inputValue.replace(/[^\d,]/g, '')
														
														// Limita a uma única vírgula
														if (rawValue.split(',').length > 2) {
															rawValue = rawValue.replace(/,/g, function(match: string, offset: number, string: string) {
																return offset === string.indexOf(',') ? ',' : '';
															});
														}
														
														// Limita o número de dígitos antes da vírgula a 3 (para permitir 100)
														if (rawValue.includes(',')) {
															const [intPart, decPart] = rawValue.split(',');
															if (intPart.length > 3) {
																rawValue = intPart.substring(0, 3) + ',' + decPart;
															}
														} else if (rawValue.length > 3) {
															rawValue = rawValue.substring(0, 3);
														}
														
														// Calcular percentual máximo permitido para este co-participante
														let maxAllowed = 100;
														
														// Calcular total já alocado
														let existingTotal = 0;
														if (existingMainProponent) {
															const mainPercentage = parseFloat(existingMainProponent.participationPercentage.replace('%', '').replace(',', '.')) || 0;
															existingTotal += mainPercentage;
														} else {
															const mainPercentStr = getValues().profile.participationPercentage || '0,00%';
															const mainPercent = parseFloat(mainPercentStr.replace('%', '').replace(',', '.')) || 0;
															existingTotal += mainPercent;
														}
														
														// Incluir percentuais dos outros coparticipantes (exceto o que está sendo editado)
														coparticipants.forEach(cp => {
															if (editingCoparticipantId && cp.id === editingCoparticipantId) {
																return;
															}
															const cpPercentage = parseFloat(cp.participationPercentage.replace('%', '').replace(',', '.')) || 0;
															existingTotal += cpPercentage;
														});
														
														// Calcular participantes restantes
														const numParticipants = parseInt(getValues().operation.participantsNumber, 10) || 2;
														const alreadyCadastrated = coparticipants.length + 1; // +1 pelo proponente principal
														const currentParticipants = editingCoparticipantId ? alreadyCadastrated : alreadyCadastrated + 1;
														const participantsLeft = numParticipants - currentParticipants;
														
														// Se ainda há participantes para cadastrar, deixar espaço mínimo
														if (participantsLeft > 0) {
															const minimumForOthers = participantsLeft * 0.01;
															maxAllowed = Math.min(100, 100 - existingTotal - minimumForOthers);
														} else {
															// Se é o último participante, pode usar todo o espaço restante
															maxAllowed = 100 - existingTotal;
														}
														
														// Garantir que maxAllowed seja pelo menos 0,01
														maxAllowed = Math.max(0.01, maxAllowed);
														
														// Limitar valor máximo baseado no cálculo
														if (rawValue.includes(',')) {
															const [intPart, decPart] = rawValue.split(',');
															const intValue = parseInt(intPart, 10);
															const decValue = parseInt(decPart.padEnd(2, '0').substring(0, 2), 10) / 100;
															const totalValue = intValue + decValue;
															
															if (totalValue > maxAllowed) {
																const maxInt = Math.floor(maxAllowed);
																const maxDec = Math.round((maxAllowed - maxInt) * 100);
																rawValue = `${maxInt},${maxDec.toString().padStart(2, '0')}`;
															}
														} else {
															const intValue = parseInt(rawValue, 10);
															if (intValue > maxAllowed) {
																const maxInt = Math.floor(maxAllowed);
																rawValue = maxInt.toString();
															}
														}
														
														// Adiciona o símbolo de porcentagem apenas se houver algum valor
														if (rawValue !== '') {
															rawValue += rawValue.includes('%') ? '' : '%';
														}
														
														onChange(rawValue);
													}}
													onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
														// Normaliza o formato ao perder o foco
														const rawValue = e.target.value.replace(/[^\d,]/g, '');
														
														// Se o campo estiver vazio, deixar vazio
														if (rawValue === '') {
															onBlur();
															return;
														}
														
														// Formatar o valor
														let formattedValue;
														
														if (rawValue.includes(',')) {
															const parts = rawValue.split(',');
															const intPart = parseInt(parts[0], 10) || 0;
															const decPart = parts.length > 1 ? parts[1] : '00';
															const paddedDecPart = decPart.padEnd(2, '0').substring(0, 2);
															formattedValue = `${intPart},${paddedDecPart}%`;
														} else {
															const intValue = parseInt(rawValue, 10) || 0;
															formattedValue = `${intValue},00%`;
														}
														
														// Atualizar o valor formatado
														onChange(formattedValue);
														
														// Chamar o callback para validar
														if (handleCoparticipantPercentageBlur) {
															handleCoparticipantPercentageBlur(formattedValue);
														}
														
														onBlur();
													}}
													value={typeof value === 'string' ? value : ''}
												/>
												<div className="text-xs text-red-500">
													{participationError?.message}
												</div>
												{!mipFilled && (
													<div className="text-xs text-orange-600">
														Preencha o Capital MIP primeiro para habilitar este campo
													</div>
												)}
												{mipFilled && !isLastParticipant && (() => {
													// Calcular o percentual máximo disponível para mostrar ao usuário
													let existingTotal = 0;
													if (existingMainProponent) {
														const mainPercentage = parseFloat(existingMainProponent.participationPercentage.replace('%', '').replace(',', '.')) || 0;
														existingTotal += mainPercentage;
													} else {
														const mainPercentStr = getValues().profile.participationPercentage || '0,00%';
														const mainPercent = parseFloat(mainPercentStr.replace('%', '').replace(',', '.')) || 0;
														existingTotal += mainPercent;
													}
													
													coparticipants.forEach(cp => {
														if (editingCoparticipantId && cp.id === editingCoparticipantId) return;
														const cpPercentage = parseFloat(cp.participationPercentage.replace('%', '').replace(',', '.')) || 0;
														existingTotal += cpPercentage;
													});
													
													const numParticipants = parseInt(getValues().operation.participantsNumber, 10) || 2;
													const alreadyCadastrated = coparticipants.length + 1;
													const currentParticipants = editingCoparticipantId ? alreadyCadastrated : alreadyCadastrated + 1;
													const participantsLeft = numParticipants - currentParticipants;
													
													let maxAvailable = 100 - existingTotal;
													if (participantsLeft > 0) {
														const minimumForOthers = participantsLeft * 0.01;
														maxAvailable = Math.min(maxAvailable, maxAvailable - minimumForOthers);
													}
													
													if (participantsLeft > 0) {
														return (
															<div className="text-xs text-blue-600">
																Máximo permitido: {maxAvailable.toFixed(2).replace('.', ',')}% (deve sobrar {(participantsLeft * 0.01).toFixed(2).replace('.', ',')}% para {participantsLeft} participante(s) restante(s))
															</div>
														);
													}
													return null;
												})()}
											</label>
										);
									}}
								/>

								<div>
									<div className="text-gray-500">Participação no Financiamento</div>
									<div className="h-12 w-full rounded-lg border border-input bg-gray-100 px-4 flex items-center">
										{coparticipantParticipationValue || 'R$ 0,00'}
									</div>
								</div>
							</ShareLine>
						</div>

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
								tabIndex={10}
								onClick={() => setIsCoparticipantDialogOpen(false)}
							>
								Cancelar
							</Button>
							<Button 
								type="button" 
								tabIndex={11}
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

			{/* Modal de confirmação de cancelamento */}
			<Dialog
				open={isCancelConfirmDialogOpen}
				onOpenChange={setIsCancelConfirmDialogOpen}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Confirmar cancelamento</DialogTitle>
						<DialogDescription>
							Tem certeza que deseja cancelar o preenchimento? Todos os dados inseridos serão perdidos e você será redirecionado para a tela anterior.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button 
							type="button"
							variant="outline" 
							onClick={handleCancelCancelForm}
						>
							Não, continuar
						</Button>
						<Button 
							type="button"
							variant="destructive"
							onClick={handleConfirmCancelForm}
						>
							Sim, cancelar
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Modal de participantes faltando */}
			<Dialog
				open={isMissingParticipantsModalOpen}
				onOpenChange={setIsMissingParticipantsModalOpen}
			>
				<DialogContent className="max-w-xl">
					<DialogHeader>
						<DialogTitle>⚠️ Operação Incompleta - Participantes Faltando</DialogTitle>
						<DialogDescription>
							{missingParticipantsData && (
								<div className="space-y-4">
									<div className="p-4 bg-red-50 border border-red-200 rounded-lg">
										<p className="font-medium text-red-800 mb-2">
											Não é possível salvar a operação neste momento.
										</p>
										<p className="text-red-700 text-sm">
											Você precisa cadastrar todos os co-participantes antes de finalizar a operação.
										</p>
									</div>
									
									<div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
										<h4 className="font-medium text-blue-800 mb-2">Status da Operação:</h4>
										<div className="text-sm text-blue-700 space-y-1">
											<p>• <strong>Participantes declarados:</strong> {missingParticipantsData.declared}</p>
											<p>• <strong>Participantes cadastrados:</strong> {missingParticipantsData.current}</p>
											<p>• <strong>Co-participantes faltando:</strong> <span className="font-bold text-red-600">{missingParticipantsData.missing}</span></p>
										</div>
									</div>
									
									<div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
										<h4 className="font-medium text-gray-800 mb-2">O que fazer:</h4>
										<p className="text-sm text-gray-700">
											Clique em <strong>&quot;Adicionar Co-participante&quot;</strong> para cadastrar os {missingParticipantsData.missing} participante(s) restante(s) 
											e garantir que o percentual total de participação seja exatamente 100%.
										</p>
									</div>
								</div>
							)}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="flex gap-3">
						<Button 
							type="button"
							variant="outline" 
							onClick={closeMissingParticipantsModal}
							className="flex-1"
						>
							Fechar
						</Button>
						<Button 
							type="button"
							onClick={() => {
								closeMissingParticipantsModal();
								// Abrir diretamente o modal de co-participante
								setTimeout(() => {
									saveAndAddCoparticipant();
								}, 100);
							}}
							className="flex-1 bg-blue-600 hover:bg-blue-700"
						>
							🔗 Adicionar Co-participante
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</form>
	)
}

export default DpsInitialForm
