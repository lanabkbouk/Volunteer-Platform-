// Matches the "skill" table in the ERD: skill_id, name.
// Each skill carries a "categoryId" from the shared category table.
// This lets the Volunteer Profile group skills by category and lets
// Opportunities match required skills.
//
// TODO: once Laravel is ready, set VITE_API_MODE=real
// GET /api/skills -> [{ id, name, categoryId }, ...]

import { apiClient, getApiErrorMessage } from "./api/client";
import { isMockMode } from "./api/mockMode";
import { wait } from "./api/delay";
import { fetchCategories } from "./categories"; // ← مهم جداً

const MOCK_MODE = isMockMode();

const MOCK_SKILLS = [
  // Health (c1)
  { id: "s1", name: "First Aid", categoryId: "c1" },
  { id: "s2", name: "Patient Care", categoryId: "c1" },
  { id: "s3", name: "Health Awareness", categoryId: "c1" },

  // Education (c2)
  { id: "s4", name: "Teaching", categoryId: "c2" },
  { id: "s5", name: "Tutoring", categoryId: "c2" },
  { id: "s6", name: "Curriculum Design", categoryId: "c2" },

  // Social (c3)
  { id: "s7", name: "Communication", categoryId: "c3" },
  { id: "s8", name: "Event Management", categoryId: "c3" },
  { id: "s9", name: "Fundraising", categoryId: "c3" },

  // Sport (c4)
  { id: "s10", name: "Coaching", categoryId: "c4" },
  { id: "s11", name: "Team Leadership", categoryId: "c4" },

  // Environment (c5)
  { id: "s12", name: "Environmental Awareness", categoryId: "c5" },
  { id: "s13", name: "Waste Management", categoryId: "c5" },

  // Technical (c6)
  { id: "s14", name: "Programming", categoryId: "c6" },
  { id: "s15", name: "Graphic Design", categoryId: "c6" },
  { id: "s16", name: "Photography", categoryId: "c6" },
];

const MOCK_SKILL_CATEGORY_MAP = Object.fromEntries(
  MOCK_SKILLS.map((skill) => [skill.id, skill.categoryId]),
);

export function getCategoryIdsForSkillIds(skillIds = []) {
  if (!Array.isArray(skillIds) || skillIds.length === 0) return [];

  return [...new Set(skillIds.map((skillId) => MOCK_SKILL_CATEGORY_MAP[skillId]).filter(Boolean))];
}

/**
 * Fetches all available skills and attaches category info dynamically.
 */
export async function fetchAvailableSkills() {
  const categories = await fetchCategories(); // ← جلب التصنيفات

  if (MOCK_MODE) {
    await wait();
    return MOCK_SKILLS.map((skill) => ({
      ...skill,
      category: categories.find((c) => c.id === skill.categoryId) || null,
    }));
  }

  let skills;

  try {
    const response = await apiClient.get("/skills");
    skills = response.data || [];
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to load skills"));
  }

  // 🔥 الربط الديناميكي هنا
  return skills.map((skill) => ({
    ...skill,
    category: categories.find((c) => c.id === skill.categoryId) || null,
  }));
}

/**
 * Fetches skills belonging to a specific category only.
 */
export async function fetchSkillsByCategory(categoryId) {
  const skills = await fetchAvailableSkills();
  if (!categoryId) return skills;
  return skills.filter(( skill) => skill.categoryId === categoryId);
}

// ————————————————————————————————————————————————————————————
// إدارة المهارات (أدمن فقط)
//
// ⚠️ مختلف عن categories.js: SkillController بالباك اند حاليًا كله
// دوال فاضية (index/store/update/destroy بدون أي تنفيذ فعلي، وجدول
// skills نفسه فيه بس id/timestamps — عمود "name" انضاف لاحقًا بـ
// migration منفصلة). يعني هذا الجزء Mock-only 100% لحد ما فريق 
// يكمل SkillController فعليًا. الاستدعاءات الحقيقية أدناه جاهزة
// ومكتوبة بانتظار ذلك، لكنها لن تُستخدم قبل تفعيل VITE_API_MODE=real
// وتأكيد اكتمال الكنترولر.
// ————————————————————————————————————————————————————————————

/**
 * ينشئ مهارة جديدة تحت تصنيف معيّن.
 * @param {{name: string, categoryId: string}} payload
 */
export async function createSkill(payload) {
  if (MOCK_MODE) {
    await wait()

    const nameTaken = MOCK_SKILLS.some(
      (skill) => skill.name.trim().toLowerCase() === payload.name.trim().toLowerCase(),
    )
    if (nameTaken) return { success: false, error: 'A skill with this name already exists' }

    const newSkill = { id: `s${Date.now()}`, name: payload.name, categoryId: payload.categoryId }
    MOCK_SKILLS.push(newSkill)
    MOCK_SKILL_CATEGORY_MAP[newSkill.id] = newSkill.categoryId
    return { success: true, data: newSkill }
  }

  try {
    const response = await apiClient.post('/skills', payload)
    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error, 'Failed to create skill') }
  }
}

/**
 * يعدّل اسم مهارة و/أو تصنيفها.
 * @param {string|number} skillId
 * @param {{name: string, categoryId: string}} payload
 */
export async function updateSkill(skillId, payload) {
  if (MOCK_MODE) {
    await wait()

    const skill = MOCK_SKILLS.find((item) => item.id === skillId)
    if (!skill) return { success: false, error: 'Skill not found' }

    // نستثني المهارة نفسها من فحص التكرار — وإلا ما كانت تقدر تحفظي
    // بدون تعديل الاسم إطلاقًا (بيصير هو نفسه "مكرر" مع نفسه)
    const nameTaken = MOCK_SKILLS.some(
      (item) =>
        item.id !== skillId && item.name.trim().toLowerCase() === payload.name.trim().toLowerCase(),
    )
    if (nameTaken) return { success: false, error: 'A skill with this name already exists' }

    skill.name = payload.name
    skill.categoryId = payload.categoryId
    MOCK_SKILL_CATEGORY_MAP[skillId] = payload.categoryId
    return { success: true, data: skill }
  }

  try {
    const response = await apiClient.put(`/skills/${skillId}`, payload)
    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error, 'Failed to update skill') }
  }
}

/**
 * يحذف مهارة.
 * @param {string|number} skillId
 */
export async function deleteSkill(skillId) {
  if (MOCK_MODE) {
    await wait()

    const index = MOCK_SKILLS.findIndex((item) => item.id === skillId)
    if (index === -1) return { success: false, error: 'Skill not found' }

    MOCK_SKILLS.splice(index, 1)
    delete MOCK_SKILL_CATEGORY_MAP[skillId]
    return { success: true }
  }

  try {
    await apiClient.delete(`/skills/${skillId}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error, 'Failed to delete skill') }
  }
}