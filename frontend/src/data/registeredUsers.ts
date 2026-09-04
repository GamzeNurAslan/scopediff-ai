export interface RegisteredUser {
  id: string
  fullName: string
  corporateEmail: string
  department: string
  role: string
  isActive: boolean
}


export const REGISTERED_USERS: RegisteredUser[] = [
  {
    id: 'USR-001',
    fullName: 'Demo Kullanıcı',
    corporateEmail: 'demo@company.com',
    department: 'Veri Bilimi & Yapay Zekâ',
    role: 'Stajyer',
    isActive: true,
  },

  {
    id: 'USR-002',
    fullName: 'Ayşe Demir',
    corporateEmail: 'ayse.demir@company.com',
    department: 'İş Analizi',
    role: 'İş Analisti',
    isActive: true,
  },

  {
    id: 'USR-003',
    fullName: 'Mert Kaya',
    corporateEmail: 'mert.kaya@company.com',
    department: 'Yazılım Geliştirme',
    role: 'Yazılım Geliştirici',
    isActive: true,
  },

  {
    id: 'USR-004',
    fullName: 'Selin Arslan',
    corporateEmail: 'selin.arslan@company.com',
    department: 'Kalite Güvence / Test',
    role: 'QA / Test Mühendisi',
    isActive: true,
  },

]


export function normalizeValue(
  value: string,
): string {
  return value
    .trim()
    .toLocaleLowerCase('tr-TR')
}


export function findUserByEmail(
  email: string,
): RegisteredUser | undefined {
  const normalizedEmail =
    normalizeValue(email)

  return REGISTERED_USERS.find(
    (user) =>
      normalizeValue(
        user.corporateEmail,
      ) === normalizedEmail,
  )
}


export function getDepartmentSuggestions():
string[] {
  return Array.from(
    new Set(
      REGISTERED_USERS
        .filter(
          (user) =>
            user.isActive,
        )
        .map(
          (user) =>
            user.department,
        ),
    ),
  ).sort(
    (a, b) =>
      a.localeCompare(
        b,
        'tr',
      ),
  )
}


export function getRoleSuggestions():
string[] {
  return Array.from(
    new Set(
      REGISTERED_USERS
        .filter(
          (user) =>
            user.isActive,
        )
        .map(
          (user) =>
            user.role,
        ),
    ),
  ).sort(
    (a, b) =>
      a.localeCompare(
        b,
        'tr',
      ),
  )
}
