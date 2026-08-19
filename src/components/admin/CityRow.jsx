// نفس بنية CategoryRow/SkillRow بالضبط — عرض صف واحد لمدينة/محافظة
// (الاسمين عربي وإنجليزي) مع شارة الحالة وزري تعديل وتفعيل/تعطيل.
//
// ⚠️ قرار: أبقينا زر التعديل (Pencil) رغم أن اسم المدينة (nameEn) صار
// مقفولًا بعد الإنشاء — لأنه لسا فيه حقل فعلي قابل للتعديل بمعنى حقيقي:
// nameAr (الاسم العربي المعروض) مجرد تسمية عرض، مش قيمة مرجعية بأي سجل
// قديم، فتصحيح خطأ إملائي فيها يضل عملية مشروعة. لو الفورم كان بيحتوي
// حقل nameEn وحيد بس (بدون nameAr)، كان الأصح نخفي الزر بالكامل بدل ما
// نفتح فورم بحقله الوحيد معطّل بدون أي فايدة.

import { Pencil, Power } from 'lucide-react'
import Button from '../ui/Button'
import Badge from '../common/Badge'
import { ADMIN_CARD_BASE, ADMIN_GHOST_BUTTON } from '../../utils/adminStyles'

export default function CityRow({ city, onEdit, onToggleStatus, isTogglingStatus }) {
  const isActive = city.isActive !== false

  return (
    <div className={`${ADMIN_CARD_BASE} flex flex-col gap-4 md:flex-row md:items-center md:justify-between`}>
      <div className="flex flex-wrap items-center gap-2 min-w-0">
        <h3 className="font-semibold text-adminTextHi truncate">{city.nameEn}</h3>
        <Badge label={isActive ? 'Active' : 'Inactive'} tone={isActive ? 'success' : 'neutral'} dark />
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button variant="ghost" size="small" onClick={() => onEdit(city)} className={`min-h-11 min-w-11 ${ADMIN_GHOST_BUTTON}`} aria-label={`Edit ${city.nameEn}`}>
          <Pencil size={16} />
        </Button>
        <Button
          variant="ghost"
          size="small"
          disabled={isTogglingStatus}
          onClick={() => onToggleStatus(city)}
          className={`min-h-11 min-w-11 ${ADMIN_GHOST_BUTTON} ${isActive ? 'text-danger! hover:bg-danger/10!' : 'text-success! hover:bg-success/10!'}`}
          aria-label={isActive ? `Deactivate ${city.nameEn}` : `Activate ${city.nameEn}`}
        >
          <Power size={16} />
        </Button>
      </div>
    </div>
  )
}
