
export const formatCurrencyBRL = (value: number | null | undefined): string => {

    if (value == null) {
        return 'Sem dívidas';
    }

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
};
