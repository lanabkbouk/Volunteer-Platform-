// components/ui/TabsFilter.jsx
//
// شريط تابات فلترة عمودي بالكامل — عمود ثابت دائم الظهور على md وما
// فوق، وزر قابل للطي (Collapsible) على الشاشات الصغيرة بدل عرض القائمة
// كاملة دائمًا (بديل عن components/ui/Tabs.jsx العام لما يكون عدد
// التابات كبير وما بيحتمل شاشات صغيرة، مثل تابات حالة "My Volunteering"
// السبعة).
//
// التصميم: التاب النشط محدَّد بخلفية فاتحة (bg-primary/10) بدل خط
// سفلي/خلفية بيضاء. Badge العدد ملوّن حسب دلالة الحالة (tab.colorVariant
// القادم من الأب)، مش حسب كون التاب نشط أو لا.
//
// البيانات (tabs/activeTab/onTabChange) بالكامل props من الأب — لا
// بيانات ثابتة ولا منطق جلب هون، حتى يصير قابل لإعادة الاستخدام بأي
// شريط فلترة تاني بالمشروع (راجع constants/participationTabs.js
// كمثال على مصدر بيانات منفصل عن هذا المكوّن).

import { useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { PANEL_SURFACE } from "../../utils/surfaceStyles";

// ألوان الشارة حسب الدلالة — معرّفة هون فقط (مش مستوردة من Chip.jsx)
// لأن حجم/شكل شارة التاب مختلف عن استخدامات Chip العامة بالمشروع، لكن
// نفس عائلة الألوان الدلالية المستخدمة أصلًا بـ PARTICIPATION_STATUS_META
// (gold/green/red/gray) حتى تنسجم بصريًا مع باقي شارات الحالة بالموقع
const BADGE_COLOR_CLASSES = {
  neutral: "bg-heading/10 text-heading/60",
  warning: "bg-amber-100 text-amber-700",
  success: "bg-emerald-100 text-emerald-700",
  danger: "bg-red-100 text-red-700",
};

export default function TabsFilter({ tabs, activeTab, onTabChange, ariaLabel = "Filter" }) {
  // خاص فقط بعرض/إخفاء القائمة على الشاشات الصغيرة — لا علاقة له بـ
  // activeTab المُدار من الأب. على md وما فوق قيمته بلا أي تأثير
  // (القائمة تُفرض ظاهرة دائمًا عبر md: classes بغض النظر عنها)
  const [isExpanded, setIsExpanded] = useState(false);
  const listId = useId();

  // مرجع لكل زر تاب حسب id — للتحكم بالفوكس يدويًا عند التنقل بالأسهم
  // (roving tabindex: تاب واحد بس قابل للوصول بـ Tab، والبقية تُصل
  // إليهم بالأسهم يدويًا متل أي قائمة تابات حسب معيار WAI-ARIA)
  const tabButtonsRef = useRef(new Map());
  const focusTabById = (id) => {
    tabButtonsRef.current.get(id)?.focus();
  };

  // اختيار تاب (بالماوس أو الكيبورد سوا) — تبديل التاب النشط بالأب، ثم
  // إغلاق القائمة المطوية على الموبايل تلقائيًا (بلا أي تأثير على md+
  // حيث isExpanded غير مستخدَم أصلًا بصريًا)
  const selectTab = (id) => {
    onTabChange(id);
    setIsExpanded(false);
  };

  // تفعيل تلقائي (Automatic Activation): السهم بينقل الفوكس *ويبدّل*
  // التاب النشط بنفس الوقت — نمط شائع ومتوقّع لتابات الفلترة (بعكس
  // النمط "اليدوي" يلي بيحتاج Enter/Space إضافي بعد نقل الفوكس).
  // عمودي فقط (ArrowUp/ArrowDown) بدل الأفقي السابق
  const handleKeyDown = (event, index) => {
    let nextIndex;

    if (event.key === "ArrowDown") nextIndex = (index + 1) % tabs.length;
    else if (event.key === "ArrowUp") nextIndex = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = tabs.length - 1;
    else return;

    event.preventDefault();
    const nextTab = tabs[nextIndex];
    selectTab(nextTab.id);
    focusTabById(nextTab.id);
  };

  const activeTabDef = tabs.find((tab) => tab.id === activeTab) || tabs[0];
  const ActiveIcon = activeTabDef?.icon;

  // فاصل بصري قبل آخر تابين — بترتيب participationTabs.js الحالي هذول
  // هم "Rejected" و"Withdrawn" (الحالتان الثانويتان)، بس القرار هون
  // موضعي بحت (آخر تابين) مش مبني على اسم/id محدد، حتى يضل المكوّن
  // عامًا وقابلًا لإعادة الاستخدام بأي تابات تانية بدون أي معرفة بمعناها
  const dividerIndex = tabs.length > 2 ? tabs.length - 2 : -1;

  return (
    // بدون mb-6 هون: المكوّن مستخدَم داخل حاوية flex بها gap-6 أصلًا
    // بصفحة participates.jsx (تباعد الأب هو المسؤول، مش المكوّن نفسه)
    <div className="w-full">
      {/* زر الطي — يظهر فقط تحت md، ويُخفى بالكامل (بما فيه منطقه) على
          md وما فوق عبر md:hidden */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
        aria-controls={listId}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-heading/10 bg-field px-4 py-3 text-sm font-medium text-heading transition-colors hover:bg-heading/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 md:hidden"
      >
        <span className="flex min-w-0 items-center gap-1.5">
          {ActiveIcon ? <ActiveIcon size={15} className="shrink-0 text-primary" aria-hidden="true" /> : null}
          <span className="truncate">
            {activeTabDef?.label}
            {typeof activeTabDef?.count === "number" ? ` (${activeTabDef.count})` : ""}
          </span>
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-heading/50 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {/* حيلة grid-template-rows (0fr -> 1fr) للانتقال السلس بالارتفاع
          بدون قياس ارتفاع فعلي بجافاسكربت وبدون أي مكتبة أنيميشن —
          overflow-hidden بالداخل يقصّ المحتوى أثناء الانتقال بس. على
          md وما فوق: نفرض 1fr وopacity-100 دائمًا (md: classes بترجّح
          على القيم الأساسية داخل نفس الـ breakpoint)، فتظهر القائمة
          دومًا بغض النظر عن isExpanded
          */}
      <div
        className={`grid transition-all duration-300 ease-in-out md:grid-rows-[1fr] md:opacity-100 ${
          isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div
            id={listId}
            role="tablist"
            aria-orientation="vertical"
            aria-label={ariaLabel}
            // نفس صندوق "Categories" حرفيًا بصفحة Explore Opportunities
            // (CategorySidebar.jsx: PANEL_SURFACE + p-5) — بدل قائمة flex
            // عارية بلا هوية بصرية مستقلة تبدو ملتصقة بجانب الكاردات
            className={`${PANEL_SURFACE} flex w-full flex-col gap-1 p-5`}
          >
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const badgeClass = BADGE_COLOR_CLASSES[tab.colorVariant] || BADGE_COLOR_CLASSES.neutral;

              return (
                <div key={tab.id}>
                  {index === dividerIndex && <div className="my-2 border-t border-heading/10" aria-hidden="true" />}

                  <button
                    ref={(node) => {
                      if (node) tabButtonsRef.current.set(tab.id, node);
                      else tabButtonsRef.current.delete(tab.id);
                    }}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    tabIndex={isActive ? 0 : -1}
                    onKeyDown={(event) => handleKeyDown(event, index)}
                    onClick={() => selectTab(tab.id)}
                    className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                      isActive ? "bg-primary/10 text-primary" : "text-heading/60 hover:bg-heading/5 hover:text-heading"
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-1.5">
                      {Icon ? <Icon size={15} className="shrink-0" aria-hidden="true" /> : null}
                      <span className="truncate">{tab.label}</span>
                    </span>

                    {/* عداد اختياري — يظهر بس لو انمرر فعليًا، فما بيأثر
                        على تابات ما إلها عداد أصلًا */}
                    {typeof tab.count === "number" ? (
                      <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${badgeClass}`}>
                        {tab.count}
                      </span>
                    ) : null}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
