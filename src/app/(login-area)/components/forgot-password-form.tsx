'use client'

import { Controller, useForm } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import {
	email,
	minLength,
	object,
	string,
	pipe,
	InferInput,
	maxLength,
	custom,
	ValiError,
	nonEmpty,
	forward,
	partialCheck,
} from 'valibot'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import LabeledSeparator from '@/components/ui/labeled-separator'
import { signIn } from 'next-auth/react'
import InputPassword from '@/components/ui/input-password'
import Image from 'next/image'
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSeparator,
	InputOTPSlot,
} from '@/components/ui/input-otp'
import {
	ChangeEvent,
	ComponentPropsWithoutRef,
	ElementRef,
	forwardRef,
	useEffect,
	useState,
} from 'react'

export default function ForgotPasswordForm() {
	const [step, setStep] = useState<0 | 1 | 2 | 3>(0)

	return (
		<div className="flex flex-col items-center gap-4 h-full w-full">
			<div className="flex w-full items-center justify-center grow">
				{step === 0 && <SendEmailForm setStep={setStep} />}
				{step === 1 && <ValidateOTPForm setStep={setStep} />}
				{step === 2 && <ResetPasswordForm setStep={setStep} />}
				{step === 3 && <SuccessMessage />}
			</div>
			<div className="p-3 my-3 text-sm text-slate-500">
				Protegido por reCAPTCHA e sujeito as normas de{' '}
				<Link href="/">Política de privacidade</Link> e{' '}
				<Link href={'/'}>Termos de uso</Link>
			</div>
		</div>
	)
}

const sendEmailSchema = object({
	email: pipe(
		string(),
		nonEmpty('Campo obrigatório.'),
		email('Email inválido.')
	),
})

type SendEmailSchema = InferInput<typeof sendEmailSchema>

function SendEmailForm({
	setStep,
}: {
	setStep: (step: 0 | 1 | 2 | 3) => void
}) {
	const {
		handleSubmit,
		getValues,
		control,
		formState: { isSubmitting, isSubmitted, errors, ...formState },
	} = useForm<SendEmailSchema>({
		resolver: valibotResolver(sendEmailSchema),
	})

	async function onSubmit(v: SendEmailSchema) {
		setStep(1)
	}

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className="flex flex-col gap-6 w-full max-w-96"
		>
			<div>
				<h2 className="mb-2 text-2xl font-semibold">Esqueceu a senha?</h2>
				<p className="text-muted-foreground">
					Insira seu e-mail aqui, enviaremos um código para validação e
					recuperação da sua senha.
				</p>
			</div>

			<Controller
				control={control}
				defaultValue=""
				name="email"
				render={({ field: { onChange, onBlur, value, ref } }) => (
					<div>
						<Input
							id="email"
							type="email"
							placeholder="email@email.com"
							className={cn(
								'px-4 py-6 rounded-lg',
								errors?.email && 'border-red-500 focus-visible:border-red-500'
							)}
							disabled={isSubmitting}
							onChange={onChange}
							onBlur={onBlur}
							value={value}
							ref={ref}
						/>
						<div className="text-xs text-red-500">{errors?.email?.message}</div>
					</div>
				)}
			/>

			<Button
				type="submit"
				disabled={isSubmitting}
				className="py-6 text-base font-semibold"
			>
				{isSubmitting ? 'Carregando...' : 'Receber código'}
			</Button>

			<p className="mt-8 text-center text-muted-foreground">
				Se lembrou? <Link href={'/login'}>Fazer login</Link>
			</p>
		</form>
	)
}

const validateOTPSchema = object({
	otp: pipe(
		string(),
		nonEmpty('Campo obrigatório.'),
		minLength(5, 'Código inválido.'),
		maxLength(5, 'Código inválido.')
	),
})

type ValidateOTPSchema = InferInput<typeof validateOTPSchema>

function ValidateOTPForm({
	setStep,
}: {
	setStep: (step: 0 | 1 | 2 | 3) => void
}) {
	const {
		handleSubmit,
		getValues,
		control,
		formState: { isSubmitting, isSubmitted, errors, ...formState },
	} = useForm<ValidateOTPSchema>({
		resolver: valibotResolver(validateOTPSchema),
	})

	async function onSubmit(v: ValidateOTPSchema) {
		setStep(2)
	}

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className="flex flex-col gap-6 w-full max-w-96"
		>
			<div>
				<h2 className="mb-2 text-2xl font-semibold">Esqueceu a senha?</h2>
				<p className="mb-4 text-muted-foreground">
					Insira abaixo o código recebido via e-mail.
				</p>
			</div>

			<Controller
				control={control}
				defaultValue=""
				name="otp"
				render={({ field: { onChange, onBlur, value, ref } }) => (
					<div className="mx-auto">
						<InputOTPComp
							className={cn(
								errors?.otp && 'border-red-500 focus-visible:border-red-500'
							)}
							onChange={onChange}
							value={value}
							ref={ref}
						/>
						<div className="text-xs text-red-500">{errors?.otp?.message}</div>
					</div>
				)}
			/>

			<Button
				type="submit"
				disabled={isSubmitting}
				className="py-6 text-base font-semibold"
			>
				{isSubmitting ? 'Carregando...' : 'Validar código'}
			</Button>

			<p className="mt-8 text-center text-muted-foreground">
				Se lembrou? <Link href={'/login'}>Fazer login</Link>
			</p>
		</form>
	)
}

const InputOTPComp = forwardRef<ElementRef<any>, ComponentPropsWithoutRef<any>>(
	({ ...props }) => {
		console.log('InputOTPComp', props)
		return (
			<InputOTP {...props} maxLength={6}>
				<InputOTPGroup>
					<InputOTPSlot className="w-14" index={0} />
					<InputOTPSlot className="w-14" index={1} />
					<InputOTPSlot className="w-14" index={2} />
					<InputOTPSlot className="w-14" index={3} />
				</InputOTPGroup>
				<InputOTPSeparator />
				<InputOTPGroup>
					<InputOTPSlot className="w-14" index={4} />
				</InputOTPGroup>
			</InputOTP>
		)
	}
)
InputOTPComp.displayName = 'InputOTPComp'

const resetPasswordSchema = pipe(
	object({
		newPassword: pipe(
			string(),
			nonEmpty('Campo obrigatório.'),
			minLength(8, 'Senha deve conter pelo menos 8 caracteres.'),
			maxLength(255, 'Senha inválida.')
		),
		confirmPassword: string(),
	}),
	forward(
		partialCheck(
			[['newPassword'], ['confirmPassword']],
			input => input.newPassword === input.confirmPassword,
			'As senhas precisam ser iguais.'
		),
		['confirmPassword']
	)
)

type ResetPasswordSchema = InferInput<typeof resetPasswordSchema>

function ResetPasswordForm({
	setStep,
}: {
	setStep: (step: 0 | 1 | 2 | 3) => void
}) {
	const {
		handleSubmit,
		getValues,
		watch,
		trigger,
		control,
		formState: { isSubmitting, isSubmitted, errors, ...formState },
	} = useForm<ResetPasswordSchema>({
		resolver: valibotResolver(resetPasswordSchema),
	})

	const newPwd = watch('newPassword')
	const confirmPwd = watch('confirmPassword')

	useEffect(() => {
		if (getValues('confirmPassword')) trigger('confirmPassword')
	}, [newPwd, trigger, getValues])

	useEffect(() => {
		trigger('confirmPassword')
	}, [confirmPwd, trigger])

	async function onSubmit(v: ResetPasswordSchema) {
		setStep(3)
	}

	console.log(errors)
	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className="flex flex-col gap-6 w-full max-w-96"
		>
			<div>
				<h2 className="mb-2 text-2xl font-semibold">Nova senha</h2>
				<p className="text-muted-foreground">Preencha aqui sua nova senha</p>
			</div>

			<Controller
				control={control}
				defaultValue=""
				name="newPassword"
				render={({ field: { onChange, onBlur, value, ref } }) => (
					<div>
						<Input
							id="nemPassword"
							type="password"
							placeholder="Nova senha"
							className={cn(
								'px-4 py-6 rounded-lg',
								errors?.newPassword &&
									'border-red-500 focus-visible:border-red-500'
							)}
							disabled={isSubmitting}
							onChange={onChange}
							onBlur={onBlur}
							value={value}
							ref={ref}
						/>
						<div className="text-xs text-red-500">
							{errors?.newPassword?.message}
						</div>
					</div>
				)}
			/>

			<Controller
				control={control}
				defaultValue=""
				name="confirmPassword"
				render={({ field: { onChange, onBlur, value, ref } }) => (
					<div>
						<Input
							id="confirmPassword"
							type="password"
							placeholder="Confirmar nova senha"
							className={cn(
								'px-4 py-6 rounded-lg',
								errors?.confirmPassword &&
									'border-red-500 focus-visible:border-red-500'
							)}
							disabled={isSubmitting}
							onChange={onChange}
							onBlur={onBlur}
							value={value}
							ref={ref}
						/>
						<div className="text-xs text-red-500">
							{errors?.confirmPassword?.message}
						</div>
					</div>
				)}
			/>

			<Button
				type="submit"
				disabled={isSubmitting}
				className="py-6 text-base font-semibold"
			>
				{isSubmitting ? 'Carregando...' : 'Salvar nova senha'}
			</Button>

			<p className="mt-8 text-center text-muted-foreground">
				Se lembrou? <Link href={'/login'}>Fazer login</Link>
			</p>
		</form>
	)
}

function SuccessMessage() {
	return (
		<div>
			<h2 className="mb-2 text-2xl font-semibold">Parabéns</h2>
			<p className="text-muted-foreground">
				Senha alterada com sucesso. <Link href={'/login'}>Fazer login</Link>
			</p>
		</div>
	)
}
