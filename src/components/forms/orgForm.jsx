import Input from '../ui/Input'
import ImageUploader from '../common/ImageUploader'

// نموذج بيانات المنظمة فقط (UI بدون منطق) — منطق رفع/معاينة/التحقق من
// صورة التوثيق موجود بـ Register.jsx (عبر useImageUpload)، هون بس عرض
export default function OrganizationForm({
  register,
  errors,
  onFieldChange,
  verificationImagePreview,
  verificationImageError,
  onVerificationImageChange,
}) {
  return (
    <>
      <Input
        label='Organization Name'
        type='text'
        name='orgName'
        register={register}
        registerOptions={{ onChange: onFieldChange }}
        placeholder='Your Organization'
        error={errors?.orgName?.message}
        required
      />

      <Input
        label='Contact Person'
        type='text'
        name='contactPerson'
        register={register}
        registerOptions={{ onChange: onFieldChange }}
        placeholder='Full Name'
        error={errors?.contactPerson?.message}
        required
      />

      {/* حقل رفع صورة التوثيق: الصف بالكامل قابل للنقر (label واحد يلف
          كل شي) بدل الاعتماد على أيقونة كاميرا صغيرة داخل الصورة — تصميم
          أوضح وأسهل بالاستخدام، خصوصًا إنه النص جنب الصورة أصلاً بيشرح
          إنه المنطقة كاملة قابلة للنقر. */}
      <div className='flex w-full flex-col gap-1'>
        <label htmlFor='verificationImage' className='mb-1 text-sm font-medium text-heading'>
          Organization Verification Image
          <span className='ml-1 text-primary'>*</span>
        </label>

        <label
          className='flex w-full cursor-pointer items-center gap-4 rounded-xl border border-heading/10 bg-field px-4 py-3 transition-colors hover:border-primary/40 focus-within:ring-2 focus-within:ring-primary/40'
        >
          <ImageUploader
            previewUrl={verificationImagePreview}
            shape='square'
            size='sm'
            fallbackIcon='organization'
            disabled
          />
          <div className='flex flex-col gap-0.5'>
            <span className='text-sm font-medium text-heading'>
              {verificationImagePreview ? 'Change verification image' : 'Upload verification image'}
            </span>
            <span className='text-xs text-body/70'>JPG, PNG or WEBP — up to 2MB</span>
          </div>
          <input
            id='verificationImage'
            type='file'
            accept='image/jpeg,image/png,image/webp'
            className='sr-only'
            aria-describedby={(verificationImageError || errors?.verificationImage?.message) ? 'verificationImage-error' : undefined}
            onChange={onVerificationImageChange}
          />
        </label>

        {(verificationImageError || errors?.verificationImage?.message) && (
          <p id='verificationImage-error' className='mt-1 text-xs text-danger'>
            {verificationImageError || errors?.verificationImage?.message}
          </p>
        )}
      </div>
    </>
  )
}