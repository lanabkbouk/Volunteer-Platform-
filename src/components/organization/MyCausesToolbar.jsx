// شريط بحث + فلترة حسب الحالة + فرز، فوق قائمة "My Causes" — نفس بنية
// ApplicantsToolbar.jsx بالضبط. كل المنطق هون Client-side بحت (فلترة/فرز
// مصفوفة محمّلة أصلًا بالكامل من useMyOpportunitiesQuery)، ما في داعي
// لأي طلب شبكة إضافي أو Debounce (عدد فرص المنظمة الواحدة صغير بطبيعته).

import { Search } from "lucide-react";
import Input from "../ui/Input";
import Dropdown from "../ui/Dropdown";
import { CAUSE_STATUS_FILTERS, CAUSE_SORT_OPTIONS } from "../../constants/causeFilters";

export default function MyCausesToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortOrder,
  onSortOrderChange,
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <Input
        name="causeSearch"
        placeholder="Search by cause title..."
        aria-label="Search causes by title"
        icon={Search}
        fullWidth
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        className="sm:flex-1"
      />

      <div className="flex gap-3 shrink-0">
        <Dropdown
          items={CAUSE_STATUS_FILTERS}
          value={statusFilter}
          onChange={onStatusFilterChange}
          triggerLabel="All statuses"
          ariaLabel="Filter by status"
          fullWidth={false}
          className="w-full sm:w-44"
        />
        <Dropdown
          items={CAUSE_SORT_OPTIONS}
          value={sortOrder}
          onChange={onSortOrderChange}
          triggerLabel="Newest first"
          ariaLabel="Sort order"
          fullWidth={false}
          className="w-full sm:w-44"
        />
      </div>
    </div>
  );
}
