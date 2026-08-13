// components/common/UploadRow.jsx
//
// صف رفع صورة بشكل "صورة صغيرة + نص + زر ملف مخفي" — كان مكرّرًا حرفيًا
// بين RejectedVerificationPanel.jsx (رفع وثيقة توثيق جديدة) وforms/orgForm.jsx
// (صورة توثيق المنظمة بالتسجيل). يعيد استخدام ImageUploader (المعطّل بصريًا
// هون لأن الصف بالكامل هو الزر الفعلي، لا الصورة الصغيرة لحالها).

import ImageUploader from "./ImageUploader";

export default function UploadRow({
  fieldId,
  previewUrl,
  onFileChange,
  accept = "image/jpeg,image/png,image/webp",
  fallbackIcon = "organization",
  changeText,
  uploadText,
  helperText = "JPG, PNG or WEBP — up to 2MB",
  error,
  className = "flex w-full cursor-pointer items-center gap-4 rounded-xl border border-heading/10 bg-field px-4 py-3 transition-colors hover:border-primary/40 focus-within:ring-2 focus-within:ring-primary/40",
}) {
  const errorId = error ? `${fieldId}-error` : undefined;

  return (
    <div className="flex w-full flex-col gap-1">
      <label htmlFor={fieldId} className={className}>
        <ImageUploader
          previewUrl={previewUrl}
          shape="square"
          size="sm"
          fallbackIcon={fallbackIcon}
          disabled
        />
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-heading">
            {previewUrl ? changeText : uploadText}
          </span>
          <span className="text-xs text-body/70">{helperText}</span>
        </div>
        <input
          id={fieldId}
          type="file"
          accept={accept}
          className="sr-only"
          aria-describedby={errorId}
          onChange={onFileChange}
        />
      </label>

      {error && (
        <p id={errorId} className="mt-1 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
