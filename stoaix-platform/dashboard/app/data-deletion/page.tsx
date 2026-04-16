export default function DataDeletionPage({
  searchParams,
}: {
  searchParams: { code?: string }
}) {
  const code = searchParams.code

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <h1 className="text-xl font-semibold text-gray-900 mb-3">
          Veri Silme Talebi
        </h1>

        {code ? (
          <>
            <p className="text-gray-600 text-sm mb-4">
              Talebiniz alındı. Facebook ile bağlantılı verileriniz sistemimizden silinmiştir.
            </p>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Onay Kodu</p>
              <p className="font-mono text-sm text-gray-800 break-all">{code}</p>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Sorularınız için{' '}
              <a href="mailto:emirturkoz15@gmail.com" className="underline">
                emirturkoz15@gmail.com
              </a>{' '}
              adresine ulaşabilirsiniz.
            </p>
          </>
        ) : (
          <p className="text-gray-600 text-sm">
            Veri silme talebi oluşturmak için Facebook&apos;un uygulama ayarları üzerinden
            işlem başlatmanız gerekmektedir.
          </p>
        )}
      </div>
    </main>
  )
}
