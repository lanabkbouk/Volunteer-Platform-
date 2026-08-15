// components/common/ShowMoreButton.jsx
//
// زر "Show more" موحّد الشكل، يُستخدم مع useShowMore وكمان مع أي مصدر
// صفحات حقيقي (useInfiniteQuery، مثال: صفحة دليل المنظمات). عرضه
// بيتضمن عدد العناصر المتبقية (مش بس "Show more" عارية) حتى يعرف
// المستخدم قبل ما يضغط قديه باقي — تفصيل بسيط بيحسّن الثقة بالتفاعل.
//
// remainingCount اختياري عمدًا: مصادر Pagination حقيقية (Server-side)
// مش دايمًا عندها رقم دقيق 100% (مثلًا لو الباك اند ما بيفلتر فعليًا
// على شرط عرض معيّن — راجع ملاحظة الدقة بـ services/organizations.js)،
// فبدل ما نعرض رقم مضلِّل، نتراجع لنص "Show more" عام بدون رقم

import { ChevronDown } from "lucide-react";
import Button from "../ui/Button";

export default function ShowMoreButton({ remainingCount, onClick }) {
  const hasAccurateCount = typeof remainingCount === "number";

  return (
    <div className="mt-6 flex justify-center">
      <Button variant="ghost" onClick={onClick} className="flex items-center gap-1.5">
        <ChevronDown size={16} aria-hidden="true" />
        {hasAccurateCount ? `Show ${remainingCount} more` : "Show more"}
      </Button>
    </div>
  );
}
