'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { Loader2Icon } from 'lucide-react'

interface CpfVerificationProps {
  documentToVerify: string
  uid: string
}

// Função para normalizar o CPF (remover caracteres não numéricos)
const normalizeCpf = (cpf: string): string => {
  return cpf.replace(/\D/g, '');
}

export function CpfVerification({ documentToVerify, uid }: CpfVerificationProps) {
  const router = useRouter()
  const [cpfDigits, setCpfDigits] = useState<string[]>(Array(5).fill(''))
  const [error, setError] = useState<string | null>(null)
  const [attemptsLeft, setAttemptsLeft] = useState(3)
  const [showHint, setShowHint] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Normalizar o CPF do documento
  const normalizedDocumentCpf = normalizeCpf(documentToVerify)

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [])

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.charAt(0)
    }

    if (!/^[0-9]*$/.test(value)) {
      return
    }

    const newCpfDigits = [...cpfDigits]
    newCpfDigits[index] = value
    setCpfDigits(newCpfDigits)
    setError(null)

    // Move to next input if current input is filled
    if (value && index < 4) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    // Submeter ao pressionar Enter no último campo
    if (e.key === 'Enter' && index === 4 && cpfDigits.every(digit => digit !== '')) {
      handleVerify();
      return;
    }
    
    if (e.key === 'Backspace' && !cpfDigits[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 4) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleVerify = async () => {
    // Verificar se todos os 5 dígitos foram informados
    if (cpfDigits.length !== 5 || cpfDigits.some(digit => digit === '')) {
      setError("Por favor, preencha todos os 5 dígitos do CPF");
      return;
    }

    // Ativar o estado de verificação
    setIsVerifying(true);
    setError(null);

    try {
      const enteredCpf = cpfDigits.join('')
      const firstFiveDigits = normalizedDocumentCpf.substring(0, 5)

      console.log("Verificação:", {
        digitado: enteredCpf,
        esperado: firstFiveDigits,
        tamanhoDigitado: enteredCpf.length,
        tamanhoEsperado: firstFiveDigits.length
      });

      // Simular um pequeno atraso para mostrar o loading (remova em produção)
      await new Promise(resolve => setTimeout(resolve, 800));

      // Verificação dos dígitos
      const isValid = enteredCpf === firstFiveDigits

      if (isValid) {
        // Definir cookie para verificação bem-sucedida
        // Expira em 30 minutos (1800 segundos)
        Cookies.set(`dps-verification-${uid}`, 'verified', { expires: 1/48, secure: true, sameSite: 'Strict' })
        
        // Redirecionar para o formulário
        router.push(`/external/fill-out/form/${uid}/formulario`)
      } else {
        // Decrementar o contador de tentativas
        const newAttemptsLeft = attemptsLeft - 1
        setAttemptsLeft(newAttemptsLeft)
        
        // Definir mensagem de erro
        if (newAttemptsLeft > 0) {
          setError(`Verificação incorreta. Você tem mais ${newAttemptsLeft} ${newAttemptsLeft === 1 ? 'tentativa' : 'tentativas'}.`)
          setShowHint(true)
          
          // Limpar os campos para nova tentativa
          setCpfDigits(Array(5).fill(''))
          setTimeout(() => {
            inputRefs.current[0]?.focus()
          }, 100)
        } else {
          setError('Número máximo de tentativas excedido.')
          
          // Redirecionar para página 404 após 3 segundos
          setTimeout(() => {
            router.push('/external/fill-out/form/not-found')
          }, 3000)
        }
      }
    } catch (error) {
      setError('Ocorreu um erro durante a verificação. Tente novamente.');
    } finally {
      // Desativar o estado de verificação
      setIsVerifying(false);
    }
  }

  // Formato do CPF para exibir como dica
  const formatCpfHint = (cpf: string) => {
    const normalized = normalizeCpf(cpf).substring(0, 5)
    if (normalized.length < 5) return null
    
    return normalized.substring(0, 3) + '.' + normalized.substring(3, 5)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h2 className="text-2xl font-bold text-center mb-6">Verificação de CPF</h2>
        <p className="text-gray-600 mb-6 text-center">
          Para acessar o formulário, por favor digite os 5 primeiros dígitos do seu CPF
        </p>

        <form onSubmit={(e) => { e.preventDefault(); handleVerify(); }} className="mb-4">
          <div className="flex justify-center gap-2 mb-6">
            {cpfDigits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                aria-label={`Dígito ${index + 1} do CPF`}
                className={`w-12 h-12 text-center text-xl border-2 border-gray-300 rounded-md focus:border-blue-500 focus:ring focus:ring-blue-200 focus:outline-none ${isVerifying ? 'opacity-70' : ''}`}
                maxLength={1}
                disabled={attemptsLeft === 0 || isVerifying}
              />
            ))}
          </div>
          
          {showHint && (
            <div className="mb-4 text-sm text-center text-gray-500">
              <p className="mb-1">Dica de formato:</p>
              <p className="font-medium">{formatCpfHint('xxxxxx')}</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-md text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={cpfDigits.some(digit => digit === '') || attemptsLeft === 0 || isVerifying}
            className="w-full py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isVerifying ? (
              <>
                <Loader2Icon className="animate-spin mr-2 h-5 w-5" />
                Verificando...
              </>
            ) : (
              'Verificar'
            )}
          </button>
        </form>
      </div>
    </div>
  )
} 