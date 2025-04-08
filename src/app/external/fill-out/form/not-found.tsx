export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="p-8 bg-white shadow-lg rounded-lg max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Recurso não encontrado</h1>
        <p className="text-gray-600 mb-6">
          O recurso que você está tentando acessar pode não existir ou não está mais disponível.
        </p>
      </div>
    </div>
  )
} 