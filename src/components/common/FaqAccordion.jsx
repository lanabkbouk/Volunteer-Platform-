// أكورديون أسئلة شائعة: سؤال واحد مفتوح بأي وقت. Component عرض بحت،
// البيانات (items) جاية من الصفحة الأب — قابل لإعادة الاستخدام بأي
// صفحة تانية تحتاج قسم أسئلة شائعة (مثلًا About) بدون أي تعديل هون.
//
// item.icon/categoryLabel/categoryColor اختيارية بالكامل — لو ما انمرروا
// (مثل أي استخدام مستقبلي بسيط بـ {question, answer} بس) الكارد بترجع
// لشكلها الأساسي بدون أيقونة أو شارة، فما في كسر لأي استخدام تاني.

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import Chip from "../ui/Chip";

export default function FaqAccordion({ items, showCategoryBadge = false, className = "" }) {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className={`flex flex-col gap-3 max-w-3xl mx-auto ${className}`}>
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const Icon = item.icon;

        return (
          <div
            key={item.question}
            className={`rounded-2xl bg-field shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border ${
              isOpen ? "border-primary/20 border-l-4 border-l-primary bg-primary/5" : "border-heading/10"
            }`}
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              aria-expanded={isOpen}
              className={`group w-full flex items-center justify-between gap-4 px-6 py-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset ${
                isOpen ? "" : "hover:bg-heading/5 cursor-pointer"
              }`}
            >
              <span className="flex min-w-0 items-center gap-3">
                {Icon && (
                  <Icon
                    size={18}
                    className={`shrink-0 ${isOpen ? "text-primary" : "text-heading/40"}`}
                    aria-hidden="true"
                  />
                )}
                <span className={isOpen ? "font-semibold text-primary" : "font-medium text-heading"}>
                  {item.question}
                </span>
                {showCategoryBadge && item.categoryLabel && (
                  <Chip color={item.categoryColor || "gray"} className="!px-2 !py-0.5 !text-xs shrink-0">
                    {item.categoryLabel}
                  </Chip>
                )}
              </span>

              <span
                className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 transition-colors ${
                  isOpen ? "bg-primary/10" : "bg-heading/5 group-hover:bg-heading/10"
                }`}
              >
                <ChevronDown
                  size={18}
                  className={`text-primary transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </span>
            </button>

            <div
              className={`grid transition-all duration-200 ease-in-out ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className={`overflow-hidden transition-opacity duration-200 ${isOpen ? "opacity-100" : "opacity-0"}`}>
                <p className="px-6 pb-4 text-sm text-body leading-relaxed">{item.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
