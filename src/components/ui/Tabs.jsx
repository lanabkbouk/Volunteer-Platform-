// components/ui/Tabs.jsx
//
// مكوّن Tabs عام (Segmented Control) — عرض بصري بحت، بدون أي منطق
// جلب بيانات أو فلترة. الصفحة الأب هي يلي بتقرر شو تعرض حسب التبويب
// النشط. أي مكان بالموقع يحتاج تبديل بين طريقتي عرض (زي "All/Suggested"
// بصفحة تصفح الفرص، أو "Open/Past" بصفحة تفاصيل المنظمة) يعيد استخدام
// هذا المكوّن بدل بناء تبويب جديد لحاله — راجع OpportunityTabs.jsx
// كمثال على "غلاف" رقيق فوقه بتبويبات جاهزة مسبقًا.

export default function Tabs({ tabs, activeTab, onChange, ariaLabel = "View" }) {
  return (
    // flex-wrap بدل overflow-x-auto: لما عددها كبير على شاشة موبايل ضيقة
    // (مثلًا 7 تبويبات حالة المشاركة)، التبويبات تلتف لسطر ثانٍ (أو أكثر)
    // بدل التمرير الأفقي — كل التبويبات تضل مرئية فورًا بلا أي تفاعل
    // إضافي (سحب/تمرير) لاكتشاف تبويبات مخفية خارج حدود الشاشة
    //
    // w-fit تحديدًا (مش w-max ومش w-full): عنصر flex (غير inline) بيمتد
    // افتراضيًا ليأخذ كامل عرض حاويته الأب لو ما في قيد عرض صريح — w-full
    // بالضبط هيك (امتداد كامل، وهي المشكلة يلي صارت). w-max كانت تجبر
    // العرض على حجم المحتوى الفعلي دايمًا حتى لو تجاوز عرض الحاوية الأب
    // (بيطلع برّا الحاوية بدل ما يلتف). w-fit هي الوسط الصحيح: تنكمش
    // حول المحتوى تمامًا متل w-max بالحالة العادية (تابين قصيرين مثلًا
    // ما بيمتدوا لعرض الصفحة)، لكن لما المحتوى أعرض من الحاوية الأب،
    // بتتقيّد بعرض الحاوية وتترك flex-wrap يلتف التابات لسطر تانٍ بدل
    // ما تفيض برّا — تجمع بين "الانكماش حول المحتوى" و"القدرة على
    // الالتفاف عند الحاجة" بنفس الوقت
    <div className="mb-6">
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="flex flex-wrap w-fit gap-2 rounded-2xl bg-heading/5 border border-heading/10 p-1"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={`flex items-center gap-1.5 min-h-11 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                isActive ? "bg-field text-primary shadow-sm" : "text-heading/60 hover:text-heading"
              }`}
            >
              {Icon ? <Icon size={15} className={isActive ? "text-primary" : ""} /> : null}
              {tab.label}
              {/* عداد اختياري (مثلًا عدد الفرص بكل تبويب) — يظهر بس لو
                  انمرر فعليًا، فما بيأثر على تبويبات ما إلها عداد أصلًا */}
              {typeof tab.count === "number" ? (
                <span
                  className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                    isActive ? "bg-primary/15 text-primary" : "bg-heading/10 text-heading/50"
                  }`}
                >
                  {tab.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}