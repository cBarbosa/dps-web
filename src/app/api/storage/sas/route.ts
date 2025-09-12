import { NextRequest, NextResponse } from 'next/server'
import {
  BlobSASPermissions,
  BlobSASSignatureValues,
  SASProtocol,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobServiceClient,
} from '@azure/storage-blob'

export const runtime = 'nodejs'

function parseConnectionString(connectionString: string): {
  AccountName: string
  AccountKey: string
  EndpointSuffix?: string
} {
  const parts = connectionString.split(';')
  const map: Record<string, string> = {}
  for (const part of parts) {
    const [k, ...rest] = part.split('=')
    if (!k || rest.length === 0) continue
    map[k] = rest.join('=')
  }
  const AccountName = map['AccountName']
  const AccountKey = map['AccountKey']
  const EndpointSuffix = map['EndpointSuffix']
  if (!AccountName || !AccountKey) {
    throw new Error('Invalid Azure Storage connection string')
  }
  return { AccountName, AccountKey, EndpointSuffix }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const containerName: string = body?.container || 'smart-dps'
    const blobName: string = body?.blobName
    if (!blobName || typeof blobName !== 'string') {
      return NextResponse.json(
        { error: 'blobName é obrigatório' },
        { status: 400 }
      )
    }

    const cs =
      process.env.AZURE_STORAGE_CONNECTION_STRING ||
      process.env.NEXT_PUBLIC_AZURE_STORAGE_CONNECTION_STRING
    if (!cs) {
      return NextResponse.json(
        {
          error:
            'AZURE_STORAGE_CONNECTION_STRING não configurado no ambiente do servidor',
        },
        { status: 500 }
      )
    }

    const { AccountName, AccountKey, EndpointSuffix } = parseConnectionString(cs)
    const credential = new StorageSharedKeyCredential(AccountName, AccountKey)

    const startsOn = new Date(Date.now() - 5 * 60 * 1000)
    const expiresOn = new Date(Date.now() + 15 * 60 * 1000)

    // Garante que o container exista
    try {
      const service = BlobServiceClient.fromConnectionString(cs)
      const containerClient = service.getContainerClient(containerName)
      await containerClient.createIfNotExists()
    } catch (e) {
      // prossegue mesmo se já existir / sem permissão de criar
    }

    const sasValues: BlobSASSignatureValues = {
      protocol: SASProtocol.Https,
      startsOn,
      expiresOn,
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse('racw'), // read + add + create + write (debug)
    }

    const sasToken = generateBlobSASQueryParameters(sasValues, credential).toString()

    console.log(sasValues)
    console.log(sasToken)

    const endpointSuffix = EndpointSuffix || 'core.windows.net'
    const baseUrl = `https://${AccountName}.blob.${endpointSuffix}`
    const blobUrl = `${baseUrl}/${containerName}/${blobName}`
    const uploadUrl = `${blobUrl}?${sasToken}`

    return NextResponse.json({ uploadUrl, blobUrl })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Erro ao gerar SAS' },
      { status: 500 }
    )
  }
}


