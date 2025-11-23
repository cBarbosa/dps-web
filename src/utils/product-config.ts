import { Product, ProductConfiguration } from '@/types/product';

/**
 * Busca a configuração de um produto por UID ou nome
 * @param products Array de produtos
 * @param productUidOrName UID do produto ou nome do produto
 * @returns Configuração do produto ou null se não encontrado
 */
export function getProductConfiguration(
  products: Product[],
  productUidOrName: string
): ProductConfiguration | null {
  // Primeiro tenta buscar por UID
  let product = products.find(p => p.uid === productUidOrName);
  
  // Se não encontrar, busca por nome exato
  if (!product) {
    product = products.find(p => 
      p.name.toLowerCase() === productUidOrName.toLowerCase()
    );
  }
  
  // Se ainda não encontrar, busca por nomes alternativos na configuração
  if (!product) {
    product = products.find(p => 
      p.configuration?.names.some(name => 
        name.toLowerCase() === productUidOrName.toLowerCase()
      )
    );
  }
  
  return product?.configuration || null;
}

/**
 * Obtém o tipo do produto a partir da configuração
 * @param products Array de produtos
 * @param productUidOrName UID do produto ou nome do produto
 * @returns Tipo do produto ou null se não encontrado
 */
export function getProductTypeFromConfig(
  products: Product[],
  productUidOrName: string
): ProductConfiguration['type'] | null {
  const config = getProductConfiguration(products, productUidOrName);
  return config?.type || null;
}

/**
 * Obtém o produto completo por UID ou nome
 * @param products Array de produtos
 * @param productUidOrName UID do produto ou nome do produto
 * @returns Produto ou null se não encontrado
 */
export function getProductByUidOrName(
  products: Product[],
  productUidOrName: string
): Product | null {
  // Primeiro tenta buscar por UID
  let product = products.find(p => p.uid === productUidOrName);
  
  // Se não encontrar, busca por nome exato
  if (!product) {
    product = products.find(p => 
      p.name.toLowerCase() === productUidOrName.toLowerCase()
    );
  }
  
  // Se ainda não encontrar, busca por nomes alternativos na configuração
  if (!product) {
    product = products.find(p => 
      p.configuration?.names.some(name => 
        name.toLowerCase() === productUidOrName.toLowerCase()
      )
    );
  }
  
  return product || null;
}

/**
 * Verifica se um produto tem configuração
 * @param products Array de produtos
 * @param productUidOrName UID do produto ou nome do produto
 * @returns true se o produto tem configuração, false caso contrário
 */
export function hasProductConfiguration(
  products: Product[],
  productUidOrName: string
): boolean {
  return getProductConfiguration(products, productUidOrName) !== null;
}

