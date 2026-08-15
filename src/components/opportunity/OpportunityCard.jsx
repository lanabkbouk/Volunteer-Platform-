import { MapPin, Clock, Users, Sparkles, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Card from "../ui/Card";
import Chip from "../ui/Chip";
import Button from "../ui/Button";
import OpportunityStatusBadge from "./OpportunityStatusBadge";
import { CATEGORY_COLORS, CATEGORY_ICONS, getCategoryLabel } from "../../utils/categoryStyles";
import { ROUTES } from "../../constants/paths";

export default function OpportunityCard({
  opportunity,
  recommended = false,
  showCategoryChip = true,
  showMatchReason = true,
}) {
  const navigate = useNavigate();
  const categoryName = opportunity.category?.name;
  const categoryStyle = CATEGORY_COLORS[categoryName] || CATEGORY_COLORS.Social;
  const CategoryIcon = CATEGORY_ICONS[categoryName] || Users;
  const spotsLeft = Math.max(opportunity.maxVolunteers - opportunity.currentVolunteers, 0);
  // أقوى سبب تطابق بس (لا قائمة كاملة) — راجع services/opportunities.js
  // computeMatchScore. showMatchReason=false لما السبب يصير عنوان قسم
  // خارجي بدل سطر داخل البطاقة (راجع OpportunitiesListPage.jsx)
  const matchReason = recommended && showMatchReason ? opportunity.matchReason : null;

  // Falls back to a category-colored icon whenever there's no real photo yet —
  // whether the organization hasn't uploaded one, or the backend rejected it.
  // This never depends on the backend "working"; it's always safe to render.
  const imageFallback = (
    <div className={`flex w-full aspect-video items-center justify-center ${categoryStyle}`}>
      <CategoryIcon className="h-10 w-10" aria-hidden="true" />
    </div>
  );

  // شارة صلبة (مو شفافة متل Chip العادية) لضمان وضوحها فوق أي صورة خلفية
  const recommendedBadge = recommended ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary text-white text-xs font-semibold px-3 py-1 shadow-sm">
      <Sparkles size={12} aria-hidden="true" /> Recommended
    </span>
  ) : null;

  return (
    <Card
      imageSrc={opportunity.image}
      imageAlt={opportunity.title}
      imageFallback={imageFallback}
      badge={recommendedBadge}
      title={opportunity.title}
      titleAdornment={<OpportunityStatusBadge status={opportunity.status} />}
      description={opportunity.description}
      onAction={() => navigate(`${ROUTES.OPPORTUNITIES}/${opportunity.id}`)}
    >
      <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-body">
        <span className="flex items-center gap-1">
          <MapPin size={16} className="text-primary" aria-hidden="true" />
          {opportunity.location}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={16} className="text-primary" aria-hidden="true" />
          {opportunity.minHours}-{opportunity.maxHours} hrs
        </span>
        <span className="flex items-center gap-1">
          <Users size={16} className="text-primary" aria-hidden="true" />
          {spotsLeft} spots left
        </span>
      </div>

      {matchReason ? (
        <p className="flex items-center gap-1.5 mb-4 text-xs font-medium text-primary">
          <Target size={13} aria-hidden="true" />
          {matchReason}
        </p>
      ) : null}

      {(opportunity.category && showCategoryChip) || opportunity.isGroup === true ? (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {opportunity.category && showCategoryChip ? (
            <Chip customStyle={categoryStyle} className="inline-block w-fit">
              {getCategoryLabel(opportunity.category.name)}
            </Chip>
          ) : null}

          {/* isGroup صراحة true بس (مش أي قيمة فولسي) — فردية هي الافتراضي
              وما إلها داعي لشارة. الحقل نفسه يغذّي منطق إنجاز "3 أنشطة
              جماعية" بالباك اند (AchievementService::checkThreeGroupActivities)،
              فمش مجرد UI بدون استخدام فعلي بمكان تاني */}
          {opportunity.isGroup === true ? (
            <Chip color="blue" className="inline-flex items-center gap-1 w-fit">
              <Users size={12} aria-hidden="true" />
              Group opportunity
            </Chip>
          ) : null}
        </div>
      ) : null}

      <Button
        variant="secondary"
        fullWidth
        className="py-4 rounded-4xl text-[15px] font-bold uppercase tracking-wide"
        onClick={() => navigate(`${ROUTES.OPPORTUNITIES}/${opportunity.id}`)}
      >
        View Details
      </Button>
    </Card>
  );
}