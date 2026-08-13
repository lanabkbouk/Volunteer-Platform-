// pages/notifications.jsx
//
// النسخة الكاملة من التنبيهات (بدل dropdown الـ Bell الضيق بالنافبار،
// راجع components/ui/NotificationBell.jsx) — نفس مصدر البيانات
// (useRecentUpdates، بلا أي جلب مضاعف)، بس بمساحة كافية لفلترة حسب
// النوع + تعليم صريح كمقروء (فردي أو الكل دفعة وحدة).
//
// إزالة تفاؤلية محليًا (dismissedIds) قبل ما يوصل الـ polling التالي
// (كل 5 ثواني، راجع useRecentUpdates.js) — بدونها كان العنصر بيضل ظاهر
// لحد 5 ثواني كاملة بعد الضغط على "مقروء"، إحساس بطيء وغير مباشر.

import { useMemo, useState } from "react";
import { Bell, CheckCheck, PartyPopper } from "lucide-react";
import Typography from "../components/ui/Typography";
import Button from "../components/ui/Button";
import TabsFilter from "../components/ui/TabsFilter";
import EmptyState from "../components/common/EmptyState";
import ShowMoreButton from "../components/common/ShowMoreButton";
import NotificationListItem from "../components/notifications/NotificationListItem";
import useRecentUpdates from "../hooks/useRecentUpdates";
import { useShowMore } from "../hooks/useShowMore";
import { CARD_SURFACE } from "../utils/surfaceStyles";
import {
  NOTIFICATION_TYPE_ICONS,
  NOTIFICATION_TYPE_LABELS,
  DEFAULT_NOTIFICATION_ICON,
} from "../constants/notificationTypes";

export default function Notifications() {
  const { items } = useRecentUpdates();
  const [dismissedIds, setDismissedIds] = useState(() => new Set());
  const [activeTab, setActiveTab] = useState("all");

  const visibleAllItems = useMemo(
    () => items.filter((item) => !dismissedIds.has(item.id)),
    [items, dismissedIds],
  );

  // تابات ديناميكية مبنية من الأنواع الموجودة فعليًا بالقائمة الحالية —
  // بلا قائمة أنواع ثابتة مُقفلة بالكود، حتى نوع جديد يُضاف لاحقًا
  // بـ services/notifications.js يظهر تلقائيًا كتاب هون بدون أي تعديل
  const tabs = useMemo(() => {
    const countsByType = new Map();
    visibleAllItems.forEach((item) => {
      countsByType.set(item.type, (countsByType.get(item.type) || 0) + 1);
    });

    const typeTabs = [...countsByType.entries()].map(([type, count]) => ({
      id: type,
      label: NOTIFICATION_TYPE_LABELS[type] || "Updates",
      icon: NOTIFICATION_TYPE_ICONS[type] || DEFAULT_NOTIFICATION_ICON,
      count,
    }));

    return [{ id: "all", label: "All", icon: Bell, count: visibleAllItems.length }, ...typeTabs];
  }, [visibleAllItems]);

  // تعديل حالة أثناء الرندر (نفس نمط hooks/useShowMore.js) بدل useEffect:
  // لو التاب النشط صار غير متاح (مثلًا آخر تنبيه من نوعه اتعلّم مقروء)،
  // نرجع لـ"All" فورًا بدل ما يضل المستخدم واقف على تاب فاضي بصمت
  if (activeTab !== "all" && !tabs.some((tab) => tab.id === activeTab)) {
    setActiveTab("all");
  }

  const filteredItems = useMemo(
    () => (activeTab === "all" ? visibleAllItems : visibleAllItems.filter((item) => item.type === activeTab)),
    [visibleAllItems, activeTab],
  );
  const { visibleItems, hasMore, remainingCount, showMore } = useShowMore(filteredItems);

  const handleDismiss = (item) => {
    item.onDismiss?.();
    setDismissedIds((prev) => new Set(prev).add(item.id));
  };

  const handleMarkAllRead = () => {
    visibleAllItems.forEach((item) => item.onDismiss?.());
    setDismissedIds((prev) => {
      const next = new Set(prev);
      visibleAllItems.forEach((item) => next.add(item.id));
      return next;
    });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Typography variant="sectionTitle" className="mb-2">
            Notifications
          </Typography>
          <Typography variant="body" className="text-body">
            Everything that needs your attention, in one place.
          </Typography>
        </div>

        {visibleAllItems.length > 0 && (
          <Button variant="ghost" size="small" onClick={handleMarkAllRead} className="flex items-center gap-2">
            <CheckCheck size={16} aria-hidden="true" />
            Mark all as read
          </Button>
        )}
      </div>

      {visibleAllItems.length === 0 ? (
        <EmptyState
          icon={PartyPopper}
          title="You're all caught up"
          description="New updates about your activity will show up here."
        />
      ) : (
        <div className="flex flex-col items-start gap-8 md:flex-row">
          <div className="w-full md:w-56 md:shrink-0">
            <TabsFilter
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              ariaLabel="Notification type filter"
            />
          </div>

          <div className="flex w-full min-w-0 flex-1 flex-col gap-y-4 md:max-w-4xl">
            <div className={`${CARD_SURFACE} overflow-hidden`}>
              {visibleItems.map((item) => (
                <NotificationListItem
                  key={item.id}
                  item={item}
                  onDismiss={handleDismiss}
                  showDismiss
                  truncateDescription={false}
                />
              ))}
            </div>

            {hasMore && <ShowMoreButton remainingCount={remainingCount} onClick={showMore} />}
          </div>
        </div>
      )}
    </div>
  );
}
