'use client'
import DatePicker from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import SelectComp from '@/components/ui/select-comp'
import ShareLine from '@/components/ui/share-line'
import { cn } from '@/lib/utils'
import React from 'react'
import { Control, Controller, FormState } from 'react-hook-form'
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
} from 'valibot'
import validateCpf from 'validar-cpf'
import { DpsInitialForm } from './dps-initial-form'

export const dpsProfileForm = object({
	cpf: pipe(
		string(),
		nonEmpty('Campo obrigatório.'),
		custom(v => validateCpf(v as string), 'CPF inválido.')
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
		email('Email inválido.')
	),
	phone: pipe(string(), nonEmpty('Campo obrigatório.')),
	gender: pipe(string(), nonEmpty('Campo obrigatório.')),
})

export type DpsProfileFormType = InferInput<typeof dpsProfileForm>

const genderOptions = [
	{ value: 'M', label: 'Masculino' },
	{ value: 'F', label: 'Feminino' },
]

const DpsProfileForm = ({
	data,
	control,
	// errors,
	// isSubmitting,
	formState,
}: {
	data?: Partial<DpsProfileFormType>
	control: Control<DpsInitialForm>
	// errors: FieldErrors<DpsProfileFormType>
	// isSubmitting: boolean
	formState: FormState<DpsInitialForm>
}) => {
	const errors = formState.errors?.profile
	const isSubmitting = formState.isSubmitting

	return (
		<div className="flex flex-col gap-6 w-full">
			<h3 className="text-primary text-lg">Dados do Proponente</h3>
			<ShareLine>
				<Controller
					control={control}
					name="profile.cpf"
					render={({ field: { onChange, onBlur, value, ref } }) => (
						<label>
							<div className="text-gray-500">CPF</div>
							<Input
								id="cpf"
								type="text"
								placeholder="999.999.999-99"
								mask="999.999.999-99"
								className={cn(
									'w-full px-4 py-6 rounded-lg',
									errors?.cpf && 'border-red-500 focus-visible:border-red-500'
								)}
								disabled={data?.cpf ? true : false}
								autoComplete="cpf"
								onChange={onChange}
								onBlur={onBlur}
								value={value}
								ref={ref}
							/>
							<div className="text-xs text-red-500">{errors?.cpf?.message}</div>
						</label>
					)}
				/>

				<Controller
					control={control}
					name="profile.birthdate"
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
								disabled={isSubmitting || data?.birthdate !== undefined}
								onChange={onChange}
								onBlur={onBlur}
								value={value}
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
					defaultValue=""
					name="profile.name"
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
								disabled={isSubmitting || data?.name !== undefined}
								onChange={onChange}
								onBlur={onBlur}
								value={value}
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
					defaultValue=""
					name="profile.socialName"
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
								disabled={isSubmitting || data?.socialName !== undefined}
								onChange={onChange}
								onBlur={onBlur}
								value={value}
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
				{/* <Controller
					control={control}
					defaultValue=""
					name="profession"
					render={({ field: { onChange, value } }) => (
						<label>
							<div className="text-gray-500">Atividade Profissional</div>
							<SelectComp
								placeholder="Atividade profissional"
								options={professionOptions}
								triggerClassName="p-4 h-12 rounded-lg"
								disabled={isSubmitting}
								onValueChange={onChange}
								defaultValue={value}
							/>
							<div className="text-xs text-red-500">
								{errors?.profession?.message}
							</div>
						</label>
					)}
				/> */}

				<Controller
					control={control}
					defaultValue=""
					name="profile.profession"
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
								// disabled={isSubmitting || data?.profession !== undefined}
								onChange={onChange}
								onBlur={onBlur}
								value={value}
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
					defaultValue=""
					name="profile.email"
					render={({ field: { onChange, onBlur, value, ref } }) => (
						<label>
							<div className="text-gray-500">E-mail</div>
							<Input
								id="email"
								type="email"
								placeholder="exemplo@email.com"
								className={cn(
									'w-full px-4 py-6 rounded-lg',
									errors?.email && 'border-red-500 focus-visible:border-red-500'
								)}
								autoComplete="email"
								disabled={isSubmitting}
								onChange={onChange}
								onBlur={onBlur}
								value={value}
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
					defaultValue=""
					name="profile.phone"
					render={({ field: { onChange, onBlur, value, ref } }) => (
						<label>
							<div className="text-gray-500">Telefone</div>
							<Input
								id="phone"
								type="text"
								placeholder="(99) 99999-9999"
								mask="(99) 99999-9999"
								className={cn(
									'w-full px-4 py-6 rounded-lg',
									errors?.phone && 'border-red-500 focus-visible:border-red-500'
								)}
								autoComplete="phone"
								disabled={isSubmitting}
								onChange={onChange}
								onBlur={onBlur}
								value={value}
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
					defaultValue=""
					name="profile.gender"
					render={({ field: { onChange, value } }) => (
						<label>
							<div className="text-gray-500">Sexo</div>
							<SelectComp
								placeholder="Sexo"
								options={genderOptions}
								triggerClassName="p-4 h-12 rounded-lg"
								onValueChange={onChange}
								defaultValue={value}
								disabled={isSubmitting || data?.gender !== undefined}
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
