'use client'
import { Input } from '@/components/ui/input'
import SelectComp from '@/components/ui/select-comp'
import { AddressData } from '@/components/ui/share-address'
import ShareLine from '@/components/ui/share-line'
import { states } from '@/constants'
import { cn } from '@/lib/utils'
import React, { useState } from 'react'
import { Control, Controller, FormState, Path } from 'react-hook-form'
import {
	InferInput,
	minLength,
	nonEmpty,
	number,
	object,
	pipe,
	string,
	maxLength,
} from 'valibot'
import { Loader2Icon } from 'lucide-react'

export const dpsAddressForm = object({
	zipcode: pipe(string(), nonEmpty('Campo obrigatório.')),
	state: pipe(string(), nonEmpty('Campo obrigatório.')),
	city: pipe(string(), nonEmpty('Campo obrigatório.')),
	district: pipe(string(), nonEmpty('Campo obrigatório.')),
	street: pipe(string(), nonEmpty('Campo obrigatório.')),
	number: pipe(
		string(),
		nonEmpty('Campo obrigatório.'),
		maxLength(10, 'Máximo de 10 caracteres permitidos.')
	),
	complement: pipe(string(), minLength(0, 'Complemento inválido.')),
})

export type DpsAddressFormType = InferInput<typeof dpsAddressForm>

// Generic version of the DpsAddressForm that works with any form structure that includes address
const DpsAddressForm = <T extends { address: DpsAddressFormType }>({
	control,
	formState,
	data,
	cepDataLoader,
	disabled,
	onAddressChange,
}: {
	control: Control<T>
	formState: FormState<T>
	data?: AddressData
	cepDataLoader: (cep: string) => Promise<void>
	disabled?: boolean
	onAddressChange?: () => void
}) => {
	const errors = formState.errors?.address as any
	const [loadingCep, setLoadingCep] = useState(false)
	const [highlightMissing, setHighlightMissing] = useState(false)

	const completeCepData = async (cep: string) => {
		if (!cep || cep.replace(/\D/g, '').length < 8) return;

		try {
			setLoadingCep(true)
			// Limpa caracteres não numéricos para garantir formato correto
			const cleanCep = cep.replace(/\D/g, '')
			await cepDataLoader(cleanCep)

			// Notificar mudança de endereço para validação externa
			if (onAddressChange) {
				onAddressChange()
			}
		} catch (error) {
			console.error('Erro ao buscar CEP:', error)
		} finally {
			setLoadingCep(false)
		}
	}

	// Função para formatar o CEP
	const formatCep = (value: string) => {
		if (!value) return '';
		
		// Remove caracteres não numéricos
		const digits = value.replace(/\D/g, '');
		
		// Limita a 8 dígitos
		const cepDigits = digits.substring(0, 8);
		
		// Formata como 99999-999
		if (cepDigits.length <= 5) {
			return cepDigits;
		} else {
			return `${cepDigits.substring(0, 5)}-${cepDigits.substring(5)}`;
		}
	};
	
	// Manipulador para quando qualquer campo perde o foco
	const handleFieldBlur = () => {
		// Ativar o destaque para campos não preenchidos
		setHighlightMissing(true);
	};

	return (
		<div className="flex flex-col gap-6 w-full">
			<div className="flex flex-col gap-1">
				<h3 className="text-primary text-lg">Endereço</h3>
				<span className='text-primary text-sm'>(do imóvel financiado ou imóvel em garantia)</span>
			</div>
			<ShareLine>
				<Controller
					control={control}
					name={"address.zipcode" as Path<T>}
					render={({ field: { onChange, onBlur, value, ref } }) => (
						<label>
							<div className="text-gray-500">CEP <span className="text-red-500">*</span></div>
							<div className="relative">
								<Input
									id="zip"
									type="text"
									name="zip"
									placeholder="99999-999"
									className={cn(
										'w-full px-4 py-6 rounded-lg',
										errors?.zipcode && 'border-red-500 focus-visible:border-red-500',
										highlightMissing && !value && 'border-orange-400 bg-orange-50',
										loadingCep && 'pr-10'
									)}
									onChange={(e) => {
										// Permite apenas dígitos e formatação
										const rawValue = e.target.value.replace(/\D/g, '');
										const formatted = formatCep(rawValue);
										onChange(formatted);
									}}
									onBlur={(e) => {
										onBlur();
										handleFieldBlur();
										completeCepData(e.target.value);
									}}
									value={typeof value === 'string' ? value : ''}
									ref={ref}
									disabled={disabled || loadingCep}
								/>
								{loadingCep && (
									<Loader2Icon className="absolute right-3 top-2.5 h-5 w-5 animate-spin text-primary" />
								)}
							</div>
							<div className="text-xs text-red-500">
								{errors?.zipcode?.message}
							</div>
						</label>
					)}
				/>

				<Controller
					control={control}
					name={"address.state" as Path<T>}
					render={({ field: { onChange, onBlur, value } }) => (
						<label>
							<div className="text-gray-500">UF <span className="text-red-500">*</span></div>
							<SelectComp
								placeholder="UF"
								options={states}
								triggerClassName={cn(
									"p-4 h-12 rounded-lg",
									highlightMissing && !value && 'border-orange-400 bg-orange-50'
								)}
								onValueChange={(val) => {
									onChange(val);
									setTimeout(() => {
										onBlur();
										handleFieldBlur();
										// Notificar mudança de endereço para validação externa
										if (onAddressChange) {
											onAddressChange();
										}
									}, 0);
								}}
								value={typeof value === 'string' ? value : ''}
								disabled={disabled}
							/>
							<div className="text-xs text-red-500">
								{errors?.state?.message}
							</div>
						</label>
					)}
				/>
			</ShareLine>

			<ShareLine>
				<Controller
					control={control}
					name={"address.city" as Path<T>}
					render={({ field: { onChange, onBlur, value, ref } }) => (
						<label>
							<div className="text-gray-500">Cidade <span className="text-red-500">*</span></div>
							<Input
								id="city"
								type="text"
								placeholder="Cidade"
								className={cn(
									'w-full px-4 py-6 rounded-lg',
									errors?.city && 'border-red-500 focus-visible:border-red-500',
									highlightMissing && !value && 'border-orange-400 bg-orange-50'
								)}
								onChange={onChange}
								onBlur={() => {
									onBlur();
									handleFieldBlur();
									// Notificar mudança de endereço para validação externa
									if (onAddressChange) {
										onAddressChange();
									}
								}}
								value={typeof value === 'string' ? value : ''}
								ref={ref}
								disabled={disabled}
							/>
							<div className="text-xs text-red-500">{errors?.city?.message}</div>
						</label>
					)}
				/>

				<Controller
					control={control}
					name={"address.district" as Path<T>}
					render={({ field: { onChange, onBlur, value, ref } }) => (
						<label>
							<div className="text-gray-500">Bairro <span className="text-red-500">*</span></div>
							<Input
								id="district"
								type="text"
								placeholder="Bairro"
								className={cn(
									'w-full px-4 py-6 rounded-lg',
									errors?.district && 'border-red-500 focus-visible:border-red-500',
									highlightMissing && !value && 'border-orange-400 bg-orange-50'
								)}
								onChange={onChange}
								onBlur={() => {
									onBlur();
									handleFieldBlur();
								}}
								value={typeof value === 'string' ? value : ''}
								ref={ref}
								disabled={disabled}
							/>
							<div className="text-xs text-red-500">
								{errors?.district?.message}
							</div>
						</label>
					)}
				/>
			</ShareLine>

			<ShareLine>
				<Controller
					control={control}
					name={"address.street" as Path<T>}
					render={({ field: { onChange, onBlur, value, ref } }) => (
						<label>
							<div className="text-gray-500">Logradouro <span className="text-red-500">*</span></div>
							<Input
								id="street"
								type="text"
								placeholder="Rua/Avenida/Alameda"
								className={cn(
									'w-full px-4 py-6 rounded-lg',
									errors?.street && 'border-red-500 focus-visible:border-red-500',
									highlightMissing && !value && 'border-orange-400 bg-orange-50'
								)}
								onChange={onChange}
								onBlur={() => {
									onBlur();
									handleFieldBlur();
								}}
								value={typeof value === 'string' ? value : ''}
								ref={ref}
								disabled={disabled}
							/>
							<div className="text-xs text-red-500">
								{errors?.street?.message}
							</div>
						</label>
					)}
				/>

				<Controller
					control={control}
					name={"address.number" as Path<T>}
					render={({ field: { onChange, onBlur, value, ref } }) => (
						<label>
							<div className="text-gray-500">Número <span className="text-red-500">*</span></div>
							<Input
								id="number"
								type="text"
								placeholder="Número"
								className={cn(
									'w-full px-4 py-6 rounded-lg',
									errors?.number && 'border-red-500 focus-visible:border-red-500',
									highlightMissing && !value && 'border-orange-400 bg-orange-50'
								)}
								onChange={(e) => {
									// Limita a 10 caracteres alfanuméricos
									const cleanValue = e.target.value.slice(0, 10);
									onChange(cleanValue);
								}}
								onBlur={() => {
									onBlur();
									handleFieldBlur();
								}}
								value={typeof value === 'string' ? value : ''}
								ref={ref}
								disabled={disabled}
								maxLength={10}
							/>
							<div className="text-xs text-red-500">
								{errors?.number?.message}
							</div>
						</label>
					)}
				/>

				<Controller
					control={control}
					name={"address.complement" as Path<T>}
					render={({ field: { onChange, onBlur, value, ref } }) => (
						<label>
							<div className="text-gray-500">Complemento</div>
							<Input
								id="complement"
								type="text"
								placeholder="Complemento"
								className={cn(
									'w-full px-4 py-6 rounded-lg',
									errors?.complement && 'border-red-500 focus-visible:border-red-500'
								)}
								onChange={onChange}
								onBlur={() => {
									onBlur();
									handleFieldBlur();
								}}
								value={typeof value === 'string' ? value : ''}
								ref={ref}
								disabled={disabled}
							/>
							<div className="text-xs text-red-500">
								{errors?.complement?.message}
							</div>
						</label>
					)}
				/>
			</ShareLine>
		</div>
	)
}

export default DpsAddressForm
