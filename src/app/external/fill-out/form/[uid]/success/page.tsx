import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default function SuccessPage({
  params: { uid },
}: {
  params: { uid: string }
}) {
  // Verificar se o usuário passou pelo formulário
  const cookieStore = cookies()
  const verificationCookie = cookieStore.get(`dps-verification-${uid}`)
  
  // Se não existe o cookie de verificação, redirecionar para a página inicial
  if (!verificationCookie || verificationCookie.value !== 'verified') {
    redirect(`/external/fill-out/form/${uid}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="p-8 bg-white shadow-lg rounded-lg max-w-md w-full text-center">
        <svg 
          className="mx-auto h-16 w-16 text-green-500 mb-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            d="M5 13l4 4L19 7"
          />
        </svg>
        
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Informações enviadas com sucesso!</h1>
        <p className="text-gray-600 mb-8">
          Seu formulário DPS foi preenchido e encaminhado com sucesso. Em breve você receberá mais informações.
        </p>
        
        <div className="mt-8 flex justify-center">
          {/* <Link
            href="/"
            className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Voltar ao Início
          </Link> */}
        </div>
      </div>
    </div>
  )
} 