'use client'

import { Controller, useForm } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { email, minLength, object, string, pipe, InferInput } from 'valibot'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import LabeledSeparator from '@/components/ui/labeled-separator'
import { signIn } from 'next-auth/react'
import InputPassword from '@/components/ui/input-password'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import DialogAlertComp from '@/components/ui/alert-dialog-comp'
import { useSession } from 'next-auth/react'
import { SalesChannelModal } from '@/components/sales-channel-modal'
import { SalesChannel } from '@/types/sales-channel'
import { changeSalesChannel } from '../actions'
import { signOut } from 'next-auth/react'

const loginSchema = object({
	email: pipe(
		string(),
		minLength(1, 'Campo obrigatório.'),
		email('Email inválido.')
	),
	password: pipe(string(), minLength(1, 'Campo obrigatório.')),
})

type LoginSchema = InferInput<typeof loginSchema>

export default function LoginForm() {
	const {
		handleSubmit,
		getValues,
		trigger,
		setValue,
		control,
		reset,
		formState: { isSubmitting, isSubmitted, ...formState },
	} = useForm<LoginSchema>({
		resolver: valibotResolver(loginSchema),
	})

	const router = useRouter()

	const params = useSearchParams()

	const [dialogState, setDialogState] = useState({
		open: false,
		message: '',
		title: '',
	})

	const [isLoading, setIsLoading] = useState(false)
	const [showChannelModal, setShowChannelModal] = useState(false)
	const [channels, setChannels] = useState<SalesChannel[]>([])
	const [currentChannel, setCurrentChannel] = useState<SalesChannel | null>(null)
	const [hasProcessedLogin, setHasProcessedLogin] = useState(false)
	const { data: session, update } = useSession()

	useEffect(() => {
		router.refresh()
	}, [router])

	// Verificar canais após login bem-sucedido
	useEffect(() => {
		// Evitar processar múltiplas vezes
		if (hasProcessedLogin) {
			return
		}

		const sessionWithToken = session as any
		if (sessionWithToken?.accessToken) {
			const sessionChannels = sessionWithToken.channels || []
			const sessionLastChannel = sessionWithToken.lastChannel || null

			// Lógica: 
			// - Se channels tem itens → múltiplos canais (lastChannel + channels)
			// - Se channels está vazio mas lastChannel existe → apenas 1 canal
			// - Se channels está vazio e lastChannel não existe → sem canais
			if (sessionChannels.length > 0) {
				// Múltiplos canais: lastChannel + channels
				// Combinar lastChannel com channels para mostrar todos
				const allChannels = sessionLastChannel 
					? [sessionLastChannel, ...sessionChannels.filter((c: SalesChannel) => c.uid !== sessionLastChannel.uid)]
					: sessionChannels
				
				setChannels(allChannels)
				setCurrentChannel(sessionLastChannel)
				setShowChannelModal(true)
				setHasProcessedLogin(true)
				setIsLoading(false)
			} else if (sessionLastChannel) {
				// Apenas um canal (channels vazio mas lastChannel existe)
				// Redirecionar direto
				setHasProcessedLogin(true)
				setIsLoading(false)
				const redirectPath = params.get('callbackUrl') || '/dashboard'
				if (redirectPath && redirectPath.startsWith('/') && !redirectPath.startsWith('/logout') && redirectPath !== '/') {
					router.push(redirectPath)
				} else {
					router.push('/dashboard')
				}
			} else {
				// Sem canais
				setHasProcessedLogin(true)
				setIsLoading(false)
				setDialogState({
					open: true,
					title: 'Nenhum canal disponível',
					message: 'Você não tem acesso a nenhum canal de venda. Entre em contato com o administrador.',
				})
				signOut({ redirect: false })
			}
		}
	}, [session, router, params, hasProcessedLogin])

	async function onSubmit(v: LoginSchema) {
		setIsLoading(true)
		setHasProcessedLogin(false) // Resetar flag ao fazer novo login
		setShowChannelModal(false) // Garantir que modal está fechado

		const cbParam = params.get('callbackUrl') || '/dashboard'

		const result = await signIn('credentials', {
			email: v.email,
			password: v.password,
			redirect: false,
			callbackUrl: cbParam,
		})

		if (result === undefined) {
			setDialogState({
				open: true,
				title: 'Ocorreu um erro ao autenticar',
				message: 'Tente novamente.',
			})
			setIsLoading(false)

			return
		}

		if (result.status === 401) {
			setDialogState({
				open: true,
				title: 'Login inválido',
				message: result.error || 'Email ou senha inválidos.',
			})
			setIsLoading(false)
			return
		}

		if (!result.ok) {
			console.log('ERRO AO AUTENTICAR')

			setDialogState({
				open: true,
				title: 'Ocorreu um erro ao autenticar',
				message: 'Tente novamente.',
			})
			setIsLoading(false)
			return
		}

		// Não redirecionar aqui - deixar o useEffect processar os canais
		// O useEffect vai verificar se há múltiplos canais e mostrar o modal ou redirecionar
	}

	async function handleSelectChannel(channelUid: string) {
		const sessionWithToken = session as any
		if (!sessionWithToken?.accessToken) {
			setDialogState({
				open: true,
				title: 'Erro',
				message: 'Sessão não encontrada. Por favor, faça login novamente.',
			})
			return
		}

		try {
			const result = await changeSalesChannel(sessionWithToken.accessToken, channelUid)

			if (result?.success && result.data) {
				// Atualizar sessão com os novos dados retornados pelo backend
				// Isso inclui o novo accessToken, expires, role, channels e lastChannel
				await update({
					accessToken: result.data.accessToken,
					expires: result.data.expires,
					role: result.data.role,
					channels: result.data.userData.channels || [],
					lastChannel: result.data.userData.lastChannel || null,
				})
				
				// Redirecionar
				const redirectPath = params.get('callbackUrl') || '/dashboard'
				if (redirectPath && redirectPath.startsWith('/') && !redirectPath.startsWith('/logout') && redirectPath !== '/') {
					router.push(redirectPath)
				} else {
					router.push('/dashboard')
				}
			} else {
				setDialogState({
					open: true,
					title: 'Erro ao trocar canal',
					message: result?.message || 'Não foi possível trocar o canal. Tente novamente.',
				})
			}
		} catch (error) {
			console.error('Erro ao trocar canal:', error)
			setDialogState({
				open: true,
				title: 'Erro ao trocar canal',
				message: 'Ocorreu um erro ao trocar o canal. Tente novamente.',
			})
		}
	}

	return (
		<div className="flex flex-col items-center gap-4 h-full w-full">
			<div className="flex w-full items-center justify-center grow">
				<form
					onSubmit={handleSubmit(onSubmit)}
					className="flex flex-col gap-6 w-full max-w-96"
				>
					<h2 className="text-2xl font-semibold">Entrar</h2>

					<Controller
						control={control}
						defaultValue=""
						name="email"
						render={({ field: { onChange, onBlur, value, ref } }) => (
							<div>
								<Input
									id="email"
									type="email"
									placeholder="Endereço de E-mail"
									className={cn(
										'px-4 py-6 rounded-lg',
										formState.errors?.email &&
											'border-red-500 focus-visible:border-red-500'
									)}
									autoComplete="username"
									disabled={isSubmitting}
									onChange={onChange}
									onBlur={onBlur}
									value={value}
									ref={ref}
								/>
								<div className="text-xs text-red-500">
									{formState.errors?.email?.message}
								</div>
							</div>
						)}
					/>

					<Controller
						control={control}
						defaultValue=""
						name="password"
						render={({
							field: { onChange, onBlur, value, ref },
							formState,
						}) => (
							<div>
								<InputPassword
									id="password"
									placeholder="Senha"
									className={cn(
										'px-4 py-6 rounded-lg',
										formState.errors.password &&
											'border-red-500 focus-visible:border-red-500'
									)}
									autoComplete="current-password"
									disabled={isSubmitting}
									onChange={onChange}
									onBlur={onBlur}
									value={value}
									ref={ref}
								/>
								<div className="text-xs text-red-500">
									{formState.errors.password?.message}
								</div>
							</div>
						)}
					/>

					<Link href={'/forgot-password'}>Esqueceu a senha?</Link>

					<Button
						type="submit"
						disabled={isSubmitting || isLoading}
						className="py-6 text-base font-semibold"
					>
						{isSubmitting || isLoading ? 'Carregando...' : 'Entrar'}
					</Button>

					{/* <LabeledSeparator label="OU" className="text-xs" />

					<Button
						disabled={isSubmitting}
						onClick={() => signIn('google')}
						variant="outline"
						className="py-6 font-semibold"
						hidden={true}
					>
						<Image
							src={'/static/icons/ic_google_logo.svg'}
							width={24}
							height={24}
							alt="Google logo"
							className="mr-2"
						/>
						Google
					</Button> */}
				</form>
			</div>
			<div className="p-3 my-3 text-sm text-slate-500">
				Protegido por reCAPTCHA e sujeito as normas de{' '}
				<Link href="/">Política de privacidade</Link> e{' '}
				<Link href={'/'}>Termos de uso</Link>
				<p>
					Copyright © 2024 Techtrail - Todos os direitos reservados
				</p>
			</div>

			<DialogAlertComp
				open={dialogState.open}
				title={dialogState.title}
				onOpenChange={open => setDialogState(prev => ({ ...prev, open: open }))}
			>
				{dialogState.message}
			</DialogAlertComp>

			<SalesChannelModal
				open={showChannelModal}
				onOpenChange={setShowChannelModal}
				channels={channels}
				currentChannel={currentChannel}
				onSelectChannel={handleSelectChannel}
				isLoading={isLoading}
				title="Selecione o Canal de Venda"
				description="Você tem acesso a múltiplos canais. Escolha qual deseja acessar:"
				required={true}
			/>
		</div>
	)
}
