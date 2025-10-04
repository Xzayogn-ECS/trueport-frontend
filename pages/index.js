import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      <Head>
        <title>TruePortMe - Verified Digital Portfolio</title>
        <meta name="description" content="Create and verify your professional experiences with TruePortMe" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 lg:pt-16 pb-12 sm:pb-16 lg:pb-20">
        {/* HERO */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-center">
          <div className="text-center lg:text-left space-y-6">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
              Build a <span className="text-primary-600">Verified</span> Portfolio employers trust
            </h1>
            <p className="mt-4 text-base sm:text-lg text-gray-600 max-w-xl mx-auto lg:mx-0">
              Add experiences, attach proof, get them verified by mentors and employers — then share a single professional link.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              <Link href="/auth/register" className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-primary-600 text-white font-medium hover:bg-primary-700 text-sm sm:text-base">
                Get Started
              </Link>
              <Link href="/auth/login" className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-white border border-gray-200 text-primary-600 font-medium hover:bg-gray-50 text-sm sm:text-base">
                Sign In
              </Link>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 justify-center lg:justify-start">
              <div className="flex items-center justify-center lg:justify-start gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                Verified credentials
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v4a4 4 0 004 4h10" /></svg>
                Rich media & docs
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 20l9-5-9-5-9 5 9 5z" /></svg>
                Public portfolio link
              </div>
            </div>
          </div>

          <div className="mt-8 lg:mt-0">
            <div className="relative bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="p-4 sm:p-6 lg:p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-400">Preview</div>
                    <div className="mt-2 font-medium text-gray-900 text-sm sm:text-base truncate">siddharth.dev/portfolio</div>
                  </div>
                  <div className="text-xs text-gray-400">Public</div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center text-xs sm:text-sm font-medium text-gray-700">S</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start sm:items-center justify-between gap-2 flex-col sm:flex-row">
                        <div className="font-medium text-gray-900 text-sm sm:text-base">Frontend Intern — Acme</div>
                        <div className="text-xs text-green-600 font-medium whitespace-nowrap">Verified</div>
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 mt-1">Built responsive UI, reduced load by 30%.</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center text-xs sm:text-sm font-medium text-gray-700">P</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start sm:items-center justify-between gap-2 flex-col sm:flex-row">
                        <div className="font-medium text-gray-900 text-sm sm:text-base">Open Source — Portfolio Kit</div>
                        <div className="text-xs text-yellow-600 font-medium whitespace-nowrap">Pending</div>
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 mt-1">Pulled 3 PRs, docs & CI setup.</div>
                    </div>
                  </div>

                  <div className="mt-4 text-center sm:text-right">
                    <Link href="/portfolio/demo" className="inline-flex items-center px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100">
                      View public portfolio →
                    </Link>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 sm:px-6 py-3 text-xs text-gray-500 text-center sm:text-left">Shareable link • Verified badges</div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="mt-12 sm:mt-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                title: 'Verified Experiences',
                desc: 'Get mentors & employers to vouch for real work.',
                icon: (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4" /></svg>
                )
              },
              {
                title: 'Upload Proof',
                desc: 'Attach docs, images, videos and certificates.',
                icon: (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7" /></svg>
                )
              },
              {
                title: 'Share & Get Hired',
                desc: 'Send one link — remove resume guesswork.',
                icon: (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A2 2 0 0122 9.618v4.764a2 2 0 01-2.447 1.894L15 14M10 14l-4.553 2.276A2 2 0 013 14.382V9.618a2 2 0 011.447-1.894L10 10" /></svg>
                )
              }
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 rounded-lg bg-primary-50 text-primary-600 flex-shrink-0">{f.icon}</div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm sm:text-base">{f.title}</h4>
                    <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-500">{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="mt-12 sm:mt-16 bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 text-center">How it works</h2>
          <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {[
              { n: '1', title: 'Add entry', desc: 'Describe what you did, attach proof.' },
              { n: '2', title: 'Request verification', desc: 'Send to a mentor or employer.' },
              { n: '3', title: 'Share link', desc: 'One verified portfolio — universal link.' }
            ].map((s) => (
              <div key={s.n} className="flex flex-col items-center text-center p-3 sm:p-4">
                <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary-600 text-white font-semibold text-base sm:text-lg">{s.n}</div>
                <h3 className="mt-3 sm:mt-4 font-medium text-gray-900 text-sm sm:text-base">{s.title}</h3>
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-8 sm:mt-12 text-center text-xs sm:text-sm text-gray-400">© {new Date().getFullYear()} TruePortMe</footer>
      </main>
    </div>
  );
}
