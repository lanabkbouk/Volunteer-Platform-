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

import { useMemo, useRef, useState } from "react";
import { Bell, CheckCheck, PartyPopper } from "lucide-react";
import Typography from "../components/ui/Typography";
import Button from "../components/ui/Button";
import TabsFilter from "../components/ui/TabsFilter";
import EmptyState from "../components/common/EmptyState";
import ShowMoreButton from "../components/common/ShowMoreButton";
import NotificationListItem from "../components/notifications/NotificationListItem";
import Toast from "../components/common/Toast";
import AuthAlert from "../components/auth/AuthAlert";
import { useToast } from "../hooks/useToast";
import useRecentUpdates from "../hooks/useRecentUpdates";
import { useShowMore } from "../hooks/useShowMore";
import { CARD_SURFACE } from "../utils/surfaceStyles";
import {
  NOTIFICATION_TYPE_ICONS,
  NOTIFICATION_TYPE_LABELS,
  DEFAULT_NOTIFICATION_ICON,
} from "../constants/notificationTypes";

// مهلة "تراجع" التعليم الجماعي كمقروء — خلال هالوقت، نداء onDismiss()
// الفعلي (يلي بيعلّم كل عنصر مقروء عند المصدر) بيضل مؤجّل، فالضغط على
// "Undo" بالتوست قادر يلغيه فعليًا قبل ما يصير نهائي
const MARK_ALL_UNDO_WINDOW_MS = 5000;

export default function Notifications() {
  const { items, hasError } = useRecentUpdates();
  const [dismissedIds, setDismissedIds] = useState(() => new Set());
  const [activeTab, setActiveTab] = useState("all");
  const { toast, showToast, closeToast } = useToast();
  // نخزّن هون دفعة "التعليم الجماعي" المعلّقة حاليًا (لسا ما انفّذت
  // فعليًا) — id المهلة + قائمة العناصر نفسها، حتى نقدر (أ) نلغي المهلة
  // ونرجّع العناصر للعرض لو ضغط المستخدم Undo، أو (ب) ننفّذها فورًا لو
  // ضغط "Mark all as read" مرة تانية قبل ما تخلص المهلة السابقة
  const pendingMarkAllRef = useRef(null);

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

  // ملاحظة: onDismiss() الحقيقي لكل عنصر (يلي بيعلّمه مقروء عند المصدر)
  // بيتنفّذ بس لما تخلص مهلة التراجع بدون ما يُلغى — بدونها، ضغطة "Undo"
  // ما كانت رح تقدر تسترجع شي فعليًا لأنه التعليم الحقيقي يكون صار خلاص
  const commitPendingMarkAll = () => {
    const pending = pendingMarkAllRef.current;
    if (!pending) return;
    clearTimeout(pending.timeoutId);
    pending.items.forEach((item) => item.onDismiss?.());
    pendingMarkAllRef.current = null;
  };

  const handleMarkAllRead = () => {
    // لو فيه دفعة سابقة لسا معلّقة (المستخدم ضغط الزر مرتين بسرعة)،
    // ننفّذها فورًا الأول بدل ما تضيع أو تتلخبط مع الدفعة الجديدة
    commitPendingMarkAll();

    const itemsToMark = visibleAllItems;

    // إخفاء تفاؤلي فوري من العرض — نفس آلية dismissedIds المستخدمة أصلًا
    // بالتعليم الفردي (handleDismiss تحت)، حتى الاستجابة البصرية تصير
    // لحظية بغض النظر عن مهلة التراجع
    setDismissedIds((prev) => {
      const next = new Set(prev);
      itemsToMark.forEach((item) => next.add(item.id));
      return next;
    });

    const timeoutId = setTimeout(() => {
      itemsToMark.forEach((item) => item.onDismiss?.());
      pendingMarkAllRef.current = null;
    }, MARK_ALL_UNDO_WINDOW_MS);

    pendingMarkAllRef.current = { timeoutId, items: itemsToMark };

    showToast(
      `Marked ${itemsToMark.length} notification${itemsToMark.length === 1 ? "" : "s"} as read`,
      "success",
      {
        actionLabel: "Undo",
        onAction: () => {
          const pending = pendingMarkAllRef.current;
          if (!pending) return;
          clearTimeout(pending.timeoutId);
          pendingMarkAllRef.current = null;

          // نرجّع بس نفس العناصر يلي كانت جزء من هالدفعة تحديدًا — لو
          // المستخدم علّم عنصر إضافي مقروء يدويًا (X) بالفترة نفسها، بدنا
          // يضل مخفي، مش يرجع بالغلط مع البقية
          setDismissedIds((prev) => {
            const next = new Set(prev);
            pending.items.forEach((item) => next.delete(item.id));
            return next;
          });
        },
      },
    );
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

      {hasError && (
        // ⚠️ ما منخفي القائمة تحتها لو كان عندها عناصر قديمة لسا محفوظة
        // بالذاكرة (آخر جلب ناجح) — بس المستخدم لازم يعرف إنه آخر محاولة
        // فشلت، مش يظن إنه القائمة الظاهرة محدّثة 100% لهلق
        <div className="mb-4">
          <AuthAlert variant="error">Couldn't refresh notifications. Retrying automatically.</AuthAlert>
        </div>
      )}

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

      {/* duration مطابقة تمامًا لمهلة التراجع (MARK_ALL_UNDO_WINDOW_MS) —
          حتى يختفي زر "Undo" بنفس لحظة ما يصير التعليم نهائيًا فعليًا،
          بدل ما يضل ظاهرًا وما إله أي أثر بعدها */}
      <Toast
        message={toast.message}
        variant={toast.variant}
        duration={MARK_ALL_UNDO_WINDOW_MS}
        onClose={closeToast}
        actionLabel={toast.actionLabel}
        onAction={toast.onAction}
      />
    </div>
  );
}
