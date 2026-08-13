import {
  Bot,
  Cat,
  Coffee,
  Rocket,
  Sparkles,
  UserRound,
  type LucideIcon,
} from 'lucide-react'


export interface ProfileAvatarOption {
  id: string
  label: string
  icon: LucideIcon
}


export const PROFILE_AVATAR_OPTIONS:
ProfileAvatarOption[] = [
  { id: 'person', label: 'İnsan', icon: UserRound },
  { id: 'cat', label: 'Kedi', icon: Cat },
  { id: 'rocket', label: 'Roket', icon: Rocket },
  { id: 'coffee', label: 'Kahve', icon: Coffee },
  { id: 'sparkles', label: 'Işıltı', icon: Sparkles },
  { id: 'bot', label: 'Robot', icon: Bot },
]


export function getProfileAvatar(
  avatarId?: string,
): ProfileAvatarOption {
  return (
    PROFILE_AVATAR_OPTIONS.find(
      (option) => option.id === avatarId,
    )
    ?? PROFILE_AVATAR_OPTIONS[0]
  )
}


interface ProfileAvatarProps {
  avatarId?: string
  initials?: string
  className?: string
}


function ProfileAvatar(
  {
    avatarId,
    initials,
    className = '',
  }: ProfileAvatarProps,
) {
  const avatar = getProfileAvatar(avatarId)
  const Icon = avatar.icon

  return (
    <span
      className={`profile-avatar-art profile-avatar-art-${avatar.id} ${className}`}
      data-initials={initials}
    >
      <Icon
        size={18}
        strokeWidth={2.2}
      />
    </span>
  )
}


export default ProfileAvatar
