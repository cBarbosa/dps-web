'use client'

import React from 'react'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useRouter } from 'next/navigation'

interface TermsOfUseModalProps {
	open: boolean
	onAccept: () => void
}

export default function TermsOfUseModal({ open, onAccept }: TermsOfUseModalProps) {
	const router = useRouter()

	const handleCancel = () => {
		router.push('/dashboard')
	}

	return (
		<AlertDialog open={open}>
			<AlertDialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
				<AlertDialogHeader>
					<AlertDialogTitle className="text-xl font-bold">
						Termo de Consentimento para Consulta de Dados e Demonstração de Perfil
					</AlertDialogTitle>
					<AlertDialogDescription asChild>
						<div className="text-left space-y-4 mt-4 text-gray-700">
							<p className="font-semibold text-base text-gray-900">
								TECHTRAIL — Plataforma de Inteligência em Dados e IA Aplicada
							</p>
							
							<p className="text-sm leading-relaxed">
								Ao informar seu CPF, você autoriza, de forma livre, informada e inequívoca, 
								que a TECHTRAIL realize a consulta e tratamento de informações associadas a 
								esse número de CPF em bases públicas e privadas contratadas, com a finalidade 
								exclusiva de demonstrar o funcionamento da plataforma e a geração de perfis 
								analíticos durante este evento.
							</p>

							<p className="text-sm leading-relaxed">
								O objetivo desta demonstração é apresentar como a tecnologia da TECHTRAIL 
								integra múltiplas fontes de dados e aplica modelos de Inteligência Artificial 
								e estatística para criar perfis preditivos e apoiar a tomada de decisões 
								comerciais e de risco.
							</p>

							<p className="text-sm leading-relaxed">
								Nenhum dado coletado ou exibido durante esta demonstração será utilizado 
								para fins comerciais, cadastrais, creditícios ou de marketing, e será 
								automaticamente descartado após o encerramento do evento.
							</p>

							<div className="space-y-2 mt-4">
								<p className="text-sm font-semibold text-gray-900">
									Ao prosseguir, você declara que:
								</p>
								
								<ul className="space-y-2 pl-4">
									<li className="text-sm leading-relaxed flex">
										<span className="mr-2">•</span>
										<span>
											Está informando seu próprio CPF, sobre o qual possui legitimidade 
											para consentir o tratamento de dados;
										</span>
									</li>
									<li className="text-sm leading-relaxed flex">
										<span className="mr-2">•</span>
										<span>
											Está ciente de que a consulta tem propósito exclusivamente 
											demonstrativo e educacional;
										</span>
									</li>
									<li className="text-sm leading-relaxed flex">
										<span className="mr-2">•</span>
										<span>
											Concorda que a TECHTRAIL realize a consulta de informações 
											provenientes de fontes públicas e privadas regularmente contratadas, 
											com base em seu CPF;
										</span>
									</li>
									<li className="text-sm leading-relaxed flex">
										<span className="mr-2">•</span>
										<span>
											Autoriza o tratamento temporário dos dados para exibição dos 
											resultados analíticos nesta plataforma.
										</span>
									</li>
								</ul>
							</div>

							<p className="text-sm leading-relaxed font-medium text-gray-900 mt-4">
								Caso não concorde, basta não prosseguir com a demonstração.
							</p>
						</div>
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter className="mt-6">
					<AlertDialogCancel onClick={handleCancel}>
						Cancelar
					</AlertDialogCancel>
					<AlertDialogAction 
						onClick={onAccept}
						className="bg-bradesco hover:bg-bradesco/90"
					>
						Li e Concordo
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}

