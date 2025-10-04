import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';

const demoData = {
  handle: 'siddharth.dev/portfolio',
  name: 'Siddharth',
  title: 'Frontend Engineer • React / Next.js',
  about: "Clean UI, fast code, measurable impact. This demo shows verified experiences, proof attachments, and shareable badges.",
  contact: { email: 'siddharth@example.com', linkedin: 'siddharth' },
  experiences: [
    { id: 'e1', role: 'Frontend Intern', org: 'Acme Corp', period: 'Jan 2024 — Jun 2024', bullets: ['Built responsive dashboard', 'Cut bundle size by 28%'], status: 'verified' },
    { id: 'e2', role: 'Open Source Contributor', org: 'Portfolio Kit', period: 'Apr 2023 — Present', bullets: ['3 PRs merged', 'Wrote docs & CI'], status: 'pending' },
  ],
  education: [
    { id: 'ed1', name: 'B.Sc. Computer Science', org: 'MRIIRS', period: '2021 — Present', status: 'verified' }
  ],
  projects: [
    { id: 'p1', name: 'EzyOlive', desc: 'Patient-doctor marketplace', repo: 'github.com/siddharth/ezyolive', demo: '#' },
    { id: 'p2', name: 'TruePortMe', desc: 'Verified portfolio platform', repo: 'github.com/siddharth/trueportme', demo: '#' },
  ],
  badges: [
    { id: 'b1', title: 'Verified Experience', issuer: 'Acme', date: '2024-06-10' }
  ]
};

export default function PortfolioDemo() {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`https://${demoData.handle}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error('copy failed', e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>{demoData.name} — Portfolio Demo</title>
        <meta name="description" content="Demo of a verified portfolio — TruePortMe" />
      </Head>

      <header className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <Link href="/">
              <span className="text-lg font-bold text-primary-600">TruePortMe</span>
            </Link>
            <div className="text-xs text-gray-500">Demo portfolio</div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={copyLink} className="px-3 py-2 rounded-md bg-primary-600 text-white text-sm">{copied ? 'Copied' : 'Copy link'}</button>
            <Link href="/auth/register" className="px-3 py-2 rounded-md border border-gray-200 text-sm">Create yours</Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="sm:flex sm:items-center sm:justify-between gap-6">
            <div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-2xl font-semibold text-gray-700">S</div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{demoData.name}</h1>
                  <div className="text-sm text-gray-500">{demoData.title}</div>
                </div>
              </div>

              <p className="mt-4 text-gray-600 max-w-xl">{demoData.about}</p>

              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <div className="px-3 py-1 bg-gray-100 rounded-full text-gray-700">{demoData.contact.email}</div>
                <a href={`https://linkedin.com/in/${demoData.contact.linkedin}`} className="px-3 py-1 bg-gray-100 rounded-full text-gray-700">LinkedIn</a>
                <div className="px-3 py-1 bg-green-50 text-green-700 rounded-full">Verified profile</div>
              </div>
            </div>

            <div className="mt-6 sm:mt-0 flex flex-col items-start sm:items-end gap-3">
              <div className="text-sm text-gray-500">Public link</div>
              <div className="font-mono text-sm text-gray-800">https://{demoData.handle}</div>
              <div className="flex items-center gap-2 mt-2">
                <button onClick={copyLink} className="px-3 py-2 rounded-md border border-gray-200 text-sm">Copy</button>
                <a href="#" className="px-3 py-2 rounded-md bg-primary-600 text-white text-sm">Share</a>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Experiences</h2>
                <Link href="/experiences" className="text-sm text-primary-600">Manage</Link>
              </div>

              <div className="space-y-3">
                {demoData.experiences.map((e) => (
                  <article key={e.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="font-medium text-gray-900">{e.role}</div>
                          <div className="text-sm text-gray-500">@ {e.org}</div>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">{e.period}</div>
                        <ul className="mt-2 text-sm text-gray-600 list-disc ml-5">
                          {e.bullets.map((b, i) => <li key={i}>{b}</li>)}
                        </ul>
                      </div>

                      <div className="text-sm text-right">
                        <div className={`${e.status === 'verified' ? 'text-green-600' : 'text-yellow-600'} font-medium`}>{e.status}</div>
                        <div className="mt-2">
                          <Link href={`/#proof-${e.id}`} className="text-xs text-primary-600">View proof</Link>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
                <Link href="/projects" className="text-sm text-primary-600">Manage</Link>
              </div>

              <div className="space-y-3">
                {demoData.projects.map((p) => (
                  <div key={p.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{p.name}</div>
                      <div className="text-sm text-gray-600">{p.desc}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={p.repo} className="text-sm text-primary-600">Repo</a>
                      <a href={p.demo} className="text-sm text-gray-500">Demo</a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <h3 className="text-sm font-medium text-gray-900">Education</h3>
              <div className="mt-3 space-y-2 text-sm text-gray-700">
                {demoData.education.map((ed) => (
                  <div key={ed.id} className="p-2 bg-gray-50 rounded-md border border-gray-100">
                    <div className="font-medium">{ed.name}</div>
                    <div className="text-xs text-gray-500">{ed.org} • {ed.period}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <h3 className="text-sm font-medium text-gray-900">Badges</h3>
              <div className="mt-3 space-y-2">
                {demoData.badges.map((b) => (
                  <div key={b.id} className="p-2 bg-green-50 rounded-md border border-green-100 text-sm text-green-700">
                    <div className="font-medium">{b.title}</div>
                    <div className="text-xs text-green-600">{b.issuer} • {b.date}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-sm">
              <div className="font-medium mb-2">Share</div>
              <div className="flex flex-col gap-2">
                <button onClick={copyLink} className="px-3 py-2 rounded-md border text-left">Copy link</button>
                <a href="#" className="px-3 py-2 rounded-md bg-blue-600 text-white text-center">Share via email</a>
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-10 text-center text-sm text-gray-500">
          This is a demo page — real portfolio shows verified attachments and proof links.
        </section>
      </main>
    </div>
  );
}
