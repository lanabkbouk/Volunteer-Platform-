// قسم إدارة عام (عنوان + وصف + زر إضافة + قائمة/تحميل/فارغ) — نفس
// الهيكل بالضبط مطلوب لقسمي "التصنيفات" و"المهارات"، فبدل ما نكرره
// مرتين، هاد الـ wrapper بياخد العنصر الجاهز للعرض عبر renderItem
// (Render Prop) ويهتم هو بحالات التحميل/الفراغ فقط.

import { Plus } from 'lucide-react'
import Typography from '../ui/Typography'
import Skeleton from '../ui/Skeleton'
import Button from '../ui/Button'
import AuthAlert from '../auth/AuthAlert'
import EmptyState from '../common/EmptyState'
import { ADMIN_CARD_SURFACE } from '../../utils/adminStyles'

export default function CatalogSection({
  title,
  description,
  addLabel,
  onAdd,
  items,
  isLoading,
  // فشل الجلب (اختياري) — لو ما تم تمريره، السلوك القديم يضل تمامًا
  // كما هو (isError افتراضيًا false، فما في أي تأثير على أي استخدام
  // ما بيمرر هالـ props الجديدة)
  isError = false,
  errorMessage = 'Failed to load items',
  onRetry,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  renderItem,
}) {
  return (
    <section>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <Typography variant="h4" className="text-adminTextHi!">{title}</Typography>
          {description && (
            <Typography variant="bodySm" className="text-adminTextLo! mt-1">
              {description}
            </Typography>
          )}
        </div>

        <Button variant="primary" size="small" onClick={onAdd} className="flex items-center gap-1 shrink-0">
          <Plus size={16} />
          {addLabel}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className={`${ADMIN_CARD_SURFACE} p-4`}>
              <Skeleton className="h-5 w-1/3 mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : isError ? (
        // فشل الجلب لازم يظهر كخطأ صريح مع إعادة محاولة، مش كقائمة فاضية
        <div className="flex flex-col items-start gap-3">
          <AuthAlert variant="error">{errorMessage}</AuthAlert>
          {onRetry && (
            <Button variant="danger" size="small" onClick={onRetry}>
              Retry
            </Button>
          )}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} dark />
      ) : (
        <div className="flex flex-col gap-3">{items.map(renderItem)}</div>
      )}
    </section>
  )
}