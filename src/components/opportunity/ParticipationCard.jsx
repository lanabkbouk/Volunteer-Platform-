import { useState } from "react";
import { Link } from "react-router-dom";
import { Building2, CalendarClock, Clock, MapPin, LogOut, PlayCircle, Info } from "lucide-react";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import ConfirmModal from "../common/ConfirmModal";
import ParticipationStatusBadge from "./ParticipationStatusBadge";
import { useWithdrawParticipationMutation } from "../../hooks/queries/useWithdrawParticipationMutation";
import { PARTICIPATION_STATUS } from "../../constants/participationStatus";
import { OPPORTUNITY_STATUS } from "../../constants/opportunityStatus";
import { ROUTES } from "../../constants/paths";
import { CARD_BASE } from "../../utils/surfaceStyles";
import { getDaysUntilStart } from "../../utils/opportunityStatus";
import { canWithdraw as canWithdrawParticipation } from "../../utils/participationPolicy";
import { formatParticipationHours } from "../../utils/participationHours";

export default function ParticipationCard({ participation }) {
  const { opportunity, status, joinedDate, withdrawnDate, rejectionReason } = participation;
  const withdrawMutation = useWithdrawParticipationMutation();
  const [error, setError] = useState("");
  const [isReasonOpen, setIsReasonOpen] = useState(false);
  // مودال تأكيد موحّد (ConfirmModal) بدل window.confirm() السابق —
  // نافذة المتصفح الافتراضية كانت مختلفة بصريًا عن باقي نوافذ التأكيد
  const [isWithdrawConfirmOpen, setIsWithdrawConfirmOpen] = useState(false);

  // نفس الدالة الموحّدة المستخدمة بالضبط بـ
  // buildUpcomingOpportunityReminderItems (services/notifications.js)
  // — مؤشر تكميلي هون على البطاقة نفسها، حتى لو المتطوع ما فتح جرس
  // الإشعارات بالنافذة الضيقة (يومين)، بيشوف نفس المعلومة أول ما يراجع
  // صفحة "My Volunteering" أصلًا
  const daysUntilStart =
    status === PARTICIPATION_STATUS.ACCEPTED ? getDaysUntilStart(opportunity?.startDate) : null;

  // ⚠️ opportunity.status هون هي الحالة الفعلية المحسوبة أصلًا (راجع
  // attachComputedStatus بـ services/opportunities.js)، مش قيمة خام —
  // فمقارنتها مباشرة بـ IN_PROGRESS دقيقة بدون أي حساب إضافي هون.
  // شارة "بدأت الفرصة" مستقلة تمامًا عن شارة "Starts in X days" فوق —
  // الاثنتان لا تظهران سوا أبدًا (لو بدأت فعليًا، daysUntilStart
  // بترجع null تلقائيًا من نفس الدالة)
  const hasStarted =
    status === PARTICIPATION_STATUS.ACCEPTED && opportunity?.status === OPPORTUNITY_STATUS.IN_PROGRESS;

  // hoursLogged بيضل null لحد ما المنظمة تأكد/تعدّل الرقم النهائي بعد
  // انتهاء الفرصة فعليًا (راجع updateParticipationHours) — بعد التأكيد
  // نعرض الرقمين سوا (يلي حدّده المتطوع لنفسه + يلي أكّدته المنظمة)
  const hoursLabel = formatParticipationHours(participation);

  // قرار مع فريق : الانسحاب متاح من pending أو accepted سوا، بس مش
  // من rejected أو expired — ما في شي ينسحب منه. راجع
  // utils/participationPolicy.js للقاعدة الكاملة (مشتركة مع بطاقة دورة
  // حياة الفرصة بصفحة التفاصيل)
  const isWithdrawEligibleStatus =
    status === PARTICIPATION_STATUS.PENDING || status === PARTICIPATION_STATUS.ACCEPTED;
  const canWithdraw = canWithdrawParticipation(participation);

  const handleConfirmWithdraw = async () => {
    setError("");
    const result = await withdrawMutation.mutateAsync(participation.id);
    if (!result.success) {
      setError(result.error || "Failed to withdraw from this opportunity");
    }
    setIsWithdrawConfirmOpen(false);
  };

  return (
    <div className={CARD_BASE}>
      <div className="flex items-start justify-between gap-3 mb-1">
        <Link
          to={`${ROUTES.OPPORTUNITIES}/${opportunity.id}`}
          className="min-w-0 rounded font-semibold text-heading hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {opportunity.title}
        </Link>
        <ParticipationStatusBadge participation={participation} className="shrink-0" />
      </div>

      {opportunity.organization?.name && (
        <Link
          to={`${ROUTES.ORGANIZATIONS}/${opportunity.organization.id}`}
          className="mb-2 flex w-fit items-center gap-1.5 rounded text-sm text-body hover:text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <Building2 size={13} className="text-primary shrink-0" aria-hidden="true" />
          {opportunity.organization.name}
        </Link>
      )}

      {/* "شو الخطوة الجاية" أهم من التفاصيل الثانوية تحت (موقع/ساعات/تاريخ
          انضمام) — لهيك طالعينها فوق قبل صف الميتاداتا، مش تحت كل شي */}
      {daysUntilStart !== null && (
        <div className="mb-3 flex items-center gap-1.5 rounded-lg bg-sky-500/10 px-3 py-2 text-sm font-medium text-sky-600 w-fit">
          <CalendarClock size={14} aria-hidden="true" />
          Starts in {daysUntilStart} day{daysUntilStart === 1 ? "" : "s"}
        </div>
      )}

      {hasStarted && (
        <div className="mb-3 flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-600 w-fit">
          <PlayCircle size={14} aria-hidden="true" />
          Opportunity in progress
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4 text-sm text-body">
          <span className="flex items-center gap-1">
            <MapPin size={14} className="text-primary" aria-hidden="true" />
            {opportunity.location}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={14} className="text-primary" aria-hidden="true" />
            {hoursLabel}
          </span>
          <span className="text-heading/55">Joined {joinedDate}</span>
          {status === PARTICIPATION_STATUS.WITHDRAWN && withdrawnDate && (
            <span className="text-heading/55">· Withdrew {withdrawnDate}</span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {status === PARTICIPATION_STATUS.REJECTED && (
            <Button
              variant="ghost"
              size="small"
              onClick={() => setIsReasonOpen(true)}
              className="flex min-h-11 items-center gap-1 !px-3 !text-sm text-heading/60 hover:bg-heading/5"
            >
              <Info size={14} />
              View reason
            </Button>
          )}

          {canWithdraw && (
            <Button
              variant="ghost"
              size="small"
              onClick={() => setIsWithdrawConfirmOpen(true)}
              disabled={withdrawMutation.isPending}
              title="Available until this opportunity's registration closes"
              className="flex min-h-11 items-center gap-1 !px-3 !text-sm text-danger hover:bg-danger/10"
            >
              <LogOut size={14} />
              Withdraw
            </Button>
          )}
        </div>
      </div>

      {/* تلميح سياقي: يظهر فقط لما الانسحاب كان ممكنًا نظريًا (الحالة
          نفسها Pending/Accepted) لكن اختفى الزر لأن تسجيل الفرصة أُغلق —
          بدون هذا السطر، اختفاء الزر بدون تفسير قد يبدو خطأ بالواجهة
          للمتطوع، بدل قاعدة منصة مقصودة */}
      {!canWithdraw && isWithdrawEligibleStatus && (
        <p className="mt-2 text-xs text-heading/55">
          Withdrawal is no longer available — registration for this opportunity has closed.
        </p>
      )}

      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

      <Modal
        open={isReasonOpen}
        onClose={() => setIsReasonOpen(false)}
        title="Rejection Reason"
        footer={
          <Button variant="ghost" onClick={() => setIsReasonOpen(false)}>
            Close
          </Button>
        }
      >
        {rejectionReason || "No reason was provided by the organization for this decision."}
      </Modal>

      <ConfirmModal
        open={isWithdrawConfirmOpen}
        onClose={() => setIsWithdrawConfirmOpen(false)}
        onConfirm={handleConfirmWithdraw}
        title={`Withdraw from "${opportunity.title}"?`}
        description="This can't be undone."
        confirmLabel="Withdraw"
        confirmVariant="danger"
        isLoading={withdrawMutation.isPending}
        loadingText="Withdrawing..."
      />
    </div>
  );
}