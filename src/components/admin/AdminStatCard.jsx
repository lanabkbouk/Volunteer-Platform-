import Typography from '../ui/Typography'
import { CARD_BASE } from '../../utils/surfaceStyles'

const ACCENT_STYLES = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-amber-500/10 text-amber-700',
  danger: 'bg-danger/10 text-danger',
  secondary: 'bg-secondary/10 text-secondary',
  neutral: 'bg-heading/5 text-heading',
}

export default function AdminStatCard({ label, value, description, icon: Icon, accent = 'primary' }) {
  return (
    <article className={`${CARD_BASE} p-5 md:p-6`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Typography variant="overline" className="text-body/70">
            {label}
          </Typography>

          <Typography variant="h3" className="mt-2">
            {value}
          </Typography>

          {description && (
            <Typography variant="bodySm" className="mt-2 text-body">
              {description}
            </Typography>
          )}
        </div>

        {Icon && (
          <div className={`rounded-2xl p-3 ${ACCENT_STYLES[accent] || ACCENT_STYLES.primary}`}>
            <Icon size={20} aria-hidden="true" />
          </div>
        )}
      </div>
    </article>
  )
}