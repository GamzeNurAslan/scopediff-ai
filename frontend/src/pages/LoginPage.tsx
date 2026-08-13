import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
} from 'lucide-react'

import {
  useState,
  type FormEvent,
} from 'react'

import {
  useLocation,
  useNavigate,
} from 'react-router'

import {
  useLanguage,
} from '../i18n/LanguageContext'

import {
  useProfile,
} from '../context/ProfileContext'

import {
  findUserByEmail,
} from '../data/registeredUsers'

import './LoginPage.css'


const COPY = {
  tr: {
    fullName: 'Ad Soyad',
    fullNamePlaceholder: 'Adını ve soyadını yaz',
    eyebrow: 'SCOPEDIFF ENTERPRISE',
    title: 'Ekibin nabzini\ntek bakista g?r.',
    description: 'Degisiklikleri yakala, isleri hizlandir, ekibin kontrol?n? elinde tut.',
    signIn: 'Hesabina giris yap',
    signInHint: 'Kurumsal hesabinla g?venli ?alisma alanina devam et.',
    email: 'Kurumsal e-posta',
    emailPlaceholder: 'ad.soyad@company.com',
    password: 'Sifre',
    passwordPlaceholder: '????????',
    remember: 'Bu cihazda oturumu a?ik tut',
    submit: '?alisma alanina gir',
    invalid: 'E-posta veya sifre hatali. Demo hesaplardan birini deneyebilirsin.',
    shortPassword: 'Sifre en az 6 karakter olmali.',
    demoTitle: 'Demo erisimleri',
    teamLead: 'Takim Lideri',
    teamLeadEmail: 'lider@company.com',
    intern: 'Demo Kullanici',
    internEmail: 'demo@company.com',
    demoPassword: 'Sifre: 123456',
    secure: 'Canli ekip zek?si',
    secureHint: 'Rol bazli erisim ve anlik s?re? g?r?n?rl?g?',
    localNote: 'Gelistirme ortami ? Demo giris',
  },
  en: {
    fullName: 'Full name',
    fullNamePlaceholder: 'Enter your full name',
    eyebrow: 'SCOPEDIFF ENTERPRISE',
    title: 'See your team?s pulse\nat a glance.',
    description: 'Catch change, move work forward and keep your team in control.',
    signIn: 'Sign in to your account',
    signInHint: 'Continue to your secure workspace with your corporate account.',
    email: 'Corporate email',
    emailPlaceholder: 'name@company.com',
    password: 'Password',
    passwordPlaceholder: '????????',
    remember: 'Keep me signed in on this device',
    submit: 'Enter workspace',
    invalid: 'Email or password is incorrect. Try one of the demo accounts.',
    shortPassword: 'Password must be at least 6 characters.',
    demoTitle: 'Demo access',
    teamLead: 'Team Lead',
    teamLeadEmail: 'lider@company.com',
    intern: 'Demo User',
    internEmail: 'demo@company.com',
    demoPassword: 'Password: 123456',
    secure: 'Live team intelligence',
    secureHint: 'Role-based access and instant process visibility',
    localNote: 'Development environment ? Demo access',
  },
} as const


const DEMO_TEAM_LEAD = {
  userId: 'USR-TEAM-001',
  fullName: 'Takim Lideri',
  corporateEmail: 'lider@company.com',
  department: 'Çözüm Geliştirme',
  role: 'Takım Lideri',
}


function ScopeDiffLogo() {
  return (
    <svg
      className="login-scope-logo"
      viewBox="0 0 44 44"
      aria-hidden="true"
    >
      <circle cx="22" cy="22" r="15.5" fill="none" stroke="url(#login-scope-gradient)" strokeWidth="2.2" />
      <text x="22" y="26" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11.5" fontWeight="800" letterSpacing="-0.8" fill="currentColor">SD</text>
      <circle cx="8" cy="22" r="2.6" fill="#ff7900" />
      <circle cx="36" cy="22" r="2.6" fill="#a88cff" />
      <defs>
        <linearGradient id="login-scope-gradient" x1="6" y1="7" x2="38" y2="37" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ff9a3d" />
          <stop offset="0.52" stopColor="#ffd166" />
          <stop offset="1" stopColor="#a88cff" />
        </linearGradient>
      </defs>
    </svg>
  )
}


function LoginPage() {
  const { language } = useLanguage()
  const copy = language === 'tr'
    ? { ...COPY.tr, fullNamePlaceholder: 'Adini ve soyadini yaz' }
    : COPY.en
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, saveProfile } = useProfile()
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function fillDemo(nextEmail: string) {
    setEmail(nextEmail)
    setPassword('123456')
    setError(null)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError(copy.shortPassword)
      return
    }

    const normalizedEmail = email.trim().toLocaleLowerCase('tr-TR')
    const registeredUser = findUserByEmail(normalizedEmail)
    const nextProfile = normalizedEmail === DEMO_TEAM_LEAD.corporateEmail
      ? DEMO_TEAM_LEAD
      : registeredUser
        ? {
            userId: registeredUser.id,
            fullName: registeredUser.fullName,
            corporateEmail: registeredUser.corporateEmail,
            department: registeredUser.department,
            role: registeredUser.role,
          }
        : profile?.corporateEmail.toLocaleLowerCase('tr-TR') === normalizedEmail
          ? profile
          : {
              userId: `USR-${normalizedEmail}`,
              fullName: fullName.trim()
                || normalizedEmail
                  .split('@')[0]
                  .replace(/[._-]+/g, ' ')
                  .replace(/\b\w/g, (letter) => letter.toUpperCase()),
              corporateEmail: normalizedEmail,
              department: 'Çözüm Geliştirme',
              role: 'Team Member',
            }

    if (!nextProfile) {
      setError(copy.invalid)
      return
    }

    setLoading(true)
    window.setTimeout(() => {
      saveProfile(nextProfile)
      const from = (location.state as { from?: string } | null)?.from
      navigate(from || '/dashboard', { replace: true })
    }, remember ? 250 : 450)
  }

  return (
    <main className="login-page">
      <div className="login-ambient login-ambient-one" />
      <div className="login-ambient login-ambient-two" />

      <section className="login-brand-panel">
        <div className="login-brand-top"><span className="login-brand-mark"><ScopeDiffLogo /></span><strong>ScopeDiff</strong><span>ETIYA WORKSPACE</span><i><b />SYSTEM READY</i></div>
        <div className="login-brand-content">
          <span className="login-eyebrow">{copy.eyebrow}</span>
          <h1>{copy.title}</h1>
          <p>{copy.description}</p>
          <div className="login-brand-visual" aria-label="ScopeDiff change intelligence">
            <div className="brand-visual-orbit orbit-a" />
            <div className="brand-visual-orbit orbit-b" />
            <div className="brand-visual-orbit orbit-c" />
            <div className="brand-visual-core"><strong>SD</strong><span>CHANGE<br />INTELLIGENCE</span></div>
            <span className="brand-visual-tag tag-one">CHANGE</span>
            <span className="brand-visual-tag tag-two">INSIGHT</span>
            <span className="brand-visual-tag tag-three">ACTION</span>
          </div>
        </div>
        <small className="login-brand-footer">? 2026 ScopeDiff ? {copy.localNote}</small>
      </section>

      <section className="login-form-panel">
        <div className="login-panel-orbit orbit-one" /><div className="login-panel-orbit orbit-two" />
        <div className="login-form-card">
          <div className="login-form-heading"><span className="login-mobile-mark"><ScopeDiffLogo /></span><span className="login-eyebrow">{copy.eyebrow}</span><h2>{copy.signIn}</h2><p>{copy.signInHint}</p><div className="login-heading-line"><i /><span>SECURE ACCESS</span></div></div>
          <form onSubmit={handleSubmit}>
            <label className="login-field"><span>{copy.fullName}</span><div className="login-input-wrap"><UserRound size={16} /><input type="text" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder={copy.fullNamePlaceholder} autoComplete="name" required /></div></label>
            <label className="login-field"><span>{copy.email}</span><div className="login-input-wrap"><Mail size={16} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={copy.emailPlaceholder} autoComplete="email" required /></div></label>
            <label className="login-field"><span>{copy.password}</span><div className="login-input-wrap"><LockKeyhole size={16} /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={copy.passwordPlaceholder} autoComplete="current-password" minLength={6} required /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((current) => !current)}>{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button></div></label>
            <label className="login-remember"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /><span>{copy.remember}</span></label>
            {error && <div className="login-error">{error}</div>}
            <button className="login-submit" type="submit" disabled={loading}>{loading ? '...' : copy.submit}<ArrowRight size={16} /></button>
          </form>

          <div className="login-demo"><div className="login-demo-heading"><span>{copy.demoTitle}</span><small>{copy.demoPassword}</small></div><button type="button" onClick={() => fillDemo(copy.teamLeadEmail)}><span><strong>{copy.teamLead}</strong><small>{copy.teamLeadEmail}</small></span><ArrowRight size={14} /></button><button type="button" onClick={() => fillDemo(copy.internEmail)}><span><strong>{copy.intern}</strong><small>{copy.internEmail}</small></span><ArrowRight size={14} /></button></div>
        </div>
      </section>
    </main>
  )
}


export default LoginPage
