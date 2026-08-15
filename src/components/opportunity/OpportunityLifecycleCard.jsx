// بطاقة معلومات مدمجة تُعرض قبل ما المتطوع يتقدّم بطلب — تشرح دورة حياة
// الفرصة كمراحل متسلسلة، وسياسة السحب ضمن نفس البطاقة (مش قسم منفصل).
// مكوّن عرض بحت (بدون أي جلب بيانات)؛ سياسة السحب مصدرها
// WITHDRAWAL_POLICY_META نفسها المستخدمة بتلميح زر الانسحاب على بطاقة
// "My Volunteering" (ParticipationCard) — حتى ما ينحرف النص عن بعضه.
//
// ⚠️ لا لون مستقل أو مكتوب يدويًا بهاد الملف إطلاقًا — كل لون/أيقونة
// لمرحلة تمثّل حالة حقيقية مسحوبة من المصدر المركزي (getDisplayStatusMeta
// في utils/participationDisplayStatus.js) بالضبط، فأي تعديل مستقبلي
// على لون حالة معيّنة بالمصدر المركزي بينعكس هون تلقائيًا. المرحلة يلي
// مالها حالة مخزّنة فعليًا بالنظام هلق (Applied) بتاخد نمط "قادم/غير
// مفعّل بعد" محايد (حدود متقطّعة + شفافية أخف + أيقونة دائرة فاضية) بدل
// أي لون يوحي إنها حالة نشطة فعليًا.
//
// لا يوجد مكوّن Steps/Stepper جاهز بالمشروع، فهاد أول واحد — بسيط وقابل
// لإعادة الاستخدام (props بس، بدون أي منطق خاص بصفحة معيّنة).

import { Circle } from "lucide-react";
import { PANEL_SURFACE } from "../../utils/surfaceStyles";
import Typography from "../ui/Typography";
import Chip from "../ui/Chip";
import { WITHDRAWAL_POLICY_META } from "../../utils/participationPolicy";
import { getDisplayStatusMeta, PARTICIPATION_DISPLAY_STATUS } from "../../utils/participationDisplayStatus";

// كل مرحلة بمصدر لونها/أيقونتها الحقيقي: Under Review/Accepted حالتا
// مشاركة حقيقيتان (PARTICIPATION_STATUS_META عبر getDisplayStatusMeta)،
// Active/Completed مُشتقّتان من حالة الفرصة نفسها (OPPORTUNITY_STATUS_META
// — نفس قرار getParticipationStatusMeta بالضبط). Applied ما إلها قيمة
// PARTICIPATION_STATUS مخزّنة فعليًا هلق (التقديم نفسه بيصير pending
// فورًا) فـ meta بترجع null قصدًا، فتاخد النمط المحايد تحت
const LIFECYCLE_STEPS = [
  { label: "Applied", meta: null },
  { label: "Under Review", meta: getDisplayStatusMeta(PARTICIPATION_DISPLAY_STATUS.PENDING) },
  { label: "Accepted", meta: getDisplayStatusMeta(PARTICIPATION_DISPLAY_STATUS.ACCEPTED) },
  { label: "Active", meta: getDisplayStatusMeta(PARTICIPATION_DISPLAY_STATUS.ACTIVE) },
  { label: "Completed", meta: getDisplayStatusMeta(PARTICIPATION_DISPLAY_STATUS.COMPLETED) },
];

function StepChip({ label, meta }) {
  if (!meta) {
    return (
      <Chip color="gray" className="inline-flex items-center gap-1 !py-0.5 !text-xs border-dashed opacity-70">
        <Circle size={12} aria-hidden="true" />
        {label}
      </Chip>
    );
  }

  const Icon = meta.icon;

  return (
    <Chip color={meta.color} className="inline-flex items-center gap-1 !py-0.5 !text-xs">
      {Icon && <Icon size={12} aria-hidden="true" />}
      {label}
    </Chip>
  );
}

export default function OpportunityLifecycleCard() {
  return (
    <div className={`${PANEL_SURFACE} p-5 mb-8`}>
      <Typography variant="h5" className="mb-4">
        How this works
      </Typography>
      {/* Stepper عمودي: عمود ثابت (دائرة الرقم + الخط الواصل) بجانب
          عمود المحتوى (الشارة الملوّنة). align-items الافتراضي (stretch)
          بالـflex يخلّي عمود الدائرة/الخط ياخد نفس ارتفاع صف المحتوى
          تلقائيًا، فالخط (flex-1) بيمتد بالضبط لحد الدائرة يلي بعده
          بدون أي حساب ارتفاع يدوي أو absolute positioning */}
      <ol className="mb-5">
        {LIFECYCLE_STEPS.map((step, index) => {
          const isLastStep = index === LIFECYCLE_STEPS.length - 1;

          return (
            <li key={step.label} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-heading/5 text-xs font-semibold text-heading/60">
                  {index + 1}
                </span>
                {!isLastStep && <span className="w-px flex-1 bg-heading/10" aria-hidden="true" />}
              </div>
              <div className={isLastStep ? "pb-0.5" : "pb-5"}>
                <StepChip label={step.label} meta={step.meta} />
              </div>
            </li>
          );
        })}
      </ol>

      <Typography variant="h6" className="mb-2 pt-4 border-t border-heading/10">
        Withdrawal Policy
      </Typography>
      {/* تكديس عمودي (شارة بسطر، وصف تحتها) بدل صف أفقي — تسميات طويلة
          زي "Accepted (while registration is open)" كانت بتوسّع الشارة
          وتدفع النص فيصير السطر غير متوازن. عمودي بيضمن إن طول التسمية
          (قصيرة أو طويلة) ما يأثر على تناسق الصف أبدًا */}
      <ul className="flex flex-col gap-3">
        {WITHDRAWAL_POLICY_META.map((entry) => {
          const meta = getDisplayStatusMeta(entry.displayStatus);
          const Icon = meta?.icon;

          return (
            <li key={entry.displayStatus} className="flex flex-col gap-1 text-xs text-body pb-2">
              <Chip
                color={meta?.color || "gray"}
                className="inline-flex items-center gap-1 !py-0.5 !text-[11px] w-fit"
              >
                {Icon && <Icon size={11} aria-hidden="true" />}
                {entry.label}
              </Chip>
              <span className="leading-relaxed">{entry.description}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
