// components/home/HomePartners.jsx
//
// سكشن "منظمات مشاركة": بيستخرج أسماء المنظمات من بيانات الفرص
// الموجودة أصلًا (organization.name على كل فرصة) بدل ما يجيب بيانات
// منظمات من مصدر منفصل. عرض بصري بس، بدون روابط أو صفحات تفاصيل —
// لأن صفحة "تفاصيل منظمة" مو مبنية بعد بالمشروع.

import { Building2 } from "lucide-react";
import Typography from "../ui/Typography";
import { CARD_SURFACE, CARD_ELEVATION } from "../../utils/surfaceStyles";

// يرجع منظمات فريدة (بدون تكرار، حسب id) من قائمة فرص — كائن كامل
// (id, name, imageUrl) مش الاسم بس، حتى نقدر نعرض صورة المنظمة لاحقًا
function getUniqueOrganizations(opportunities) {
  const seen = new Set();
  const organizations = [];

  opportunities.forEach((opportunity) => {
    const org = opportunity.organization;
    if (org?.id && !seen.has(org.id)) {
      seen.add(org.id);
      organizations.push(org);
    }
  });

  return organizations;
}

export default function HomePartners({ opportunities }) {
  const organizations = getUniqueOrganizations(opportunities);

  if (organizations.length === 0) return null;

  return (
    <section>
      <div className="text-center mb-10">
        <Typography variant="h2" className="mb-2">
          Trusted by Organizations
        </Typography>
        <Typography variant="body" className="max-w-xl mx-auto">
          Real causes, posted by real organizations already making an impact.
        </Typography>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {organizations.map((org) => (
          <div
            key={org.id}
            className={`flex flex-col items-center text-center gap-3 p-6 ${CARD_SURFACE} ${CARD_ELEVATION}`}
          >
            {org.imageUrl ? (
              <img
                src={org.imageUrl}
                alt={org.name}
                className="w-14 h-14 rounded-full object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 size={24} className="text-primary" aria-hidden="true" />
              </div>
            )}
            <span className="font-semibold text-heading text-sm leading-snug line-clamp-2 wrap-break-word">{org.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}