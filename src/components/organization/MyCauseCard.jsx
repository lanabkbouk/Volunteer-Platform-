import { useState } from "react";
import { MapPin, Calendar, Users, Pencil, Trash2, Lock, Unlock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Card from "../ui/Card";
import Chip from "../ui/Chip";
import Button from "../ui/Button";
import OpportunityStatusBadge from "../opportunity/OpportunityStatusBadge";
import { OPPORTUNITY_STATUS } from "../../constants/opportunityStatus";
import { CATEGORY_COLORS, CATEGORY_ICONS, getCategoryLabel } from "../../utils/categoryStyles";
import { ROUTES } from "../../constants/paths";

// نفس منطق حساب المقاعد المتبقية المستخدم في OpportunityCard (بدون تكراره حرفيًا لأن
// هذا الكارد يعرض معلومة إضافية: نسبة الامتلاء، وليس فقط "كم بقي")
function formatVolunteerProgress(current, max) {
  const safeCurrent = Math.max(0, current || 0);
  const safeMax = Math.max(1, max || 1);
  const percentage = Math.min(100, Math.round((safeCurrent / safeMax) * 100));
  return { safeCurrent, safeMax, percentage };
}

export default function MyCauseCard({ opportunity, onDelete, onToggleStatus, isVerified = true }) {
  const navigate = useNavigate();
  const categoryName = opportunity.category?.name;
  const categoryStyle = CATEGORY_COLORS[categoryName] || CATEGORY_COLORS.Social;
  const CategoryIcon = CATEGORY_ICONS[categoryName] || Users;
  const { safeCurrent, safeMax, percentage } = formatVolunteerProgress(
    opportunity.currentVolunteers,
    opportunity.maxVolunteers,
  );

  // التبديل اليدوي (قفل/فتح) منطقي بس لما التسجيل لسا بمرحلته (قبل ما
  // تبدأ الفرصة فعليًا) — بعد ما تصير "قيد العمل" أو "منتهية"، الحالة
  // محسوبة بالكامل من التواريخ وما في داعي (ولا معنى) لأي تبديل يدوي
  const isRegistrationClosed = opportunity.status === OPPORTUNITY_STATUS.REGISTRATION_CLOSED;
  const canToggleRegistration =
    opportunity.status === OPPORTUNITY_STATUS.REGISTRATION_OPEN ||
    opportunity.status === OPPORTUNITY_STATUS.REGISTRATION_CLOSED;

  const [deleting, setDeleting] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const busy = deleting || togglingStatus;

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Delete "${opportunity.title}"? This can't be undone.`,
    );
    if (!confirmed) return;

    setDeleting(true);
    await onDelete?.(opportunity.id);
    // لا داعي لإعادة setDeleting(false) في حال النجاح: الكارد بينحذف من القائمة فورًا
    // بس نرجعها لو صار خطأ ورجع الكارد يظهر من جديد
    setDeleting(false);
  };

  // تبديل يدوي بين تسجيل مفتوح/منتهي — منفصل تمامًا عن الإغلاق التلقائي
  // عند اكتمال العدد أو تجاوز تاريخ نهاية التسجيل (يُحسب تلقائيًا)
  const handleToggleStatus = async () => {
    const nextStatus = isRegistrationClosed
      ? OPPORTUNITY_STATUS.REGISTRATION_OPEN
      : OPPORTUNITY_STATUS.REGISTRATION_CLOSED;
    const confirmed = window.confirm(
      isRegistrationClosed
        ? `Reopen registration for "${opportunity.title}"?`
        : `Close registration for "${opportunity.title}" early?`,
    );
    if (!confirmed) return;

    setTogglingStatus(true);
    await onToggleStatus?.(opportunity.id, nextStatus);
    setTogglingStatus(false);
  };

  const imageFallback = (
    <div className={`flex w-full aspect-video items-center justify-center ${categoryStyle}`}>
      <CategoryIcon className="h-10 w-10" aria-hidden="true" />
    </div>
  );

  return (
    <Card imageSrc={opportunity.image} imageAlt={opportunity.title} imageFallback={imageFallback}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-bold text-2xl text-heading">{opportunity.title}</h3>
        <OpportunityStatusBadge status={opportunity.status} />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-body">
        <span className="flex items-center gap-1">
          <MapPin size={16} className="text-primary" aria-hidden="true" />
          {opportunity.location}
        </span>
        <span className="flex items-center gap-1">
          <Calendar size={16} className="text-primary" aria-hidden="true" />
          {opportunity.startDate}
        </span>
      </div>

      {opportunity.category ? (
        <Chip customStyle={categoryStyle} className="mb-4 inline-block w-fit">
          {getCategoryLabel(opportunity.category.name)}
        </Chip>
      ) : null}

      {/* تقدّم عدد المتطوعين — معلومة مخصصة لمنظور المنظمة، غير موجودة بكارد المتطوع */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-sm mb-1.5">
          <span className="flex items-center gap-1 text-heading font-medium">
            <Users size={16} className="text-primary" aria-hidden="true" />
            {safeCurrent} of {safeMax} volunteers
          </span>
          <span className="text-heading/50">{percentage}%</span>
        </div>
        <div className="h-2 rounded-full bg-heading/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* تُعرض بس أثناء مرحلة التسجيل — توضّح للمنظمة متى تنتهي هالمرحلة */}
      {canToggleRegistration && opportunity.registerEndAt ? (
        <p className="mb-5 text-xs text-heading/50">
          Registration {isRegistrationClosed ? "closed" : "closes"} on {opportunity.registerEndAt}
        </p>
      ) : (
        <div className="mb-5" />
      )}

      <div className="mt-auto flex items-center gap-2">
        <Button
          variant="secondary"
          fullWidth
          disabled={busy}
          onClick={() => navigate(`${ROUTES.APPLICANTS}/${opportunity.id}`)}
        >
          View Applicants
        </Button>
        <Button
          variant="ghost"
          size="medium"
          disabled={busy || !isVerified}
          onClick={() => navigate(`${ROUTES.MY_CAUSES}/${opportunity.id}/edit`)}
          aria-label="Edit this cause"
          title={!isVerified ? "Available once your organization is verified" : undefined}
        >
          <Pencil size={18} />
        </Button>
        {/* زر القفل/الفتح يظهر بس أثناء مرحلة التسجيل — إخفاؤه (مو تعطيله
            فقط) لما الفرصة "قيد العمل" أو "منتهية" لأنه ببساطة ما إله معنى
            بهاتين المرحلتين (الحالة محسوبة بالكامل من التواريخ) */}
        {canToggleRegistration && (
          <Button
            variant="ghost"
            size="medium"
            disabled={busy || !isVerified}
            isLoading={togglingStatus}
            loadingText="Updating..."
            onClick={handleToggleStatus}
            aria-label={isRegistrationClosed ? "Reopen registration" : "Close registration early"}
            title={
              !isVerified
                ? "Available once your organization is verified"
                : isRegistrationClosed
                  ? "Reopen registration for new volunteers"
                  : "Close registration to new volunteers early"
            }
          >
            {isRegistrationClosed ? <Unlock size={18} /> : <Lock size={18} />}
          </Button>
        )}
        <Button
          variant="ghost"
          size="medium"
          disabled={busy || !isVerified}
          isLoading={deleting}
          loadingText="Deleting..."
          onClick={handleDelete}
          className="text-danger hover:bg-danger/10 border-danger/20"
          aria-label="Delete this cause"
          title={!isVerified ? "Available once your organization is verified" : undefined}
        >
          <Trash2 size={18} />
        </Button>
      </div>
    </Card>
  );
}