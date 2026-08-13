import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import Button from './Button'
import Typography from './Typography'
import { CARD_SURFACE, CARD_ELEVATION } from '../../utils/surfaceStyles'

export default function Card({
  as: Component = 'div',
  className = '',
  children,
  title,
  description,
  imageSrc,
  imageAlt,
  imageFallback,
  badge,
  titleAdornment,
  actionLabel = 'View Details',
  onAction,
  contentClassName = '',
  buttonClassName = '',
  mediaClassName = '',
  ...props
}) {
  // رابط صورة صحيح شكليًا بس معطوب/محذوف (404) كان يطلع أيقونة المتصفح
  // المكسورة الافتراضية بدل fallback الـ ImageOff الجاهز أصلًا تحت.
  // تصفير الحالة بيصير مباشرة أثناء الـ render (نمط React الموصى فيه
  // لضبط state حسب تغيّر prop) بدل useEffect، تفاديًا لـ render إضافي
  const [imageFailed, setImageFailed] = useState(false)
  const [lastImageSrc, setLastImageSrc] = useState(imageSrc)
  if (imageSrc !== lastImageSrc) {
    setLastImageSrc(imageSrc)
    setImageFailed(false)
  }

  const showImage = imageSrc && !imageFailed

  return (
    <Component
      className={[
        CARD_SURFACE,
        CARD_ELEVATION,
        'w-full overflow-hidden flex flex-col',
        className,
      ].join(' ')}
      {...props}
    >
      {/* الصورة */}
      <div className={['relative w-full overflow-hidden rounded-t-2xl', mediaClassName].join(' ')}>
        {badge && <div className="absolute top-3 left-3 z-10">{badge}</div>}
        {showImage ? (
          <img
            src={imageSrc}
            alt={imageAlt || title || 'Project image'}
            onError={() => setImageFailed(true)}
            className="w-full aspect-video object-cover block"
          />
        ) : imageFallback ? (
          imageFallback
        ) : (
          <div className="flex w-full aspect-video items-center justify-center bg-heading/5 text-heading/40">
            <ImageOff className="h-8 w-8" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* المحتوى */}
      <div className={['px-6 py-6 flex flex-1 flex-col', contentClassName].join(' ')}>
        {title && (
          <div className="flex items-start justify-between gap-2 mb-2">
            <Typography variant="h3" color="heading" className="text-2xl font-bold line-clamp-2">
              {title}
            </Typography>
            {titleAdornment}
          </div>
        )}

        {description && (
          <Typography
            variant="bodySm"
            className="mb-6 text-[14px] text-body leading-relaxed line-clamp-3"
          >
            {description}
          </Typography>
        )}

        {/* الزر */}
        <div className="mt-auto">
          {children || (
            <Button
              variant="secondary"
              fullWidth
              onClick={onAction}
              className={[
                'py-4 rounded-xl text-[15px] font-bold uppercase tracking-wide',
                buttonClassName,
              ].join(' ')}
            >
              {actionLabel}
            </Button>
          )}
        </div>
      </div>
    </Component>
  )
}