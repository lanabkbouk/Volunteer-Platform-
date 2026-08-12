// نفس بنية CategoryRow/SkillRow بالضبط — عرض صف واحد لمدينة/محافظة
// (الاسمين عربي وإنجليزي) مع زري تعديل وحذف.

import { Pencil, Trash2 } from 'lucide-react'
import Button from '../ui/Button'
import Badge from '../common/Badge'
import { CARD_BASE } from '../../utils/surfaceStyles'

export default function CityRow({ city, onEdit, onDelete, isDeleting }) {
  return (
    <div className={`${CARD_BASE} flex flex-col gap-4 md:flex-row md:items-center md:justify-between`}>
      <div className="flex flex-wrap items-center gap-2 min-w-0">
        <h3 className="font-semibold text-heading truncate">{city.nameEn}</h3>
        <Badge label={city.nameAr} tone="neutral" />
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button variant="ghost" size="small" onClick={() => onEdit(city)} className="min-h-11 min-w-11" aria-label={`Edit ${city.nameEn}`}>
          <Pencil size={16} />
        </Button>
        <Button
          variant="ghost"
          size="small"
          disabled={isDeleting}
          onClick={() => onDelete(city)}
          className="min-h-11 min-w-11 text-danger hover:bg-danger/10"
          aria-label={`Delete ${city.nameEn}`}
        >
          <Trash2 size={16} />
        </Button>
      </div>
    </div>
  )
}
