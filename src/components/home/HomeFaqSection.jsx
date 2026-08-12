// components/home/HomeFaqSection.jsx
//
// سكشن الأسئلة الشائعة: عنوان + تبويبات فئة + FaqAccordion. البيانات
// جاية من constants/homeContent.js، ومنطق فلترة الفئة معزول بالكامل
// بـ useFaqFilter — هالملف مسؤول بس عن التخطيط وتجهيز البيانات (إضافة
// icon/categoryLabel/categoryColor لكل عنصر) قبل ما يمررها لـ
// FaqAccordion (يلي بيضل Component عرض بحت ما بيعرف شي عن "فئات").

import { HelpCircle } from "lucide-react";
import Typography from "../ui/Typography";
import FaqAccordion from "../common/FaqAccordion";
import FaqCategoryTabs from "./FaqCategoryTabs";
import EmptyState from "../common/EmptyState";
import { useFaqFilter, FAQ_CATEGORY_ALL } from "../../hooks/useFaqFilter";
import { HOME_FAQS, FAQ_CATEGORY_META, FAQ_TAB_CATEGORIES } from "../../constants/homeContent";
import { PANEL_SURFACE } from "../../utils/surfaceStyles";

const TAB_CATEGORIES = FAQ_TAB_CATEGORIES.map((id) => ({
  id,
  label: FAQ_CATEGORY_META[id].label,
  icon: FAQ_CATEGORY_META[id].icon,
}));

export default function HomeFaqSection() {
  const { activeCategory, setActiveCategory, filteredItems } = useFaqFilter(HOME_FAQS);

  const displayItems = filteredItems.map((item) => ({
    ...item,
    icon: FAQ_CATEGORY_META[item.category]?.icon,
    categoryLabel: FAQ_CATEGORY_META[item.category]?.label,
    categoryColor: FAQ_CATEGORY_META[item.category]?.color,
  }));

  return (
    <section>
      <div className="text-center mb-8">
        <Typography variant="h2" className="mb-2">
          Frequently Asked Questions
        </Typography>
        <Typography variant="body" className="max-w-xl mx-auto">
          Answers to the most common questions from volunteers and organizations.
        </Typography>
      </div>

      <div className={`${PANEL_SURFACE} p-4 sm:p-8`}>
        <div className="flex justify-center mb-6">
          <FaqCategoryTabs categories={TAB_CATEGORIES} activeCategory={activeCategory} onChange={setActiveCategory} />
        </div>

        {displayItems.length === 0 ? (
          <EmptyState
            icon={HelpCircle}
            title="No questions found"
            description="Try a different category."
          />
        ) : (
          <FaqAccordion
            key={activeCategory}
            items={displayItems}
            showCategoryBadge={activeCategory === FAQ_CATEGORY_ALL}
            className="animate-shell-in"
          />
        )}
      </div>
    </section>
  );
}
