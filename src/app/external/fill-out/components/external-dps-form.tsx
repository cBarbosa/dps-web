'use client'

import { useRouter } from 'next/navigation'
import { ProposalByUid, postHealthDataByUid, signProposal } from '@/app/external/actions'
import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { UserIcon, Loader2Icon, CheckIcon, AlertCircleIcon } from 'lucide-react'
import { diseaseNames } from '@/app/(logged-area)/dps/fill-out/components/dps-form'
import { cn } from '@/lib/utils'

interface ExternalDpsFormProps {
  initialProposalData: ProposalByUid
  initialHealthData?: {
    code: string
    question: string
    exists: boolean
    created: string
    updated?: string
    description?: string
  }[]
  successRedirect: string
}

// Componente DiseaseField adaptado para o formulário externo
function DiseaseField({
  name,
  label,
  value,
  onChange,
  onDescriptionChange,
  error,
  isSubmitting,
}: {
  name: string
  label: string
  value: { has: string, description: string }
  onChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  error: boolean
  isSubmitting: boolean
}) {
  const hasInputRef = useRef<HTMLElement | null>(null)
  
  function handleValidShake(check: boolean) {
    if (check && hasInputRef.current) {
      hasInputRef.current.style.animation = 'horizontal-shaking 0.25s backwards'
      setTimeout(() => {
        if (hasInputRef.current) hasInputRef.current.style.animation = ''
      }, 250)
    }
    return check
  }

  useEffect(() => {
    handleValidShake(error)
  }, [error])

  return (
    <div className="py-4 px-4 hover:bg-gray-50" ref={hasInputRef as any}>
      <div>
        <div className="text-gray-500">{label}</div>
        <div className="mt-2">
          <Textarea
            id={name}
            placeholder="Descreva"
            className={cn(
              'w-full p-4 h-12 mt-3 rounded-lg',
              error && 'border-red-500 focus-visible:border-red-500'
            )}
            disabled={isSubmitting || value.has !== 'yes'}
            onChange={(e) => onDescriptionChange(e.target.value)}
            value={value.description}
          />
          {error && value.has === 'yes' && !value.description && (
            <div className="text-xs text-red-500">
              Campo obrigatório
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        <RadioGroup 
          value={value.has || ''} 
          onValueChange={onChange}
          className="flex items-center gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id={`yes-${name}`} />
            <Label htmlFor={`yes-${name}`}>Sim</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id={`no-${name}`} />
            <Label htmlFor={`no-${name}`}>Não</Label>
          </div>
        </RadioGroup>
        
        {error && !value.has && (
          <p className="text-sm text-red-500 mt-1">Selecione uma opção</p>
        )}
      </div>
    </div>
  )
}

export default function ExternalDpsForm({
  initialProposalData,
  initialHealthData,
  successRedirect
}: ExternalDpsFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Initialize form data from existing health data or empty state
  const [formData, setFormData] = useState<Record<string, { has: string, description: string }>>(() => {
    if (initialHealthData && initialHealthData.length > 0) {
      return initialHealthData.reduce((acc, item) => ({
        ...acc,
        [item.code]: {
          has: item.exists ? 'yes' : '',
          description: ''
        }
      }), {});
    }
    
    return Object.keys(diseaseNames).reduce((acc, key) => ({
      ...acc,
      [key]: { has: '', description: '' }
    }), {});
  });
  
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  
  const handleRadioChange = (questionId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], has: value }
    }));
    
    // Clear error for this question
    if (errors[questionId]) {
      setErrors(prev => ({ ...prev, [questionId]: false }));
    }
  };
  
  const handleDescriptionChange = (questionId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], description: value }
    }));
    
    // Clear error if this is a "yes" answer and there was an error
    if (formData[questionId]?.has === 'yes' && errors[questionId] && value.trim()) {
      setErrors(prev => ({ ...prev, [questionId]: false }));
    }
  };
  
  const validateForm = () => {
    const newErrors: Record<string, boolean> = {};
    let hasError = false;
    
    Object.keys(diseaseNames).forEach(key => {
      // Pular a validação do campo telefoneContato
      if (key === 'telefoneContato') return;
      
      if (!formData[key]?.has) {
        newErrors[key] = true;
        hasError = true;
      } else if (formData[key].has === 'yes' && !formData[key].description.trim()) {
        newErrors[key] = true;
        hasError = true;
      }
    });
    
    setErrors(newErrors);
    return !hasError;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Format data for API
      const postData = Object.entries(formData)
        .filter(([key]) => key !== 'telefoneContato') // Excluir o campo telefoneContato
        .map(([key, value]) => ({
          code: key,
          question: diseaseNames[key as keyof typeof diseaseNames],
          exists: value.has === 'yes',
          created: new Date().toISOString(),
          description: value.description
        }));

      // Post health data
      const healthResponse = await postHealthDataByUid(initialProposalData.uid, postData);
      
      if (healthResponse?.success) {
        // Sign the proposal
        const signResponse = await signProposal(initialProposalData.uid);
        
        if (signResponse?.success) {
          setIsSubmitted(true);
          setTimeout(() => {
            router.push(successRedirect);
          }, 2000);
        } else {
          setSubmitError(signResponse?.message || 'Erro ao assinar a proposta. Por favor, tente novamente.');
        }
      } else {
        setSubmitError(healthResponse?.message || 'Erro ao enviar dados de saúde. Por favor, tente novamente.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitError('Ocorreu um erro inesperado. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Simple profile data component
  const ProfileData = () => {
    return (
      <div className="px-3">
        <h3 className="text-primary text-xl font-semibold mb-4">Dados do Proponente</h3>
        <div className="flex flex-col md:flex-row gap-6 my-4">
          <div className="flex items-start">
            <div className="bg-primary/10 p-3 rounded-full">
              <UserIcon size={42} className="text-primary" />
            </div>
          </div>
          
          <div className="grow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Nome</div>
                <div className="font-medium">{initialProposalData.customer.name}</div>
                
                {initialProposalData.customer.socialName && (
                  <>
                    <div className="text-sm text-muted-foreground mt-3">Nome Social</div>
                    <div className="font-medium">{initialProposalData.customer.socialName}</div>
                  </>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">CPF</div>
                <div className="font-medium">
                  {initialProposalData.customer.document.replace(
                    /(\d{3})(\d{3})(\d{3})(\d{2})/,
                    '$1.$2.$3-$4'
                  )}
                </div>
                
                <div className="text-sm text-muted-foreground mt-3">Data de Nascimento</div>
                <div className="font-medium">
                  {new Date(initialProposalData.customer.birthdate).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">E-mail</div>
                <div className="font-medium">{initialProposalData.customer.email}</div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Celular</div>
                <div className="font-medium">
                  {initialProposalData.customer.cellphone || "Não informado"}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Produto</div>
                <div className="font-medium">{initialProposalData.product.name}</div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Prazo</div>
                <div className="font-medium">
                  {initialProposalData.deadlineMonths ? `${initialProposalData.deadlineMonths} meses` : "Não informado"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Tela de carregamento
  if (isSubmitting) {
    return (
      <div className="p-5">
        <div className="p-9 mt-8 w-full max-w-7xl mx-auto bg-white rounded-3xl">
          <ProfileData />
        </div>
        <div className="p-9 mt-8 w-full max-w-7xl mx-auto bg-white rounded-3xl">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2Icon size={60} className="animate-spin text-primary mb-6" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Processando sua solicitação</h2>
            <p className="text-gray-600 text-center max-w-md">
              Estamos enviando seus dados e validando as informações. 
              Por favor, aguarde um momento...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Tela de erro
  if (submitError) {
    return (
      <div className="p-5">
        <div className="p-9 mt-8 w-full max-w-7xl mx-auto bg-white rounded-3xl">
          <ProfileData />
        </div>
        <div className="p-9 mt-8 w-full max-w-7xl mx-auto bg-white rounded-3xl">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-red-100 mb-4"> 
              <AlertCircleIcon className="h-10 w-10 text-red-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Não foi possível processar sua solicitação</h2>
            <p className="text-gray-600 mb-6">
              {submitError}
            </p>
            
            <Button 
              onClick={() => setSubmitError(null)} 
              className="px-6"
            >
              Tentar Novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Tela de sucesso
  if (isSubmitted) {
    return (
      <div className="p-5">
        <div className="p-9 mt-8 w-full max-w-7xl mx-auto bg-white rounded-3xl">
          <ProfileData />
        </div>
        <div className="p-9 mt-8 w-full max-w-7xl mx-auto bg-white rounded-3xl">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-100 mb-4"> 
              <CheckIcon className="h-10 w-10 text-green-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Preenchimento Realizado com Sucesso!</h2>
            <p className="text-gray-600">
              Seu formulário DPS foi enviado e encaminhado para assinatura do proponente.
              <br />Em breve você receberá mais informações sobre o andamento do processo.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Formulário
  return (
    <div className="p-5">
      <div className="p-9 mt-8 w-full max-w-7xl mx-auto bg-white rounded-3xl">
        <ProfileData />
      </div>
      <div className="p-9 mt-8 w-full max-w-7xl mx-auto bg-white rounded-3xl">
        <h3 className="text-primary text-lg mb-6">Formulário Declaração Pessoal de Saúde</h3>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-8 w-full">
          <div>
            Preencha o formulário abaixo para declarar sua saúde.
          </div>
          
          <div className="space-y-8 divide-y">
            {Object.entries(diseaseNames).map(([key, question]) => key === 'telefoneContato' ? null : (
              <DiseaseField
                key={key}
                name={key}
                label={question}
                value={formData[key] || { has: '', description: '' }}
                onChange={(value) => handleRadioChange(key, value)}
                onDescriptionChange={(value) => handleDescriptionChange(key, value)}
                error={errors[key] || false}
                isSubmitting={isSubmitting}
              />
            ))}
          </div>
          
          <div className="mt-6">
            <Button
              type="submit"
              className="w-40"
              disabled={isSubmitting}
            >
              Salvar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 