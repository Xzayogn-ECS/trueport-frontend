import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import WCard from '../../components/WCard'
import api from '../../utils/api'
import { getDisplayName } from '../../utils/nameUtils'

// shadcn/ui
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'

// icons
import {
  Github, Mail, Linkedin, ExternalLink, CheckCircle2, Star,
  Building2, ArrowLeft, Globe, Clock, XCircle
} from 'lucide-react'

// animation
import { motion } from 'framer-motion'

// ---- status helpers (no UI layout change, just text shown) ----
const getItemStatus = (item) => {
  const raw = item?.verificationStatus || (item?.verified ? 'verified' : 'not_verified')
  if (raw === 'submitted') return 'submitted'
  if (raw === 'verified') return 'verified'
  return 'not_verified'
}

const STATUS_META = {
  verified:   { label: 'Verified', Icon: CheckCircle2, cls: 'text-green-600' },
  submitted:  { label: 'Submitted for verification', Icon: Clock, cls: 'text-amber-600' },
  not_verified: { label: 'Not verified', Icon: XCircle, cls: 'text-slate-500' },
}

function StatusPill({ status }) {
  const { label, Icon, cls } = STATUS_META[status] || STATUS_META.not_verified
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${cls}`}>
      <Icon className='h-4 w-4' /> {label}
    </span>
  )
}
// ---------------------------------------------------------------

export default function PublicPortfolio () {
  const router = useRouter()
  const { userId } = router.query
  const [showExitPreview, setShowExitPreview] = useState(false)
  const [user, setUser] = useState(null)
  const [experiences, setExperiences] = useState([])
  const [education, setEducation] = useState([])
  const [projects, setProjects] = useState([])
  const [githubRepos, setGithubRepos] = useState([])
  const [customUrls, setCustomUrls] = useState([])
  const [loading, setLoading] = useState(true)
  const [githubLoading, setGithubLoading] = useState(false)

  useEffect(() => {
    if (userId) fetchPortfolioData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  // Determine whether to show an "Exit Preview" button.
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const ref = document.referrer || ''
      const fromSameOrigin = ref.startsWith(window.location.origin)
      const isDirectOpen = (!ref || !fromSameOrigin) && window.history.length <= 2
      setShowExitPreview(isDirectOpen)
    } catch {
      setShowExitPreview(false)
    }
  }, [])

  const fetchPortfolioData = async () => {
    try {
      const response = await api.get(`/portfolio/${userId}`)
      setUser(response.data.user)
      setExperiences(Array.isArray(response.data.experiences) ? response.data.experiences : [])
      setEducation(Array.isArray(response.data.education) ? response.data.education : [])
      setProjects(Array.isArray(response.data.projects) ? response.data.projects : Array.isArray(response.data.githubProjects) ? response.data.githubProjects : [])

      const urls = response.data.user?.contactInfo?.customUrls || response.data.user?.customUrls || []
      setCustomUrls(Array.isArray(urls) ? urls : [])

      const ghUser = response.data.user?.contactInfo?.githubUsername || response.data.user?.githubUsername
      if (ghUser) fetchGithubRepos(ghUser)
    } catch (error) {
      console.error('Failed to fetch portfolio:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchGithubRepos = async (username) => {
    setGithubLoading(true)
    try {
      const response = await api.get(`/github/public/${username}`)
      const reposData = Array.isArray(response.data) ? response.data : []
      setGithubRepos(reposData.slice(0, 6))
    } catch (error) {
      console.error('Failed to fetch GitHub repos:', error)
    } finally {
      setGithubLoading(false)
    }
  }

  const formatDate = (date) => {
    if (!date) return ''
    try {
      return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
    } catch {
      return ''
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || (typeof window !== 'undefined' ? window.location.origin : '')
  const portfolioUrl = `${baseUrl}/portfolio/${userId || user?._id || user?.id || ''}`

  // Public items are those where isPublic !== false
  const publicExperiences = useMemo(() => (Array.isArray(experiences) ? experiences.filter(e => e?.isPublic !== false) : []), [experiences])
  const publicEducation = useMemo(() => (Array.isArray(education) ? education.filter(e => e?.isPublic !== false) : []), [education])
  const publicProjects = useMemo(() => (Array.isArray(projects) ? projects.filter(p => p?.isPublic !== false) : []), [projects])

  const sortedEducation = useMemo(() => (publicEducation.length ? [...publicEducation].sort((a, b) => (b?.passingYear || 0) - (a?.passingYear || 0)) : []), [publicEducation])
  const sortedProjects = useMemo(() => ([...publicProjects].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))), [publicProjects])

  const stats = useMemo(() => ({
    verifiedEducation: Array.isArray(education) ? education.filter(e => e?.verified).length : 0,
    publicProjects: publicProjects.length,
    verifiedExperiences: Array.isArray(experiences) ? experiences.filter(e => e?.verified).length : 0
  }), [education, experiences, publicProjects.length])

  const verifiedExperiences = useMemo(() => (Array.isArray(experiences) ? experiences.filter(e => e?.verified) : []), [experiences])

  const publicContactInfo = useMemo(() => ({
    emailVisible: user?.contactVisibility?.email !== false,
    phoneVisible: user?.contactVisibility?.phone !== false,
    linkedinVisible: user?.contactVisibility?.linkedinUrl !== false,
    githubVisible: true,
    email: user?.contactInfo?.email || '',
    phone: user?.contactInfo?.phone || '',
    linkedinUrl: user?.contactInfo?.linkedinUrl || '',
    githubUsername: user?.contactInfo?.githubUsername || user?.githubUsername || ''
  }), [user])

  const skillsTop = useMemo(() => {
    const counts = {}
    try {
      (publicProjects || []).forEach(p => {
        const skills = Array.isArray(p.skillsUsed) ? p.skillsUsed : (Array.isArray(p.technologies) ? p.technologies : [])
        skills.forEach(s => {
          const key = (s && s.label) ? s.label : s
          if (!key) return
          const k = String(key).trim()
          if (!k) return
          counts[k] = (counts[k] || 0) + 1
        })
      })
      ;(verifiedExperiences || []).forEach(exp => {
        const tags = Array.isArray(exp.tags) ? exp.tags : []
        tags.forEach(t => {
          const k = String(t).trim()
          if (!k) return
          counts[k] = (counts[k] || 0) + 1
        })
      })
    } catch {}
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 12)
  }, [publicProjects, verifiedExperiences])

  if (loading) {
    return (
      <div className='min-h-screen grid place-items-center bg-gradient-to-b from-slate-50 to-white'>
        <div className='h-12 w-12 animate-spin rounded-full border-2 border-slate-300 border-t-transparent' />
      </div>
    )
  }

  if (!user) {
    return (
      <div className='min-h-screen grid place-items-center bg-gradient-to-b from-slate-50 to-white p-6'>
        <Card className='max-w-md w-full'>
          <CardContent className='py-10 text-center'>
            <div className='mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-slate-100'>
              <Building2 className='h-6 w-6 text-slate-400' />
            </div>
            <h3 className='text-base font-semibold text-slate-900'>Portfolio not found</h3>
            <p className='mt-1 text-sm text-slate-500'>This portfolio doesn't exist or is not public.</p>
            <Button asChild className='mt-6'>
              <Link href='/'>Go home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const initials = (getDisplayName(user) || 'U')
    .split(' ')
    .map(s => s[0])
    .slice(0, 2)
    .join('')

  return (
    <div className='relative min-h-screen bg-gradient-to-b from-white via-slate-50 to-white'>
      <Head>
        <title>{getDisplayName(user)} - TruePortMe</title>
        <meta name='description' content={`Professional portfolio of ${getDisplayName(user)}${user.bio ? ` - ${user.bio}` : ''}`} />
      </Head>

      {/* background blobs */}
      <div aria-hidden className='pointer-events-none absolute inset-0 overflow-hidden'>
        <div className='absolute -top-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-tr from-indigo-200/60 via-purple-200/40 to-pink-200/40 blur-3xl' />
        <div className='absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-gradient-to-tr from-cyan-200/50 via-blue-200/40 to-indigo-200/40 blur-3xl' />
      </div>

      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10'>
        <div className='mb-4 flex items-center gap-3'>
          <button onClick={() => router.push('/dashboard')} className='inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800'>
            <ArrowLeft className='mr-1.5 h-4 w-4' /> Back to dashboard
          </button>
          {showExitPreview && (
            <button onClick={() => router.push('/')} className='inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800'>
              <ArrowLeft className='mr-1.5 h-4 w-4' /> Exit preview
            </button>
          )}
        </div>

        {/* HERO */}
        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card className='relative overflow-hidden border-none shadow-lg ring-1 ring-slate-100'>
            <CardContent className='p-6 sm:p-8'>
              <div className='flex flex-col gap-6 md:flex-row md:items-center md:justify-between'>
                {/* identity */}
                <div className='flex items-start gap-4'>
                  <div className='relative'>
                    <div className='absolute -inset-0.5 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 opacity-30 blur-md' />
                    <Avatar className='relative h-20 w-20 ring-2 ring-white shadow-sm'>
                      <AvatarImage src={user?.avatarUrl || user?.profileImage} alt={getDisplayName(user)} />
                      <AvatarFallback className='text-lg font-semibold'>{initials}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div>
                    <div className='flex flex-wrap items-center gap-x-3 gap-y-2'>
                      <h1 className='text-2xl sm:text-3xl font-bold tracking-tight text-slate-900'>{getDisplayName(user)}</h1>
                      {user?.verified && (
                        <Badge variant='secondary' className='inline-flex items-center gap-1'>
                          <CheckCircle2 className='h-4 w-4 text-green-600' /> Verified
                        </Badge>
                      )}
                    </div>
                    {user?.bio && <p className='mt-1 max-w-2xl text-sm text-slate-600'>{user.bio}</p>}
                    <div className='mt-3 flex flex-wrap items-center gap-2'>
                      {publicContactInfo?.email && (
                        <ContactPill href={`mailto:${publicContactInfo.email}`} label='Email' icon={Mail} />
                      )}
                      {publicContactInfo?.linkedinUrl && (
                        <ContactPill href={publicContactInfo.linkedinUrl} label='LinkedIn' icon={Linkedin} />
                      )}
                      {publicContactInfo?.githubUsername && (
                        <ContactPill href={`https://github.com/${publicContactInfo.githubUsername}`} label='GitHub' icon={Github} />
                      )}
                      {customUrls?.filter(Boolean)?.slice(0, 2)?.map((u, i) => (
                        <ContactPill key={i} href={u?.url || u} label={u?.label || 'Link'} icon={Globe} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* quick stats + QR */}
                <div className='w-full md:w-auto'>
                  <div className='hidden md:block'>
                    <WCard
                      user={user}
                      contactInfo={publicContactInfo}
                      portfolioUrl={portfolioUrl}
                      compact
                      showControls={false}
                      stats={stats}
                      customUrls={customUrls}
                    />
                  </div>
                  <div className='md:hidden grid grid-cols-3 gap-2'>
                    <Stat value={stats.verifiedExperiences} label='Verified Exp' />
                    <Stat value={stats.verifiedEducation} label='Education' />
                    <Stat value={stats.publicProjects} label='Projects' />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Skills */}
        {!!skillsTop.length && (
          <section className='mt-6 sm:mt-8'>
            <div className='flex items-center justify-between'>
              <h2 className='text-base sm:text-lg font-semibold text-slate-900'>Top Skills</h2>
              <span className='text-xs text-slate-500'>Showing {skillsTop.length}</span>
            </div>
            <div className='mt-3 flex flex-wrap gap-2'>
              {skillsTop.map(([name, count]) => (
                <Badge key={name} variant='secondary' className='rounded-full px-3 py-1 text-xs'>
                  {name} <span className='ml-1 text-[10px] text-slate-500'>×{count}</span>
                </Badge>
              ))}
            </div>
          </section>
        )}

        {/* Main grid */}
        <div className='mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3'>
          {/* left */}
          <div className='lg:col-span-2 space-y-6'>
            {!!publicExperiences.length && (
              <Card className='shadow-sm'>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-lg'>Verified Experiences</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='relative pl-4 sm:pl-6'>
                    <div className='absolute left-1 top-0 bottom-0 w-px bg-gradient-to-b from-indigo-200 via-slate-200 to-transparent' />
                    <div className='space-y-5'>
                      {publicExperiences.map((exp) => {
                        const st = getItemStatus(exp)
                        return (
                          <motion.div key={exp._id} initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.25 }} className='relative'>
                            <div className='absolute -left-[9px] top-1.5 h-2.5 w-2.5 rounded-full bg-indigo-500 ring-4 ring-indigo-100' />
                            <div className='rounded-lg border border-slate-100 bg-slate-50/60 p-4'>
                              <div className='flex flex-wrap items-start justify-between gap-3'>
                                <div>
                                  <div className='flex flex-wrap items-center gap-2'>
                                    <p className='font-medium text-slate-900'>{exp.title}</p>
                                    {(exp.organization || exp.company) && (
                                      <span className='text-sm text-slate-500'>@ {exp.organization || exp.company}</span>
                                    )}
                                  </div>
                                  <p className='mt-0.5 text-xs text-slate-500'>
                                    {exp.startDate && formatDate(exp.startDate)}
                                    {exp.endDate ? ` — ${formatDate(exp.endDate)}` : ' — Present'}
                                  </p>
                                </div>

                                {/* status pill (icon + full text) */}
                                <StatusPill status={st} />
                              </div>

                              {exp.description && (
                                <p className='mt-2 text-sm text-slate-700 whitespace-pre-wrap'>{exp.description}</p>
                              )}
                              {!!(exp.tags?.length) && (
                                <div className='mt-2 flex flex-wrap gap-1.5'>
                                  {exp.tags.slice(0, 6).map((t, i) => (
                                    <Badge key={i} variant='outline' className='rounded-full'>{t}</Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {!!sortedProjects.length && (
              <Card className='shadow-sm'>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-lg'>Projects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                    {sortedProjects.slice(0, 6).map((project) => (
                      <motion.a
                        key={project.id}
                        href={project.liveLink || project.githubLink || '#'}
                        target='_blank'
                        rel='noopener noreferrer'
                        initial={{ opacity: 0, y: 8 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.25 }}
                        className='group block rounded-xl border border-slate-100 bg-white p-4 shadow-sm ring-1 ring-transparent hover:-translate-y-0.5 hover:ring-indigo-200 focus-visible:ring-2 focus-visible:ring-indigo-300 focus:outline-none'
                      >
                        <div className='flex items-start justify-between gap-3'>
                          <div>
                            <h3 className='line-clamp-1 font-semibold text-slate-900 group-hover:text-indigo-600'>{project.title}</h3>
                            {project.description && (
                              <p className='mt-1 line-clamp-2 text-sm text-slate-600'>{project.description}</p>
                            )}
                          </div>
                          {(project.githubLink || project.liveLink) && (
                            <ExternalLink className='h-4 w-4 flex-shrink-0 text-slate-400 group-hover:text-indigo-500' />
                          )}
                        </div>
                        {!!(project.tags?.length) && (
                          <div className='mt-3 flex flex-wrap gap-1.5'>
                            {project.tags.slice(0, 6).map((t, i) => (
                              <Badge key={i} variant='outline' className='rounded-full'>{t}</Badge>
                            ))}
                          </div>
                        )}
                        <div className='mt-3 flex gap-3 text-xs text-slate-500'>
                          {project.githubLink && (
                            <span className='inline-flex items-center gap-1'><Github className='h-3.5 w-3.5' /> Repo</span>
                          )}
                          {project.liveLink && (
                            <span className='inline-flex items-center gap-1'><Globe className='h-3.5 w-3.5' /> Demo</span>
                          )}
                        </div>
                      </motion.a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* right */}
          <div className='space-y-6'>
            {!!sortedEducation.length && (
              <Card className='shadow-sm'>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm'>Education</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    {sortedEducation.slice(0, 4).map((edu) => {
                      const st = getItemStatus(edu)
                      return (
                        <div key={edu._id || edu.id} className='rounded-lg border border-slate-100 bg-slate-50/60 p-3'>
                          <div className='flex items-start justify-between gap-3'>
                            <div>
                              <p className='text-sm font-medium text-slate-900'>
                                {edu.courseName || edu.degree || edu.title}
                                {edu.courseType && <span className='text-slate-500'> ({edu.courseType})</span>}
                              </p>
                              <p className='mt-0.5 text-xs text-slate-600'>
                                {edu.schoolOrCollege || edu.institute || edu.boardOrUniversity}
                                {edu.passingYear && ` • Class of ${edu.passingYear}`}
                              </p>
                            </div>

                            {/* show full status text here (no tooltip) */}
                            <StatusPill status={st} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* GitHub repos */}
            {(() => {
              const ghUsername = user?.contactInfo?.githubUsername || user?.githubUsername
              return ghUsername && !githubLoading && githubRepos.length > 0
            })() && (
              <Card className='shadow-sm'>
                <CardHeader className='pb-2'>
                  <div className='flex items-center justify-between'>
                    <CardTitle className='text-sm'>GitHub Repositories</CardTitle>
                    <Button variant='link' className='h-auto p-0 text-indigo-600' asChild>
                      <a href={`https://github.com/${user?.contactInfo?.githubUsername || user?.githubUsername}`} target='_blank' rel='noopener noreferrer'>View all →</a>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    {githubRepos.map((repo) => (
                      <a key={repo.id} href={repo.html_url} target='_blank' rel='noopener noreferrer' className='block rounded-lg border border-slate-100 bg-white p-3 hover:border-indigo-200'>
                        <div className='flex items-start justify-between gap-3'>
                          <div>
                            <p className='line-clamp-1 font-medium text-slate-900'>{repo.name}</p>
                            <p className='mt-0.5 line-clamp-2 text-xs text-slate-600'>{repo.description || 'No description available'}</p>
                          </div>
                          {!!repo.stargazers_count && (
                            <span className='inline-flex items-center gap-1 text-xs text-amber-600'>
                              <Star className='h-3.5 w-3.5' /> {repo.stargazers_count}
                            </span>
                          )}
                        </div>
                        <div className='mt-2 flex items-center justify-between text-[11px] text-slate-500'>
                          {repo.language && (
                            <span className='inline-flex items-center gap-1'>
                              <span className='h-2 w-2 rounded-full bg-slate-400' /> {repo.language}
                            </span>
                          )}
                          <span>{formatDate(repo.updated_at)}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* CTA */}
        <section className='mt-10'>
          <div className='relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-6 sm:p-8 text-center text-white shadow-xl'>
            <div className='pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl' />
            <h2 className='text-xl sm:text-2xl font-bold'>Create your own verified portfolio</h2>
            <p className='mt-2 text-sm/relaxed text-indigo-100'>Showcase achievements with verified credentials. Build trust with employers and clients.</p>
            <Button asChild variant='secondary' className='mt-4'>
              <Link href='/auth/register'>Get started</Link>
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className='mt-10 border-t border-slate-200 pt-6 text-center text-sm text-slate-500'>
          Powered by{' '}
          <Link href='/' className='font-medium text-indigo-600 hover:text-indigo-700'>TruePortMe</Link>
          {' '}— Verified Digital Portfolios
        </footer>
      </div>
    </div>
  )
}

function ContactPill ({ href, label, icon: Icon }) {
  return (
    <Button asChild variant='outline' className='h-8 rounded-full border-slate-200 px-3 text-xs'>
      <a href={href} target={href?.startsWith('http') ? '_blank' : undefined} rel='noopener noreferrer'>
        <span className='inline-flex items-center gap-1.5'><Icon className='h-3.5 w-3.5' /> {label}</span>
      </a>
    </Button>
  )
}

function Stat ({ value, label }) {
  return (
    <div className='rounded-xl border border-slate-100 bg-white p-3 text-center shadow-sm'>
      <div className='text-xl font-bold text-slate-900'>{value}</div>
      <div className='text-xs text-slate-500'>{label}</div>
    </div>
  )
}
