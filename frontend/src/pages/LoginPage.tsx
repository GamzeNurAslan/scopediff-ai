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
    title: 'Ekibin nabzını\ntek bakışta gör.',
    description: 'Değişiklikleri yakala, işleri hızlandır, ekibin kontrolünü elinde tut.',
    signIn: 'Hesabına giriş yap',
    signInHint: 'Kurumsal hesabınla güvenli çalışma alanına devam et.',
    email: 'Kurumsal e-posta',
    emailPlaceholder: 'ad.soyad@company.com',
    password: 'Şifre',
    passwordPlaceholder: 'Şifreni gir',
    remember: 'Bu cihazda oturumu açık tut',
    submit: 'Çalışma alanına gir',
    invalid: 'E-posta veya şifre hatalı. Demo hesaplardan birini deneyebilirsin.',
    shortPassword: 'Şifre en az 6 karakter olmalı.',
    demoTitle: 'Demo erişimleri',
    teamLead: 'Takım Lideri',
    teamLeadEmail: 'lider@company.com',
    intern: 'Demo Kullanıcı',
    internEmail: 'demo@company.com',
    demoPassword: 'Şifre: 123456',
    secure: 'Canlı ekip zekâsı',
    secureHint: 'Rol bazlı erişim ve anlık süreç görünürlüğü',
    localNote: 'Geliştirme ortamı · Demo giriş',
  },
  en: {
    fullName: 'Full name',
    fullNamePlaceholder: 'Enter your full name',
    eyebrow: 'SCOPEDIFF ENTERPRISE',
    title: "See your team's pulse\nat a glance.",
    description: 'Catch change, move work forward and keep your team in control.',
    signIn: 'Sign in to your account',
    signInHint: 'Continue to your secure workspace with your corporate account.',
    email: 'Corporate email',
    emailPlaceholder: 'name@company.com',
    password: 'Password',
    passwordPlaceholder: 'Enter your password',
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
    localNote: 'Development environment · Demo access',
  },
} as const


const DEMO_TEAM_LEAD = {
  userId: 'USR-TEAM-001',
  fullName: 'Takım Lideri',
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
      <rect x="16" y="9.5" width="19" height="25" rx="9.5" fill="#c8b7e8" fillOpacity=".2" stroke="#b5a4d8" strokeWidth="1.8" />
      <rect x="9" y="9.5" width="19" height="25" rx="9.5" fill="#f4b18e" fillOpacity=".25" stroke="#e99468" strokeWidth="1.8" />
      <path d="M15 19.5h7M15 24h4.6" fill="none" stroke="#d9794e" strokeLinecap="round" strokeWidth="1.6" opacity=".88" />
    </svg>
  )
}


function LoginPage() {
  const { language } = useLanguage()
  const copy = language === 'tr'
    ? { ...COPY.tr, fullNamePlaceholder: 'Adını ve soyadını yaz' }
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
            <div className="brand-visual-core">
              <div className="brand-core-sheet brand-core-sheet-back" />
              <div className="brand-core-sheet brand-core-sheet-front">
                <div className="brand-core-meta"><span>SCOPEDIFF</span><b>CHANGE MAP</b><i>02</i></div>
                <div className="brand-core-title"><strong>SD</strong><span>REQUIREMENTS<br />VERSIONING</span></div>
                <div className="brand-core-compare">
                  <div className="brand-core-version"><small>v1</small><i /><i /><i /></div>
                  <b className="brand-core-arrow">→</b>
                  <div className="brand-core-version active"><small>v2</small><i /><i /><i /></div>
                </div>
                <div className="brand-core-footer"><span>12 changes detected</span><b>+24%</b></div>
              </div>
            </div>
            <span className="brand-visual-tag tag-one">CHANGE</span>
            <span className="brand-visual-tag tag-two">INSIGHT</span>
            <span className="brand-visual-tag tag-three">ACTION</span>
          </div>
        </div>
        <small className="login-brand-footer">© 2026 ScopeDiff · {copy.localNote}</small>
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
