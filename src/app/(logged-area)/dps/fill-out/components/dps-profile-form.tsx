'use client'
import DatePicker from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import SelectComp from '@/components/ui/select-comp'
import ShareLine from '@/components/ui/share-line'
import { cn } from '@/lib/utils'
import React, { useEffect } from 'react'
import { Control, Controller, FormState, Path } from 'react-hook-form'
import {
	custom,
	date,
	email,
	InferInput,
	maxValue,
	nonEmpty,
	object,
	optional,
	pipe,
	string,
	minLength,
	forward,
	regex,
} from 'valibot'
import validateCpf from 'validar-cpf'
import { RecursivePartial, maskToBrlCurrency } from '@/lib/utils'
import { useState } from 'react'
import { Loader2Icon } from 'lucide-react'

export const dpsProfileForm = object({
	cpf: pipe(
		string(),
		nonEmpty('Campo obrigatório.'),
		custom(v => validateCpf(v as string), 'CPF inválido.'),
		minLength(1, 'CPF é obrigatório')
	),
	name: pipe(string(), nonEmpty('Campo obrigatório.')),
	socialName: optional(string()),
	birthdate: pipe(
		date('Data inválida.'),
		maxValue(new Date(), 'Idade inválida.')
	),
	profession: pipe(string(), nonEmpty('Campo obrigatório.')),
	email: pipe(
		string(),
		nonEmpty('Campo obrigatório.'),
		email('Email inválido.'),
		minLength(1, 'Email é obrigatório')
	),
	phone: pipe(string(), nonEmpty('Campo obrigatório.')),
	gender: pipe(string(), nonEmpty('Campo obrigatório.')),
	participationPercentage: pipe(
		string(), 
		nonEmpty('Campo obrigatório.'),
		regex(/^\d{1,3}(,\d{1,2})?%$/, 'Formato inválido. Use: 0,00%')
	),
})

export type DpsProfileFormType = InferInput<typeof dpsProfileForm>

const genderOptions = [
	{ value: 'M', label: 'Masculino' },
	{ value: 'F', label: 'Feminino' },
]

// Função para formatar CPF manualmente
const formatToCPF = (value: string): string => {
	if (!value) return '';
	
	// Remove todos os caracteres não numéricos
	const cpf = value.replace(/\D/g, '');
	
	// Limita a 11 dígitos
	const cpfLimited = cpf.slice(0, 11);
	
	// Formata o CPF como 999.999.999-99
	if (cpfLimited.length <= 3) {
		return cpfLimited;
	} else if (cpfLimited.length <= 6) {
		return `${cpfLimited.slice(0, 3)}.${cpfLimited.slice(3)}`;
	} else if (cpfLimited.length <= 9) {
		return `${cpfLimited.slice(0, 3)}.${cpfLimited.slice(3, 6)}.${cpfLimited.slice(6)}`;
	} else {
		return `${cpfLimited.slice(0, 3)}.${cpfLimited.slice(3, 6)}.${cpfLimited.slice(6, 9)}-${cpfLimited.slice(9)}`;
	}
};

// Generic version of the DpsProfileForm that works with any form structure that includes profile
const DpsProfileForm = <T extends { profile: DpsProfileFormType }>({
	data,
	control,
	formState,
	getDataByCpf,
	disabled,
	participationPercentage,
	participationValue,
	onParticipationPercentageBlur,
	validateCpf,
	placeholderPercentage,
	isSingleParticipant,
	setValue,
}: {
	data?: Partial<DpsProfileFormType>
	control: Control<T>
	formState: FormState<T>
	getDataByCpf: (cpf: string) => void
	disabled?: boolean
	participationPercentage?: string
	participationValue?: string
	onParticipationPercentageBlur?: (value: string) => void
	validateCpf?: (cpf: string) => boolean
	placeholderPercentage?: string
	isSingleParticipant?: boolean
	setValue?: (name: string, value: any) => void
}) => {
	const errors = formState.errors?.profile as any
	const isSubmitting = formState.isSubmitting
	const [loadingCpf, setLoadingCpf] = useState(false)
	const [highlightMissing, setHighlightMissing] = useState(false)

	// Manipulador genérico para quando campos perdem foco
	const handleFieldBlur = () => {
		// Ativar o destaque para campos não preenchidos
		setHighlightMissing(true);
	};

	// Modificar a lógica para usar o setValue recebido como prop
	useEffect(() => {
		if (isSingleParticipant && setValue) {
			// Use the setValue prop instead of accessing control directly
			setValue("profile.participationPercentage", "100,00%");
			
			// Call the callback to update participation value if provided
			if (onParticipationPercentageBlur) {
				onParticipationPercentageBlur("100,00%");
			}
		}
	}, [isSingleParticipant, setValue, onParticipationPercentageBlur]);

	const handleCpfBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
		const cpf = e.target.value
		if (!cpf || cpf === data?.cpf) return
		
		// Verificar se é um CPF válido via regex básico antes de fazer a validação completa
		if (cpf.replace(/\D/g, '').length !== 11) {
			return; // Não é um CPF com 11 dígitos, não prosseguir com a validação
		}

		// Destacar visualmente campos não preenchidos
		handleFieldBlur();
		
		// Se a validação de CPF duplicado falhar, o erro será definido no campo
		// e o foco deve permanecer no campo para correção
		setLoadingCpf(true)
		await getDataByCpf(cpf)
		setLoadingCpf(false)
		
		// Verificar se há erro após a validação e manter o foco no campo se necessário
		setTimeout(() => {
			if (errors?.cpf?.message) {
				// Destacar visualmente o campo com erro
				e.target.classList.add('border-red-500');
				e.target.classList.add('focus-visible:border-red-500');
				e.target.focus();
			}
		}, 100);
	}
	
	// Function to handle percentage input formatting
	const handlePercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value.replace(/[^\d]/g, '')
		
		// Convert to number and limit to 100
		let numValue = parseInt(value, 10)
		if (isNaN(numValue)) numValue = 0
		if (numValue > 100) numValue = 100
		
		// Format with 2 decimal places
		const formattedValue = numValue.toFixed(2).replace('.', ',') + '%'
		return formattedValue
	}

	return (
		<div className="flex flex-col gap-6 w-full">
			<h3 className="text-primary text-lg">Dados do Proponente</h3>
			<ShareLine>
				<Controller
					control={control}
					name={"profile.cpf" as Path<T>}
					render={({ field: { onChange, onBlur, value, ref } }) => (
						<label>
							<div className="text-gray-500">CPF</div>
							<div className="relative">
								<Input
									id="cpf"
									type="text"
									placeholder="999.999.999-99"
									mask="999.999.999-99"
									className={cn(
										'w-full px-4 py-6 rounded-lg',
										errors?.cpf && 'border-red-500 focus-visible:border-red-500',
										disabled || loadingCpf ? 'opacity-50 cursor-not-allowed' : '',
										highlightMissing && !value && 'border-orange-400 bg-orange-50'
									)}
									disabled={disabled || (data?.cpf ? true : false) || loadingCpf}
									autoComplete="cpf"
									onChange={(e) => {
										onChange?.(e);
										// Limpar erro quando o usuário modificar o valor
										if (!errors?.cpf?.message) {
											// Em vez de usar clearErrors diretamente, vamos remover a invalidação visual
											// O erro será limpo automaticamente no próximo onBlur
											e.currentTarget.classList.remove('border-red-500');
											e.currentTarget.classList.remove('focus-visible:border-red-500');
										}
									}}
									onBlur={handleCpfBlur}
									value={typeof value === 'string' ? formatToCPF(value) : ''}
									ref={ref}
								/>
								{loadingCpf && (
									<Loader2Icon className="absolute right-3 top-2.5 h-5 w-5 animate-spin" />
								)}
							</div>
							<div className="text-xs text-red-500">{errors?.cpf?.message}</div>
						</label>
					)}
				/>

				<Controller
					control={control}
					name={"profile.birthdate" as Path<T>}
					render={({ field: { onChange, onBlur, value, ref } }) => (
						<label>
							<div className="text-gray-500">Data de Nascimento</div>
							<DatePicker
								id="birthdate"
								placeholder="01/01/1999"
								className={cn(
									'w-full px-4 py-6 rounded-lg',
									errors?.birthdate &&
										'border-red-500 focus-visible:border-red-500',
									highlightMissing && !value && 'border-orange-400 bg-orange-50'
								)}
								disabled={
									disabled ||
									isSubmitting ||
									data?.birthdate !== undefined
								}
								onChange={onChange}
								onBlur={() => {
									onBlur();
									handleFieldBlur();
								}}
								value={value instanceof Date ? value : undefined}
								ref={ref}
							/>
							<div className="text-xs text-red-500">
								{errors?.birthdate?.message}
							</div>
						</label>
					)}
				/>
			</ShareLine>

			<ShareLine>
				<Controller
					control={control}
					name={"profile.name" as Path<T>}
					render={({ field: { onChange, onBlur, value, ref } }) => (
						<label>
							<div className="text-gray-500">Nome do Proponente</div>
							<Input
								id="name"
								type="text"
								placeholder="Nome do proponente"
								className={cn(
									'w-full px-4 py-6 rounded-lg',
									errors?.name && 'border-red-500 focus-visible:border-red-500',
									highlightMissing && !value && 'border-orange-400 bg-orange-50'
								)}
								autoComplete="name"
								disabled={
									disabled ||
									isSubmitting ||
									data?.name !== undefined
								}
								onChange={onChange}
								onBlur={() => {
									onBlur();
									handleFieldBlur();
								}}
								value={typeof value === 'string' ? value : ''}
								ref={ref}
							/>
							<div className="text-xs text-red-500">
								{errors?.name?.message}
							</div>
						</label>
					)}
				/>

				<Controller
					control={control}
					name={"profile.socialName" as Path<T>}
					render={({ field: { onChange, onBlur, value, ref } }) => (
						<label>
							<div className="text-gray-500">Nome social do Proponente</div>
							<Input
								id="socialName"
								type="text"
								placeholder="Nome social do proponente"
								className={cn(
									'w-full px-4 py-6 rounded-lg',
									errors?.socialName &&
										'border-red-500 focus-visible:border-red-500',
								)}
								autoComplete="socialName"
								disabled={
									disabled || isSubmitting || data?.socialName !== undefined
								}
								onChange={onChange}
								onBlur={() => {
									onBlur();
									handleFieldBlur();
								}}
								value={typeof value === 'string' ? value : ''}
								ref={ref}
							/>
							<div className="text-xs text-red-500">
								{errors?.socialName?.message}
							</div>
						</label>
					)}
				/>
			</ShareLine>

			<ShareLine>
				<Controller
					control={control}
					name={"profile.profession" as Path<T>}
					render={({ field: { onChange, onBlur, value, ref } }) => (
						<label>
							<div className="text-gray-500">Atividade profissional</div>
							<Input
								id="profession"
								type="text"
								placeholder="Atividade profissional"
								className={cn(
									'w-full px-4 py-6 rounded-lg',
									errors?.profession &&
										'border-red-500 focus-visible:border-red-500',
									highlightMissing && !value && 'border-orange-400 bg-orange-50'
								)}
								autoComplete="profession"
								disabled={disabled}
								onChange={onChange}
								onBlur={() => {
									onBlur();
									handleFieldBlur();
								}}
								value={typeof value === 'string' ? value : ''}
								ref={ref}
							/>
							<div className="text-xs text-red-500">
								{errors?.profession?.message}
							</div>
						</label>
					)}
				/>

				<Controller
					control={control}
					name={"profile.email" as Path<T>}
					render={({ field: { onChange, onBlur, value, ref } }) => (
						<label>
							<div className="text-gray-500">E-mail</div>
							<Input
								id="email"
								type="text"
								placeholder="conta@exemplo.com.br"
								className={cn(
									'w-full px-4 py-6 rounded-lg',
									errors?.email && 'border-red-500 focus-visible:border-red-500',
									highlightMissing && !value && 'border-orange-400 bg-orange-50'
								)}
								autoComplete="email"
								disabled={disabled}
								onChange={onChange}
								onBlur={() => {
									onBlur();
									handleFieldBlur();
								}}
								value={typeof value === 'string' ? value : ''}
								ref={ref}
							/>
							<div className="text-xs text-red-500">
								{errors?.email?.message}
							</div>
						</label>
					)}
				/>
			</ShareLine>

			<ShareLine>
				<Controller
					control={control}
					name={"profile.phone" as Path<T>}
					render={({ field: { onChange, onBlur, value, ref } }) => (
						<label>
							<div className="text-gray-500">Telefone</div>
							<Input
								id="phone"
								type="text"
								placeholder="(99) 99999-9999"
								mask="(99) 99999-99999"
								className={cn(
									'w-full px-4 py-6 rounded-lg',
									errors?.phone && 'border-red-500 focus-visible:border-red-500',
									highlightMissing && !value && 'border-orange-400 bg-orange-50'
								)}
								disabled={disabled}
								autoComplete="tel"
								onChange={onChange}
								onBlur={() => {
									onBlur();
									handleFieldBlur();
								}}
								value={typeof value === 'string' ? value : ''}
								ref={ref}
							/>
							<div className="text-xs text-red-500">
								{errors?.phone?.message}
							</div>
						</label>
					)}
				/>

				<Controller
					control={control}
					name={"profile.gender" as Path<T>}
					render={({ field: { onChange, onBlur, value } }) => (
						<label>
							<div className="text-gray-500">Sexo</div>
							<SelectComp
								placeholder="Sexo"
								options={genderOptions}
								triggerClassName={cn(
									"p-4 h-12 rounded-lg",
									highlightMissing && !value && 'border-orange-400 bg-orange-50'
								)}
								disabled={disabled || data?.gender !== undefined}
								onValueChange={(val) => {
									onChange(val);
									// Chamar onBlur após a mudança para disparar a revalidação
									setTimeout(() => {
										onBlur();
										handleFieldBlur();
									}, 0);
								}}
								defaultValue={typeof value === 'string' ? value : ''}
							/>
							<div className="text-xs text-red-500">
								{errors?.gender?.message}
							</div>
						</label>
					)}
				/>
			</ShareLine>
			
			<ShareLine>
				<Controller
					control={control}
					name={"profile.participationPercentage" as Path<T>}
					render={({ field: { onChange, onBlur, value } }) => {
						// Se for participante único, renderizar versão somente leitura
						if (isSingleParticipant) {
							return (
								<label>
									<div className="text-gray-500">% Participação</div>
									<div className="h-12 w-full rounded-lg border border-input bg-gray-100 px-4 flex items-center">
										100,00%
									</div>
									<div className="text-xs text-red-500">
										{errors?.participationPercentage?.message}
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
										errors?.participationPercentage && 'border-red-500 focus-visible:border-red-500',
										highlightMissing && !value && 'border-orange-400 bg-orange-50'
									)}
									disabled={disabled}
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
										
										// Limita valor máximo a 100 para a parte inteira
										if (rawValue.includes(',')) {
											const [intPart, decPart] = rawValue.split(',');
											const intValue = parseInt(intPart, 10);
											if (intValue > 100) {
												rawValue = '100,' + decPart;
											}
										} else {
											const intValue = parseInt(rawValue, 10);
											if (intValue > 100) {
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
											if (errors?.participationPercentage?.message) {
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
									}}
									value={typeof value === 'string' ? value : ''}
								/>
								<div className="text-xs text-red-500">
									{errors?.participationPercentage?.message}
								</div>
							</label>
						);
					}}
				/>

				<div>
					<div className="text-gray-500">Participação no Financiamento</div>
					<div className="h-12 w-full rounded-lg border border-input bg-gray-100 px-4 flex items-center">
						{participationValue}
					</div>
				</div>
			</ShareLine>
		</div>
	)
}

export default DpsProfileForm
