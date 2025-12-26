import { Product, ProductConfiguration } from '@/types/product';
import { getProductConfiguration } from './product-config';
import { calculateFinalAge, validateFinalAgeLimit as validateFinalAgeLimitFallback, getFinalAgeErrorMessage as getFinalAgeErrorMessageFallback, validateCapitalLimit as validateCapitalLimitFallback, getCapitalErrorMessage as getCapitalErrorMessageFallback, getMaxCapitalByProduct } from '@/constants';

/**
 * Obtém a idade máxima de um produto a partir da configuração
 * @param products Array de produtos
 * @param productUidOrName UID do produto ou nome do produto
 * @returns Idade máxima ou null se não encontrado
 */
export function getMaxAgeByProductConfig(
  products: Product[],
  productUidOrName: string
): number | null {
  const config = getProductConfiguration(products, productUidOrName);
  return config?.ageConfig.maxAge || null;
}

/**
 * Obtém a idade mínima de um produto a partir da configuração
 * @param products Array de produtos
 * @param productUidOrName UID do produto ou nome do produto
 * @returns Idade mínima ou null se não encontrado
 */
export function getMinAgeByProductConfig(
  products: Product[],
  productUidOrName: string
): number | null {
  const config = getProductConfiguration(products, productUidOrName);
  return config?.ageConfig.minAge || null;
}

/**
 * Obtém o limite máximo de capital de um produto a partir da configuração
 * @param products Array de produtos
 * @param productUidOrName UID do produto ou nome do produto
 * @param age Idade do segurado (opcional, necessário para limites variáveis)
 * @param type Tipo de capital ('MIP' ou 'DFI') - necessário para MAG_HABITACIONAL
 * @returns Limite máximo de capital ou null se não encontrado
 */
export function getMaxCapitalByProductConfig(
  products: Product[],
  productUidOrName: string,
  age?: number,
  type?: 'MIP' | 'DFI'
): number | null {
  const config = getProductConfiguration(products, productUidOrName);
  if (!config) return null;
  
  const capitalConfig = config.capitalConfig;
  
  // Para MAG_HABITACIONAL, usar limites específicos por tipo
  if (config.type === 'MAG_HABITACIONAL') {
    if (type === 'DFI' && capitalConfig.dfiLimit !== null && capitalConfig.dfiLimit !== undefined) {
      return capitalConfig.dfiLimit;
    }
    if (type === 'MIP' && capitalConfig.mipLimit !== null && capitalConfig.mipLimit !== undefined) {
      return capitalConfig.mipLimit;
    }
    // Fallback para constantes se não tiver na config
    return getMaxCapitalByProduct(productUidOrName, age, type);
  }
  
  // Se tem limite fixo, retorna ele
  if (capitalConfig.fixedLimit !== null && capitalConfig.fixedLimit !== undefined) {
    return capitalConfig.fixedLimit;
  }
  
  // Se tem limite variável
  if (capitalConfig.variableLimit && age !== undefined && age !== null) {
    const { under60, over60, ageThreshold } = capitalConfig.variableLimit;
    if (age >= ageThreshold) {
      return over60;
    } else {
      return under60;
    }
  }
  
  // Se tem teto absoluto, retorna ele
  if (capitalConfig.absoluteMax !== null && capitalConfig.absoluteMax !== undefined) {
    return capitalConfig.absoluteMax;
  }
  
  return null;
}

/**
 * Valida o limite de idade final (idade + prazo) baseado na configuração
 * @param products Array de produtos
 * @param productUidOrName UID do produto ou nome do produto
 * @param birthDate Data de nascimento
 * @param deadlineMonths Prazo do contrato em meses
 * @returns true se válido, false se inválido
 */
export function validateFinalAgeLimitConfig(
  products: Product[],
  productUidOrName: string,
  birthDate: Date,
  deadlineMonths: number
): boolean {
  const config = getProductConfiguration(products, productUidOrName);
  if (!config) return true; // Se não tiver config, permite
  
  const limit = config.ageConfig.finalAgeLimit;
  if (!limit) return true;
  
  // Calcular idade final usando função existente
  const finalAge = calculateFinalAge(birthDate, deadlineMonths);
  
  // Comparar com limite
  if (finalAge.years < limit.years) return true;
  if (finalAge.years > limit.years) return false;
  if (finalAge.months < limit.months) return true;
  if (finalAge.months > limit.months) return false;
  return finalAge.days <= limit.days;
}

/**
 * Valida o limite de capital baseado na configuração
 * @param products Array de produtos
 * @param productUidOrName UID do produto ou nome do produto
 * @param capitalValue Valor do capital a validar
 * @param age Idade do segurado (opcional, necessário para limites variáveis)
 * @param type Tipo de capital ('MIP' ou 'DFI') - necessário para MAG_HABITACIONAL
 * @returns Objeto com resultado da validação
 */
export function validateCapitalLimitConfig(
  products: Product[],
  productUidOrName: string,
  capitalValue: number,
  age?: number,
  type?: 'MIP' | 'DFI'
): { valid: boolean; maxAllowed: number | null; message?: string } {
  const maxAllowed = getMaxCapitalByProductConfig(products, productUidOrName, age, type);
  
  if (maxAllowed === null) {
    return { valid: true, maxAllowed: null }; // Se não tiver limite configurado, permite
  }
  
  const valid = capitalValue <= maxAllowed;
  
  if (!valid) {
    const message = getCapitalErrorMessageConfig(products, productUidOrName, age, type);
    return { valid: false, maxAllowed, message };
  }
  
  return { valid: true, maxAllowed };
}

/**
 * Gera mensagem de erro de capital baseada na configuração
 * @param products Array de produtos
 * @param productUidOrName UID do produto ou nome do produto
 * @param age Idade do segurado (opcional)
 * @param type Tipo de capital ('MIP' ou 'DFI') - necessário para MAG_HABITACIONAL
 * @returns Mensagem de erro formatada
 */
export function getCapitalErrorMessageConfig(
  products: Product[],
  productUidOrName: string,
  age?: number,
  type?: 'MIP' | 'DFI'
): string {
  const config = getProductConfiguration(products, productUidOrName);
  if (!config) {
    // Fallback para constantes
    return getCapitalErrorMessageFallback(productUidOrName, age, type);
  }
  
  const maxAllowed = getMaxCapitalByProductConfig(products, productUidOrName, age, type);
  if (maxAllowed === null) return 'Capital máximo não configurado.';
  
  const productType = config.type;
  
  if (productType === 'MAG_HABITACIONAL') {
    const maxInMillions = maxAllowed / 1_000_000;
    return `Capital máximo ${type === 'DFI' ? 'DFI' : 'MIP'} R$ ${maxInMillions.toFixed(0)}.000.000,00`;
  }
  
  if (productType === 'FHE_POUPEX') {
    if (age !== undefined && age !== null && age >= 60) {
      return `Capital máximo R$ ${(maxAllowed / 1_000_000).toFixed(1)} milhões para segurados com 60 anos ou mais.`;
    } else {
      return `Capital máximo R$ ${(maxAllowed / 1_000_000).toFixed(1)} milhões para segurados entre 16 e 59 anos.`;
    }
  }
  
  // Para outros produtos - formatar como R$ X.000.000,00
  const maxInMillions = maxAllowed / 1_000_000;
  if (maxInMillions >= 1) {
    return `Capital máximo R$ ${maxInMillions.toFixed(0)}.000.000,00`;
  }
  return `Capital máximo R$ ${maxAllowed.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Gera mensagem de erro de idade baseada na configuração
 * @param products Array de produtos
 * @param productUidOrName UID do produto ou nome do produto
 * @returns Mensagem de erro formatada
 */
export function getAgeErrorMessageConfig(
  products: Product[],
  productUidOrName: string
): string {
  const minAge = getMinAgeByProductConfig(products, productUidOrName);
  const maxAge = getMaxAgeByProductConfig(products, productUidOrName);
  
  if (minAge === null || maxAge === null) {
    return 'Idade não configurada para este produto.';
  }
  
  return `Idade deve estar entre ${minAge} e ${maxAge} anos.`;
}

/**
 * Gera mensagem de erro de idade final baseada na configuração
 * @param products Array de produtos
 * @param productUidOrName UID do produto ou nome do produto
 * @param participantType Tipo de participante (ex: 'proponente', 'coparticipante')
 * @returns Mensagem de erro formatada
 */
export function getFinalAgeErrorMessageConfig(
  products: Product[],
  productUidOrName: string,
  participantType: string = 'proponente'
): string {
  const config = getProductConfiguration(products, productUidOrName);
  if (!config) {
    const maxAge = getMaxAgeByProductConfig(products, productUidOrName);
    if (maxAge === null) {
      return `A idade final do ${participantType} não pode exceder o limite configurado até o fim do contrato.`;
    }
    return `A idade final do ${participantType} não pode exceder ${maxAge} anos até o fim do contrato.`;
  }
  
  const limit = config.ageConfig.finalAgeLimit;
  const productType = config.type;
  
  // Mensagem específica baseada no limite
  if (productType === 'FHE_POUPEX') {
    return `A idade final do ${participantType} não pode exceder 80 anos e 6 meses até o fim do contrato.`;
  } else if (productType === 'HOME_EQUITY') {
    return `A idade final do ${participantType} não pode exceder 75 anos até o fim do contrato.`;
  } else {
    return `A idade final do ${participantType} não pode exceder 80 anos até o fim do contrato.`;
  }
}

/**
 * Gera mensagem de erro de idade final com anos calculados
 * @param products Array de produtos
 * @param productUidOrName UID do produto ou nome do produto
 * @param participantType Tipo de participante
 * @param finalAge Idade final calculada em anos
 * @returns Mensagem de erro formatada
 */
export function getFinalAgeWithYearsErrorMessageConfig(
  products: Product[],
  productUidOrName: string,
  participantType: string,
  finalAge: number
): string {
  const config = getProductConfiguration(products, productUidOrName);
  if (!config) {
    const maxAge = getMaxAgeByProductConfig(products, productUidOrName);
    if (maxAge === null) {
      return `A idade final do ${participantType} (${Math.round(finalAge)} anos) não pode exceder o limite configurado ao fim da operação.`;
    }
    return `A idade final do ${participantType} (${Math.round(finalAge)} anos) não pode exceder ${maxAge} anos ao fim da operação.`;
  }
  
  const productType = config.type;
  
  // Mensagem específica baseada no limite
  if (productType === 'FHE_POUPEX') {
    return `A idade final do ${participantType} (${Math.round(finalAge)} anos) não pode exceder 80 anos e 6 meses ao fim da operação.`;
  } else if (productType === 'HOME_EQUITY') {
    return `A idade final do ${participantType} (${Math.round(finalAge)} anos) não pode exceder 75 anos ao fim da operação.`;
  } else {
    return `A idade final do ${participantType} (${Math.round(finalAge)} anos) não pode exceder 80 anos ao fim da operação.`;
  }
}

// ============================================================================
// FUNÇÕES HÍBRIDAS COM FALLBACK PARA CONSTANTES
// ============================================================================
// Estas funções tentam usar a configuração do backend primeiro,
// e se não encontrar, usam as constantes hardcoded como fallback

/**
 * Valida limite de idade final com fallback para constantes
 * @param products Array de produtos (pode ser vazio para usar fallback)
 * @param productUidOrName UID do produto ou nome do produto
 * @param birthDate Data de nascimento
 * @param deadlineMonths Prazo do contrato em meses
 * @returns true se válido, false se inválido
 */
export function validateFinalAgeLimitHybrid(
  products: Product[],
  productUidOrName: string,
  birthDate: Date,
  deadlineMonths: number
): boolean {
  // Tenta usar configuração do backend
  if (products.length > 0) {
    const config = getProductConfiguration(products, productUidOrName);
    if (config) {
      return validateFinalAgeLimitConfig(products, productUidOrName, birthDate, deadlineMonths);
    }
  }
  
  // Fallback para constantes
  return validateFinalAgeLimitFallback(productUidOrName, birthDate, deadlineMonths);
}

/**
 * Valida limite de capital com fallback para constantes
 * @param products Array de produtos (pode ser vazio para usar fallback)
 * @param productUidOrName UID do produto ou nome do produto
 * @param capitalValue Valor do capital a validar
 * @param age Idade do segurado (opcional)
 * @param type Tipo de capital ('MIP' ou 'DFI') - necessário para MAG_HABITACIONAL
 * @returns Objeto com resultado da validação
 */
export function validateCapitalLimitHybrid(
  products: Product[],
  productUidOrName: string,
  capitalValue: number,
  age?: number,
  type?: 'MIP' | 'DFI'
): { valid: boolean; maxAllowed: number; message?: string } {
  // Tenta usar configuração do backend
  if (products.length > 0) {
    const config = getProductConfiguration(products, productUidOrName);
    if (config) {
      const result = validateCapitalLimitConfig(products, productUidOrName, capitalValue, age, type);
      // Se maxAllowed for null, usar fallback
      if (result.maxAllowed === null) {
        return validateCapitalLimitFallback(productUidOrName, capitalValue, age, type);
      }
      // Garantir que maxAllowed seja number
      return {
        valid: result.valid,
        maxAllowed: result.maxAllowed,
        message: result.message
      };
    }
  }
  
  // Fallback para constantes
  return validateCapitalLimitFallback(productUidOrName, capitalValue, age, type);
}

/**
 * Gera mensagem de erro de idade final com fallback para constantes
 * @param products Array de produtos (pode ser vazio para usar fallback)
 * @param productUidOrName UID do produto ou nome do produto
 * @param participantType Tipo de participante
 * @returns Mensagem de erro formatada
 */
export function getFinalAgeErrorMessageHybrid(
  products: Product[],
  productUidOrName: string,
  participantType: string = 'proponente'
): string {
  // Tenta usar configuração do backend
  if (products.length > 0) {
    const config = getProductConfiguration(products, productUidOrName);
    if (config) {
      return getFinalAgeErrorMessageConfig(products, productUidOrName, participantType);
    }
  }
  
  // Fallback para constantes
  return getFinalAgeErrorMessageFallback(productUidOrName, participantType);
}

/**
 * Gera mensagem de erro de capital com fallback para constantes
 * @param products Array de produtos (pode ser vazio para usar fallback)
 * @param productUidOrName UID do produto ou nome do produto
 * @param age Idade do segurado (opcional)
 * @param type Tipo de capital ('MIP' ou 'DFI') - necessário para MAG_HABITACIONAL
 * @returns Mensagem de erro formatada
 */
export function getCapitalErrorMessageHybrid(
  products: Product[],
  productUidOrName: string,
  age?: number,
  type?: 'MIP' | 'DFI'
): string {
  // Tenta usar configuração do backend
  if (products.length > 0) {
    const config = getProductConfiguration(products, productUidOrName);
    if (config) {
      return getCapitalErrorMessageConfig(products, productUidOrName, age, type);
    }
  }
  
  // Fallback para constantes
  return getCapitalErrorMessageFallback(productUidOrName, age, type);
}

