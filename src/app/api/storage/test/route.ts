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

async function runTest(containerName: string, blobName: string) {
  const cs =
    process.env.AZURE_STORAGE_CONNECTION_STRING ||
    process.env.NEXT_PUBLIC_AZURE_STORAGE_CONNECTION_STRING
  if (!cs) throw new Error('AZURE_STORAGE_CONNECTION_STRING não configurado')

  const { AccountName, AccountKey, EndpointSuffix } = parseConnectionString(cs)
  const credential = new StorageSharedKeyCredential(AccountName, AccountKey)

  // Garante container
  try {
    const service = BlobServiceClient.fromConnectionString(cs)
    const containerClient = service.getContainerClient(containerName)
    await containerClient.createIfNotExists()
  } catch {}

  const startsOn = new Date(Date.now() - 5 * 60 * 1000)
  const expiresOn = new Date(Date.now() + 15 * 60 * 1000)

  const sasValues: BlobSASSignatureValues = {
    protocol: SASProtocol.Https,
    startsOn,
    expiresOn,
    containerName,
    blobName,
    permissions: BlobSASPermissions.parse('racw'),
  }

  const sasToken = generateBlobSASQueryParameters(sasValues, credential).toString()
  const endpointSuffix = EndpointSuffix || 'core.windows.net'
  const baseUrl = `https://${AccountName}.blob.${endpointSuffix}`
  const blobUrl = `${baseUrl}/${containerName}/${blobName}`
  const uploadUrl = `${blobUrl}?${sasToken}`

  // PUT do servidor
  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'x-ms-blob-type': 'BlockBlob',
      'x-ms-blob-content-type': 'text/plain',
      'If-None-Match': '*',
    },
    body: Buffer.from('hello from server'),
  })
  const putText = putRes.ok ? '' : await putRes.text().catch(() => '')
  const getRes = await fetch(blobUrl, { method: 'GET' })
  const getText = await getRes.text().catch(() => '')

  return {
    upload: {
      status: putRes.status,
      errorCode: putRes.headers.get('x-ms-error-code') || undefined,
      requestId: putRes.headers.get('x-ms-request-id') || undefined,
      text: putText?.slice(0, 500),
    },
    get: {
      status: getRes.status,
      text: getText?.slice(0, 200),
    },
    blobUrl,
  }
}

export async function GET() {
  try {
    const result = await runTest(
      'smart-dps',
      `Development/dps/test/hello-from-server.txt`
    )
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Erro no teste' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const container = body?.container || 'smart-dps'
    const blobName =
      body?.blobName || `Development/dps/test/hello-from-server-${Date.now()}.txt`
    const result = await runTest(container, blobName)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Erro no teste' },
      { status: 500 }
    )
  }
}



