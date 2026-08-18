// جرس إشعارات مستقل بالنافبار — بديل عن دفن التحديثات جوا Dropdown
// البروفايل (كان لازم تضغطي اسمك أول لتكتشفي وجودهم). نفس فلسفة
// useClickOutside الموجودة أصلًا (StatusLegendPopover)، بس بعداد رقمي
// وأيقونة مختلفة لكل نوع تحديث — بدل نقطة حمراء صامتة أو نص فاضي.

import { Link } from "react-router-dom";
import { Bell, PartyPopper, ArrowRight } from "lucide-react";
import useClickOutside from "../../hooks/useClickOutside";
import NotificationListItem from "../notifications/NotificationListItem";
import { ROUTES } from "../../constants/paths";

export default function NotificationBell({ items, isOpen, onToggle, onClose, triggerClassName }) {
  const rootRef = useClickOutside(isOpen, onClose);
  const count = items.length;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={count > 0 ? `${count} new updates` : "Notifications"}
        className={
          triggerClassName ||
          "relative flex items-center justify-center h-10 w-10 rounded-2xl bg-white/10 border border-white/15 text-white hover:bg-white/15 hover:border-white/25 transition"
        }
      >
        <Bell className="h-4.5 w-4.5" aria-hidden="true" />
        {count > 0 && (
          <span
            className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[11px] font-bold leading-[18px] text-center border-2 border-black animate-pulse"
            aria-hidden="true"
          >
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-2xl bg-field border-2 border-heading/20 shadow-2xl ring-1 ring-black/5 overflow-hidden z-50">
          <p className="px-4 py-3 text-xs font-semibold text-heading/50 uppercase tracking-wide border-b border-heading/10">
            Notifications
          </p>

          {count === 0 ? (
            // نفس تركيبة EmptyState (دائرة primary/10 + أيقونة + عنوان)
            // بس بمقاس مصغّر يلائم عرض القائمة المنسدلة (w-80) — نسخة
            // EmptyState الكاملة (py-20 وأيقونة 96px) مصمّمة لسكشن كامل
            // بالصفحة، مش لقائمة منسدلة صغيرة بالنافبار
            <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                <PartyPopper size={20} className="text-primary" aria-hidden="true" />
              </div>
              <p className="text-sm font-semibold text-heading">You're all caught up.</p>
            </div>
          ) : (
            <div className="flex max-h-80 flex-col overflow-y-auto">
              {items.map((item) => (
                <NotificationListItem key={item.id} item={item} onNavigate={onClose} />
              ))}
            </div>
          )}

          <Link
            to={ROUTES.NOTIFICATIONS}
            onClick={onClose}
            className="flex items-center justify-center gap-1.5 border-t border-heading/10 px-4 py-3 text-xs font-semibold text-primary transition hover:bg-heading/5"
          >
            See all notifications
            <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </div>
      )}
    </div>
  );
}