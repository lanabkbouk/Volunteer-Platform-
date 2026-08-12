import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { ROUTES, AUTH_QUERY_KEYS } from '../../constants/paths'
import { ACCOUNT_TYPES } from '../../constants/auth/accountTypes'
import AuthShell from '../../components/auth/AuthShell'
import AuthAlert from '../../components/auth/AuthAlert'
import { useAuth } from '../../context/AuthContext'
import useAsyncAction from '../../hooks/useAsyncAction'
import { loginSchema } from '../../utils/auth/validation'
import { loginUser } from '../../services/auth'

const initialValues = {
  email: '',
  password: '',
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  // نفس هوك إدارة الـ loading/error المستخدم بصفحة Register — بدل ما كانت
  // Login تدير هالحالة يدويًا بـ useState منفصلة، صار السلوك موحّدًا بين
  // الصفحتين (نفس التعامل مع النجاح/الفشل/الاستثناءات غير المتوقعة)
  const { loading, error, execute, clearError } = useAsyncAction(loginUser)
  // يظهر لمرة وحدة بعد التوجيه من ResetPassword.jsx (navigate state)،
  // ويختفي فور أي تعديل بالفورم بدل ما يضل عالقًا بعد محاولة دخول فاشلة
  const [showResetSuccess, setShowResetSuccess] = useState(Boolean(location.state?.resetSuccess))

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    setFocus,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: initialValues,
  })

  const handleFieldChange = useCallback(() => {
    clearError()
    setShowResetSuccess(false)
  }, [clearError])

  // يفرّغ الباسورد بس (الإيميل بيضل زي ما هو) ويرجّع الفوكس له، جاهز
  // لإعادة المحاولة — نفس السلوك المتّبع بـ Google/GitHub لأي محاولة فاشلة
  const clearPasswordAndFocus = () => {
    setValue('password', '')
    setFocus('password')
  }

  const onSubmit = async (values) => {
    const result = await execute(values)
    if (!result?.success) {
      // نربط كل خطأ حقل رجعه الباك اند (مثلاً Laravel 422) بحقله
      // المقابل بالفورم مباشرة، بدل رسالة عامة واحدة بس فوق الفورم
      if (result?.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, message]) => {
          setError(field, { type: 'server', message })
        })
      }

      clearPasswordAndFocus()
      return
    }

    if (!login(result.data)) {
      setError('root', {
        type: 'manual',
        message: 'Received invalid authentication response. Please try again.',
      })
      clearPasswordAndFocus()
      return
    }

    // الأدمن بيوصل مباشرة لصفحة الإعدادات (مش الرئيسية) — هذا أول شي
    // بيحتاجه عادةً (مراجعة توثيق منظمات، إدارة الفئات...)، بعكس متطوع
    // أو منظمة يلي الصفحة الرئيسية منطقية إلهم كنقطة بداية
    navigate(result.data.accountType === ACCOUNT_TYPES.ADMIN ? ROUTES.ADMIN_SETTINGS : ROUTES.HOME)
  }

  return (
    <AuthShell
      title='Sign In'
      subtitle='Welcome back! Please enter your details.'
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link
            to={`${ROUTES.REGISTER}?${AUTH_QUERY_KEYS.TYPE}=${ACCOUNT_TYPES.VOLUNTEER}`}
            className='text-primary hover:underline'
          >
            Register
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className='space-y-4' noValidate>
        {showResetSuccess ? (
          <AuthAlert variant='success'>Your password has been reset. Please sign in.</AuthAlert>
        ) : null}

        <Input
          label='Email'
          type='email'
          name='email'
          register={register}
          registerOptions={{ onChange: handleFieldChange }}
          placeholder='you@example.com'
          error={errors.email?.message}
          autoComplete='email'
          required
        />

        <div>
          <Input
            label='Password'
            type='password'
            name='password'
            register={register}
            registerOptions={{ onChange: handleFieldChange }}
            placeholder='********'
            error={errors.password?.message}
            autoComplete='current-password'
            required
          />
          <div className='mt-1 flex justify-end'>
            <Link to={ROUTES.FORGOT_PASSWORD} className='text-sm text-primary hover:underline'>
              Forgot password?
            </Link>
          </div>
        </div>

        <AuthAlert variant='error'>{error || errors.root?.message}</AuthAlert>

        <Button type='submit' disabled={loading} isLoading={loading} loadingText='Signing In...' fullWidth>
          Sign In
        </Button>
      </form>
    </AuthShell>
  )
}