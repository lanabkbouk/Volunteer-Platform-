import { Pencil, Trash2 } from 'lucide-react'
import Button from '../ui/Button'
import Badge from '../common/Badge'
import { ADMIN_CARD_BASE, ADMIN_GHOST_BUTTON } from '../../utils/adminStyles'
import { getCategoryTheme, getCategoryLabel } from '../../utils/categoryStyles'

export default function CategoryRow({ category, onEdit, onDelete, isDeleting }) {
  const opportunitiesCount = category.opportunitiesCount ?? 0
  // اللون هون معروض فقط للتوضيح — الأدمن ما بيختاره يدويًا، هو محسوب
  // تلقائيًا وثابت لكل فئة (راجع categoryStyles.js)، فهاي النقطة بس
  // بتأكّد له إنه الفئة الجديدة صار إلها لون مميّز فورًا بكل الموقع
  const theme = getCategoryTheme(category.name)

  return (
    <div className={`${ADMIN_CARD_BASE} flex flex-col gap-4 md:flex-row md:items-center md:justify-between`}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full shrink-0 ${theme.dot}`}
            aria-hidden="true"
          />
          <h3 className="text-base font-semibold text-adminTextHi">{getCategoryLabel(category.name)}</h3>
          <Badge
            label={`${opportunitiesCount} opportunit${opportunitiesCount === 1 ? 'y' : 'ies'}`}
            tone="neutral"
            dark
          />
        </div>

        <p className="mt-1 text-sm text-adminTextLo line-clamp-2">
          {category.description || 'No description provided.'}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="ghost"
          size="small"
          onClick={() => onEdit(category)}
          className={`min-h-11 min-w-11 ${ADMIN_GHOST_BUTTON}`}
          aria-label={`Edit ${getCategoryLabel(category.name)}`}
        >
          <Pencil size={16} />
        </Button>
        <Button
          variant="ghost"
          size="small"
          disabled={isDeleting}
          onClick={() => onDelete(category)}
          className={`min-h-11 min-w-11 ${ADMIN_GHOST_BUTTON} text-danger! hover:bg-danger/10!`}
          aria-label={`Delete ${getCategoryLabel(category.name)}`}
        >
          <Trash2 size={16} />
        </Button>
      </div>
    </div>
  )
}