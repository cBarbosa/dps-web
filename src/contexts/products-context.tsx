'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { getProductList, Product } from '@/app/(logged-area)/dps/actions';

type ProductsContextType = {
  products: Product[];
  loading: boolean;
  error: string | null;
  refreshProducts: () => Promise<void>;
};

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProducts = useCallback(async () => {
    const token = (session as any)?.accessToken;
    if (!token) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await getProductList(token);
      if (response?.success && response.data) {
        setProducts(response.data);
      } else {
        setError('Erro ao carregar produtos');
        setProducts([]);
      }
    } catch (err) {
      setError('Erro ao carregar produtos');
      setProducts([]);
      console.error('Erro ao carregar produtos:', err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  return (
    <ProductsContext.Provider value={{ products, loading, error, refreshProducts }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error('useProducts must be used within ProductsProvider');
  }
  return context;
}

