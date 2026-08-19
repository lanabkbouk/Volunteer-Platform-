// src/utils/adminStyles.js
//
// نقطة واحدة لأنماط الأسطح المشتركة داخل لوحة الأدمن الغامقة الدائمة —
// نفس مبدأ surfaceStyles.js/fieldStyles.js العامين، بس بتوكنات
// adminBg*/adminBorder المخصّصة للأدمن (index.css) بدل bg-field/
// border-heading الفاتحة المستخدمة ببقية الموقع. أي تغيير مستقبلي بشكل
// أسطح الأدمن بيصير هون بس، وينعكس تلقائيًا على كل صفحة/مكوّن أدمن.

// لوحة ثابتة (رأس بحث، لوحة إحصاء جانبية...) — نفس دور PANEL_SURFACE العام
export const ADMIN_PANEL_SURFACE = "rounded-3xl bg-adminBg1 border border-adminBorder shadow-sm"

// بطاقة/صف تفاعلي (تصنيف، مهارة، مدينة، منظمة، بطاقة إحصاء...) — مستوى
// أعمق من ADMIN_PANEL_SURFACE (adminBg2) حتى تتمايز بصريًا فوقها
export const ADMIN_CARD_SURFACE = "rounded-2xl bg-adminBg2 border border-adminBorder"

export const ADMIN_CARD_BASE = `${ADMIN_CARD_SURFACE} p-5`

// نسخة غامقة من Button variant="ghost" (اللي يفرض bg-bg الأبيض/
// border-heading/20/text-heading/hover:bg-heading/5 افتراضيًا بـ
// Button.jsx — مصمّم لخلفية الموقع العام الفاتحة) — تُمرَّر كـ className
// إضافي على أي زر ghost يظهر مباشرة فوق الأدمن الغامق (خارج Modal، اللي
// يبقى فاتحًا بلا تغيير عمدًا). كل قيمة هون لازم !important: className
// العادي (بدون !) بنفس درجة تخصيص (Specificity) القيمة الافتراضية
// المتعارضة معها بـ Button.jsx، وTailwind بيفرز التعارض حسب ترتيب توليد
// الـ CSS الداخلي مش ترتيب الكلاسات بالـ JSX (نفس مشكلة Typography.jsx
// المؤكَّدة بمراجعة بصرية حية) — بدون ! كان بعض هالقيم يخسر التعارض
export const ADMIN_GHOST_BUTTON =
  "bg-transparent! border-adminBorder! text-adminTextHi! hover:bg-white/6!"

// checkbox خام (<input type="checkbox">) داخل الأدمن — بدون تنسيق كان
// المتصفح يفرض لونه الأزرق الافتراضي بغض النظر عن الهوية. accent-color
// (accent-adminAccent، مولَّدة تلقائيًا بـ Tailwind v4 من توكن
// --color-adminAccent بـ index.css) بتلوّن المربع المعبّأ وعلامة الصح
// معًا كخاصية CSS أصيلة، بدون إخفاء الـ input وبناء بديل SVG يدوي —
// يبقي الـ HTML الدلالي وسلوك onChange/register الأصلي بلا أي تغيير
export const ADMIN_CHECKBOX =
  "h-5 w-5 cursor-pointer rounded border-adminBorder bg-adminBg2 accent-adminAccent focus:outline-none focus-visible:ring-2 focus-visible:ring-adminAccent/40"
