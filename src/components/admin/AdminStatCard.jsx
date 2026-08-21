import Typography from '../ui/Typography'
import { ADMIN_CARD_BASE } from '../../utils/adminStyles'

const ACCENT_STYLES = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-amber-500/10 text-amber-400',
  danger: 'bg-danger/10 text-danger',
  secondary: 'bg-adminAccent/15 text-adminAccentSoft',
  neutral: 'bg-white/5 text-adminTextLo',
}

export default function AdminStatCard({ label, value, description, icon: Icon, accent = 'secondary' }) {
  return (
    <article className={`${ADMIN_CARD_BASE} p-4 sm:p-5 md:p-6`}>
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <Typography variant="overline" className="text-adminTextLo!">
            {label}
          </Typography>

          <Typography variant="h3" className="mt-1.5 sm:mt-2 text-adminTextHi!">
            {value}
          </Typography>

          {description && (
            <Typography variant="bodySm" className="mt-1.5 sm:mt-2 text-adminTextLo! line-clamp-2">
              {description}
            </Typography>
          )}
        </div>

        {Icon && (
          <div className={`shrink-0 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 ${ACCENT_STYLES[accent] || ACCENT_STYLES.secondary}`}>
            <Icon size={20} aria-hidden="true" />
          </div>
        )}
      </div>
    </article>
  )
}