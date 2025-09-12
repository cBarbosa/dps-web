import getServerSessionAuthorization from '@/hooks/getServerSessionAuthorization';
import { redirect } from 'next/navigation';
import React from 'react';
import { getReopenedProposals } from '../actions';
import DpsDataTable, { DPS } from '../../components/dps-data-table';
import { Input } from '@/components/ui/input';
import {
    ListFilterIcon,
    SearchIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function Page({
    searchParams,
}: {
    searchParams: { page: string }
}) {

    const { session, granted } = await getServerSessionAuthorization([
            'vendedor-sup',
    ]);
    const token = (session as any)?.accessToken;

    console.log('Saler-sup page - Verificação de permissão:', {
        granted,
        role: (session as any)?.role,
        hasToken: !!token
    });

    if (!granted) {
        console.log('Saler-sup page - Redirecionando para dashboard - permissão negada');
        redirect('/dashboard');
    }

    const currentPage = searchParams?.page ? +searchParams.page : 1;

    const dataRaw = await getReopenedProposals(
            token,
            undefined,
            currentPage
    );

    console.log('Saler-sup page - Dados recebidos:', {
        hasData: !!dataRaw,
        itemsCount: dataRaw?.items?.length || 0
    });

    // Se não há dados, criar array vazio em vez de redirecionar
    const data: DPS[] = dataRaw?.items?.map((item: any) => {
            return {
                uid: item.uid,
                codigo: item.contractNumber ?? `-`,
                cpf: item.customer.document,
                dataCadastro: item?.created && new Date(item.created),
                tipoDoc: item.type?.description,
                status: item.status,
                dfiStatus: item.dfiStatus,
                riskStatus: item.riskStatus
            }
        }) || [];

    async function filterResults(formData: FormData) {
        'use server'
        const cpfRaw = formData.get('cpf');
        const cpf = cpfRaw?.toString().replace(/[^\d]/g, '');
        console.log('filtering', cpf);

        redirect(`/dps/saler-sup?cpf=${cpf}`);
    }

    return(
        <div className="p-5">
			<div className="p-5 w-full max-w-7xl mx-auto bg-white rounded-3xl">
				<div className="flex justify-start items-center gap-6 mt-2 mb-7">
					<h2 className="text-xl text-primary">Painel de Reanálise</h2>
					<span className="text-muted-foreground text-sm">
						Aqui listamos as DPS&apos;s que aguardam reanálise.
					</span>
				</div>
				<form action={filterResults} className="mb-3 flex gap-5 items-center">
					<Input
						name="cpf"
						placeholder="Pesquisar CPF"
						className="w-72 p-5 rounded-full bg-gray-150 border-none"
						icon={<SearchIcon size={20} className="text-gray-500" />}
						iconOffset={2}
						mask="999.999.999-99"
					/>
					<Button
						type="submit"
						variant="round"
						className="w-10 h-10 p-0 text-muted-foreground bg-gray-150 hover:bg-gray-200"
					>
						<ListFilterIcon size={20} />
					</Button>
				</form>
				<DpsDataTable data={data} currentPage={1} pageAmount={1} />
			</div>
		</div>
    );
}
