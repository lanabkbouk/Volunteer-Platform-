// components/opportunity/SuccessStoryCard.jsx
//
// كارد لفرصة اكتملت بنجاح (وصلت للعدد الكامل من المتطوعين). مختلف
// عن OpportunityCard عمدًا: هون ما في دعوة "شارك الآن" لأنو الفرصة
// خلصت فعليًا — بس عرض للإنجاز (عدد المتطوعين + التاريخ).

import { CheckCircle2, Users, Calendar } from "lucide-react";
import Card from "../ui/Card";
import Chip from "../ui/Chip";
import { CATEGORY_COLORS, CATEGORY_ICONS, CATEGORY_ILLUSTRATIONS } from "../../utils/categoryStyles";

function formatDate(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export default function SuccessStoryCard({ opportunity }) {
  const categoryName = opportunity.category?.name;
  const categoryStyle = CATEGORY_COLORS[categoryName] || CATEGORY_COLORS.Social;
  const CategoryIcon = CATEGORY_ICONS[categoryName] || Users;

  const CategoryIllustration = CATEGORY_ILLUSTRATIONS[categoryName];

  const imageFallback = CategoryIllustration ? (
    <div className="flex w-full aspect-video items-center justify-center bg-canvas overflow-hidden">
      <CategoryIllustration className="w-full h-full object-contain p-2" />
    </div>
  ) : (
    <div className={`flex w-full aspect-video items-center justify-center ${categoryStyle}`}>
      <CategoryIcon className="h-10 w-10" aria-hidden="true" />
    </div>
  );

  return (
    <Card
      imageSrc={opportunity.image}
      imageAlt={opportunity.title}
      imageFallback={imageFallback}
      title={opportunity.title}
      description={opportunity.organization?.name}
    >
      <Chip color="green" className="mb-4 inline-flex items-center gap-1 w-fit">
        <CheckCircle2 size={12} /> Completed
      </Chip>

      <div className="flex flex-wrap items-center gap-4 text-sm text-body">
        <span className="flex items-center gap-1">
          <Users size={16} className="text-primary" aria-hidden="true" />
          {opportunity.currentVolunteers} volunteers helped
        </span>
        <span className="flex items-center gap-1">
          <Calendar size={16} className="text-primary" aria-hidden="true" />
          {formatDate(opportunity.endDate)}
        </span>
      </div>
    </Card>
  );
}