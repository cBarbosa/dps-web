'use client'
import { Button } from '@/components/ui/button'
import DatePicker from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import SelectComp from '@/components/ui/select-comp'
import ShareLine from '@/components/ui/share-line'
import { cn } from '@/lib/utils'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { useSession } from 'next-auth/react'
import React from 'react'
import { Controller, useForm } from 'react-hook-form'
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
import { postProposal } from '../../actions'
import { useRouter } from 'next/navigation'

const profileForm = object({
	produto: pipe(string(), nonEmpty('Campo obrigatório.')),
	lmi: pipe(string(), nonEmpty('Campo obrigatório.')),
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
})

export type ProfileForm = InferInput<typeof profileForm>

const DpsProfileForm = ({
	onSubmit: onSubmitProp,
	data,
	lmiOptions,
	productOptions,
}: {
	onSubmit: (uid: string, v: ProfileForm) => void
	data?: Partial<ProfileForm>
	lmiOptions: { value: string; label: string }[]
	productOptions: { value: string; label: string }[]
}) => {
	const session = useSession()
	const token = (session.data as any)?.accessToken

	const {
		handleSubmit,
		getValues,
		trigger,
		setValue,
		control,
		reset,
		formState: { isSubmitting, isSubmitted, errors, ...formState },
	} = useForm<ProfileForm>({
		resolver: valibotResolver(profileForm),
		defaultValues: {
			cpf: data?.cpf,
			lmi: data?.lmi,
			produto: data?.produto,
			name: data?.name,
			birthdate: data?.birthdate,
			profession: data?.profession,
			email: data?.email,
			phone: data?.phone,
			socialName: data?.socialName,
		},
	})

	const router = useRouter()

	if (!data || !data.cpf || !data.lmi || !data.produto)
		router.replace('/dps/fill-out')

	async function onSubmit(v: ProfileForm) {
		if (!data || !data.cpf || !data.lmi || !data.produto)
			return router.replace('/dps/fill-out')

		const postData = {
			document: data.cpf,
			name: v.name,
			socialName: v.socialName ?? '',
			email: v.email,
			birthDate: v.birthdate.toISOString(),
			productId: v.produto,
			profession: v.profession ?? '',
			typeId: 2,
			lmiRangeId: +data.lmi,
		}
		console.log('submitting', token, postData)

		const response = await postProposal(token, postData)

		console.log('post proposal', response)

		if (response) {
			reset()
			if (response.success) {
				onSubmitProp(response.data, v)
			} else {
				console.error(response.message)
			}
		}
	}

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className="flex flex-col gap-6 w-full"
		>
			<h3 className="text-primary text-lg">Dados do Proponente</h3>
			<ShareLine>
				<Controller
					control={control}
					defaultValue=""
					name="produto"
					render={({ field: { onChange, value } }) => (
						<label>
							<div className="text-gray-500">Produto</div>
							<SelectComp
								placeholder="Produto"
								options={productOptions}
								triggerClassName="p-4 h-12 rounded-lg"
								disabled={true}
								onValueChange={onChange}
								defaultValue={value}
							/>
							<div className="text-xs text-red-500">
								{errors?.produto?.message}
							</div>
						</label>
					)}
				/>

				<Controller
					control={control}
					defaultValue=""
					name="lmi"
					render={({ field: { onChange, value } }) => (
						<label>
							<div className="text-gray-500">LMI</div>
							<SelectComp
								placeholder="LMI"
								options={lmiOptions}
								triggerClassName="p-4 h-12 rounded-lg"
								disabled={true}
								onValueChange={onChange}
								defaultValue={value}
							/>
							<div className="text-xs text-red-500">{errors?.lmi?.message}</div>
						</label>
					)}
				/>
			</ShareLine>
			<ShareLine>
				<Controller
					control={control}
					defaultValue=""
					name="cpf"
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
								autoComplete="cpf"
								disabled={true}
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
					name="birthdate"
					render={({ field: { onChange, onBlur, value, ref } }) => (
						<label>
							<div className="text-gray-500">Data de Nascimento</div>
							{/* <Input
								id="birthdate"
								type="text"
								placeholder="01/01/1999"
								mask="99/99/9999"
								className={cn(
									'w-full px-4 py-6 rounded-lg',
									errors?.birthdate &&
										'border-red-500 focus-visible:border-red-500'
								)}
								autoComplete="birthdate"
								disabled={isSubmitting}
								onChange={onChange}
								onBlur={onBlur}
								value={value}
								ref={ref}
							/> */}

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
					name="name"
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
					name="socialName"
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
					name="profession"
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
								disabled={isSubmitting || data?.profession !== undefined}
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
					name="email"
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
								disabled={isSubmitting || data?.email !== undefined}
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
					name="phone"
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
								disabled={isSubmitting || data?.phone !== undefined}
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
				<div></div>
			</ShareLine>

			<Button type="submit" className="w-40" disabled={isSubmitting}>
				Salvar
			</Button>
		</form>
	)
}

export default DpsProfileForm
