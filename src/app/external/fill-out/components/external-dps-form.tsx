'use client'

import { useRouter } from 'next/navigation'
import { ProposalByUid, postHealthDataByUid, signProposal, postMagHabitacionalAutoApproval } from '@/app/external/actions'
import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { UserIcon, Loader2Icon, CheckIcon, AlertCircleIcon } from 'lucide-react'
import { diseaseNamesHabitacional, diseaseNamesHomeEquity, diseaseNamesMagHabitacionalSimplified, diseaseNamesMagHabitacionalComplete } from '@/app/(logged-area)/dps/fill-out/components/dps-form'
import { isMagHabitacionalProduct, getDpsTypeByCapital } from '@/constants'
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

// Componente para campos de texto obrigatórios (altura e peso) no formulário externo
function MagTextField({
  name,
  label,
  value,
  onChange,
  error,
  isSubmitting,
  required = false,
}: {
  name: string
  label: string
  value: string
  onChange: (value: string) => void
  error: boolean
  isSubmitting: boolean
  required?: boolean
}) {
  return (
    <div className="py-4 px-4 hover:bg-gray-50">
      <div className="w-full">
        <div className="text-gray-500 mb-3">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </div>
        <Input
          id={name}
          placeholder="Digite sua resposta"
          className={cn(
            'w-full p-4 h-12 rounded-lg',
            error && 'border-red-500 focus-visible:border-red-500'
          )}
          disabled={isSubmitting}
          onChange={(e) => onChange(e.target.value)}
          value={value}
        />
        {error && (
          <div className="text-xs text-red-500 mt-1">
            Campo obrigatório
          </div>
        )}
      </div>
    </div>
  )
}

// Componente para DPS Simplificada MAG Habitacional no formulário externo
function MagSimplifiedField({
  value,
  onChange,
  onDescriptionChange,
  error,
  isSubmitting,
}: {
  value: { has: string; description: string }
  onChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  error: boolean
  isSubmitting: boolean
}) {
  return (
    <div className="py-4 px-4 hover:bg-gray-50">
      <div className="w-full">
        <div className="text-gray-500 mb-3">
          O proponente apresenta qualquer problema de saúde que afete suas atividades profissionais, esteve internado, fez qualquer cirurgia/biópsia nos últimos três anos ou tem ainda, conhecimento de qualquer condição médica que possa resultar em uma hospitalização ou cirurgia nos próximos meses? Não Em caso afirmativo, especificar.
        </div>

        {/* Radio Group Sim/Não */}
        <div className="mb-4">
          <RadioGroup
            value={value.has || ''}
            onValueChange={onChange}
            className="flex flex-row items-center gap-6"
          >
            <div className={`flex items-center space-x-2 ${error && 'text-red-500'}`}>
              <RadioGroupItem value="yes" id="simplified-yes" />
              <Label htmlFor="simplified-yes" className="cursor-pointer">
                Sim
              </Label>
            </div>
            <div className={`flex items-center space-x-2 ${error && 'text-red-500'}`}>
              <RadioGroupItem value="no" id="simplified-no" />
              <Label htmlFor="simplified-no" className="cursor-pointer">
                Não
              </Label>
            </div>
          </RadioGroup>
          {error && (
            <p className="text-sm text-red-500 mt-1">Escolha a opção</p>
          )}
        </div>

        {/* Textarea condicional - só mostra quando "Sim" é selecionado */}
        {value.has === 'yes' && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="Descreva em detalhes..."
              className={cn(
                'w-full p-4 min-h-[100px] rounded-lg resize-none',
                error && value.description && !value.description.trim() && 'border-red-500 focus-visible:border-red-500'
              )}
              disabled={isSubmitting}
              onChange={(e) => onDescriptionChange(e.target.value)}
              value={value.description || ''}
            />
            {error && value.has === 'yes' && (!value.description || !value.description.trim()) && (
              <div className="text-xs text-red-500 mt-1">
                Campo obrigatório quando selecionar Sim
              </div>
            )}
          </div>
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

  // Determinar tipo de produto e DPS
  const isMagHabitacional = isMagHabitacionalProduct(initialProposalData.product.name);
  const magDpsType = isMagHabitacional && initialProposalData.capitalMIP
    ? getDpsTypeByCapital(initialProposalData.product.name, initialProposalData.capitalMIP)
    : 'complete';

  // Initialize form data from existing health data or empty state
  const [formData, setFormData] = useState<Record<string, { has: string, description: string } | string>>(() => {
    if (initialHealthData && initialHealthData.length > 0) {
      // Para MAG Habitacional simplificada, processar dados específicos
      if (isMagHabitacional && magDpsType === 'simplified') {
        return initialHealthData.reduce((acc, item) => ({
          ...acc,
          [item.code]: {
            has: item.exists ? 'yes' : 'no',
            description: item.description || ''
          }
        }), {});
      } else if (isMagHabitacional && magDpsType === 'complete') {
        // Para MAG Habitacional completa, processar dados específicos
        return initialHealthData.reduce((acc, item) => {
          // Questões 11-12 são texto puro
          if (['11', '12'].includes(item.code)) {
            return {
              ...acc,
              [item.code]: item.description || ''
            };
          }
          // Questões 1-10 são yes/no
          return {
            ...acc,
            [item.code]: {
              has: item.exists ? 'yes' : '',
              description: item.description || ''
            }
          };
        }, {});
      } else {
        // Para outros produtos, manter lógica existente
        return initialHealthData.reduce((acc, item) => ({
          ...acc,
          [item.code]: {
            has: item.exists ? 'yes' : '',
            description: item.description || ''
          }
        }), {});
      }
    }

    // Inicialização para formulário vazio baseado no tipo de produto
    if (isMagHabitacional && magDpsType === 'simplified') {
      return Object.keys(diseaseNamesMagHabitacionalSimplified)
        .reduce((acc, key) => ({
          ...acc,
          [key]: { has: '', description: '' }
        }), {});
    }

    if (isMagHabitacional && magDpsType === 'complete') {
      return Object.keys(diseaseNamesMagHabitacionalComplete)
        .reduce((acc, key) => {
          // Questões 11-12 são campos de texto, armazenar como string
          if (['11', '12'].includes(key)) {
            return {
              ...acc,
              [key]: '' // String vazia para campos de texto
            };
          }
          // Questões 1-10 são Sim/Não
          return {
            ...acc,
            [key]: { has: '', description: '' }
          };
        }, {});
    }

    const productTypeDiseaseNames = (initialProposalData.product.name === 'HDI Home Equity' || initialProposalData.product.name === 'FHE Poupex');

    return Object.keys(productTypeDiseaseNames ? diseaseNamesHomeEquity : diseaseNamesHabitacional)
      .filter(key => key !== 'telefoneContato') // Exclude telefoneContato
      .reduce((acc, key) => ({
        ...acc,
        [key]: { has: '', description: '' }
      }), {});
  });

  const [errors, setErrors] = useState<Record<string, boolean>>({});
  
  const handleRadioChange = (questionId: string, value: string) => {
    setFormData(prev => {
      const currentValue = prev[questionId];
      return {
        ...prev,
        [questionId]: typeof currentValue === 'string' 
          ? { has: value, description: '' } 
          : { ...currentValue, has: value }
      };
    });
    
    // Clear error for this question
    if (errors[questionId]) {
      setErrors(prev => ({ ...prev, [questionId]: false }));
    }
  };
  
  const handleDescriptionChange = (questionId: string, value: string) => {
    setFormData(prev => {
      const currentValue = prev[questionId];
      return {
        ...prev,
        [questionId]: typeof currentValue === 'string'
          ? { has: '', description: value }
          : { ...currentValue, description: value }
      };
    });
    
    // Clear error if this is a "yes" answer and there was an error
    const currentData = formData[questionId];
    if (typeof currentData !== 'string' && currentData?.has === 'yes' && errors[questionId] && value.trim()) {
      setErrors(prev => ({ ...prev, [questionId]: false }));
    }
  };

  // Handler para campos de texto simples (Q11 e Q12 da MAG Habitacional completa)
  const handleTextChange = (questionId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [questionId]: value
    }));
    
    // Clear error if value is provided
    if (errors[questionId] && value.trim()) {
      setErrors(prev => ({ ...prev, [questionId]: false }));
    }
  };
  
  const validateForm = () => {
    const newErrors: Record<string, boolean> = {};
    let hasError = false;

    // Validação baseada no tipo de produto
    if (isMagHabitacional && magDpsType === 'simplified') {
      // Validação para MAG Habitacional simplificada
      Object.keys(diseaseNamesMagHabitacionalSimplified).forEach(key => {
        const val = formData[key];
        if (typeof val === 'string' || !val?.has || (val.has !== 'yes' && val.has !== 'no')) {
          newErrors[key] = true;
          hasError = true;
        } else if (val.has === 'yes' && (!val.description || !val.description.trim())) {
          newErrors[key] = true;
          hasError = true;
        }
      });
    } else if (isMagHabitacional && magDpsType === 'complete') {
      // Validação para MAG Habitacional completa
      Object.keys(diseaseNamesMagHabitacionalComplete).forEach(key => {
        if (['11', '12'].includes(key)) {
          // Questões 11-12 são campos de texto obrigatórios (string)
          const val = formData[key];
          if (typeof val !== 'string' || !val.trim()) {
            newErrors[key] = true;
            hasError = true;
          }
        } else {
          // Questões 1-10 são Sim/Não (objeto)
          const val = formData[key];
          if (typeof val === 'string' || !val?.has) {
            newErrors[key] = true;
            hasError = true;
          } else if (val.has === 'yes' && (!val.description || !val.description.trim())) {
            newErrors[key] = true;
            hasError = true;
          }
        }
      });
    } else {
      // Validação para outros produtos
      const productTypeDiseaseNames = (initialProposalData.product.name === 'HDI Home Equity' || initialProposalData.product.name === 'FHE Poupex');

      Object.keys(productTypeDiseaseNames ? diseaseNamesHomeEquity : diseaseNamesHabitacional).forEach(key => {
        if (key === 'telefoneContato') return; // Skip telefoneContato

        const val = formData[key];
        if (typeof val === 'string' || !val?.has) {
          newErrors[key] = true;
          hasError = true;
        } else if (val.has === 'yes' && (!val.description || !val.description.trim())) {
          newErrors[key] = true;
          hasError = true;
        }
      });
    }

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
      // Format data for API baseado no tipo de produto
      let postData;

      if (isMagHabitacional && magDpsType === 'simplified') {
        // Para MAG Habitacional simplificada
        postData = Object.entries(formData).map(([key, value]) => {
          const val = typeof value === 'string' ? { has: '', description: value } : value;
          return {
            code: key,
            question: diseaseNamesMagHabitacionalSimplified[key as keyof typeof diseaseNamesMagHabitacionalSimplified] || '',
            exists: val.has === 'yes' || !!(val.description && val.description.trim() !== ''),
            created: new Date().toISOString(),
            description: val.description || ''
          };
        });
      } else if (isMagHabitacional && magDpsType === 'complete') {
        // Para MAG Habitacional completa
        postData = Object.entries(formData).map(([key, value]) => {
          const question = diseaseNamesMagHabitacionalComplete[key as keyof typeof diseaseNamesMagHabitacionalComplete] || '';

          if (['11', '12'].includes(key)) {
            // Questões 11-12 são campos de texto obrigatórios (Altura e Peso) - NÃO positivam a DPS
            const textValue = typeof value === 'string' ? value : '';
            return {
              code: key,
              question: question,
              exists: false, // Sempre false para não positivar
              created: new Date().toISOString(),
              description: textValue
            };
          } else {
            // Questões 1-10 são Sim/Não (objeto)
            const val = typeof value === 'string' ? { has: '', description: '' } : value;
            return {
              code: key,
              question: question,
              exists: val.has === 'yes',
              created: new Date().toISOString(),
              description: val.description || ''
            };
          }
        });
      } else {
        // Para outros produtos
        const productTypeDiseaseNames = (initialProposalData.product.name === 'HDI Home Equity' || initialProposalData.product.name === 'FHE Poupex');
        postData = Object.entries(formData)
          .filter(([key]) => key !== 'telefoneContato')
          .map(([key, value]) => {
            const val = typeof value === 'string' ? { has: '', description: value } : value;
            return {
              code: key,
              question: productTypeDiseaseNames ? diseaseNamesHomeEquity[key as keyof typeof diseaseNamesHomeEquity] : diseaseNamesHabitacional[key as keyof typeof diseaseNamesHabitacional],
              exists: val.has === 'yes',
              created: new Date().toISOString(),
              description: val.description
            };
          });
      }

      // Post health data
      const healthResponse = await postHealthDataByUid(initialProposalData.uid, postData);

      if (healthResponse?.success) {

        // Verificar se é MAG Habitacional e DPS não está positivada para aprovação automática
        if (isMagHabitacional) {
          const hasPositiveAnswers = magDpsType === 'simplified'
            ? (typeof formData['1'] !== 'string' && formData['1']?.has === 'yes')
            : postData.some(item => item.exists === true);

          if (!hasPositiveAnswers) {
            // DPS não positivada - tentar aprovação automática
            try {
              const autoApprovalResponse = await postMagHabitacionalAutoApproval(initialProposalData.uid);

              if (autoApprovalResponse?.success) {
                console.log('DPS aprovada automaticamente para MAG Habitacional');
                setIsSubmitted(true);
                setTimeout(() => {
                  router.push(successRedirect);
                }, 2000);
                return; // Não prosseguir com assinatura normal
              } else {
                console.warn('Não foi possível aprovar automaticamente:', autoApprovalResponse?.message);
              }
            } catch (autoApprovalError) {
              console.error('Erro ao tentar aprovação automática:', autoApprovalError);
            }
          }
        }

        // Sign the proposal (para casos normais ou quando aprovação automática falhar)
        const signResponse = await signProposal(initialProposalData.uid);
        
        if (signResponse?.success) {
          console.log('Proposal signed successfully');
          setIsSubmitted(true);
          setTimeout(() => {
            router.push(successRedirect);
          }, 2000);
        } else {
          console.error('Failed to sign proposal:', signResponse);
          setSubmitError(signResponse?.message || 'Erro ao assinar a proposta. Por favor, tente novamente.');
        }
      } else {
        console.error('Failed to post health data:', healthResponse);
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

  // Renderizar formulário baseado no tipo de produto
  const renderFormFields = () => {
    // MAG Habitacional simplificada
    if (isMagHabitacional && magDpsType === 'simplified') {
      return (
        <MagSimplifiedField
          value={typeof formData['1'] === 'string' ? { has: '', description: formData['1'] } : (formData['1'] || { has: '', description: '' })}
          onChange={(value) => handleRadioChange('1', value)}
          onDescriptionChange={(value) => handleDescriptionChange('1', value)}
          error={errors['1'] || false}
          isSubmitting={isSubmitting}
        />
      );
    }

    // MAG Habitacional completa - usar questões específicas
    if (isMagHabitacional && magDpsType === 'complete') {
      return Object.entries(diseaseNamesMagHabitacionalComplete)
        .map(([key, question]) => {
          // Questões 11-12 são campos de texto obrigatórios (altura e peso)
          if (['11', '12'].includes(key)) {
            return (
              <MagTextField
                key={key}
                name={key}
                label={question}
                value={typeof formData[key] === 'string' ? formData[key] : ''}
                onChange={(value) => handleTextChange(key, value)}
                error={errors[key] || false}
                isSubmitting={isSubmitting}
                required={true}
              />
            );
          }

          // Questões 1-10 são Sim/Não
          return (
            <DiseaseField
              key={key}
              name={key}
              label={question}
              value={typeof formData[key] === 'string' ? { has: '', description: formData[key] } : (formData[key] || { has: '', description: '' })}
              onChange={(value) => handleRadioChange(key, value)}
              onDescriptionChange={(value) => handleDescriptionChange(key, value)}
              error={errors[key] || false}
              isSubmitting={isSubmitting}
            />
          );
        });
    }

    // Outros produtos (Home Equity, FHE Poupex, Habitacional tradicional)
    const productTypeDiseaseNames = (initialProposalData.product.name === 'HDI Home Equity' || initialProposalData.product.name === 'FHE Poupex');

    return Object.entries(productTypeDiseaseNames ? diseaseNamesHomeEquity : diseaseNamesHabitacional)
      .filter(([key]) => key !== 'telefoneContato')
      .map(([key, question]) => (
        <DiseaseField
          key={key}
          name={key}
          label={question}
          value={typeof formData[key] === 'string' ? { has: '', description: formData[key] } : (formData[key] || { has: '', description: '' })}
          onChange={(value) => handleRadioChange(key, value)}
          onDescriptionChange={(value) => handleDescriptionChange(key, value)}
          error={errors[key] || false}
          isSubmitting={isSubmitting}
        />
      ));
  };

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
            {renderFormFields()}
          </div>
          
          <div className="flex justify-start items-center gap-5 mt-6">
            <Button
              type="submit"
              className="w-40"
              disabled={isSubmitting}
              onClick={() => console.log('Button clicked!')}
            >
              Salvar
              {isSubmitting && (
                <Loader2Icon className="w-4 h-4 ml-2 animate-spin" />
              )}
            </Button>
            {Object.keys(errors).length > 0 && (
              <div className="text-red-500">
                Preencha todos os campos obrigatórios
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
