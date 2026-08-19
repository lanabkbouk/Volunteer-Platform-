import { useState } from 'react'

import Typography from '../../components/ui/Typography'
import { ADMIN_PANEL_SURFACE } from '../../utils/adminStyles'
import AdminSidebar from '../../components/admin/AdminSidebar'
import AdminTopbar from '../../components/admin/AdminTopbar'

// هيكل مساحة الأدمن — شريط جانبي ثابت وكامل الارتفاع مثبت على حافة
// منفذ الرؤية (يستبدل الـ Navbar المشترك على مسارات /admin، راجع
// MainLayout.jsx)، مع عمود محتوى قابل للتمرير لحاله وشريط علوي خفيف
// (AdminTopbar) يوفّر نفس الوصول اللي كان بالنافبار (إشعارات، بروفايل،
// تسجيل خروج). كل صفحة أدمن بتلف نفسها بهالمكوّن لحالها (بدون Outlet
// مشترك) — نفس البنية القديمة، فقط الديكور الداخلي تغيّر
export default function AdminLayout({ eyebrow, title, description, actions, children }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-adminBg0">
      <AdminSidebar isMobileOpen={isMobileSidebarOpen} onCloseMobile={() => setIsMobileSidebarOpen(false)} />

      <div className="lg:pl-72 xl:pl-80">
        <AdminTopbar onOpenSidebar={() => setIsMobileSidebarOpen(true)} />

        <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {(title || description || actions || eyebrow) && (
            <section className={`${ADMIN_PANEL_SURFACE} p-6 md:p-8`}>
              {eyebrow && (
                <Typography variant="overline" className="text-adminAccentSoft!">
                  {eyebrow}
                </Typography>
              )}

              <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-2">
                  {title && (
                    <Typography variant="sectionTitle" className="text-3xl sm:text-4xl text-adminTextHi!">
                      {title}
                    </Typography>
                  )}

                  {description && (
                    <Typography variant="body" className="max-w-3xl text-adminTextLo!">
                      {description}
                    </Typography>
                  )}
                </div>

                {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
              </div>
            </section>
          )}

          <div className="space-y-6">{children}</div>
        </div>
      </div>
    </div>
  )
}