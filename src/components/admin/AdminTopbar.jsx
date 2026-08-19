import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Globe, LogOut, Menu, Settings2, UserRound } from 'lucide-react'

import NavbarDropdown from '../ui/NavbarDropdown'
import NotificationBell from '../ui/NotificationBell'
import { useAuth } from '../../context/AuthContext'
import useRecentUpdates from '../../hooks/useRecentUpdates'
import { ROUTES } from '../../constants/paths'

// شريط علوي خفيف خاص بمساحة الأدمن — يحل محل الـ Navbar المشترك
// (المخفي على مسارات /admin) ويوفّر نفس الوصول (إشعارات، بروفايل،
// تسجيل خروج، الرجوع للموقع) اللي كان موجود جوا قائمة الأدمن بالنافبار
export default function AdminTopbar({ onOpenSidebar }) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { items: recentUpdates } = useRecentUpdates()

  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isBellOpen, setIsBellOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate(ROUTES.HOME)
  }

  const dropdownItems = [
    { name: 'Profile', href: ROUTES.ADMIN_PROFILE, icon: UserRound },
    { name: 'Settings', href: ROUTES.ADMIN_SETTINGS, icon: Settings2 },
    { name: 'View site', href: ROUTES.HOME, icon: Globe },
    { name: 'Logout', icon: LogOut, onClick: handleLogout },
  ]

  return (
    
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-adminBorder bg-adminBg1 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onOpenSidebar}
        aria-label="Open admin menu"
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-adminBorder bg-adminBg2 text-adminTextHi transition hover:bg-white/6 lg:hidden"
      >
        <Menu size={20} aria-hidden="true" />
      </button>

      <div className="flex flex-1 items-center justify-end gap-2">
        <NotificationBell
          items={recentUpdates}
          isOpen={isBellOpen}
          onToggle={() => setIsBellOpen((current) => !current)}
          onClose={() => setIsBellOpen(false)}
          triggerClassName="relative flex h-10 w-10 items-center justify-center rounded-xl border border-adminBorder bg-adminBg2 text-adminTextHi transition hover:bg-white/6"
        />

        <NavbarDropdown
          isOpen={isProfileOpen}
          setIsOpen={setIsProfileOpen}
          trigger={
            <div className="flex items-center gap-2 rounded-xl border border-adminBorder bg-adminBg2 px-2.5 py-1.5 text-adminTextHi transition hover:bg-white/6">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user?.displayName || 'Admin account'}
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-adminAccent/15 text-adminAccentSoft">
                  <UserRound className="h-4 w-4" aria-hidden="true" />
                </div>
              )}
              <span className="hidden text-sm font-medium sm:inline">{user?.displayName || 'Admin'}</span>
            </div>
          }
          items={dropdownItems}
        />
      </div>
    </header>
  )
}
