import Input from '../ui/Input'
import UploadRow from '../common/UploadRow'

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
        <p className='text-xs text-body mb-1'>
          Upload an official document proving your organization's legitimacy —
          e.g. a business registration certificate, official license, or
          government-issued NGO registration. This helps our team verify your
          organization faster.
        </p>

        <UploadRow
          fieldId='verificationImage'
          previewUrl={verificationImagePreview}
          onFileChange={onVerificationImageChange}
          changeText='Change verification image'
          uploadText='Upload verification image'
          error={verificationImageError || errors?.verificationImage?.message}
        />
      </div>
    </>
  )
}