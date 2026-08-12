// components/common/ImageUploader.jsx

import { Camera, Building2, User } from "lucide-react"

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
  shape = "circle",
  size = "md",
  fallbackIcon = "user",
  fallbackText,
  disabled = false,
  alt = "Profile",
}) {
  const FallbackIcon = fallbackIcon === "organization" ? Building2 : User

  return (
    <div className="relative inline-block">
      <div
        className={`${SIZE_CLASSES[size]} ${SHAPE_CLASSES[shape]} overflow-hidden border border-heading/10 flex items-center justify-center`}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={alt}
            className="w-full h-full object-cover transition-transform duration-200 hover:scale-[1.03]"
          />
        ) : fallbackText ? (
          <span className="text-primary font-bold text-2xl">{fallbackText}</span>
        ) : (
          <FallbackIcon className="text-primary/50" size={30} />
        )}
      </div>

      {!disabled && (
        <label
          className="absolute -bottom-2 -right-2 w-11 h-11 rounded-full bg-field border border-heading/10 flex items-center justify-center cursor-pointer hover:bg-primary/10 transition-colors shadow-sm focus-within:ring-2 focus-within:ring-primary/40"
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
    </div>
  )
}