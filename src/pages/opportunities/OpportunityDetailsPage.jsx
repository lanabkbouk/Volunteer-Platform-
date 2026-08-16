import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MapPin, Calendar, Clock, Phone, Building2, Users } from "lucide-react";
import Typography from "../../components/ui/Typography";
import Chip from "../../components/ui/Chip";
import Button from "../../components/ui/Button";
import OpportunityProgressBar from "../../components/opportunity/OpportunityProgressBar";
import OpportunityLifecycleCard from "../../components/opportunity/OpportunityLifecycleCard";
import OpportunityStatusBadge from "../../components/opportunity/OpportunityStatusBadge";
import StatusLegendPopover from "../../components/ui/StatusLegendPopover";
import ParticipateHoursModal from "../../components/opportunity/ParticipateHoursModal";
import Skeleton from "../../components/ui/Skeleton";
import Avatar from "../../components/common/Avatar";
import { PANEL_SURFACE } from "../../utils/surfaceStyles";
import { useOpportunityDetailsQuery } from "../../hooks/queries/useOpportunityDetailsQuery";
import { useParticipateMutation } from "../../hooks/queries/useParticipateMutation";
import { useAuth } from "../../context/AuthContext";
import { ACCOUNT_TYPES } from "../../constants/auth/accountTypes";
import { ROUTES } from "../../constants/paths";
import { CATEGORY_COLORS, CATEGORY_ICONS, CATEGORY_ILLUSTRATIONS } from "../../utils/categoryStyles";
import { OPPORTUNITY_STATUS } from "../../constants/opportunityStatus";

function formatDate(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function OpportunityDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, accountType } = useAuth();

  const [hasJoined, setHasJoined] = useState(false);
  const [joinError, setJoinError] = useState("");
  // صورة رابطها صحيح شكليًا بس معطوبة/محذوفة (404) — نرجع لنفس شكل
  // "بلا صورة" (أيقونة التصنيف) بدل أيقونة المتصفح المكسورة
  const [coverImageFailed, setCoverImageFailed] = useState(false);
  // نافذة اختيار عدد الساعات — بتنفتح قبل التأكيد الفعلي للمشاركة،
  // مو مباشرة عند ضغط "Participate"
  const [isHoursModalOpen, setIsHoursModalOpen] = useState(false);
  // نفس pattern استخدام useReducedMotion المتبع بـ MainLayout.jsx و
  // AchievementCard.jsx — نحترم تفضيل المستخدم لتقليل الحركة قبل ما
  // نشغّل انتقال "Joining..." → "You're in! ✓"
  const prefersReducedMotion = useReducedMotion();

  const detailsQuery = useOpportunityDetailsQuery(id);
  const participateMutation = useParticipateMutation(id);

  const opportunity = detailsQuery.data?.opportunity ?? null;

  const loading = detailsQuery.isPending;
  const loadError = detailsQuery.isError
    ? detailsQuery.error?.message || "Failed to load this opportunity"
    : "";

  async function handleParticipate(committedHours) {
    setJoinError("");
    const result = await participateMutation.mutateAsync(committedHours);
    if (result?.success) {
      setIsHoursModalOpen(false);
      setHasJoined(true);
    } else {
      // نبقي النافذة مفتوحة (بدل ما نسكّرها) عشان المتطوع يقدر يجرّب
      // رقم مختلف فورًا، بدل ما يضطر يفتحها من جديد من الصفر
      setJoinError(result?.error || "Failed to join this opportunity");
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* نفس ترتيب العمود الرأسي الفعلي (عنوان، زر Participate،
            صورة، باقي المعلومات) بوضع Skeleton، حتى ما يصير قفزة Layout
            مفاجئة لحظة ما البيانات توصل */}
        <div className="max-w-3xl">
          <Skeleton className="h-9 w-2/3 mb-4" />
          <Skeleton className="h-11 w-40 rounded-xl mb-8" />
          <Skeleton className="w-full aspect-video max-h-105 rounded-4xl mb-6" />
          <Skeleton className="h-4 w-1/3 mb-4" />
          <div className="flex flex-wrap gap-4 mb-6">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-2 w-full rounded-full mb-6" />
          <Skeleton className="h-24 w-full rounded-2xl mb-8" />
          <Skeleton className="h-6 w-48 mb-3" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    );
  }

  if (loadError || !opportunity) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <p className="rounded-lg border border-danger bg-danger/5 px-3 py-2 text-sm text-danger">
          {loadError || "This opportunity could not be found."}
        </p>
      </div>
    );
  }

  const isVolunteer = isAuthenticated && accountType === ACCOUNT_TYPES.VOLUNTEER;
  // حساب دقيق لكل حالة ممكنة لزر المشاركة، بدل ما يكون منطق الزر مبعثر
  // بين onClick و disabled و النص — كل شي هون بمكان واحد وواضح.
  const isGuest = !isAuthenticated;
  const isNonVolunteerAccount = isAuthenticated && !isVolunteer; // حساب منظمة مسجّل دخوله
  const spotsLeft = Math.max(opportunity.maxVolunteers - opportunity.currentVolunteers, 0);
  const categoryName = opportunity.category?.name;
  const categoryStyle = CATEGORY_COLORS[categoryName] || CATEGORY_COLORS.Social;
  const CategoryIcon = CATEGORY_ICONS[categoryName] || MapPin;
  const CategoryIllustration = CATEGORY_ILLUSTRATIONS[categoryName];

  // التسجيل مفتوح فعليًا (محسوب تلقائيًا حسب التاريخ وعدد المتطوعين —
  // راجع utils/opportunityStatus.js) — أي حالة تانية تمنع الانضمام
  const isRegistrationOpen = opportunity.status === OPPORTUNITY_STATUS.REGISTRATION_OPEN;

  const registrationClosedReason =
    opportunity.status === OPPORTUNITY_STATUS.IN_PROGRESS ||
    opportunity.status === OPPORTUNITY_STATUS.COMPLETED
      ? "This opportunity is no longer accepting new volunteers."
      : spotsLeft === 0
        ? "This opportunity is fully booked."
        : "Registration for this opportunity has closed.";

  const participateLabel = isGuest
    ? "Participate"
    : hasJoined
      ? "You're in! ✓"
      : !isRegistrationOpen
        ? spotsLeft === 0
          ? "Fully Booked"
          : "Registration Closed"
        : "Participate";

  // نفس منطق onClick/disabled يُستخدم لزر Participate الرئيسي (تحت
  // العنوان مباشرة) ولنسخته المصغّرة بالشريط الثابت أسفل الشاشة تحت lg
  // — استخراجهم هون بمكان واحد بدل تكرارهم بزرّين، حتى ما يصير فرق
  // سلوك بين الزرّين بالغلط لاحقًا
  const handleParticipateClick = isGuest
    ? () => navigate(ROUTES.REGISTER) // زائر: نحوّله مباشرة لإنشاء حساب، بلا رسالة وسيطة
    : isVolunteer
      ? () => {
          setJoinError("");
          setIsHoursModalOpen(true);
        } // نفتح نافذة اختيار الساعات أولًا، مو انضمام مباشر
      : undefined;

  // الزر يتعطل بحالات: انضم فعلاً / التسجيل مو مفتوح فعليًا / حساب
  // منظمة مسجّل دخوله. الزائر ما بينعطل الزر عندو، بينقله للتسجيل بدل
  // ما يمنعه
  const isParticipateDisabled = isNonVolunteerAccount || hasJoined || (!isGuest && !isRegistrationOpen);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-28 lg:pb-10">
      <nav className="text-sm text-heading/50 mb-4" aria-label="Breadcrumb">
        <Link to={ROUTES.OPPORTUNITIES} className="hover:text-primary rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
          Opportunities
        </Link>
        <span className="mx-2">/</span>
        <span className="text-heading">{opportunity.title}</span>
      </nav>

      {/* العنوان + الحالة، وزر Participate تحتهما مباشرة — full-width فوق
          الـ grid بعمودين، حتى يبقيا أول شي يشوفه المستخدم بدون أي
          تمرير، بغض النظر عن محاذاة الصورة والـ sidebar تحتهم */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <Typography variant="h1">
          {opportunity.title}
        </Typography>
        <div className="flex items-center gap-2">
          <OpportunityStatusBadge status={opportunity.status} />
          <StatusLegendPopover />
        </div>
      </div>

      {/* زر Participate — مباشرة تحت العنوان، أول شي يشوفه المستخدم
          بدون أي تمرير، بدل ما يكون مدفون بعد كل التفاصيل */}
      <div className="mb-8">
        <Button
          variant="primary"
          size="large"
          onClick={handleParticipateClick}
          isLoading={false}
          disabled={isParticipateDisabled}
          loadingText="Joining..."
        >
          {/* AnimatePresence بـ mode="wait": الكلمة القديمة تخرج (fade+scale)
              قبل ما الجديدة تدخل، بدل استبدال فجائي — "You're in! ✓"
              بيوصل بإحساس احتفالي خفيف بدل مجرد تغيّر نص. mode="wait"
              هون (مو "popLayout" أو غيره) لأنه الزر بحجم ثابت، ما في
              داعي لأي حساب layout إضافي أثناء التبديل */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={participateLabel}
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.9 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
              className="inline-block"
            >
              {participateLabel}
            </motion.span>
          </AnimatePresence>
        </Button>

        {/* رسالة توضيحية واحدة بحسب سبب التعطيل/الحالة — أولوية حساب
            المنظمة أولًا (أوضح سبب)، ثم إغلاق التسجيل، ثم الزائر
            (نص دائم وغير قابل للإغلاق، بلا رابط أو زر داخله — فقط
            إعلام إنه محتاج حساب) */}
        {isNonVolunteerAccount ? (
          <p className="mt-2 text-sm text-heading/50">
            Only volunteer accounts can join opportunities.
          </p>
        ) : !isGuest && !hasJoined && !isRegistrationOpen ? (
          <p className="mt-2 text-sm text-heading/50">{registrationClosedReason}</p>
        ) : isGuest ? (
          <p className="mt-2 text-sm text-heading/50">
            You'll need to create an account or sign in to join this opportunity.
          </p>
        ) : null}

        {joinError ? (
          <p className="mt-2 rounded-lg border border-danger bg-danger/5 px-3 py-2 text-sm text-danger">
            {joinError}
          </p>
        ) : null}
      </div>

      {/* Grid بعمودين متوازنين: الأيسر (minmax(0,1fr)) أوسع وفيه كل تفاصيل
          الفرصة (صورة، منظمة، موقع/تاريخ/ساعات، تقدم، مهارات، Organized
          by، والوصف)، والأيمن (lg:20rem ثابت) فيه بس OpportunityLifecycleCard.
          items-start + كون الاثنين أول عنصر بنفس صف الـ grid يضمن محاذاة
          أعلى الـ sidebar تمامًا مع أعلى الصورة (بدل أعلى العنوان). تحت lg
          يرجعوا عمودي واحد تحت بعض (grid-cols-1 الافتراضي) */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_20rem] gap-8 lg:gap-10 items-start">
        <div className="min-w-0">
          {/* max-h-96 احترازي: يمنع aspect-video من فرض ارتفاع ضخم لو
              صار عرض هالعمود كبير (خصوصًا تحت lg وين العمود الأيمن
              بيرجع تحته وهالعمود ياخد عرض الصفحة الكامل) */}
          <div className="w-full aspect-video max-h-96 rounded-3xl overflow-hidden bg-heading/5 flex items-center justify-center mb-6">
            {opportunity.image && !coverImageFailed ? (
              <img
                src={opportunity.image}
                alt={opportunity.title}
                onError={() => setCoverImageFailed(true)}
                className="w-full h-full object-cover"
              />
            ) : CategoryIllustration ? (
              <div className="flex w-full h-full items-center justify-center bg-canvas overflow-hidden">
                <CategoryIllustration className="w-full h-full object-contain p-6" />
              </div>
            ) : (
              <div className={`flex w-full h-full items-center justify-center ${categoryStyle}`}>
                <CategoryIcon size={48} aria-hidden="true" />
              </div>
            )}
          </div>

          {opportunity.organization?.name && (
            <Link
              to={`${ROUTES.ORGANIZATIONS}/${opportunity.organization.id}`}
              className="mb-4 flex w-fit items-center gap-1.5 rounded text-sm text-body hover:text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <Building2 size={14} className="text-primary shrink-0" aria-hidden="true" />
              {opportunity.organization.name}
            </Link>
          )}

          <div className="flex flex-wrap gap-4 mb-6 text-sm text-body">
            <span className="flex items-center gap-1">
              <MapPin size={16} className="text-primary" aria-hidden="true" />
              {opportunity.location}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={16} className="text-primary" aria-hidden="true" />
              {formatDate(opportunity.startDate)} - {formatDate(opportunity.endDate)}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={16} className="text-primary" aria-hidden="true" />
              {opportunity.minHours}-{opportunity.maxHours} hrs / session
            </span>
            {/* isGroup صراحة true بس — فردية هي الافتراضي وما إلها داعي
                لإشارة. الحقل نفسه يغذّي منطق إنجاز "3 أنشطة جماعية"
                بالباك اند (AchievementService::checkThreeGroupActivities)،
                فمش مجرد معلومة عرض بلا استخدام فعلي بمكان تاني */}
            {opportunity.isGroup === true && (
              <span className="flex items-center gap-1">
                <Users size={16} className="text-primary" aria-hidden="true" />
                Group opportunity
              </span>
            )}
          </div>

          <div className="mb-6">
            <OpportunityProgressBar
              current={opportunity.currentVolunteers}
              max={opportunity.maxVolunteers}
            />
          </div>

          {/* نافذة التسجيل — تُعرض بس أثناء مراحل التسجيل، وما إلها معنى
              بعد ما تبدأ الفرصة فعليًا (in_progress/completed) */}
          {(opportunity.status === OPPORTUNITY_STATUS.REGISTRATION_OPEN ||
            opportunity.status === OPPORTUNITY_STATUS.REGISTRATION_CLOSED) &&
          opportunity.registerEndAt ? (
            <p className="mb-6 -mt-2 text-xs text-heading/50">
              Registration {opportunity.status === OPPORTUNITY_STATUS.REGISTRATION_CLOSED ? "closed" : "closes"} on{" "}
              {formatDate(opportunity.registerEndAt)}
            </p>
          ) : null}

          {opportunity.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-8">
              {opportunity.skills.map((skill) => (
                <Chip key={skill.id} color="blue">
                  {skill.name}
                </Chip>
              ))}
            </div>
          ) : null}

          <div className={`${PANEL_SURFACE} p-6 mb-8`}>
            <p className="text-sm text-heading/50 mb-2">Organized by</p>
            <div className="flex items-center gap-3">
              <Avatar
                src={opportunity.organization?.imageUrl}
                name={opportunity.organization?.name}
                size="sm"
              />
              <div className="min-w-0">
                {opportunity.organization?.id ? (
                  <Link
                    to={`${ROUTES.ORGANIZATIONS}/${opportunity.organization.id}`}
                    className="text-lg font-semibold text-heading hover:text-primary rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    {opportunity.organization.name}
                  </Link>
                ) : (
                  <p className="text-lg font-semibold text-heading">{opportunity.organization.name}</p>
                )}

                {opportunity.organization?.phone ? (
                  <a
                    href={`tel:${opportunity.organization.phone}`}
                    className="mt-1 flex items-center gap-2 text-sm text-body hover:text-primary w-fit rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    <Phone size={14} className="text-primary shrink-0" aria-hidden="true" />
                    {opportunity.organization.phone}
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          <Typography variant="h4" className="mb-3">
            About this opportunity
          </Typography>
          <Typography variant="body" className="text-body leading-relaxed">
            {opportunity.description}
          </Typography>
        </div>

        {/* العمود الأيمن: بس How this works + Withdrawal Policy، بدون
            sticky (يبقى بموقعه الطبيعي بتدفق الصفحة)، وبدون أي بوكس
            تصنيفات (CategorySidebar انحذف بمهمة سابقة، ما إله أي أثر هون) */}
        <div>
          <OpportunityLifecycleCard />
        </div>
      </div>

      {/* شريط CTA ثابت أسفل الشاشة تحت lg بس — الزر الرئيسي صار فوق
          مباشرة تحت العنوان (مرئي فورًا)، بس المستخدم يقدر يتمرّر عميق
          جوا وصف طويل وينسى وين الزر، خصوصًا على شاشة موبايل ضيقة.
          هاي نسخة مصغّرة تبقى مرئية دايمًا أثناء التمرير، نفس
          onClick/disabled/label بالضبط (لا فرق بالسلوك) */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-heading/10 bg-field/95 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur-sm lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <Typography variant="bodySm" className="min-w-0 flex-1 truncate font-semibold text-heading">
            {opportunity.title}
          </Typography>
          <Button
            variant="primary"
            onClick={handleParticipateClick}
            disabled={isParticipateDisabled}
            loadingText="Joining..."
            className="shrink-0"
          >
            {participateLabel}
          </Button>
        </div>
      </div>

      <ParticipateHoursModal
        open={isHoursModalOpen}
        onClose={() => setIsHoursModalOpen(false)}
        onConfirm={handleParticipate}
        minHours={opportunity.minHours}
        maxHours={opportunity.maxHours}
        submitting={participateMutation.isPending}
        serverError={joinError}
      />
    </div>
  );
}