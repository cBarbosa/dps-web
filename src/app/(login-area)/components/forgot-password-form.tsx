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
	nonEmpty,
	forward,
	partialCheck,
} from 'valibot'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSeparator,
	InputOTPSlot,
} from '@/components/ui/input-otp'
import {
	ComponentPropsWithoutRef,
	ElementRef,
	forwardRef,
	useEffect,
	useState,
} from 'react'

export default function ForgotPasswordForm() {
	const [step, setStep] = useState<0 | 1 | 2 | 3>(0)

	const [email, setEmail] = useState('')

	return (
		<div className="flex flex-col items-center gap-4 h-full w-full">
			<div className="flex w-full items-center justify-center grow">
				{step === 0 && <SendEmailForm setStep={setStep} setEmail={setEmail} />}
				{step === 1 && <ValidateOTPForm setStep={setStep} email={email} />}
				{step === 2 && <ResetPasswordForm setStep={setStep} email={email} />}
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
	setEmail,
}: {
	setStep: (step: 0 | 1 | 2 | 3) => void
	setEmail: (email: string) => void
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
		setEmail(v.email)
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
	email,
}: {
	setStep: (step: 0 | 1 | 2 | 3) => void
	email: string
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
	({ className, ...props }, ref) => {
		return (
			<InputOTP {...props} maxLength={5}>
				<InputOTPGroup>
					<InputOTPSlot className={cn('w-14', className)} index={0} />
					<InputOTPSlot className={cn('w-14', className)} index={1} />
					<InputOTPSlot className={cn('w-14', className)} index={2} />
					<InputOTPSlot className={cn('w-14', className)} index={3} />
				</InputOTPGroup>
				<InputOTPSeparator />
				<InputOTPGroup>
					<InputOTPSlot className={cn('w-14', className)} index={4} />
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
	email,
}: {
	setStep: (step: 0 | 1 | 2 | 3) => void
	email: string
}) {
	const {
		handleSubmit,
		getValues,
		watch,
		trigger,
		control,
		getFieldState,
		formState: { isSubmitting, isSubmitted, errors, ...formState },
	} = useForm<ResetPasswordSchema>({
		resolver: valibotResolver(resetPasswordSchema),
	})

	const newPwd = watch('newPassword')
	const confirmPwd = watch('confirmPassword')

	useEffect(() => {
		if (getFieldState('confirmPassword').isTouched) trigger('confirmPassword')
	}, [newPwd, trigger, getFieldState])

	useEffect(() => {
		if (getFieldState('confirmPassword').isTouched) trigger('confirmPassword')
	}, [confirmPwd, trigger, getFieldState])

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

			<input
				type="text"
				name="email"
				value={email}
				autoComplete="email"
				hidden
				readOnly
			/>

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
							autoComplete="new-password"
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
							autoComplete="confirm-new-password"
							disabled={isSubmitting}
							onChange={onChange}
							onBlur={e => {
								trigger('confirmPassword')
								return onBlur()
							}}
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
