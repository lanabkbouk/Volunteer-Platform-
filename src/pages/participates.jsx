import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Compass, Filter, Sparkles, ArrowRight } from "lucide-react";
import Typography from "../components/ui/Typography";
import ParticipationCard from "../components/opportunity/ParticipationCard";
import ParticipationStatusTabs, { PARTICIPATION_TAB } from "../components/opportunity/ParticipationStatusTabs";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/common/EmptyState";
import ShowMoreButton from "../components/common/ShowMoreButton";
import { useMyParticipationsQuery } from "../hooks/queries/useMyParticipationsQuery";
import { useShowMore } from "../hooks/useShowMore";
import { useParticipationCounts } from "../hooks/useParticipationCounts";
import { markHoursSeen } from "../utils/hoursSeenTracker";
import { markStatusSeen } from "../utils/participationStatusSeenTracker";
import { matchesParticipationStatusTab } from "../utils/participationDisplayStatus";
import { PARTICIPATION_STATUS } from "../constants/participationStatus";
import { CARD_SURFACE } from "../utils/surfaceStyles";
import { ROUTES } from "../constants/paths";

// رسائل فارغة سياقية لكل تبويب حالة — تظهر بس لما يكون عند المتطوع
// مشاركات أصلًا (وإلا العرض الفارغ الكامل تحت بيتكفّل فيها بدعوة صريحة
// للانضمام لأول فرصة). نفس مفاتيح PARTICIPATION_TAB الموجودة أصلًا.
const TAB_EMPTY_MESSAGES = {
  [PARTICIPATION_TAB.PENDING]: "No requests awaiting review right now.",
  [PARTICIPATION_TAB.ACCEPTED]: "No accepted opportunities in this view.",
  [PARTICIPATION_TAB.ACTIVE]: "No opportunities in progress right now.",
  [PARTICIPATION_TAB.COMPLETED]: "No completed opportunities yet.",
  [PARTICIPATION_TAB.REJECTED]: "No rejected requests here.",
  [PARTICIPATION_TAB.WITHDRAWN]: "No withdrawals here.",
};

export default function Participates() {
  const navigate = useNavigate();
  const participationsQuery = useMyParticipationsQuery();
  const [activeTab, setActiveTab] = useState(PARTICIPATION_TAB.ALL);

  const participations = useMemo(() => participationsQuery.data ?? [], [participationsQuery.data]);
  const counts = useParticipationCounts(participations);
  const filteredParticipations = useMemo(
    () => participations.filter((participation) => matchesParticipationStatusTab(participation, activeTab)),
    [participations, activeTab],
  );
  const { visibleItems: visibleParticipations, hasMore, remainingCount, showMore } = useShowMore(filteredParticipations);
  const loading = participationsQuery.isPending;
  const error = participationsQuery.isError
    ? participationsQuery.error?.message || "Failed to load your volunteering history"
    : "";

  // تعليم كل الساعات المؤكدة وحالات القبول/الرفض الظاهرة هلق
  // كـ"مشاهدة" — بعد هالسطر، النقطة الحمراء بالنافبار بتختفي لحد ما
  // يظهر تحديث جديد فعليًا
  useEffect(() => {
    participations.forEach((participation) => {
      if (participation.hoursLogged !== null && participation.hoursLogged !== undefined) {
        markHoursSeen(participation.id, participation.hoursLogged);
      }
      if (
        participation.status === PARTICIPATION_STATUS.ACCEPTED ||
        participation.status === PARTICIPATION_STATUS.REJECTED
      ) {
        markStatusSeen(participation.id, participation.status);
      }
    });
  }, [participations]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Typography variant="sectionTitle" className="mb-2">
        My Volunteering
      </Typography>
      <Typography variant="body" className="mb-8 text-body">
        Track the opportunities you've joined and your progress so far.
      </Typography>

      {loading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className={`${CARD_SURFACE} p-5 flex flex-col gap-3`}>
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-1/3" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="rounded-lg border border-danger bg-danger/5 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : participations.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="You haven't joined any opportunities yet"
          description="Browse open opportunities that match your skills and start making an impact today."
          actionLabel="Explore Opportunities"
          onAction={() => navigate(ROUTES.EXPLORE)}
        />
      ) : (
        <>
          {/* جسر بصري لباقي رحلة التطوع — نفس أسلوب البطاقة السردية
              المستخدمة بصفحة My Journey (VolunteeringHoursSummary) بالضبط،
              حتى تحس الصفحتين إنهم امتداد لبعض مش قسمين منفصلين */}
          <Link
            to={ROUTES.MY_JOURNEY}
            className="mb-6 flex items-center gap-4 rounded-2xl border border-primary/15 bg-primary/5 p-5 shadow-sm transition-colors hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
              <Sparkles size={18} className="text-primary" aria-hidden="true" />
            </div>
            <p className="flex-1 text-sm leading-relaxed text-body">
              See your <strong className="font-bold text-primary">confirmed hours</strong> and{" "}
              <strong className="font-bold text-primary">achievements</strong> on your My Journey page.
            </p>
            <ArrowRight size={16} className="shrink-0 text-primary" aria-hidden="true" />
          </Link>

          <ParticipationStatusTabs activeTab={activeTab} onChange={setActiveTab} counts={counts} />

          {filteredParticipations.length === 0 ? (
            <EmptyState
              icon={Filter}
              title="No participations in this status"
              description={TAB_EMPTY_MESSAGES[activeTab] || "Try a different status tab."}
            />
          ) : (
            <div className="flex flex-col gap-4">
              {visibleParticipations.map((participation) => (
                <ParticipationCard key={participation.id} participation={participation} />
              ))}

              {hasMore && <ShowMoreButton remainingCount={remainingCount} onClick={showMore} />}
            </div>
          )}
        </>
      )}
    </div>
  );
}