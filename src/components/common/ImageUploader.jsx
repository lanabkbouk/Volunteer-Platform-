// components/common/ImageUploader.jsx

import { Camera, Building2, User, X } from "lucide-react"
import ClickableAvatar from "./ClickableAvatar"

const SHAPE_CLASSES = {
  circle: "rounded-full",
  square: "rounded-2xl",
}

const SIZE_CLASSES = {
  sm: "w-16 h-16",
  md: "w-24 h-24 md:w-28 md:h-28",
  lg: "w-32 h-32 md:w-40 md:h-40",
}

export default function ImageUploader({
  previewUrl,
  onFileChange,
  // اختياري — لو مُمرَّر، بيظهر زر إزالة صغير (X) بس لما فيه previewUrl
  // فعليًا. بدونه (مثلاً بشاشات ما بتدعم إزالة الصورة)، السلوك القديم
  // يضل زي ما هو تمامًا
  onRemove,
  shape = "circle",
  size = "md",
  fallbackIcon = "user",
  fallbackText,
  disabled = false,
}) {
  const FallbackIcon = fallbackIcon === "organization" ? Building2 : User

  const preview = (
    <div
      className={`${SIZE_CLASSES[size]} ${SHAPE_CLASSES[shape]} overflow-hidden border border-heading/10 flex items-center justify-center ${!previewUrl ? 'bg-primary/10' : ''}`}
    >
      {previewUrl ? (
        <img
          src={previewUrl}
          alt="Profile"
          className="w-full h-full object-cover transition-transform duration-200 hover:scale-[1.03]"
        />
      ) : fallbackText ? (
        <span className="text-primary font-bold text-2xl">{fallbackText}</span>
      ) : (
        <FallbackIcon className="text-primary/50" size={30} />
      )}
    </div>
  )

  return (
    <div className="relative inline-block">
      {/* disabled=true يعني هالمكوّن مستخدم كصورة مصغّرة جوا عنصر أكبر
          هو الزر الفعلي لحاله (مثلًا UploadRow.jsx: الصف كامل تحت label
          واحد بيفتح منتقي الملف). ClickableAvatar بترندر <button>، ولو
          لفّينا فيها هون كمان بهالحالة كان بيصير button جوا label —
          نقر الصورة المصغّرة كان رح يفتح Lightbox بدل منتقي الملف. فبنلف
          بس لما disabled=false (استخدام مستقل بلا عنصر أكبر يحتويه) */}
      {disabled ? (
        preview
      ) : (
        <ClickableAvatar src={previewUrl} alt="Profile photo">
          {preview}
        </ClickableAvatar>
      )}

      {!disabled && (
        <label
          className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-field border border-heading/10 flex items-center justify-center cursor-pointer hover:bg-primary/10 transition-colors shadow-sm focus-within:ring-2 focus-within:ring-primary/40"
        >
          <span className="sr-only">Change the image</span>
          <Camera size={16} className="text-primary" />
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={onFileChange}
          />
        </label>
      )}

      {/* زر الإزالة — بأعلى اليسار، حتى ما يتداخل بصريًا مع زر الكاميرا
          بأسفل اليمين. يظهر فقط لما فيه صورة فعلية معروضة، مو أيقونة/حرف
          افتراضي (إزالة "لا شيء" ما إلها معنى) */}
      {!disabled && onRemove && previewUrl && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full bg-danger text-white flex items-center justify-center shadow-sm hover:bg-danger/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-danger/40"
        >
          <span className="sr-only">Remove photo</span>
          <X size={14} />
        </button>
      )}
    </div>
  )
}