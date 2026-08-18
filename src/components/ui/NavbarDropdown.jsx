import { useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import useClickOutside from "../../hooks/useClickOutside";

export default function NavbarDropdown({
  trigger,
  triggerAriaLabel,
  items = [],
  header = null,
  isOpen,
  setIsOpen,
  width = "w-56",
  align = "right",
  className = "",
}) {
  const alignStyles = {
    right: "right-0",
    left: "left-0",
  };

  // إغلاق القائمة تلقائيًا عند الضغط في أي مكان خارجها
  const rootRef = useClickOutside(isOpen, () => setIsOpen(false));
  const triggerRef = useRef(null);

  // إغلاق بـ Escape من لوحة المفاتيح، مع إرجاع الفوكس لزر التشغيل
  // (نفس سلوك أي قائمة منسدلة قياسية بمعايير WCAG)
  useEffect(() => {
    if (!isOpen) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setIsOpen]);

  function handleTriggerKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen(!isOpen);
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      
      {/* Trigger — قابل للوصول بالكيبورد بالكامل (Tab, Enter, Space) */}
      <div
        ref={triggerRef}
        role="button"
        tabIndex={0}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={triggerAriaLabel}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleTriggerKeyDown}
        className="cursor-pointer select-none rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      >
        {trigger}
      </div>

      {/* Menu */}
      {isOpen && (
        <div
          role="menu"
          className={`
            absolute ${alignStyles[align]} ${width}
            mt-2 z-50
            bg-field
            border-2 border-heading/20
            rounded-xl
            shadow-2xl
            ring-1 ring-black/5
          `}
        >
          {/* Header */}
          {header && (
            <div className="px-4 py-3 border-b border-heading/10">
              {header}
            </div>
          )}

          {/* Items */}
          <div className="py-2">
            {items.map((item) => {
              const isLogout = item.name === "Logout";

              const baseClasses =
                "group w-full flex items-center gap-3 px-4 py-2 text-sm transition rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset";

              // hover بلون primary خفيف للعناصر العادية (بدل رمادي محايد) —
              // نفس لغة hover المستخدمة بعناصر Dropdown.jsx القابلة للنقر.
              // Logout يبقى بلون danger لوحده (تحذير لإجراء حسّاس، مش تنقّل عادي)
              const textClasses = isLogout
                ? "text-danger hover:bg-danger/10"
                : "text-heading hover:bg-primary/10 hover:text-primary";

              const iconClasses = isLogout
                ? "w-4 h-4 text-danger"
                : "w-4 h-4 text-heading/70 transition-colors group-hover:text-primary";

              const content = (
                <>
                  {item.icon && <item.icon className={iconClasses} />}
                  <span>{item.name}</span>
                </>
              );

              return item.href ? (
                <NavLink
                  key={item.name}
                  role="menuitem"
                  to={item.href}
                  onClick={item.onClick}
                  className={`${baseClasses} ${textClasses} ${
                    isLogout ? "border-t border-heading/10 mt-1 pt-2" : ""
                  }`}
                >
                  {content}
                </NavLink>
              ) : (
                <button
                  key={item.name}
                  role="menuitem"
                  onClick={item.onClick}
                  className={`${baseClasses} ${textClasses} ${
                    isLogout ? "border-t border-heading/10 mt-1 pt-2" : ""
                  }`}
                >
                  {content}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}