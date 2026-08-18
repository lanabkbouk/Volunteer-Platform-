// نفس فلسفة CategoryFormModal/SkillFormModal بالضبط: مودال واحد للإنشاء
// والتعديل، والـ slug بينحسب تلقائيًا بالخدمة (syrianGovernorates.js) من
// nameEn. الاسمين (عربي/إنجليزي) مطلوبين هون صراحة لأنهما يُخزّنان
// ويُعرضان بشكل منفصل (راجع CityRow.jsx وnameAr/nameEn بالـ mutations).

import { useState } from 'react'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'

const EMPTY_FORM = { nameAr: '', nameEn: '' }

export default function CityFormModal({ open, city, onClose, onSubmit, isSubmitting, error }) {
  // نفس منطق CategoryFormModal: remount عبر key من الصفحة الأم بدل useEffect
  const [form, setForm] = useState(() =>
    city ? { nameAr: city.nameAr, nameEn: city.nameEn } : EMPTY_FORM,
  )
  const isEditing = Boolean(city)

  const handleChange = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))

  const handleSubmit = () => onSubmit(form)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? `Edit "${city?.nameEn}"` : 'New city'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={!form.nameAr.trim() || !form.nameEn.trim()}
            loadingText="Saving..."
          >
            {isEditing ? 'Save changes' : 'Create city'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error && <p className="text-sm text-danger">{error}</p>}

        <Input
          label="Name (Arabic)"
          name="nameAr"
          required
          value={form.nameAr}
          onChange={handleChange('nameAr')}
          placeholder="Example: Damascus"
        />

        <Input
          label="Name (English)"
          name="nameEn"
          required
          value={form.nameEn}
          onChange={handleChange('nameEn')}
          placeholder="e.g. Damascus"
        />
      </div>
    </Modal>
  )
}
