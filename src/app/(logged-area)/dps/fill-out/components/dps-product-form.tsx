'use client'

import { Input } from '@/components/ui/input'
import SelectComp from '@/components/ui/select-comp'
import ShareLine from '@/components/ui/share-line'
import { cn, maskToBrlCurrency, maskToDigitsAndSuffix } from '@/lib/utils'
import React, { useEffect } from 'react'
import { Control, Controller, FormState, useWatch, UseFormSetError, UseFormClearErrors, Path } from 'react-hook-form'
import { custom, InferInput, nonEmpty, object, pipe, string } from 'valibot'
import { DpsInitialForm } from './dps-initial-form'
import { HelpCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import useAlertDialog from '@/hooks/use-alert-dialog'
import { getMaxAgeByProduct, getFinalAgeErrorMessage } from '@/constants'

export const dpsProductForm = object({
	product: pipe(string(), nonEmpty('Campo obrigatório.')),
	deadline: pipe(
		string(), 
		nonEmpty('Campo obrigatório.'),
		custom(
			v => {
				const numValue = parseInt(v as string, 10);
				return !isNaN(numValue) && numValue >= 1 && numValue <= 420;
			},
			'Prazo deve ser entre 1 e 420 meses.'
		)
	),
	mip: pipe(
		string(),
		nonEmpty('Campo obrigatório.'),
		custom(
			v => checkCapitalValue(v as string),
			'Capital máximo R$ 10.000.000,00'
		)
	),
	dfi: pipe(
		string(),
		nonEmpty('Campo obrigatório.'),
		custom(
			v => checkCapitalValue(v as string),
			'Capital máximo R$ 10.000.000,00'
		)
	),
	propertyType: pipe(string(), nonEmpty('Campo obrigatório.'))
})

export type DpsProductFormType = InferInput<typeof dpsProductForm>

const DpsProductForm = ({
	data,
	prazosOptions,
	productOptions,
	tipoImovelOptions,
	control,
	formState,
	disabled = false,
	proponentAge = null,
	participationPercentage,
	participationValue,
	onParticipationPercentageBlur,
	onMipBlur,
	isSingleParticipant,
	isLastParticipant,
	setValue
}: {
	data?: Partial<DpsProductFormType>
	prazosOptions: { value: string; label: string }[]
	productOptions: { value: string; label: string }[]
	tipoImovelOptions: { value: string; label: string }[]
	control: Control<DpsInitialForm>
	formState: FormState<DpsInitialForm>
	disabled?: boolean
	proponentAge?: number | null
	participationPercentage?: string
	participationValue?: string
	onParticipationPercentageBlur?: (value: string) => void
	onMipBlur?: (mipValue: string, participationPercentage: string) => void
	isSingleParticipant?: boolean
	isLastParticipant?: boolean
	setValue?: (name: string, value: any) => void
}) => {
	// Ignoramos erros quando em modo somente leitura
	const errors = disabled ? {} : formState.errors?.product;
	const [highlightMissing, setHighlightMissing] = React.useState<boolean>(false);
	
	// Monitora o valor do Capital MIP para usar como valor total da operação na validação do DFI
	const mipValue = useWatch({
		control,
		name: "product.mip",
		defaultValue: ""
	});
	
	// Monitora o valor da participação em percentual
	const currentParticipationPercentage = useWatch({
		control,
		name: "profile.participationPercentage",
		defaultValue: ""
	});
	
	// Modal de alerta para idade inválida
	const alertDialog = useAlertDialog({
		initialContent: {
			title: 'Idade Inválida',
			description: 'A idade do proponente deve estar entre 18 e 80 anos para continuar com o preenchimento do DPS.',
			closeLabel: 'Entendi'
		}
	});
	
	// Verificar e mostrar alerta quando idade estiver fora do intervalo
	useEffect(() => {
		if (proponentAge !== null) {
			const maxAge = 80; // Default para compatibilidade
			if (proponentAge < 18 || proponentAge > maxAge) {
				alertDialog.toggle(true);
			}
		}
	}, [proponentAge, alertDialog]);

	// Manipulador genérico para quando campos perdem foco
	const handleFieldBlur = () => {
		// Ativar o destaque para campos não preenchidos
		setHighlightMissing(true);
	};

	// Função para validar se o DFI não excede o Capital MIP
	const validateDfiNotExceedMip = (dfiValue: string): string | undefined => {
		if (!dfiValue || !mipValue) return undefined;
		
		const dfiNumeric = convertCapitalValue(dfiValue) || 0;
		const mipNumeric = convertCapitalValue(mipValue) || 0;
		
		// Valor máximo permitido (10.000.000,00)
		const maxValue = 10_000_000;
		
		// DFI nunca pode ser menor que MIP
		if (dfiNumeric < mipNumeric) {
			return 'Capital DFI deve ser maior que o Capital MIP';
		}
		
		// Se MIP está no teto máximo (10.000.000,00), DFI pode ser igual ao MIP
		if (mipNumeric === maxValue) {
			// Neste caso, DFI pode ser igual ou maior que MIP (dentro do limite máximo)
			return undefined;
		} else {
			// Para todos os outros casos, DFI deve ser maior que MIP
			if (dfiNumeric === mipNumeric) {
				return 'Capital DFI deve ser maior que o Capital MIP';
			}
		}
		
		return undefined;
	}

	// Função para calcular o valor de participação no financiamento
	const calculateParticipationValue = (percentage: string, mipValue: string) => {
		if (!percentage || !mipValue) return 'R$ 0,00';
		
		const percentageNumber = parseFloat(percentage.replace('%', '').replace(',', '.')) || 0;
		const mipNumber = convertCapitalValue(mipValue) || 0;
		
		const participationValue = (mipNumber * percentageNumber) / 100;
		
		// Formatar como moeda brasileira
		return new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: 'BRL',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}).format(participationValue);
	};

	// useEffect para controlar o campo de participação quando é participante único
	useEffect(() => {
		if (isSingleParticipant && setValue && mipValue && mipValue.trim() !== '') {
			// Só preencher automaticamente se o MIP estiver preenchido
			setValue("profile.participationPercentage", "100,00%");
			
			// Call the callback to update participation value if provided
			if (onParticipationPercentageBlur) {
				onParticipationPercentageBlur("100,00%");
			}
		}
	}, [isSingleParticipant, setValue, onParticipationPercentageBlur, mipValue]);

	return (
		<div className="flex flex-col gap-6 w-full">
			<h3 className="text-primary text-lg">Dados do Produto</h3>
			{disabled && (
				<div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-700">
					<p>Os dados do produto estão bloqueados pois já existe um proponente principal para esta operação.</p>
				</div>
			)}
			<ShareLine>
				<Controller
					control={control}
					defaultValue=""
					name="product.product"
					render={({ field: { onChange, onBlur, value, ref } }) => {
						return (
							<label>
								<div className="text-gray-500">
									Produto <span className="text-red-500">*</span>
								</div>
								<SelectComp
									placeholder="Produto"
									options={productOptions}
									triggerClassName={cn(
										"p-4 h-12 rounded-lg",
										!disabled && highlightMissing && !value && 'border-orange-400 bg-orange-50'
									)}
									disabled={disabled}
									onValueChange={(val) => {
										onChange(val);
										// Chamar onBlur após a mudança para disparar a revalidação
										setTimeout(() => {
											onBlur();
											handleFieldBlur();
										}, 0);
									}}
									value={value || ''}
									defaultValue={value || ''}
								/>
								{!disabled && (
									<div className="text-xs text-red-500">
										{errors?.product?.message}
									</div>
								)}
							</label>
						)
					}}
				/>

				<Controller
					control={control}
					defaultValue=""
					name="product.deadline"
					render={({ field: { onChange, onBlur, value, ref } }) => {
						return (
							<label>
								<div className="text-gray-500 flex items-center gap-2">
									Prazo (meses) <span className="text-red-500">*</span>
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger>
												<HelpCircle className="h-4 w-4 text-gray-400" />
											</TooltipTrigger>
											<TooltipContent className="bg-primary text-primary-foreground font-medium px-4 py-2.5">
												<div className="text-sm space-y-1">
													<p>Prazo em meses para pagamento do financiamento</p>
													<p className="text-xs opacity-90">
														Prazo permitido: 1 a 420 meses
													</p>
												</div>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</div>
								<Input
									id="deadline"
									type="text"
									placeholder="Ex: 60"
									className={cn(
										'w-full px-4 py-6 rounded-lg',
										!disabled && (errors?.deadline) && 'border-red-500 focus-visible:border-red-500',
										!disabled && highlightMissing && !value && 'border-orange-400 bg-orange-50'
									)}
									disabled={disabled}
									onChange={(e) => {
										// Permitir apenas dígitos
										const numericValue = e.target.value.replace(/\D/g, '');
										// Limitar a 3 dígitos (máximo 420 meses)
										const limitedValue = numericValue.slice(0, 3);
										
										// Atualizar o valor no formulário
										onChange(limitedValue);
									}}
									onBlur={() => {
										// Chamar o onBlur original do react-hook-form
										onBlur();
										handleFieldBlur();
									}}
									value={value || ''}
									ref={ref}
								/>
								{!disabled && (
									<div className="text-xs text-red-500">
										{errors?.deadline?.message}
									</div>
								)}
							</label>
						)
					}}
				/>
			</ShareLine>
			<ShareLine>
				<Controller
					control={control}
					defaultValue=""
					name="product.mip"
					render={({ field: { onChange, onBlur, value, ref } }) => {
						return (
							<label>
								<div className="text-gray-500 flex items-center gap-2">
									Capital MIP (Valor Total da Operação) <span className="text-red-500">*</span>
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger>
												<HelpCircle className="h-4 w-4 text-gray-400" />
											</TooltipTrigger>
											<TooltipContent className="bg-primary text-primary-foreground font-medium px-4 py-2.5">
												<p className="text-sm">Valor financiamento + despesas (usado como valor total da operação)</p>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</div>
								<Input
									id="mip"
									type="text"
									placeholder="R$ 99.999,99"
									mask="R$ 9999999999999"
									beforeMaskedStateChange={maskToBrlCurrency}
									className={cn(
										'w-full px-4 py-6 rounded-lg',
										!disabled && errors?.mip && 'border-red-500 focus-visible:border-red-500',
										!disabled && highlightMissing && !value && 'border-orange-400 bg-orange-50'
									)}
									autoComplete="mip"
									onChange={(e) => {
										onChange(e);
									}}
									onBlur={() => {
										onBlur();
										handleFieldBlur();
										
										// Callback para recalcular participação quando MIP perde o foco
										if (onMipBlur && value) {
											// Obter o valor atual da participação
											const currentPercentage = currentParticipationPercentage || '';
											onMipBlur(value, currentPercentage);
										}
									}}
									value={value}
									ref={ref}
									disabled={disabled}
								/>
								{!disabled && (
									<div className="text-xs text-red-500">
										{errors?.mip?.message}
									</div>
								)}
							</label>
						);
					}}
				/>

				<Controller
					control={control}
					defaultValue=""
					name="product.dfi"
					render={({ field: { onChange, onBlur, value, ref } }) => {
						// Validar que o DFI não excede o Capital MIP
						const exceedsError = !disabled ? 
							validateDfiNotExceedMip(value) : 
							undefined;
						
						return (
							<label>
								<div className="text-gray-500 flex items-center gap-2">
									Capital DFI <span className="text-red-500">*</span>
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger>
												<HelpCircle className="h-4 w-4 text-gray-400" />
											</TooltipTrigger>
											<TooltipContent className="bg-primary text-primary-foreground font-medium px-4 py-2.5">
												<p className="text-sm">Valor de avaliação do imóvel</p>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</div>
								<Input
									id="dfi"
									type="text"
									placeholder="R$ 99.999,99"
									mask="R$ 9999999999999"
									beforeMaskedStateChange={maskToBrlCurrency}
									className={cn(
										'w-full px-4 py-6 rounded-lg',
										!disabled && (errors?.dfi || exceedsError) && 'border-red-500 focus-visible:border-red-500',
										!disabled && highlightMissing && !value && 'border-orange-400 bg-orange-50'
									)}
									autoComplete="dfi"
									onChange={(e) => {
										onChange(e);
									}}
									onBlur={() => {
										onBlur();
										handleFieldBlur();
									}}
									value={value}
									ref={ref}
									disabled={disabled}
								/>
								{!disabled && (
									<div className="text-xs text-red-500">
										{exceedsError || errors?.dfi?.message}
									</div>
								)}
							</label>
						);
					}}
				/>
			</ShareLine>

			<ShareLine>
				<Controller
					control={control}
					name={"profile.participationPercentage" as Path<DpsInitialForm>}
					render={({ field: { onChange, onBlur, value } }) => {
						const profileErrors = formState.errors?.profile as any;
						const participationError = profileErrors?.participationPercentage;
						
						// Verificar se Capital MIP está preenchido
						const mipFilled = mipValue && mipValue.trim() !== '';
						
						// Se for participante único, renderizar versão somente leitura
						if (isSingleParticipant) {
							return (
								<label>
									<div className="text-gray-500">% Participação</div>
									<div className="h-12 w-full rounded-lg border border-input bg-gray-100 px-4 flex items-center">
										100,00%
									</div>
									<div className="text-xs text-red-500">
										{participationError?.message}
									</div>
								</label>
							);
						}

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
						
						// Caso contrário, renderizar o componente normal
						return (
							<label>
								<div className="text-gray-500">% Participação <span className="text-red-500">*</span></div>
								<Input
									id="participationPercentage"
									type="text"
									placeholder="0,00%"
									className={cn(
										'w-full px-4 py-6 rounded-lg',
										participationError && 'border-red-500 focus-visible:border-red-500',
										highlightMissing && !value && 'border-orange-400 bg-orange-50'
									)}
									disabled={disabled || !mipFilled}
									onChange={e => {
										// Obtém o valor original do input
										let inputValue = e.target.value;
										
										// Se o usuário está tentando apagar, permita isso
										// Comparando o tamanho do valor atual com o tamanho do anterior
										if (inputValue.length < (value as string || '').length) {
											// O usuário está apagando, simplesmente deixe isso acontecer
											// Remova apenas o símbolo de porcentagem se presente
											inputValue = inputValue.replace(/%/g, '');
											onChange(inputValue);
											return;
										}
										
										// Para entrada normal, aplique a formatação
										// Remove tudo exceto dígitos e vírgula
										let rawValue = inputValue.replace(/[^\d,]/g, '')
										
										// Limita a uma única vírgula
										if (rawValue.split(',').length > 2) {
											rawValue = rawValue.replace(/,/g, function(match, offset, string) {
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
										
										// Limita valor máximo baseado no número de participantes
										if (rawValue.includes(',')) {
											const [intPart, decPart] = rawValue.split(',');
											const intValue = parseInt(intPart, 10);
											// Para múltiplos participantes, não permitir 100%
											if (!isSingleParticipant && intValue >= 100) {
												rawValue = '99,' + decPart;
											} else if (isSingleParticipant && intValue > 100) {
												rawValue = '100,' + decPart;
											}
										} else {
											const intValue = parseInt(rawValue, 10);
											// Para múltiplos participantes, não permitir 100%
											if (!isSingleParticipant && intValue >= 100) {
												rawValue = '99';
											} else if (isSingleParticipant && intValue > 100) {
												rawValue = '100';
											}
										}
										
										// Adiciona o símbolo de porcentagem apenas se houver algum valor
										if (rawValue !== '') {
											rawValue += rawValue.includes('%') ? '' : '%';
										}
										
										onChange(rawValue);
									}}
									onBlur={e => {
										// Não chamar onBlur() aqui para permitir validação primeiro
										handleFieldBlur();
										
										// Normaliza o formato ao perder o foco
										const rawValue = e.target.value.replace(/[^\d,]/g, '');
										
										// Se o campo estiver vazio, deixar vazio e não forçar valor mínimo
										if (rawValue === '') {
											// Manter vazio
											onBlur(); // Agora sim chama o onBlur original
											return;
										}
										
										// Formatar o valor mantendo o que o usuário informou
										let formattedValue;
										
										if (rawValue.includes(',')) {
											// Se tem vírgula, processa como decimal
											const parts = rawValue.split(',');
											const intPart = parseInt(parts[0], 10) || 0;
											// Se a parte decimal existe, usa ela, senão usa '00'
											const decPart = parts.length > 1 ? parts[1] : '00';
											
											// Garante que a parte decimal tenha 2 dígitos
											const paddedDecPart = decPart.padEnd(2, '0').substring(0, 2);
											formattedValue = `${intPart},${paddedDecPart}%`;
										} else {
											// Se não tem vírgula, é um número inteiro
											const intValue = parseInt(rawValue, 10) || 0;
											formattedValue = `${intValue},00%`;
										}
										
										// Atualizar o valor formatado
										onChange(formattedValue);
										
										// Chamar o callback para validar
										if (onParticipationPercentageBlur) {
											// Se a validação retornar mensagem de erro, voltar o foco para o campo
											onParticipationPercentageBlur(formattedValue);
											
											// Se o campo tem erro após a validação, não permitir retirar o foco
											if (participationError?.message) {
												// Manter foco no campo
												setTimeout(() => {
													e.target.focus();
												}, 100);
											} else {
												// Se não tem erro, permitir retirar o foco
												onBlur();
											}
										} else {
											// Se não houver callback de validação, permitir retirar o foco
											onBlur();
										}
										
										// Callback para recalcular participação quando % Participação perde o foco
										if (onMipBlur && mipValue && formattedValue) {
											onMipBlur(mipValue, formattedValue);
										}
									}}
									value={typeof value === 'string' ? value : ''}
								/>
								<div className="text-xs text-red-500">
									{participationError?.message}
								</div>
								{/* {!isSingleParticipant && mipFilled && (
									<div className="text-xs text-blue-600">
										Para operações com múltiplos participantes, o percentual deve ser inferior a 100% (deixe pelo menos 0,01% para cada participante restante)
									</div>
								)} */}
							</label>
						);
					}}
				/>

				<div>
					<div className="text-gray-500">Participação no Financiamento</div>
					<div className="h-12 w-full rounded-lg border border-input bg-gray-100 px-4 flex items-center">
						{calculateParticipationValue(currentParticipationPercentage || '', mipValue)}
					</div>
				</div>
			</ShareLine>

			<ShareLine>
				<Controller
					control={control}
					defaultValue=""
					name="product.propertyType"
					render={({ field: { onChange, onBlur, value, ref } }) => {
						return (
							<label>
								<div className="text-gray-500">
									Tipo de Imóvel <span className="text-red-500">*</span>
								</div>
								<SelectComp
									placeholder="Tipo de Imóvel"
									options={tipoImovelOptions}
									triggerClassName={cn(
										"p-4 h-12 rounded-lg",
										!disabled && highlightMissing && !value && 'border-orange-400 bg-orange-50'
									)}
									disabled={disabled}
									onValueChange={(val) => {
										onChange(val);
										// Chamar onBlur após a mudança para disparar a revalidação
										setTimeout(() => {
											onBlur();
											handleFieldBlur();
										}, 0);
									}}
									value={value || ''}
									defaultValue={value || ''}
								/>
								{!disabled && (
									<div className="text-xs text-red-500">
										{errors?.propertyType?.message}
									</div>
								)}
							</label>
						)
					}}
				/>
				<div></div>
			</ShareLine>
			
			{/* Modal de alerta para idade inválida */}
			{alertDialog.dialogComp}
		</div>
	)
}

export default DpsProductForm

export function convertCapitalValue(value: string) {
	if (value.length > 0) {
		const toDigit = value.replace(/[^0-9]/g, '')
		const number = +toDigit / 100
		return number
	}
	return null
}

function checkCapitalValue(value: string) {
	const converted = convertCapitalValue(value)
	if (converted != null) {
		return converted <= 10_000_000
	}
	return false
}

// Função para validar DFI considerando o valor do MIP
function checkDfiValue(dfiValue: string, mipValue: string) {
	// Primeiro verifica se o valor está dentro do limite máximo
	if (!checkCapitalValue(dfiValue)) {
		return false;
	}
	
	if (!dfiValue || !mipValue) return true;
	
	const dfiNumeric = convertCapitalValue(dfiValue) || 0;
	const mipNumeric = convertCapitalValue(mipValue) || 0;
	
	// Valor máximo permitido (10.000.000,00)
	const maxValue = 10_000_000;
	
	// Se MIP está no teto máximo (10.000.000,00), DFI pode ser igual ao MIP
	if (mipNumeric === maxValue) {
		return dfiNumeric <= mipNumeric;
	} else {
		// Para todos os outros casos, DFI deve ser maior que MIP
		return dfiNumeric > mipNumeric;
	}
}

// Função para criar schema com validação simplificada
export const createDpsProductFormWithAge = (proponentAge: number | null, productName?: string) => object({
	product: pipe(string(), nonEmpty('Campo obrigatório.')),
	deadline: pipe(
		string(), 
		nonEmpty('Campo obrigatório.'),
		custom(
			v => {
				const numValue = parseInt(v as string, 10);
				return !isNaN(numValue) && numValue >= 1 && numValue <= 420;
			},
			'Prazo deve ser entre 1 e 420 meses.'
		),
		custom(
			v => {
				// Validação da idade final apenas se a idade do proponente estiver disponível
				if (proponentAge === null) return true;
				
				const numValue = parseInt(v as string, 10);
				if (isNaN(numValue)) return false;
				
				const prazosInYears = numValue / 12; // Converter meses para anos
				const finalAge = proponentAge + prazosInYears;
				
				const maxAge = productName ? getMaxAgeByProduct(productName) : 80;
				return finalAge <= maxAge;
			},
			productName ? getFinalAgeErrorMessage(productName, 'proponente') : getFinalAgeErrorMessage('Habitacional', 'proponente')
		)
	),
	mip: pipe(
		string(),
		nonEmpty('Campo obrigatório.'),
		custom(
			v => checkCapitalValue(v as string),
			'Capital máximo R$ 10.000.000,00'
		)
	),
	dfi: pipe(
		string(),
		nonEmpty('Campo obrigatório.'),
		custom(
			v => checkCapitalValue(v as string),
			'Capital máximo R$ 10.000.000,00'
		)
	),
	propertyType: pipe(string(), nonEmpty('Campo obrigatório.'))
})
