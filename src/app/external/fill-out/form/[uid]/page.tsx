import { notFound } from 'next/navigation'
import { getProposalDpsByUid } from '@/app/external/actions'
import { CpfVerification } from '../../components/cpf-verification'

export default async function ExternalDpsPage({
  params: { uid },
}: {
  params: { uid: string }
}) {
  if (!uid) {
    return notFound()
  }

  const proposalDataRaw = await getProposalDpsByUid(uid)

  console.log(proposalDataRaw)

  if (!proposalDataRaw || proposalDataRaw.success === false) {
    return notFound()
  }

  const proposalData = proposalDataRaw.data
  
  // Log detalhado do CPF para depuração
  console.log('CPF do cliente:', {
    cpf: proposalData.customer.document,
    primeirosCincoDigitos: proposalData.customer.document.substring(0, 5),
    cpfFormatado: proposalData.customer.document.replace(/\D/g, ''),
    primeirosCincoDigitosFormatados: proposalData.customer.document.replace(/\D/g, '').substring(0, 5)
  })

  return (
    <CpfVerification 
      documentToVerify={proposalData.customer.document} 
      uid={uid} 
    />
  )
} 