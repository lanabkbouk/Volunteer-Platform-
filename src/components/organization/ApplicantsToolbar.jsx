// شريط بحث + فلترة حسب الحالة + فرز، فوق قائمة المتقدمين. كل المنطق
// هون Client-side بحت (فلترة/فرز مصفوفة محمّلة أصلًا بالكامل من
// fetchApplicantsForOpportunity) — ما في داعي لأي طلب شبكة إضافي أو
// Debounce، لأنه عدد المتقدمين على فرصة واحدة صغير بطبيعته.

import { Search } from "lucide-react";
import Input from "../ui/Input";
import Dropdown from "../ui/Dropdown";
import { APPLICANTS_STATUS_FILTERS, APPLICANTS_SORT_OPTIONS } from "../../constants/applicantFilters";

export default function ApplicantsToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortOrder,
  onSortOrderChange,
}) {
  return (
    // top-19.75 = 79px، ارتفاع الـ Navbar الفعلي المقاس (Playwright) — قيمة
    // موحّدة عبر كل نقاط التوقف بعد إصلاح مشكلة overflow الأفقي بالناف بار
    // على الموبايل (راجع Navbar.jsx). bg-canvas لازمة لأنه القائمة تحتها
    // بتتمرّر مباشرة ورا الشريط، وإلا الكاردات كانت رح "تظهر من خلاله"
    <div className="sticky top-19.75 z-40 flex flex-col gap-3 bg-canvas py-3 sm:flex-row mb-6">
      <Input
        name="applicantSearch"
        placeholder="Search by volunteer name..."
        aria-label="Search applicants by volunteer name"
        icon={Search}
        fullWidth
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        className="sm:flex-1"
      />

      <div className="flex gap-3 shrink-0">
        <Dropdown
          items={APPLICANTS_STATUS_FILTERS}
          value={statusFilter}
          onChange={onStatusFilterChange}
          triggerLabel="All statuses"
          ariaLabel="Filter by status"
          fullWidth={false}
          className="w-full sm:w-44"
        />
        <Dropdown
          items={APPLICANTS_SORT_OPTIONS}
          value={sortOrder}
          onChange={onSortOrderChange}
          triggerLabel="Newest first"
          ariaLabel="Sort order"
          fullWidth={false}
          className="w-full sm:w-40"
        />
      </div>
    </div>
  );
}