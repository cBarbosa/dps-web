'use client'

import { Input } from '@/components/ui/input'
import SelectComp from '@/components/ui/select-comp'
import ShareLine from '@/components/ui/share-line'
import { cn, maskToBrlCurrency, maskToDigitsAndSuffix } from '@/lib/utils'
import React from 'react'
import { Control, Controller, FormState, useWatch, UseFormSetError, UseFormClearErrors } from 'react-hook-form'
import { custom, InferInput, nonEmpty, object, pipe, string } from 'valibot'
import { DpsInitialForm } from './dps-initial-form'
import { HelpCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export const dpsProductForm = object({
	product: pipe(string(), nonEmpty('Campo obrigatório.')),
	deadline: pipe(
		string(), 
		nonEmpty('Campo obrigatório.'),
		custom(
			v => {
				const numValue = parseInt(v as string, 10);
				return !isNaN(numValue) && numValue > 0;
			},
			'Prazo deve ser um número válido maior que zero.'
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
	proponentAge = null
}: {
	data?: Partial<DpsProductFormType>
	prazosOptions: { value: string; label: string }[]
	productOptions: { value: string; label: string }[]
	tipoImovelOptions: { value: string; label: string }[]
	control: Control<DpsInitialForm>
	formState: FormState<DpsInitialForm>
	disabled?: boolean
	proponentAge?: number | null
}) => {
	console.log('formState', formState)
	// Ignoramos erros quando em modo somente leitura
	const errors = disabled ? {} : formState.errors?.product;
	const [highlightMissing, setHighlightMissing] = React.useState<boolean>(false);
	
	// Monitora o valor do Capital MIP para usar como valor total da operação na validação do DFI
	const mipValue = useWatch({
		control,
		name: "product.mip",
		defaultValue: ""
	});
	
	// Função para obter o prazo máximo baseado na idade
	const getMaxDeadlineByAge = React.useCallback((age: number | null): number | null => {
		if (age === null) return null;
		if (age < 18 || age > 80) return null; // Não permitido
		if (age <= 50) return 240; // Limite oficial: 240 meses para 18-50 anos
		if (age <= 55) return 180;
		if (age <= 60) return 150;
		if (age <= 65) return 84;
		if (age <= 80) return 60;
		return null;
	}, []);

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
		
		if (dfiNumeric > mipNumeric) {
			return 'Capital DFI não pode exceder o Capital MIP';
		}
		
		return undefined;
	}

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
													{proponentAge !== null && (
														<p className="text-xs opacity-90">
															{getMaxDeadlineByAge(proponentAge) 
																? `Máximo permitido para sua idade: ${getMaxDeadlineByAge(proponentAge)} meses`
																: 'Nenhum prazo disponível para esta faixa etária'
															}
														</p>
													)}
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
									disabled={disabled || getMaxDeadlineByAge(proponentAge) === null}
									onChange={(e) => {
										// Permitir apenas dígitos
										const numericValue = e.target.value.replace(/\D/g, '');
										// Limitar a 3 dígitos (máximo 999 meses)
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

// Função para criar schema com validação baseada na idade
export const createDpsProductFormWithAge = (proponentAge: number | null) => object({
	product: pipe(string(), nonEmpty('Campo obrigatório.')),
	deadline: pipe(
		string(), 
		nonEmpty('Campo obrigatório.'),
		custom(
			v => {
				const numValue = parseInt(v as string, 10);
				if (isNaN(numValue) || numValue <= 0) {
					return false;
				}
				
				// Validação baseada na idade
				if (proponentAge === null) return true;
				if (proponentAge < 18 || proponentAge > 80) {
					return false;
				}
				
				let maxDeadline = 240;
				if (proponentAge <= 50) maxDeadline = 240;
				else if (proponentAge <= 55) maxDeadline = 180;
				else if (proponentAge <= 60) maxDeadline = 150;
				else if (proponentAge <= 65) maxDeadline = 84;
				else if (proponentAge <= 80) maxDeadline = 60;
				
				return numValue <= maxDeadline;
			},
			(input) => {
				const numValue = parseInt(input.input as string, 10);
				if (isNaN(numValue) || numValue <= 0) {
					return 'Prazo deve ser um número válido maior que zero.';
				}
				
				if (proponentAge === null) return 'Idade do proponente não informada.';
				if (proponentAge < 18) return 'Não é possível contratar DPS para menores de 18 anos.';
				if (proponentAge > 80) return 'Não é possível contratar DPS para maiores de 80 anos.';
				
				let maxDeadline = 240;
				if (proponentAge <= 50) maxDeadline = 240;
				else if (proponentAge <= 55) maxDeadline = 180;
				else if (proponentAge <= 60) maxDeadline = 150;
				else if (proponentAge <= 65) maxDeadline = 84;
				else if (proponentAge <= 80) maxDeadline = 60;
				
				return `Prazo informado é inválido. (limite ${maxDeadline} meses).`;
			}
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
