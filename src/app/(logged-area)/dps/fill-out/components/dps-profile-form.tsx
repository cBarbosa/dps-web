'use client'
import DatePicker from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import SelectComp from '@/components/ui/select-comp'
import ShareLine from '@/components/ui/share-line'
import { cn } from '@/lib/utils'
import React from 'react'
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
import { RecursivePartial } from '@/lib/utils'
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
		maxValue(new Date(), 'Idade inválida.'),
		custom(
			v => {
				if (!v || !(v instanceof Date)) return false;
				const today = new Date();
				const birthDate = new Date(v);
				const age = today.getFullYear() - birthDate.getFullYear();
				const monthDiff = today.getMonth() - birthDate.getMonth();
				const dayDiff = today.getDate() - birthDate.getDate();
				
				const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
				return actualAge >= 18 && actualAge <= 80;
			},
			'Idade deve estar entre 18 e 80 anos.'
		)
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
		custom(
			v => {
				const percentageRegex = /^(100(,00)?|[1-9]?\d(,\d{1,2})?)%$/;
				return percentageRegex.test(v as string);
			},
			'Formato inválido. Use o formato: 25,50% (valores de 0,01% até 100,00%)'
		)
	),
})

// Função para criar schema de perfil para coparticipantes com validação de idade + prazo
export const createDpsProfileFormWithDeadline = (deadlineMonths: number | null) => object({
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
		maxValue(new Date(), 'Idade inválida.'),
		custom(
			v => {
				if (!v || !(v instanceof Date)) return false;
				const today = new Date();
				const birthDate = new Date(v);
				const age = today.getFullYear() - birthDate.getFullYear();
				const monthDiff = today.getMonth() - birthDate.getMonth();
				const dayDiff = today.getDate() - birthDate.getDate();
				
				const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
				return actualAge >= 18 && actualAge <= 80;
			},
			'Idade deve estar entre 18 e 80 anos.'
		),
		custom(
			v => {
				// Validação da idade final apenas se o prazo estiver definido
				if (deadlineMonths === null || deadlineMonths <= 0) return true;
				if (!v || !(v instanceof Date)) return false;
				
				const today = new Date();
				const birthDate = new Date(v);
				const age = today.getFullYear() - birthDate.getFullYear();
				const monthDiff = today.getMonth() - birthDate.getMonth();
				const dayDiff = today.getDate() - birthDate.getDate();
				
				const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
				const prazosInYears = deadlineMonths / 12;
				const finalAge = actualAge + prazosInYears;
				
				return finalAge <= 80;
			},
			'A idade final do coparticipante não pode exceder 80 anos até o fim do contrato.'
		)
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
		custom(
			v => {
				const percentageRegex = /^(100(,00)?|[1-9]?\d(,\d{1,2})?)%$/;
				return percentageRegex.test(v as string);
			},
			'Formato inválido. Use o formato: 25,50% (valores de 0,01% até 100,00%)'
		)
	),
});

// Função para criar schema dinâmico baseado no número de participantes
export const createDpsProfileFormWithParticipants = (participantsNumber?: number) => object({
	cpf: pipe(
		string(),
		nonEmpty('Campo obrigatório.'),
		custom(
			v => {
				const cpf = (v as string).replace(/\D/g, '')
				return cpf.length === 11
			},
			'CPF deve ter 11 dígitos.'
		)
	),
	name: pipe(string(), nonEmpty('Campo obrigatório.')),
	socialName: optional(string()),
	birthdate: pipe(
		date(),
		custom(v => {
			const today = new Date()
			const age = today.getFullYear() - (v as Date).getFullYear()
			const monthDiff = today.getMonth() - (v as Date).getMonth()
			const dayDiff = today.getDate() - (v as Date).getDate()

			// Calcular idade mais precisa
			const actualAge =
				monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age

			return actualAge >= 18 && actualAge <= 80
		}, 'A idade deve estar entre 18 e 80 anos.')
	),
	profession: pipe(string(), nonEmpty('Campo obrigatório.')),
	email: pipe(
		string(),
		nonEmpty('Campo obrigatório.'),
		email('E-mail inválido.')
	),
	phone: pipe(
		string(),
		nonEmpty('Campo obrigatório.'),
		custom(
			v => {
				const phone = (v as string).replace(/\D/g, '')
				return phone.length >= 10 && phone.length <= 11
			},
			'Telefone deve ter entre 10 e 11 dígitos.'
		)
	),
	gender: pipe(string(), nonEmpty('Campo obrigatório.')),
	participationPercentage: pipe(
		string(),
		nonEmpty('Campo obrigatório.'),
		custom(
			v => {
				// Permitir apenas valores de 0,01% até 100% (ou 99,99% para múltiplos participantes)
				const value = v as string;
				const numericValue = parseFloat(value.replace('%', '').replace(',', '.'));
				
				// Verificar se é um número válido
				if (isNaN(numericValue) || numericValue <= 0) {
					return false;
				}
				
				// Se há múltiplos participantes (mais de 1), não permitir 100%
				if (participantsNumber && participantsNumber > 1) {
					return numericValue < 100;
				}
				
				// Para participante único, permitir até 100%
				return numericValue <= 100;
			},
			participantsNumber && participantsNumber > 1 
				? 'Para operações com múltiplos participantes, o percentual deve ser inferior a 100% (deixe espaço para outros participantes)'
				: 'Formato inválido. Use valores de 0,01% até 100,00%'
		),
		custom(
			v => {
				// Validar formato
				const percentageRegex = /^([1-9]?\d(,\d{1,2})?|100(,00)?)%$/;
				return percentageRegex.test(v as string);
			},
			'Formato inválido. Use o formato: 25,50%'
		)
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
	validateCpf,
	placeholderPercentage,
}: {
	data?: Partial<DpsProfileFormType>
	control: Control<T>
	formState: FormState<T>
	getDataByCpf: (cpf: string) => void
	disabled?: boolean
	validateCpf?: (cpf: string) => boolean
	placeholderPercentage?: string
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
							<div className="text-gray-500">CPF <span className="text-red-500">*</span></div>
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
							<div className="text-gray-500">Data de Nascimento <span className="text-red-500">*</span></div>
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
							<div className="text-gray-500">Nome do Proponente <span className="text-red-500">*</span></div>
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
							<div className="text-gray-500">Atividade profissional <span className="text-red-500">*</span></div>
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
							<div className="text-gray-500">E-mail <span className="text-red-500">*</span></div>
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
							<div className="text-gray-500">Telefone <span className="text-red-500">*</span></div>
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
							<div className="text-gray-500">Sexo <span className="text-red-500">*</span></div>
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
			

		</div>
	)
}

export default DpsProfileForm
