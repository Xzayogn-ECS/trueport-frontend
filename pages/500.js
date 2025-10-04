import Head from 'next/head';
import Link from 'next/link';

export default function Custom500() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Head>
        <title>Server Error - TruePortMe</title>
      </Head>

      <div className="text-center px-4">
        <div className="max-w-md mx-auto">
          <div className="mb-8">
            <svg
              className="mx-auto h-24 w-24 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">500</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Server Error</h2>
          <p className="text-gray-600 mb-8">
            Something went wrong on our end. We're working to fix the issue. Please try again later.
          </p>
          
          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <button 
              onClick={() => window.location.reload()} 
              className="btn-primary inline-block"
            >
              Try Again
            </button>
            <Link href="/" className="btn-secondary inline-block">
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}