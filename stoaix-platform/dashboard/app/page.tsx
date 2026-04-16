import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-lg">
        <h1 className="text-3xl font-bold text-slate-800 mb-3">stoaix</h1>
        <p className="text-slate-500 mb-6">
          AI-powered assistant platform for businesses. Manage conversations, appointments,
          and leads — all in one place.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/login" className="bg-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors">
            Sign in
          </Link>
          <Link href="/privacy" className="text-sm text-slate-400 hover:text-slate-600 underline">
            Privacy Policy
          </Link>
          <Link href="/terms" className="text-sm text-slate-400 hover:text-slate-600 underline">
            Terms of Service
          </Link>
        </div>
      </div>
    </div>
  )
}
