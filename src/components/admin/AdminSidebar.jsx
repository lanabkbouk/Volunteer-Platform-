import { useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Building2,
  Globe,
  LayoutDashboard,
  LogOut,
  MapPin,
  Settings2,
  ShieldCheck,
  Tags,
  UserCircle2,
  X,
} from 'lucide-react'

import Badge from '../common/Badge'
import LogoIcon from '../ui/LogoIcon'
import Typography from '../ui/Typography'
import { useAuth } from '../../context/AuthContext'
import { ROUTES } from '../../constants/paths'
import { CARD_SURFACE } from '../../utils/surfaceStyles'

const navigationSections = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', to: ROUTES.ADMIN_DASHBOARD, icon: LayoutDashboard },
      { label: 'Organization verification', to: ROUTES.ADMIN_ORGANIZATIONS, icon: ShieldCheck },
      { label: 'Categories', to: ROUTES.ADMIN_CATEGORIES, icon: Tags },
      { label: 'Cities', to: ROUTES.ADMIN_CITIES, icon: MapPin },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Profile', to: ROUTES.ADMIN_PROFILE, icon: UserCircle2 },
      { label: 'Settings', to: ROUTES.ADMIN_SETTINGS, icon: Settings2 },
    ],
  },
]

function NavigationLink({ item, onNavigate }) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.to}
      end={item.to === ROUTES.ADMIN_DASHBOARD}
      onClick={onNavigate}
      className={({ isActive }) =>
        [
          'group flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition',
          isActive
            ? 'border-primary/20 bg-primary/10 text-primary'
            : 'border-transparent bg-transparent text-body hover:border-heading/10 hover:bg-heading/5 hover:text-heading',
        ].join(' ')
      }
    >
      <span className="rounded-xl bg-current/10 p-2">
        <Icon size={16} aria-hidden="true" />
      </span>
      <span className="min-w-0 truncate">{item.label}</span>
    </NavLink>
  )
}

// المحتوى الفعلي للشريط الجانبي — مستقل عن كونه ثابت (Desktop) أو
// درج منزلق (Mobile) حتى ما نكرر نفس الماركب مرتين
function SidebarContent({ onNavigate }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate(ROUTES.HOME)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-heading/10 px-5 py-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-white">
          <LogoIcon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <Typography variant="h6" className="truncate">
            Volunteer Platform
          </Typography>
          <Typography variant="caption" className="truncate text-body/60">
            Admin workspace
          </Typography>
        </div>
      </div>

      <div className="px-4 pt-4">
        <div className={`${CARD_SURFACE} p-4`}>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user?.displayName || 'Admin account'}
                  className="h-11 w-11 rounded-2xl object-cover"
                />
              ) : (
                <Building2 size={20} aria-hidden="true" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <Typography variant="h6" className="truncate">
                {user?.displayName || 'System administrator'}
              </Typography>
              <Typography variant="caption" className="mt-0.5 truncate text-body/70">
                {user?.email || 'Admin account'}
              </Typography>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Badge label="System admin" tone="primary" />
          </div>
        </div>
      </div>

      <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4" aria-label="Admin navigation">
        {navigationSections.map((section) => (
          <div key={section.title} className="space-y-1.5">
            <Typography variant="overline" className="px-2 text-body/60">
              {section.title}
            </Typography>

            <div className="space-y-1">
              {section.items.map((item) => (
                <NavigationLink key={item.to} item={item} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-1 border-t border-heading/10 px-4 py-4">
        <NavLink
          to={ROUTES.HOME}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium text-body transition hover:bg-heading/5 hover:text-heading"
        >
          <Globe size={16} aria-hidden="true" />
          <span>View site</span>
        </NavLink>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium text-danger transition hover:bg-danger/10"
        >
          <LogOut size={16} aria-hidden="true" />
          <span>Log out</span>
        </button>
      </div>
    </div>
  )
}

export default function AdminSidebar({ isMobileOpen = false, onCloseMobile }) {
  useEffect(() => {
    if (!isMobileOpen) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape') onCloseMobile?.()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isMobileOpen, onCloseMobile])

  return (
    <>
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-72 lg:flex-col lg:border-r lg:border-heading/10 lg:bg-bg xl:w-80">
        <SidebarContent />
      </aside>

      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div aria-hidden="true" className="absolute inset-0 bg-black/50" onClick={onCloseMobile} />

          <div className="animate-shell-in relative flex h-full w-72 max-w-[85vw] flex-col border-r border-heading/10 bg-field shadow-2xl">
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close admin menu"
              className="absolute right-3 top-4 flex h-9 w-9 items-center justify-center rounded-xl text-body transition hover:bg-heading/5 hover:text-heading"
            >
              <X size={18} aria-hidden="true" />
            </button>

            <SidebarContent onNavigate={onCloseMobile} />
          </div>
        </div>
      )}
    </>
  )
}
