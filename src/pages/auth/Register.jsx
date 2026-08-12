import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import AccountSwitch from '../../components/forms/AccountSwitcher'
import OrganizationForm from '../../components/forms/orgForm'
import VolunteerForm from '../../components/forms/volunteerForm'
import { ROUTES, AUTH_QUERY_KEYS } from '../../constants/paths'
import { ACCOUNT_TYPES, isAccountType } from '../../constants/auth/accountTypes'
import AuthShell from '../../components/auth/AuthShell'
import AuthAlert from '../../components/auth/AuthAlert'
import { useAuth } from '../../context/AuthContext'
import useAsyncAction from '../../hooks/useAsyncAction'
import { useImageUpload } from '../../hooks/useImageUpload'
import { getRegisterSchema } from '../../utils/auth/validation'
import { registerUser } from '../../services/auth'

// حقول مشتركة بين نوعي الحساب (متطوع/منظمة)
const SHARED_INITIAL_VALUES = {
  email: '',
  phone: '',
  password: '',
}

// حقول خاصة بالمتطوع فقط
const VOLUNTEER_INITIAL_VALUES = {
  ...SHARED_INITIAL_VALUES,
  firstName: '',
  lastName: '',
}

// حقول خاصة بالمنظمة فقط
const ORGANIZATION_INITIAL_VALUES = {
  ...SHARED_INITIAL_VALUES,
  orgName: '',
  contactPerson: '',
  verificationImage: null,
}

export default function Register() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [searchParams] = useSearchParams()
  const [successMessage, setSuccessMessage] = useState('')
  const { loading, error, execute, clearError } = useAsyncAction(registerUser)

  const accountTypeFromQuery = searchParams.get(AUTH_QUERY_KEYS.TYPE)
  const accountType = isAccountType(accountTypeFromQuery)
    ? accountTypeFromQuery
    : ACCOUNT_TYPES.VOLUNTEER

  const isVolunteer = accountType === ACCOUNT_TYPES.VOLUNTEER

  const subtitle = useMemo(() => {
    if (isVolunteer) return 'Join our community and make a difference!'
    return 'Register your Volunteer Platform or NGO to connect with volunteers.'
  }, [isVolunteer])

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    setFocus,
    formState: { errors },
  } = useForm({
    // resolver ديناميكي: بيُعاد استدعاؤه بكل submit، فبياخد accountType
    // الحالي (بعد أي تبديل عبر AccountSwitcher) بدل schema ثابتة كانت
    // ستضل مرتبطة بالقيمة الأولى وقت أول render فقط
    resolver: (values, context, options) => zodResolver(getRegisterSchema(accountType))(values, context, options),
    defaultValues: isVolunteer ? VOLUNTEER_INITIAL_VALUES : ORGANIZATION_INITIAL_VALUES,
  })

  const handleFormChange = () => {
    clearError()
    setSuccessMessage('')
  }

  // useImageUpload يتكفّل بالمعاينة المحلية والتحقق من نوع/حجم الصورة
  // (JPG/PNG/WEBP، حتى 2MB) — نفس الـ hook المستخدم بصفحة بروفايل
  // المتطوع، بدل ما كان حقل الصورة هون بدون أي معاينة ولا تحقق إطلاقًا
  const verificationImage = useImageUpload()

  const handleVerificationImageChange = (event) => {
    const selectedFile = event.target.files?.[0] || null

    verificationImage.handleFileChange(event)
    // نسجّل الملف بالفورم يدويًا (بدل register() تقليدي) عشان zod
    // (requiredFile) تتحقق من وجوده وقت الإرسال
    setValue('verificationImage', selectedFile, { shouldValidate: true })
    handleFormChange()
  }

  const onSubmit = async (values) => {
    // ما في داعي للتحقق اليدوي هون — zodResolver ما بينادي onSubmit إلا
    // إذا values مطابقة للـ schema أصلًا (نفس آلية Login.jsx تمامًا)
    const payload = { accountType, ...values }

    const result = await execute(payload)
    if (!result?.success) {
      // نربط كل خطأ حقل رجعه الباك اند (مثلاً Laravel 422) بحقله
      // المقابل بالفورم مباشرة، بدل رسالة عامة واحدة بس فوق الفورم
      if (result?.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, message]) => {
          setError(field, { type: 'server', message })
        })
      }

      setValue('password', '')
      setFocus('password')
      return
    }

    if (!login(result.data)) {
      setSuccessMessage('')
      setError('root', {
        type: 'manual',
        message: 'Account created but session could not be started. Please sign in.',
      })
      setValue('password', '')
      return
    }

    setSuccessMessage('Account created successfully. Redirecting to your profile...')

    if (isVolunteer) navigate(ROUTES.VOLUNTEER_PROFILE)
    else navigate(ROUTES.ORGANIZATION_PROFILE)
  }

  return (
    <AuthShell
      title={"Create Account"}
      subtitle={subtitle}
      footer={
        <>
          Already have an account?{' '}
          <Link to={ROUTES.LOGIN} className='text-primary hover:underline'>
            Sign In
          </Link>
        </>
      }
    >
      <AccountSwitch accountType={accountType} />

   
          <form
            className='space-y-4'
            onSubmit={handleSubmit(onSubmit)}
            noValidate
      
          >
            {isVolunteer ? (
              <VolunteerForm register={register} errors={errors} onFieldChange={handleFormChange} />
            ) : (
              <OrganizationForm
                register={register}
                errors={errors}
                onFieldChange={handleFormChange}
                verificationImagePreview={verificationImage.previewUrl}
                verificationImageError={verificationImage.error}
                onVerificationImageChange={handleVerificationImageChange}
              />
            )}

            <Input
              label='Email'
              type='email'
              name='email'
              register={register}
              registerOptions={{ onChange: handleFormChange }}
              placeholder={isVolunteer ? 'you@example.com' : 'org@example.com'}
              error={errors.email?.message}
              autoComplete='email'
              required
            />

            <Input
              label='Phone Number'
              type='tel'
              name='phone'
              register={register}
              registerOptions={{ onChange: handleFormChange }}
              placeholder='+1 234 567 890'
              error={errors.phone?.message}
              autoComplete='tel'
              required
            />

            <Input
              label='Password'
              type='password'
              name='password'
              register={register}
              registerOptions={{ onChange: handleFormChange }}
              placeholder='********'
              error={errors.password?.message}
              autoComplete='new-password'
              required
            />

            <AuthAlert variant='error'>{error || errors.root?.message}</AuthAlert>
            <AuthAlert variant='success'>{successMessage}</AuthAlert>

            <Button
              type='submit'
              disabled={loading}
              isLoading={loading}
              loadingText='Creating...'
              fullWidth
            >
              {isVolunteer ? 'Create Account' : 'Register Organization'}
            </Button>
          </form>
    </AuthShell>
  )
}