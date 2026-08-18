// components/opportunity/CategorySidebar.jsx
//
// شريط فلترة صفحة تصفح الفرص — بحث + فئات، اختيار عنصر واحد فقط
// (بدون Checkbox، العنصر المختار يُميَّز بظل/خلفية برتقالية خفيفة).
// الحالة نفسها (أي الفئة المختارة) تُدار بالكامل من الصفحة الأم
// (OpportunitiesListPage) ومربوطة بالـ URL هناك — هذا المكوّن عرض
// بحت بدون أي حالة داخلية.

import { Search } from "lucide-react";
import Input from "../ui/Input";
import Typography from "../ui/Typography";
import { PANEL_SURFACE } from "../../utils/surfaceStyles";
import { getCategoryLabel } from "../../utils/categoryStyles";

function FilterListItem({ label, count, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex w-full min-h-11 items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
        selected
          ? "bg-primary/10 font-semibold text-primary shadow-sm shadow-primary/30"
          : "text-heading/70 hover:bg-primary/5"
      }`}
    >
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {typeof count === "number" && <span className="shrink-0 text-xs text-heading/55">({count})</span>}
    </button>
  );
}

export default function CategorySidebar({
  categories,
  selectedCategoryId,
  onSelectCategory,
  searchValue,
  onSearchChange,
}) {
  return (
    <aside className="w-full lg:w-72 shrink-0 flex flex-col gap-6">
      {onSearchChange ? (
        <Input
          name="opportunity-search"
          placeholder="Search opportunities..."
          icon={Search}
          variant="filled"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      ) : null}

      <div className={`${PANEL_SURFACE} p-5`}>
        <Typography as="h3" variant="overline" weight="semibold" color="muted" className="mb-3">
          Categories
        </Typography>

        <div className="flex flex-col gap-0.5">
          <FilterListItem
            label="All Opportunities"
            selected={!selectedCategoryId}
            onSelect={() => onSelectCategory(null)}
          />

          {categories.map((category) => (
            <FilterListItem
              key={category.id}
              label={getCategoryLabel(category.name)}
              count={category.opportunitiesCount}
              selected={selectedCategoryId === category.id}
              onSelect={() => onSelectCategory(category.id)}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}
