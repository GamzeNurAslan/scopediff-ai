import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'


const STORAGE_KEY =
  'scopediff_user_profile_v1'

const AUTH_STORAGE_KEY =
  'scopediff_auth_session_v1'


function normalizeLegacyTurkishText(
  value: string,
): string {
  const replacements: Array<[string, string]> = [
    ['Demo Kullanici', 'Demo Kullanıcı'],
    ['Veri Bilimi & Yapay Zek?', 'Veri Bilimi & Yapay Zekâ'],
    ['Yapay Zek?', 'Yapay Zekâ'],
    ['Ayse Demir', 'Ayşe Demir'],
    ['Is Analizi', 'İş Analizi'],
    ['Is Analisti', 'İş Analisti'],
    ['Yazilim Gelistirme', 'Yazılım Geliştirme'],
    ['Yazilim Gelistirici', 'Yazılım Geliştirici'],
    ['Kalite G?vence / Test', 'Kalite Güvence / Test'],
    ['M?hendisi', 'Mühendisi'],
  ]

  return replacements.reduce(
    (normalized, [from, to]) =>
      normalized.replaceAll(from, to),
    value,
  )
}


export const ROLE_OPTIONS = [
  'Stajyer',
  'Yazılım Geliştirici',
  'Veri Bilimci / ML Mühendisi',
  'İş Analisti',
  'QA / Test Mühendisi',
  'Ürün Yöneticisi',
  'Proje Yöneticisi',
  'DevOps / Sistem Mühendisi',
  'Reviewer',
  'Takım Lideri',
  'Yönetici',
  'Diğer',
] as const


export interface UserProfile {
  userId: string
  fullName: string
  corporateEmail: string
  department: string
  role: string
  avatarId?: string
}


export type ProfileFieldKind =
  | 'department'
  | 'role'


export function normalizeProfileField(
  value: string,
  kind: ProfileFieldKind,
): string {
  const trimmed = value.trim()
  const key = trimmed.toLocaleLowerCase('tr-TR')

  if (
    kind === 'department'
    && (
      key === 'çözüm geliştirme'
      || key === 'cozum gelistirme'
      || key.includes('çözüm')
      || key.includes('cozum')
    )
  ) {
    return 'Çözüm Geliştirme'
  }

  if (
    kind === 'role'
    && (
      key === 'takım lideri'
      || key === 'takim lideri'
      || key === 'team lead'
      || key === 'teamlead'
      || (
        key.includes('tak')
        && key.includes('lider')
      )
    )
  ) {
    return 'Takım Lideri'
  }

  if (
    kind === 'role'
    && (
      key === 'kullanıcı'
      || key === 'team member'
      || key.includes('ekip')
    )
  ) {
    return 'Ekip Üyesi'
  }

  return trimmed
}


interface ProfileContextValue {
  profile: UserProfile | null
  authenticated: boolean

  saveProfile: (
    profile: UserProfile,
  ) => void

  clearProfile: () => void
}


const ProfileContext =
  createContext<
    ProfileContextValue | undefined
  >(undefined)


function readStoredProfile():
UserProfile | null {
  try {
    const raw =
      localStorage.getItem(
        STORAGE_KEY,
      )

    if (!raw) {
      return null
    }

    const parsed =
      JSON.parse(
        raw,
      ) as Partial<UserProfile>


    if (
      typeof parsed.userId
        !== 'string'
      || typeof parsed.fullName
        !== 'string'
      || typeof parsed.corporateEmail
        !== 'string'
      || typeof parsed.department
        !== 'string'
      || typeof parsed.role
        !== 'string'
    ) {
      localStorage.removeItem(
        STORAGE_KEY,
      )

      return null
    }


    return {
      userId:
        parsed.userId,

      fullName:
        normalizeLegacyTurkishText(
          parsed.fullName,
        ),

      corporateEmail:
        parsed.corporateEmail,

      department:
        normalizeProfileField(
          normalizeLegacyTurkishText(
            parsed.department,
          ),
          'department',
        ),

      role:
        normalizeProfileField(
          normalizeLegacyTurkishText(
            parsed.role,
          ),
          'role',
        ),

      avatarId:
        typeof parsed.avatarId === 'string'
          ? parsed.avatarId
          : undefined,
    }

  } catch {
    localStorage.removeItem(
      STORAGE_KEY,
    )

    return null
  }
}


interface ProfileProviderProps {
  children: ReactNode
}


export function ProfileProvider(
  {
    children,
  }: ProfileProviderProps,
) {
  const [
    profile,
    setProfile,
  ] = useState<UserProfile | null>(
    readStoredProfile,
  )

  const [
    authenticated,
    setAuthenticated,
  ] = useState(
    () => Boolean(
      readStoredProfile()
      && localStorage.getItem(AUTH_STORAGE_KEY) === 'true',
    ),
  )


  function saveProfile(
    newProfile: UserProfile,
  ) {
    const normalizedProfile = {
      ...newProfile,
      department: normalizeProfileField(
        newProfile.department,
        'department',
      ),
      role: normalizeProfileField(
        newProfile.role,
        'role',
      ),
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        normalizedProfile,
      ),
    )

    setProfile(
      normalizedProfile,
    )

    localStorage.setItem(
      AUTH_STORAGE_KEY,
      'true',
    )

    setAuthenticated(true)
  }


  function clearProfile() {
    localStorage.removeItem(
      STORAGE_KEY,
    )

    localStorage.removeItem(
      AUTH_STORAGE_KEY,
    )

    setProfile(
      null,
    )

    setAuthenticated(false)
  }


  const value =
    useMemo(
      () => ({
        profile,
        authenticated,
        saveProfile,
        clearProfile,
      }),
      [
        profile,
        authenticated,
      ],
    )


  return (
    <ProfileContext.Provider
      value={value}
    >
      {children}
    </ProfileContext.Provider>
  )
}


export function useProfile() {
  const context =
    useContext(
      ProfileContext,
    )

  if (!context) {
    throw new Error(
      'useProfile, ProfileProvider içerisinde kullanılmalıdır.',
    )
  }

  return context
}
