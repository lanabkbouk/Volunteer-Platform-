import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LogIn,
  Menu,
  UserPlus,
  X,
  UserIcon,
  LogOut,
  Settings2,
  UserRound,
  ChevronDown,
  Globe,
  Compass,
  Building2
} from "lucide-react";

import { ROUTES } from "../../constants/paths";
import { ACCOUNT_TYPES } from "../../constants/auth/accountTypes";
import { linksByRole } from "../../constants/navLinks";

import LogoIcon from "../../components/ui/LogoIcon";
import Button from "../../components/ui/Button";
import NavbarDropdown from "../../components/ui/NavbarDropdown";
import NotificationBell from "../../components/ui/NotificationBell";
import { useAuth } from "../../context/AuthContext";
import useRecentUpdates from "../../hooks/useRecentUpdates";
import { getOrganizationId } from "../../utils/auth/getOrganizationId";

export default function Navbar({ role = "guest" }) {
  const navigate = useNavigate();
  const { user, accountType, isAuthenticated, logout } = useAuth();
  const { items: recentUpdates } = useRecentUpdates();
  // بيوصل من AuthContext (real API) أو محليًا (mock mode بعد التسجيل —
  // راجع registerUser بـ services/auth.js). زر الـ Dashboard لازم
  // يعتمد على وجوده فعليًا، مش بس على نوع الحساب
  const organizationId = getOrganizationId(user);

  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isBellOpen, setIsBellOpen] = useState(false);
  // ⚠️ avatarUrl ممكن يكون موجود (قيمة نصية) بس يفشل التحميل الفعلي
  // (رابط منتهي/معطوب) — بدون هالحالة، وسم <img> المكسور كان يعرض نص
  // الـ alt (اسم المستخدم) مقصوص جوا دائرة صغيرة بدل أيقونة واضحة
  // ⚠️ نخزّن الرابط الفاشل نفسه (مش true/false) — لما avatarUrl يتغيّر
  // (صورة جديدة بعد وحدة معطوبة)، المقارنة تحت بتصير false تلقائيًا
  // بدون أي useEffect لإعادة الضبط يدويًا
  const [failedAvatarUrl, setFailedAvatarUrl] = useState(null);
  // ⚠️ أي رابط blob: باقٍ بالجلسة من قبل إصلاح services/volunteer.js
  // (راجع fileToDataUrl.js) مضمون 100% إنه معطوب بعد أي reload — رابط
  // blob: مربوط بذاكرة التبويب السابق فقط. ما في داعي حتى نحاول
  // تحميله ونستنى onError؛ نتعامل معه كـ"فاشل" فورًا من أول render
  const isStaleBlobUrl = user?.avatarUrl?.startsWith("blob:");
  const avatarLoadFailed = isStaleBlobUrl || failedAvatarUrl === user?.avatarUrl;
  const isOrganization = accountType === ACCOUNT_TYPES.ORGANIZATION;
  const FallbackIcon = isOrganization ? Building2 : UserIcon;  
  
  const handleLogout = () => {
    logout();
    navigate(ROUTES.HOME);
  };

  const profileHref =
    accountType === ACCOUNT_TYPES.ADMIN
      ? ROUTES.ADMIN_PROFILE
      : accountType === ACCOUNT_TYPES.VOLUNTEER
        ? ROUTES.VOLUNTEER_PROFILE
        : ROUTES.ORGANIZATION_PROFILE;

  const dropdownItems = [
    {
      name: accountType === ACCOUNT_TYPES.ADMIN ? "Profile" : "My Profile",
      href: profileHref,
      icon: UserRound,
    },
  ];

  if (accountType === ACCOUNT_TYPES.VOLUNTEER) {
    dropdownItems.push({
      name: "My Journey",
      href: ROUTES.MY_JOURNEY,
      icon: Compass,
    });
  }

  if (accountType === ACCOUNT_TYPES.ADMIN) {
    dropdownItems.push({
      name: "Settings",
      href: ROUTES.ADMIN_SETTINGS,
      icon: Settings2,
    });
  }

  dropdownItems.push({
    name: "Logout",
    icon: LogOut,
    onClick: handleLogout,
  });

  const baseLinks = [{ name: "Home", href: ROUTES.HOME }];
  const aboutLink = { name: "About Us", href: ROUTES.ABOUT };
  const isAdmin = accountType === ACCOUNT_TYPES.ADMIN;

  // "Dashboard" مرتبط فعليًا بمنظمة موثّقة بـ id — لو مش متوفر بعد
  // (مثلًا مباشرة بعد التسجيل بوضع real API لسا ما وصل)، منخفيه بدل ما
  // يوصل المستخدم لصفحة داشبورد بدون organizationId صالح
  const roleLinks = (linksByRole[role] || []).filter(
    (link) => link.name !== "Dashboard" || Boolean(organizationId)
  );

  // شاشات الأدمن عندها تنقّلها الخاص بالكامل بـ AdminSidebar (يسار
  // الشاشة) — أي رابط تاني هون بيصير تكرار. النافبار هون بيقتصر على
  // رابط وحيد وواضح: "View site"، أي مخرج صريح لوضع المستخدم العادي،
  // بدل قائمة Home/About Us العامة يلي ما إلها معنى واضح جوا سياق إدارة
  const allLinks = isAdmin
    ? [{ name: "View site", href: ROUTES.HOME, icon: Globe }]
    : [...baseLinks, ...roleLinks, aboutLink];

  const linkClass = ({ isActive }) =>
    `relative inline-flex py-2 transition duration-300 ${
      isActive ? "text-primary" : "text-white hover:text-primary"
    }`;

  return (
    <nav className="sticky top-0 z-50 w-full bg-black border-b border-white/10">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between">

          {/* Logo */}
          <NavLink to={ROUTES.HOME} className="flex items-center gap-3">
            <LogoIcon className="h-6 w-6 text-white" />
            <span className="text-2xl font-semibold text-white">
              Volunteer Platform
            </span>
          </NavLink>

          {/* Right Section */}
          <div className="flex items-center gap-3 md:order-2">

            {!isAuthenticated ? (
              <div className="hidden md:flex items-center gap-3">

                {/* Create Account */}
                <Button
                  onClick={() => navigate(ROUTES.REGISTER)}
                  variant="primary"
                  size="medium"
                  className="flex items-center gap-2 rounded-2xl px-5 py-2.5 
                             text-[15px] font-medium shadow-sm hover:shadow-md 
                             border border-primary/40"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Create Account</span>
                </Button>

                {/* Sign In */}
                <Button
                  onClick={() => navigate(ROUTES.LOGIN)}
                  variant="ghost"
                  size="medium"
                  className="
                    flex items-center gap-2
                    rounded-2xl
                    bg-black
                    text-white
                    border border-primary
                    px-5 py-2.5 text-[15px] font-medium
                    transition hover:opacity-90
                  "
                >
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </Button>

              </div>
            ) : (
              <div className="flex items-center gap-2">
                <NotificationBell
                  items={recentUpdates}
                  isOpen={isBellOpen}
                  onToggle={() => setIsBellOpen((current) => !current)}
                  onClose={() => setIsBellOpen(false)}
                />

                <NavbarDropdown
                  isOpen={isProfileOpen}
                  setIsOpen={setIsProfileOpen}
                  trigger={
                    <div className="flex items-center gap-2 rounded-2xl px-3 py-2 
                                    bg-white/10 border border-white/15
                                    text-white hover:bg-white/15 hover:border-white/25 
                                    transition">
                      {user?.avatarUrl && !avatarLoadFailed ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.displayName}
                          className="h-7 w-7 rounded-full object-cover border-2 border-primary/70"
                          onError={() => setFailedAvatarUrl(user.avatarUrl)}
                        />
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                          <FallbackIcon className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <span className="text-sm sm:text-base">
                        {user?.displayName}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-white/60 transition-transform ${
                          isProfileOpen ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  }
                  items={dropdownItems}
                />
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              onClick={() => setIsOpen(!isOpen)}
              variant="ghost"
              size="small"
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
              className="p-2 rounded-xl bg-heading/10 text-white 
                         hover:bg-heading/20 md:hidden"
            >
              {isOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
            </Button>

          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex md:w-auto md:order-1">
            <ul className="flex flex-row items-center gap-8 font-medium text-[16px]">
              {allLinks.map((link) => (
                <li key={link.name}>
                  <NavLink to={link.href} className={linkClass}>
                    <span className="flex items-center gap-1.5">
                      {link.icon && <link.icon size={16} aria-hidden="true" />}
                      {link.name}
                    </span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`overflow-hidden transition-all duration-300 md:hidden ${
            isOpen ? "mt-4 max-h-150 pb-4 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <ul className="flex flex-col items-start space-y-1 border-t border-white/10 pt-4 font-medium text-[15px]">
            {allLinks.map((link) => (
              <li key={link.name} className="w-full">
                <NavLink
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `block w-full px-3 py-3 transition ${
                      isActive ? "text-primary" : "text-white"
                    }`
                  }
                >
                  <span className="flex items-center gap-2">
                    {link.icon && <link.icon size={16} aria-hidden="true" />}
                    {link.name}
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>

          {/* تسجيل الدخول/إنشاء حساب — غير موجودين إطلاقًا بأعلى الناف بار
              تحت md، فلازم يكونوا هون حتى يقدر الزائر يوصلهم من الموبايل */}
          {!isAuthenticated && (
            <div className="flex flex-col gap-3 border-t border-white/10 pt-4 mt-2">
              <Button
                onClick={() => {
                  setIsOpen(false);
                  navigate(ROUTES.REGISTER);
                }}
                variant="primary"
                fullWidth
                className="flex items-center justify-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                <span>Create Account</span>
              </Button>

              <Button
                onClick={() => {
                  setIsOpen(false);
                  navigate(ROUTES.LOGIN);
                }}
                variant="ghost"
                fullWidth
                className="flex items-center justify-center gap-2 bg-black! text-white! border-primary!"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}