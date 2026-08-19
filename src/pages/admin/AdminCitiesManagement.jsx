import { useMemo, useState } from 'react'
import { MapPin, Search } from 'lucide-react'

import AdminLayout from '../../layouts/admin/AdminLayout'
import CatalogSection from '../../components/admin/CatalogSection'
import CityRow from '../../components/admin/CityRow'
import CityFormModal from '../../components/admin/CityFormModal'
import ConfirmModal from '../../components/common/ConfirmModal'
import Toast from '../../components/common/Toast'
import Badge from '../../components/common/Badge'
import Input from '../../components/ui/Input'
import Typography from '../../components/ui/Typography'
import { ADMIN_PANEL_SURFACE } from '../../utils/adminStyles'
import { useCitiesQuery } from '../../hooks/queries/useCitiesQuery'
import { useCreateCityMutation } from '../../hooks/queries/useCreateCityMutation'
import { useUpdateCityMutation } from '../../hooks/queries/useUpdateCityMutation'
import { useToggleCityStatusMutation } from '../../hooks/queries/useToggleCityStatusMutation'
import { useToast } from '../../hooks/useToast'

function normalizeName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
}

export default function AdminCitiesManagement() {
  const citiesQuery = useCitiesQuery()
  const cities = citiesQuery.data ?? []

  const { toast, showSuccess, showError, closeToast } = useToast()

  const [searchTerm, setSearchTerm] = useState('')
  const [cityModal, setCityModal] = useState(null)
  const [cityToToggle, setCityToToggle] = useState(null)
  const [formError, setFormError] = useState('')

  const createCityMutation = useCreateCityMutation()
  const updateCityMutation = useUpdateCityMutation()
  const toggleCityStatusMutation = useToggleCityStatusMutation()

  const isEditingCity = Boolean(cityModal && cityModal.id)
  const cityMutation = isEditingCity ? updateCityMutation : createCityMutation

  const filteredCities = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    if (!normalizedSearch) return cities

    return cities.filter((city) => {
      const haystack = [city.nameEn, city.nameAr].filter(Boolean).join(' ').toLowerCase()
      return haystack.includes(normalizedSearch)
    })
  }, [cities, searchTerm])

  const openCreateModal = () => {
    setFormError('')
    setCityModal({})
  }

  const openEditModal = (city) => {
    setFormError('')
    setCityModal(city)
  }

  const handleSubmitCity = async (form) => {
    const normalizedIncomingName = normalizeName(form.nameEn)
    const duplicateCity = cities.find(
      (city) => normalizeName(city.nameEn) === normalizedIncomingName && city.id !== cityModal?.id,
    )

    if (duplicateCity) {
      setFormError('A city with this name already exists.')
      return
    }

    const result = isEditingCity
      ? await updateCityMutation.mutateAsync({ cityId: cityModal.id, payload: form })
      : await createCityMutation.mutateAsync(form)

    if (!result.success) {
      setFormError(result.error || 'Failed to save city')
      return
    }

    showSuccess(isEditingCity ? 'City updated.' : 'City created.')
    setCityModal(null)
    setFormError('')
  }

  // بدل الحذف الفعلي: تبديل isActive بس. المدن مرجعية بسجلات قديمة
  // (فرص/بروفايلات) عبر nameEn، فالحذف الحقيقي كان رح يكسرها — راجع
  // toggleGovernorateStatus بـ services/syrianGovernorates.js
  const handleToggleCityStatus = async () => {
    if (!cityToToggle) return

    const nextIsActive = !(cityToToggle.isActive !== false)
    const result = await toggleCityStatusMutation.mutateAsync({
      cityId: cityToToggle.id,
      isActive: nextIsActive,
    })
    if (!result.success) {
      showError(result.error || 'Failed to update city status')
      return
    }

    showSuccess(nextIsActive ? 'City activated.' : 'City deactivated.')
    setCityToToggle(null)
  }

  return (
    <AdminLayout
      eyebrow="Administrative workspace"
      title="City management"
      description="Manage the governorates/cities used across registration, profiles, and opportunity forms. Duplicate names are blocked before saving."
    >
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-6">
        <div className={`${ADMIN_PANEL_SURFACE} p-5 md:p-6`}>
          <Typography variant="h4" className="text-adminTextHi!">Search cities</Typography>
          <Typography variant="bodySm" className="mt-1 text-adminTextLo!">
            {cities.length} total cities currently configured.
          </Typography>

          <div className="mt-4 max-w-2xl">
            <Input
              name="citySearch"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by name (English or Arabic)"
              icon={Search}
              aria-label="Search cities"
            />
          </div>
        </div>

        <div className="flex items-stretch">
          <div className={`${ADMIN_PANEL_SURFACE} w-full p-5 md:p-6`}>
            <Typography variant="overline" className="text-adminTextLo!">
              Total cities
            </Typography>
            <div className="mt-3 flex items-end justify-between gap-4">
              <Typography variant="h2" className="text-adminTextHi!">{cities.length}</Typography>
              <Badge label="Platform wide" tone="secondary" dark />
            </div>
            <Typography variant="bodySm" className="mt-3 text-adminTextLo!">
              Used by registration, profile, and opportunity location fields.
            </Typography>
          </div>
        </div>
      </section>

      <CatalogSection
        title="Cities"
        description="Governorates available across the platform's location fields."
        addLabel="Add city"
        onAdd={openCreateModal}
        items={filteredCities}
        isLoading={citiesQuery.isPending}
        isError={citiesQuery.isError}
        errorMessage={citiesQuery.error?.message || 'Failed to load cities'}
        onRetry={() => citiesQuery.refetch()}
        emptyIcon={MapPin}
        emptyTitle={searchTerm ? 'No matching cities' : 'No cities yet'}
        emptyDescription={
          searchTerm
            ? 'Try a different search term or clear the filter.'
            : 'Add the first city to make it available across the platform.'
        }
        renderItem={(city) => (
          <CityRow
            key={city.id}
            city={city}
            onEdit={openEditModal}
            onToggleStatus={setCityToToggle}
            isTogglingStatus={
              toggleCityStatusMutation.isPending && toggleCityStatusMutation.variables?.cityId === city.id
            }
          />
        )}
      />

      <CityFormModal
        key={cityModal ? cityModal.id ?? 'new' : 'closed'}
        open={Boolean(cityModal)}
        city={isEditingCity ? cityModal : null}
        onClose={() => {
          setCityModal(null)
          setFormError('')
        }}
        onSubmit={handleSubmitCity}
        isSubmitting={cityMutation.isPending}
        error={formError || (cityMutation.data?.success === false ? cityMutation.data.error : null)}
      />

      <ConfirmModal
        open={Boolean(cityToToggle)}
        onClose={() => setCityToToggle(null)}
        onConfirm={handleToggleCityStatus}
        title={
          cityToToggle?.isActive !== false
            ? `Deactivate ${cityToToggle?.nameEn || 'city'}?`
            : `Activate ${cityToToggle?.nameEn || 'city'}?`
        }
        description={
          cityToToggle?.isActive !== false
            ? `Deactivate ${cityToToggle?.nameEn || 'this city'}? New opportunities and profiles won't be able to use it, and its currently-open opportunities will stop accepting new volunteers. Nothing already committed is affected.`
            : `${cityToToggle?.nameEn || 'This city'} will be selectable again in registration, profile, and opportunity forms.`
        }
        confirmLabel={cityToToggle?.isActive !== false ? 'Deactivate city' : 'Activate city'}
        confirmVariant={cityToToggle?.isActive !== false ? 'danger' : 'primary'}
        isLoading={toggleCityStatusMutation.isPending}
        loadingText="Saving..."
      />

      <Toast message={toast.message} variant={toast.variant} duration={7000} onClose={closeToast} />
    </AdminLayout>
  )
}
