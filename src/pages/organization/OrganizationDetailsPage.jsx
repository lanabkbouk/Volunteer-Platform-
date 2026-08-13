import { useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Building2, MapPin, Globe, Phone, User, PenSquare, Compass, History } from "lucide-react";
import Typography from "../../components/ui/Typography";
import Button from "../../components/ui/Button";
import Tabs from "../../components/ui/Tabs";
import OpportunityCard from "../../components/opportunity/OpportunityCard";
import CardSkeleton from "../../components/ui/CardSkeleton";
import EmptyState from "../../components/common/EmptyState";
import ShowMoreButton from "../../components/common/ShowMoreButton";
import StatusLegendPopover from "../../components/ui/StatusLegendPopover";
import Skeleton from "../../components/ui/Skeleton";
import { PANEL_SURFACE } from "../../utils/surfaceStyles";
import { OPPORTUNITY_STATUS } from "../../constants/opportunityStatus";
import { useOrganizationDetailsQuery } from "../../hooks/queries/useOrganizationDetailsQuery";
import { useOrganizationOpportunitiesQuery } from "../../hooks/queries/useOrganizationOpportunitiesQuery";
import { useShowMore } from "../../hooks/useShowMore";
import { useAuth } from "../../context/AuthContext";
import { ROUTES } from "../../constants/paths";
import { getOrganizationId } from "../../utils/auth/getOrganizationId";

// تبويبان بدل قسمين منفصلين تحت بعض — نفس التصنيف بالضبط (Open Now
// مقابل السجل الكامل/Closed+In Progress+Completed سوا)، بس تجربة أنظف:
// الزائر يشوف مباشرة قسم واحد بكل مرة بدل تمرير طويل عبر قسمين
const ORG_OPPORTUNITIES_TABS = {
  OPEN: "open",
  PAST: "past",
};

export default function OrganizationDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const detailsQuery = useOrganizationDetailsQuery(id);
  const opportunitiesQuery = useOrganizationOpportunitiesQuery(id);

  const organization = detailsQuery.data ?? null;
  const opportunities = useMemo(() => opportunitiesQuery.data ?? [], [opportunitiesQuery.data]);

  // قرار: بروفايل المنظمة بيعرض سجلها الكامل، بس بقسمين منفصلين وليس
  // قائمة مخلوطة — زائر بده ينضم فورًا لازم يلاقي المتاح بأعلى الصفحة
  // بسرعة، والسجل الكامل (منتهي/شغال) موجود وواضح تحته، مش مخفي
  const { openOpportunities, pastOpportunities } = useMemo(() => {
    const open = [];
    const past = [];
    opportunities.forEach((opportunity) => {
      if (opportunity.status === OPPORTUNITY_STATUS.REGISTRATION_OPEN) {
        open.push(opportunity);
      } else {
        past.push(opportunity);
      }
    });
    return { openOpportunities: open, pastOpportunities: past };
  }, [opportunities]);

  const openShowMore = useShowMore(openOpportunities);
  const pastShowMore = useShowMore(pastOpportunities);

  // Open افتراضيًا — نفس الأولوية القديمة (زائر بده ينضم فورًا لازم
  // يلاقي المتاح أول شي)، بس هلق بتبويب بدل قسم أول بالصفحة
  const [activeTab, setActiveTab] = useState(ORG_OPPORTUNITIES_TABS.OPEN);

  // صورة رابطها صحيح شكليًا بس معطوبة/محذوفة (404) — نرجع لأيقونة
  // Building2 الافتراضية بدل أيقونة المتصفح المكسورة. تصفير الحالة
  // بيصير مباشرة أثناء الـ render (نمط React الموصى فيه لضبط state
  // حسب تغيّر prop) بدل useEffect، تفاديًا لـ render إضافي
  const [logoFailed, setLogoFailed] = useState(false);
  const [lastLogoUrl, setLastLogoUrl] = useState(organization?.profileImageUrl);
  if (organization?.profileImageUrl !== lastLogoUrl) {
    setLastLogoUrl(organization?.profileImageUrl);
    setLogoFailed(false);
  }

  const loading = detailsQuery.isPending;
  const loadError = detailsQuery.isError
    ? detailsQuery.error?.message || "Failed to load this organization"
    : "";

  // نفس منطق تحديد "منظمتي" المستخدم بالـ Navbar — لو هاي فعلًا منظمة
  // المستخدم المسجّل دخوله حاليًا، منظهر زر تعديل بروفايلها
  const myOrganizationId = getOrganizationId(user);
  const isOwnOrganization = organization && myOrganizationId === organization.id;

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Skeleton className="h-9 w-1/2 mb-4" />
        <Skeleton className="w-full aspect-[3/1] rounded-3xl mb-6" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6 mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (loadError || !organization) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <p className="rounded-lg border border-danger bg-danger/5 px-3 py-2 text-sm text-danger">
          {loadError || "This organization could not be found."}
        </p>
      </div>
    );
  }

  const opportunitiesLoading = opportunitiesQuery.isPending;
  // فشل جلب فرص المنظمة لازم يظهر كخطأ صريح — وإلا التبويبين بيعرضوا
  // "لا توجد فرص" بدل خطأ شبكة/سيرفر فعلي
  const opportunitiesError = opportunitiesQuery.isError
    ? opportunitiesQuery.error?.message || "Failed to load this organization's opportunities"
    : "";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <nav className="text-sm text-heading/50 mb-4" aria-label="Breadcrumb">
        <Link
          to={ROUTES.ORGANIZATIONS}
          className="hover:text-primary rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          Organizations
        </Link>
        <span className="mx-2">/</span>
        <span className="text-heading">{organization.name}</span>
      </nav>

      {/* غلاف علوي: صورة/شعار + الاسم + المدينة + شارة التوثيق */}
      <div className="w-full aspect-[3/1] rounded-4xl overflow-hidden bg-primary/10 flex items-center justify-center mb-6">
        {organization.profileImageUrl && !logoFailed ? (
          <img
            src={organization.profileImageUrl}
            alt={organization.name}
            onError={() => setLogoFailed(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <Building2 size={56} className="text-primary" aria-hidden="true" />
        )}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <Typography variant="h1">{organization.name}</Typography>
            {/* TODO: عمود status غير متوفر من الباك اند حاليًا — إعادة
                التفعيل بعد إضافته لجدول organizations (راجع مع مطور
                الباك اند). شارة "Verified" مخفية مؤقتًا هون لنفس السبب
                الموضّح بـ OrganizationCard.jsx */}
          </div>
          <div className="flex items-center gap-1 text-sm text-body">
            <MapPin size={16} className="text-primary" aria-hidden="true" />
            {organization.city}
          </div>
        </div>

        {isOwnOrganization ? (
          <Button
            variant="secondary"
            onClick={() => navigate(ROUTES.ORGANIZATION_PROFILE)}
            className="flex items-center gap-2"
          >
            <PenSquare size={16} aria-hidden="true" />
            Edit Profile
          </Button>
        ) : null}
      </div>

      <Typography variant="h4" className="mb-3">
        About
      </Typography>
      <Typography variant="body" className="text-body leading-relaxed mb-8">
        {organization.description || "This organization hasn't added a description yet."}
      </Typography>

      {/* معلومات تواصل — تُعرض بس الحقول المتوفرة فعليًا */}
      {(organization.contactPerson || organization.phone || organization.website) && (
        <div className={`${PANEL_SURFACE} p-6 mb-10 flex flex-col gap-3`}>
          {organization.contactPerson ? (
            <div className="flex items-center gap-2 text-sm text-heading">
              <User size={16} className="text-primary shrink-0" aria-hidden="true" />
              <span className="text-heading/50">Contact person:</span>
              {organization.contactPerson}
            </div>
          ) : null}

          {organization.phone ? (
            <a
              href={`tel:${organization.phone}`}
              className="flex items-center gap-2 text-sm text-heading hover:text-primary w-fit rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <Phone size={16} className="text-primary shrink-0" aria-hidden="true" />
              {organization.phone}
            </a>
          ) : null}

          {organization.website ? (
            <a
              href={organization.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline w-fit rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <Globe size={16} className="shrink-0" aria-hidden="true" />
              {organization.website}
            </a>
          ) : null}
        </div>
      )}

      {/* بدل قسمين منفصلين (Open + Past) تحت بعض، تبويب واحد نشط بكل
          مرة — العداد بجانب كل تبويب يعطي فكرة سريعة قبل حتى الضغط */}
      <Tabs
        tabs={[
          { id: ORG_OPPORTUNITIES_TABS.OPEN, label: "Open Opportunities", icon: Compass, count: openOpportunities.length },
          { id: ORG_OPPORTUNITIES_TABS.PAST, label: "Past Opportunities", icon: History, count: pastOpportunities.length },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        ariaLabel="Organization opportunities"
      />

      {opportunitiesLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : opportunitiesError ? (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-danger bg-danger/5 px-4 py-3 text-sm text-danger">
          <p>{opportunitiesError}</p>
          <Button variant="danger" size="small" onClick={() => opportunitiesQuery.refetch()}>
            Retry
          </Button>
        </div>
      ) : activeTab === ORG_OPPORTUNITIES_TABS.OPEN ? (
        openOpportunities.length === 0 ? (
          <EmptyState
            icon={Compass}
            title="No open opportunities right now"
            description="Check back later — this organization hasn't published any open opportunities yet."
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {openShowMore.visibleItems.map((opportunity) => (
                <OpportunityCard key={opportunity.id} opportunity={opportunity} />
              ))}
            </div>
            {openShowMore.hasMore && (
              <ShowMoreButton remainingCount={openShowMore.remainingCount} onClick={openShowMore.showMore} />
            )}
          </>
        )
      ) : pastOpportunities.length === 0 ? (
        <EmptyState
          icon={History}
          title="No past opportunities yet"
          description="This organization's completed and in-progress opportunities will show up here."
        />
      ) : (
        <>
          {/* هون بالذات (مش بتبويب Open) لأنه هون بتظهر أكتر من حالة
              مختلفة سوا (Closed/In Progress/Completed) بنفس الوقت —
              أكتر مكان بالمشروع محتاج شرح فوري */}
          <div className="mb-4 flex justify-end">
            <StatusLegendPopover />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {pastShowMore.visibleItems.map((opportunity) => (
              <OpportunityCard key={opportunity.id} opportunity={opportunity} />
            ))}
          </div>
          {pastShowMore.hasMore && (
            <ShowMoreButton remainingCount={pastShowMore.remainingCount} onClick={pastShowMore.showMore} />
          )}
        </>
      )}
    </div>
  );
}