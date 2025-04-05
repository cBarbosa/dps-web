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
	participationPercentage: pipe(string(), nonEmpty('Campo obrigatório.')),
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
	setValue
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
		if (validateCpf && !validateCpf(cpf) || cpf === data?.cpf) return

		setLoadingCpf(true)
		await getDataByCpf(cpf)
		setLoadingCpf(false)
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
										disabled || loadingCpf ? 'opacity-50 cursor-not-allowed' : ''
									)}
									disabled={disabled || (data?.cpf ? true : false) || loadingCpf}
									autoComplete="cpf"
									onChange={onChange}
									onBlur={async (e) => {
										const cpfValue = e.target.value;
										onBlur();
										
										// Não continuar se o CPF já está preenchido e desabilitado
										if (disabled || (data?.cpf ? true : false) || loadingCpf) {
											return;
										}
										
										// Verificar se é um CPF válido
										if (validateCpf && !validateCpf(cpfValue)) {
											return;
										}
										
										// Verificar se o CPF pertence a outro participante
										if (validateCpf && !validateCpf(cpfValue)) {
											// Limpar o campo para evitar o preenchimento com CPF duplicado
											onChange('');
											return;
										}
										
										// Buscar dados do CPF se todas as validações passarem
										setLoadingCpf(true);
										await getDataByCpf(cpfValue);
										setLoadingCpf(false);
									}}
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
										'border-red-500 focus-visible:border-red-500'
								)}
								disabled={
									disabled ||
									isSubmitting ||
									data?.birthdate !== undefined
								}
								onChange={onChange}
								onBlur={onBlur}
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
									errors?.name && 'border-red-500 focus-visible:border-red-500'
								)}
								autoComplete="name"
								disabled={
									disabled ||
									isSubmitting ||
									data?.name !== undefined
								}
								onChange={onChange}
								onBlur={onBlur}
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
										'border-red-500 focus-visible:border-red-500'
								)}
								autoComplete="socialName"
								disabled={
									disabled || isSubmitting || data?.socialName !== undefined
								}
								onChange={onChange}
								onBlur={onBlur}
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
										'border-red-500 focus-visible:border-red-500'
								)}
								autoComplete="profession"
								disabled={disabled}
								onChange={onChange}
								onBlur={onBlur}
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
									errors?.email && 'border-red-500 focus-visible:border-red-500'
								)}
								autoComplete="email"
								disabled={disabled}
								onChange={onChange}
								onBlur={onBlur}
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
									errors?.phone && 'border-red-500 focus-visible:border-red-500'
								)}
								disabled={disabled}
								autoComplete="tel"
								onChange={onChange}
								onBlur={onBlur}
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
								triggerClassName="p-4 h-12 rounded-lg"
								disabled={disabled || data?.gender !== undefined}
								onValueChange={(val) => {
									onChange(val);
									// Chamar onBlur após a mudança para disparar a revalidação
									setTimeout(() => onBlur(), 0);
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
									placeholder={placeholderPercentage ? `Sugestão: ${placeholderPercentage}` : "0,00%"}
									className={cn(
										'w-full px-4 py-6 rounded-lg',
										errors?.participationPercentage && 'border-red-500 focus-visible:border-red-500'
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
										onBlur();
										
										// Normaliza o formato ao perder o foco
										const rawValue = e.target.value.replace(/[^\d,]/g, '');
										
										if (rawValue === '') {
											onChange('0,00%');
											if (onParticipationPercentageBlur) {
												onParticipationPercentageBlur('0,00%');
											}
											return;
										}
										
										let numValue;
										if (rawValue.includes(',')) {
											// Se tem vírgula, processa como decimal
											const parts = rawValue.split(',');
											const intPart = parseInt(parts[0], 10) || 0;
											// Se a parte decimal existe, usa ela, senão usa '00'
											const decPart = parts.length > 1 ? parts[1] : '00';
											
											// Garante que a parte decimal tenha 2 dígitos
											const paddedDecPart = decPart.padEnd(2, '0').substring(0, 2);
											
											numValue = intPart + (parseInt(paddedDecPart, 10) / 100);
											if (numValue > 100) numValue = 100;
										} else {
											// Se não tem vírgula, é um número inteiro
											numValue = parseInt(rawValue, 10);
											if (numValue > 100) numValue = 100;
										}
										
										// Formata com 2 casas decimais
										const formattedValue = numValue.toFixed(2).replace('.', ',') + '%';
										onChange(formattedValue);
										
										// Chama o callback para calcular a participação no financiamento
										if (onParticipationPercentageBlur) {
											onParticipationPercentageBlur(formattedValue);
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
