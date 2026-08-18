import { useMemo, useState } from 'react'
import { Search, Sparkles, Tags } from 'lucide-react'

import AdminLayout from '../../layouts/admin/AdminLayout'
import CatalogSection from '../../components/admin/CatalogSection'
import CategoryRow from '../../components/admin/CategoryRow'
import CategoryFormModal from '../../components/admin/CategoryFormModal'
import SkillRow from '../../components/admin/SkillRow'
import SkillFormModal from '../../components/admin/SkillFormModal'
import ConfirmModal from '../../components/common/ConfirmModal'
import Toast from '../../components/common/Toast'
import Badge from '../../components/common/Badge'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Typography from '../../components/ui/Typography'
import { PANEL_SURFACE } from '../../utils/surfaceStyles'
import { useCategoriesQuery } from '../../hooks/queries/useCategoriesQuery'
import { useCreateCategoryMutation } from '../../hooks/queries/useCreateCategoryMutation'
import { useUpdateCategoryMutation } from '../../hooks/queries/useUpdateCategoryMutation'
import { useDeleteCategoryMutation } from '../../hooks/queries/useDeleteCategoryMutation'
import { useSkillsQuery } from '../../hooks/queries/useSkillsQuery'
import { useCreateSkillMutation } from '../../hooks/queries/useCreateSkillMutation'
import { useUpdateSkillMutation } from '../../hooks/queries/useUpdateSkillMutation'
import { useDeleteSkillMutation } from '../../hooks/queries/useDeleteSkillMutation'
import { useToast } from '../../hooks/useToast'
import { getCategoryLabel } from '../../utils/categoryStyles'

function normalizeName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
}

export default function AdminCatalogManagement() {
  const categoriesQuery = useCategoriesQuery()
  const categories = categoriesQuery.data ?? []

  const skillsQuery = useSkillsQuery()
  const skills = skillsQuery.data ?? []

  const { toast, showSuccess, showError, closeToast } = useToast()

  // ————————————————————————————————————————————————————————————
  // Categories
  // ————————————————————————————————————————————————————————————
  const [categorySearchTerm, setCategorySearchTerm] = useState('')
  const [categoryModal, setCategoryModal] = useState(null)
  const [categoryToDelete, setCategoryToDelete] = useState(null)
  const [categoryFormError, setCategoryFormError] = useState('')

  const createCategoryMutation = useCreateCategoryMutation()
  const updateCategoryMutation = useUpdateCategoryMutation()
  const deleteCategoryMutation = useDeleteCategoryMutation()

  const isEditingCategory = Boolean(categoryModal && categoryModal.id)
  const categoryMutation = isEditingCategory ? updateCategoryMutation : createCategoryMutation

  const filteredCategories = useMemo(() => {
    const normalizedSearch = categorySearchTerm.trim().toLowerCase()

    if (!normalizedSearch) return categories

    return categories.filter((category) => {
      const haystack = [category.name, category.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalizedSearch)
    })
  }, [categories, categorySearchTerm])

  const openCreateCategoryModal = () => {
    setCategoryFormError('')
    setCategoryModal({})
  }

  const openEditCategoryModal = (category) => {
    setCategoryFormError('')
    setCategoryModal(category)
  }

  const handleSubmitCategory = async (form) => {
    const normalizedIncomingName = normalizeName(form.name)
    const duplicateCategory = categories.find(
      (category) =>
        normalizeName(category.name) === normalizedIncomingName && category.id !== categoryModal?.id,
    )

    if (duplicateCategory) {
      setCategoryFormError('A category with this name already exists.')
      return
    }

    const result = isEditingCategory
      ? await updateCategoryMutation.mutateAsync({ categoryId: categoryModal.id, payload: form })
      : await createCategoryMutation.mutateAsync(form)

    if (!result.success) {
      setCategoryFormError(result.error || 'Failed to save category')
      return
    }

    showSuccess(isEditingCategory ? 'Category updated.' : 'Category created.')
    setCategoryModal(null)
    setCategoryFormError('')
  }

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return

    const result = await deleteCategoryMutation.mutateAsync(categoryToDelete.id)
    if (!result.success) {
      showError(result.error || 'Failed to delete category')
      return
    }

    showSuccess('Category deleted.')
    setCategoryToDelete(null)
  }

  // ————————————————————————————————————————————————————————————
  // Skills — نفس منطق التصنيفات بالضبط، بس مربوط بتصنيف عبر categoryId
  // ————————————————————————————————————————————————————————————
  const [skillSearchTerm, setSkillSearchTerm] = useState('')
  const [skillModal, setSkillModal] = useState(null)
  const [skillToDelete, setSkillToDelete] = useState(null)
  const [skillFormError, setSkillFormError] = useState('')

  const createSkillMutation = useCreateSkillMutation()
  const updateSkillMutation = useUpdateSkillMutation()
  const deleteSkillMutation = useDeleteSkillMutation()

  const isEditingSkill = Boolean(skillModal && skillModal.id)
  const skillMutation = isEditingSkill ? updateSkillMutation : createSkillMutation

  const filteredSkills = useMemo(() => {
    const normalizedSearch = skillSearchTerm.trim().toLowerCase()

    if (!normalizedSearch) return skills

    return skills.filter((skill) => {
      const haystack = [skill.name, skill.category?.name].filter(Boolean).join(' ').toLowerCase()
      return haystack.includes(normalizedSearch)
    })
  }, [skills, skillSearchTerm])

  const openCreateSkillModal = () => {
    setSkillFormError('')
    setSkillModal({})
  }

  const openEditSkillModal = (skill) => {
    setSkillFormError('')
    setSkillModal(skill)
  }

  const handleSubmitSkill = async (form) => {
    const normalizedIncomingName = normalizeName(form.name)
    const duplicateSkill = skills.find(
      (skill) => normalizeName(skill.name) === normalizedIncomingName && skill.id !== skillModal?.id,
    )

    if (duplicateSkill) {
      setSkillFormError('A skill with this name already exists.')
      return
    }

    const result = isEditingSkill
      ? await updateSkillMutation.mutateAsync({ skillId: skillModal.id, payload: form })
      : await createSkillMutation.mutateAsync(form)

    if (!result.success) {
      setSkillFormError(result.error || 'Failed to save skill')
      return
    }

    showSuccess(isEditingSkill ? 'Skill updated.' : 'Skill created.')
    setSkillModal(null)
    setSkillFormError('')
  }

  const handleDeleteSkill = async () => {
    if (!skillToDelete) return

    const result = await deleteSkillMutation.mutateAsync(skillToDelete.id)
    if (!result.success) {
      showError(result.error || 'Failed to delete skill')
      return
    }

    showSuccess('Skill deleted.')
    setSkillToDelete(null)
  }

  return (
    <AdminLayout
      eyebrow="Administrative workspace"
      title="Categories & Skills"
      description="Manage the shared categories used across opportunities, and the skills volunteers and opportunities are matched on. Duplicate names are blocked before saving."
    >
      {/* ===========================
          Categories
      ============================ */}
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-6">
        <div className={`${PANEL_SURFACE} p-5 md:p-6`}>
          <Typography variant="h4">Search categories</Typography>
          <Typography variant="bodySm" className="mt-1 text-body">
            {categories.length} total categories currently configured.
          </Typography>

          <div className="mt-4 max-w-2xl">
            <Input
              name="categorySearch"
              value={categorySearchTerm}
              onChange={(event) => setCategorySearchTerm(event.target.value)}
              placeholder="Search by name or description"
              icon={Search}
              aria-label="Search categories"
            />
          </div>
        </div>

        <div className="flex items-stretch">
          <div className={`${PANEL_SURFACE} w-full p-5 md:p-6`}>
            <Typography variant="overline" className="text-body/70">
              Total categories
            </Typography>
            <div className="mt-3 flex items-end justify-between gap-4">
              <Typography variant="h2">{categories.length}</Typography>
              <Badge label="Platform wide" tone="primary" />
            </div>
            <Typography variant="bodySm" className="mt-3 text-body">
              Categories are shared across opportunities and related forms.
            </Typography>
          </div>
        </div>
      </section>

      <CatalogSection
        title="Categories"
        description="Used to group opportunities, skills, and achievements across the platform."
        addLabel="Add category"
        onAdd={openCreateCategoryModal}
        items={filteredCategories}
        isLoading={categoriesQuery.isPending}
        isError={categoriesQuery.isError}
        errorMessage={categoriesQuery.error?.message || 'Failed to load categories'}
        onRetry={() => categoriesQuery.refetch()}
        emptyIcon={Tags}
        emptyTitle={categorySearchTerm ? 'No matching categories' : 'No categories yet'}
        emptyDescription={
          categorySearchTerm
            ? 'Try a different search term or clear the filter.'
            : 'Add the first category to start organizing opportunities.'
        }
        renderItem={(category) => (
          <CategoryRow
            key={category.id}
            category={category}
            onEdit={openEditCategoryModal}
            onDelete={setCategoryToDelete}
            isDeleting={deleteCategoryMutation.isPending && deleteCategoryMutation.variables === category.id}
          />
        )}
      />

      {/* ===========================
          Skills
      ============================ */}
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-6">
        <div className={`${PANEL_SURFACE} p-5 md:p-6`}>
          <Typography variant="h4">Search skills</Typography>
          <Typography variant="bodySm" className="mt-1 text-body">
            {skills.length} total skills currently configured.
          </Typography>

          <div className="mt-4 max-w-2xl">
            <Input
              name="skillSearch"
              value={skillSearchTerm}
              onChange={(event) => setSkillSearchTerm(event.target.value)}
              placeholder="Search by name or category"
              icon={Search}
              aria-label="Search skills"
            />
          </div>
        </div>

        <div className="flex items-stretch">
          <div className={`${PANEL_SURFACE} w-full p-5 md:p-6`}>
            <Typography variant="overline" className="text-body/70">
              Total skills
            </Typography>
            <div className="mt-3 flex items-end justify-between gap-4">
              <Typography variant="h2">{skills.length}</Typography>
              <Badge label="Platform wide" tone="primary" />
            </div>
            <Typography variant="bodySm" className="mt-3 text-body">
              Skills are attached to a category and used to match volunteers with opportunities.
            </Typography>
          </div>
        </div>
      </section>

      <CatalogSection
        title="Skills"
        description="Each skill belongs to a category, and volunteers/opportunities are matched against this list."
        addLabel="Add skill"
        onAdd={openCreateSkillModal}
        items={filteredSkills}
        isLoading={skillsQuery.isPending}
        isError={skillsQuery.isError}
        errorMessage={skillsQuery.error?.message || 'Failed to load skills'}
        onRetry={() => skillsQuery.refetch()}
        emptyIcon={Sparkles}
        emptyTitle={skillSearchTerm ? 'No matching skills' : 'No skills yet'}
        emptyDescription={
          skillSearchTerm
            ? 'Try a different search term or clear the filter.'
            : 'Add the first skill to start matching volunteers with opportunities.'
        }
        renderItem={(skill) => (
          <SkillRow
            key={skill.id}
            skill={skill}
            onEdit={openEditSkillModal}
            onDelete={setSkillToDelete}
            isDeleting={deleteSkillMutation.isPending && deleteSkillMutation.variables === skill.id}
          />
        )}
      />

      <CategoryFormModal
        key={categoryModal ? categoryModal.id ?? 'new' : 'closed'}
        open={Boolean(categoryModal)}
        category={isEditingCategory ? categoryModal : null}
        onClose={() => {
          setCategoryModal(null)
          setCategoryFormError('')
        }}
        onSubmit={handleSubmitCategory}
        isSubmitting={categoryMutation.isPending}
        error={categoryFormError || (categoryMutation.data?.success === false ? categoryMutation.data.error : null)}
      />

      <ConfirmModal
        open={Boolean(categoryToDelete)}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleDeleteCategory}
        title={`Delete ${categoryToDelete?.name ? getCategoryLabel(categoryToDelete.name) : 'category'}?`}
        description="This category will be removed from the platform. Opportunities and skills linked to it will need a replacement category."
        confirmLabel="Delete category"
        confirmVariant="danger"
        isLoading={deleteCategoryMutation.isPending}
        loadingText="Deleting..."
      />

      <SkillFormModal
        key={skillModal ? skillModal.id ?? 'new' : 'closed'}
        open={Boolean(skillModal)}
        skill={isEditingSkill ? skillModal : null}
        categories={categories}
        onClose={() => {
          setSkillModal(null)
          setSkillFormError('')
        }}
        onSubmit={handleSubmitSkill}
        isSubmitting={skillMutation.isPending}
        error={skillFormError || (skillMutation.data?.success === false ? skillMutation.data.error : null)}
      />

      <ConfirmModal
        open={Boolean(skillToDelete)}
        onClose={() => setSkillToDelete(null)}
        onConfirm={handleDeleteSkill}
        title={`Delete ${skillToDelete?.name || 'skill'}?`}
        description="This skill will be removed from the platform. Volunteer profiles and opportunities referencing it will need to be updated."
        confirmLabel="Delete skill"
        confirmVariant="danger"
        isLoading={deleteSkillMutation.isPending}
        loadingText="Deleting..."
      />

      <Toast message={toast.message} variant={toast.variant} duration={7000} onClose={closeToast} />
    </AdminLayout>
  )
}
