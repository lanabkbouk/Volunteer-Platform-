// شرح موحّد لكل ألوان/حالات الفرصة، بضغطة وحدة بدل ما يفهم المستخدم كل
// شارة لحالها. عمدًا "اضغط" مش "Hover" — الموبايل ما إله Hover إطلاقًا،
// وهاد مشروع لازم يكون Responsive بالكامل، فـ Tooltip بالـ Hover بس
// كان رح يحرم نص المستخدمين من الشرح. useClickOutside الموجود أصلًا
// بالمشروع (نفس المستخدم بـ NavbarDropdown) بيتكفّل بالإغلاق التلقائي.

import { useState } from "react";
import { HelpCircle } from "lucide-react";
import Chip from "./Chip";
import useClickOutside from "../../hooks/useClickOutside";
import { OPPORTUNITY_STATUS_META } from "../../constants/opportunityStatus";

export default function StatusLegendPopover({ className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useClickOutside(isOpen, () => setIsOpen(false));

  return (
    <div ref={rootRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="What do these statuses mean?"
        className="inline-flex items-center gap-1 text-xs text-heading/50 hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded"
      >
        <HelpCircle size={14} aria-hidden="true" />
        What do these mean?
      </button>

      {isOpen && (
        <div
          role="tooltip"
          className="absolute z-50 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-xl bg-field border-2 border-heading/20 shadow-2xl ring-1 ring-black/5 p-3 right-0"
        >
          <div className="flex flex-col gap-2.5">
            {Object.values(OPPORTUNITY_STATUS_META).map((meta) => {
              const Icon = meta.icon;
              return (
                <div key={meta.label} className="flex items-start gap-2">
                  <Chip color={meta.color} className="inline-flex items-center gap-1.5 shrink-0 mt-0.5">
                    {Icon && <Icon size={13} aria-hidden="true" />}
                    {meta.label}
                  </Chip>
                  <p className="text-xs text-body leading-snug">{meta.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}