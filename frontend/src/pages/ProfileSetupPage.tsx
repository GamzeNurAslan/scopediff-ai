import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react'

import {
  useMemo,
  useState,
  type FormEvent,
} from 'react'

import {
  useNavigate,
} from 'react-router'

import {
  useProfile,
} from '../context/ProfileContext'

import {
  PROFILE_AVATAR_OPTIONS,
} from '../components/ProfileAvatar'

import './ProfileSetupPage.css'


function createLocalUserId(
  email: string,
): string {
  const normalized = email
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(
      /[^a-z0-9çğıöşü]+/gi,
      '-',
    )
    .replace(
      /^-+|-+$/g,
      '',
    )

  return `LOCAL-${normalized}`
}


function ProfileSetupPage() {
  const navigate =
    useNavigate()

  const {
    profile,
    saveProfile,
  } = useProfile()


  const [
    fullName,
    setFullName,
  ] = useState(
    profile?.fullName ?? '',
  )


  const [
    corporateEmail,
    setCorporateEmail,
  ] = useState(
    profile?.corporateEmail ?? '',
  )


  const [
    department,
    setDepartment,
  ] = useState(
    profile?.department ?? '',
  )


  const [
    role,
    setRole,
  ] = useState(
    profile?.role ?? '',
  )


  const [
    avatarId,
    setAvatarId,
  ] = useState(
    profile?.avatarId ?? PROFILE_AVATAR_OPTIONS[0].id,
  )


  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  )


  const [
    success,
    setSuccess,
  ] = useState(false)


  const isEditing =
    profile !== null


  const canSubmit =
    useMemo(
      () =>
        fullName.trim().length >= 3
        && corporateEmail
          .trim()
          .length >= 5
        && department
          .trim()
          .length >= 2
        && role
          .trim()
          .length >= 2,
      [
        corporateEmail,
        department,
        fullName,
        role,
      ],
    )


  function clearMessages() {
    setError(null)
    setSuccess(false)
  }


  function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    clearMessages()


    const normalizedName =
      fullName.trim()

    const normalizedEmail =
      corporateEmail
        .trim()
        .toLocaleLowerCase(
          'tr-TR',
        )

    const normalizedDepartment =
      department.trim()

    const normalizedRole =
      role.trim()


    /*
     * AD SOYAD
     */
    if (
      normalizedName.length < 3
    ) {
      setError(
        'Lütfen geçerli bir ad soyad girin.',
      )

      return
    }


    /*
     * E-POSTA FORMAT KONTROLÜ
     *
     * Burada kullanıcının sistemde kayıtlı
     * olup olmadığını kontrol ETMİYORUZ.
     */
    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/


    if (
      !emailPattern.test(
        normalizedEmail,
      )
    ) {
      setError(
        'Lütfen geçerli bir e-posta adresi girin.',
      )

      return
    }


    /*
     * DEPARTMAN
     *
     * Kullanıcı istediği departmanı
     * serbest şekilde yazabilir.
     */
    if (
      normalizedDepartment.length
      < 2
    ) {
      setError(
        'Lütfen departmanınızı girin.',
      )

      return
    }


    /*
     * ROL
     *
     * Kullanıcı istediği rolü
     * serbest şekilde yazabilir.
     */
    if (
      normalizedRole.length < 2
    ) {
      setError(
        'Lütfen rolünüzü girin.',
      )

      return
    }


    /*
     * PROFİLİ KAYDET
     *
     * Şimdilik backend doğrulaması yok.
     * Profil localStorage üzerinden tutuluyor.
     */
    saveProfile({
      userId:
        profile?.userId
        ?? createLocalUserId(
          normalizedEmail,
        ),

      fullName:
        normalizedName,

      corporateEmail:
        normalizedEmail,

      department:
        normalizedDepartment,

      role:
        normalizedRole,

      avatarId,
    })


    setSuccess(true)


    navigate(
      '/dashboard',
      {
        replace: true,
      },
    )
  }


  return (
    <div className="profile-setup-page">

      <div
        className="
          profile-ambient
          profile-ambient-one
        "
      />

      <div
        className="
          profile-ambient
          profile-ambient-two
        "
      />


      <div className="profile-setup-shell">

        {/* =============================================
            LEFT SIDE
            ============================================= */}

        <section className="profile-intro">

          <div className="profile-brand">

            <div className="profile-brand-mark">

              <Sparkles
                size={22}
              />

            </div>


            <div>

              <strong>
                ScopeDiff AI
              </strong>

              <span>
                Requirement Intelligence
              </span>

            </div>

          </div>


          <div className="profile-intro-content">

            <span className="profile-eyebrow">
              ÇALIŞMA ALANI
            </span>


            <h1>

              Analiz ortamınızı

              <span>
                kişiselleştirin.
              </span>

            </h1>


            <p>
              Çalışma alanına devam
              etmek için temel kullanıcı,
              departman ve rol
              bilgilerinizi girin.
            </p>


            <div className="profile-feature-list">

              <div>

                <span className="profile-feature-icon">

                  <UserRound
                    size={17}
                  />

                </span>


                <div>

                  <strong>
                    Kullanıcı bilgisi
                  </strong>

                  <p>
                    Analizlerin kullanıcı
                    bağlamıyla
                    ilişkilendirilmesine
                    temel oluşturur.
                  </p>

                </div>

              </div>


              <div>

                <span className="profile-feature-icon">

                  <Building2
                    size={17}
                  />

                </span>


                <div>

                  <strong>
                    Esnek departman
                  </strong>

                  <p>
                    Departmanınızı
                    herhangi bir listeyle
                    sınırlanmadan
                    yazabilirsiniz.
                  </p>

                </div>

              </div>


              <div>

                <span className="profile-feature-icon">

                  <ShieldCheck
                    size={17}
                  />

                </span>


                <div>

                  <strong>
                    Organizasyon altyapısı
                  </strong>

                  <p>
                    Şirket ve kullanıcı
                    doğrulaması sonraki
                    geliştirme aşamasında
                    backend'e bağlanabilir.
                  </p>

                </div>

              </div>

            </div>

          </div>


          <div className="profile-intro-footer">

            <span />

            ScopeDiff AI

          </div>

        </section>


        {/* =============================================
            FORM
            ============================================= */}

        <section className="profile-form-panel">

          <div className="profile-form-heading">

            <span>
              {
                isEditing
                  ? 'PROFİL AYARLARI'
                  : 'HOŞ GELDİNİZ'
              }
            </span>


            <h2>
              {
                isEditing
                  ? 'Çalışma alanı profilini düzenle'
                  : 'Çalışma alanınızı oluşturun'
              }
            </h2>


            <p>
              Bilgilerinizi girerek
              ScopeDiff AI çalışma
              alanına devam edin.
            </p>

          </div>


          <div className="profile-avatar-picker">

            <span className="profile-avatar-picker-label">
              Avatarını seç
            </span>

            <div className="profile-avatar-options">

              {
                PROFILE_AVATAR_OPTIONS.map(
                  ({
                    id,
                    label,
                    icon: Icon,
                  }) => (
                    <button
                      key={id}
                      type="button"
                      className={
                        avatarId === id
                          ? `profile-avatar-option selected ${id}`
                          : `profile-avatar-option ${id}`
                      }
                      aria-label={`${label} avatarını seç`}
                      aria-pressed={avatarId === id}
                      onClick={() => setAvatarId(id)}
                    >
                      <Icon
                        size={21}
                        strokeWidth={2.2}
                      />
                    </button>
                  ),
                )
              }

            </div>

          </div>


          <form
            className="profile-form"
            onSubmit={handleSubmit}
          >

            {/* =========================================
                NAME
                ========================================= */}

            <div className="profile-field">

              <label
                htmlFor="profile-full-name"
              >
                Ad Soyad
              </label>


              <div className="profile-input">

                <UserRound
                  size={17}
                />


                <input
                  id="profile-full-name"
                  type="text"
                  value={fullName}
                  autoComplete="name"
                  placeholder="Adınızı ve soyadınızı girin"
                  onChange={
                    (event) => {
                      setFullName(
                        event.target.value,
                      )

                      clearMessages()
                    }
                  }
                />

              </div>

            </div>


            {/* =========================================
                EMAIL
                ========================================= */}

            <div className="profile-field">

              <label
                htmlFor="profile-email"
              >
                Kurumsal E-posta
              </label>


              <div className="profile-input">

                <Mail
                  size={17}
                />


                <input
                  id="profile-email"
                  type="email"
                  value={corporateEmail}
                  autoComplete="email"
                  placeholder="ad.soyad@company.com"
                  onChange={
                    (event) => {
                      setCorporateEmail(
                        event.target.value,
                      )

                      clearMessages()
                    }
                  }
                />

              </div>


              <small>
                Şimdilik sistem kayıt
                kontrolü yapılmaz.
              </small>

            </div>


            {/* =========================================
                DEPARTMENT
                ========================================= */}

            <div className="profile-field">

              <label
                htmlFor="profile-department"
              >
                Departman / Birim
              </label>


              <div className="profile-input">

                <Building2
                  size={17}
                />


                <input
                  id="profile-department"
                  type="text"
                  value={department}
                  autoComplete="organization-title"
                  placeholder="Örn. xDSL MS Developer"
                  onChange={
                    (event) => {
                      setDepartment(
                        event.target.value,
                      )

                      clearMessages()
                    }
                  }
                />

              </div>


              <small>
                Departmanınızı veya
                çalıştığınız birimi
                serbestçe yazabilirsiniz.
              </small>

            </div>


            {/* =========================================
                ROLE
                ========================================= */}

            <div className="profile-field">

              <label
                htmlFor="profile-role"
              >
                Rol
              </label>


              <div className="profile-input">

                <BriefcaseBusiness
                  size={17}
                />


                <input
                  id="profile-role"
                  type="text"
                  value={role}
                  autoComplete="organization-title"
                  placeholder="Örn. Stajyer, Developer, Business Analyst..."
                  onChange={
                    (event) => {
                      setRole(
                        event.target.value,
                      )

                      clearMessages()
                    }
                  }
                />

              </div>


              <small>
                Rolünüzü serbestçe
                yazabilirsiniz.
              </small>

            </div>


            {/* =========================================
                ERROR
                ========================================= */}

            {
              error
              && (
                <div className="profile-form-error">

                  <span>
                    {error}
                  </span>

                </div>
              )
            }


            {/* =========================================
                SUCCESS
                ========================================= */}

            {
              success
              && (
                <div className="profile-form-success">

                  <CheckCircle2
                    size={16}
                  />

                  <span>
                    Profil kaydedildi.
                  </span>

                </div>
              )
            }


            {/* =========================================
                ACTIONS
                ========================================= */}

            <div className="profile-form-actions">

              {
                isEditing
                && (
                  <button
                    type="button"
                    className="profile-cancel-button"
                    onClick={
                      () =>
                        navigate(
                          '/dashboard',
                        )
                    }
                  >
                    Vazgeç
                  </button>
                )
              }


              <button
                type="submit"
                className="profile-submit-button"
                disabled={!canSubmit}
              >

                {
                  isEditing
                    ? 'Profili Güncelle'
                    : 'ScopeDiff AI’a Devam Et'
                }

                <ArrowRight
                  size={17}
                />

              </button>

            </div>

          </form>

        </section>

      </div>

    </div>
  )
}


export default ProfileSetupPage
