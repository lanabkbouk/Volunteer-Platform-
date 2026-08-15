// سكشن "إحصائيات سريعة": يضيف عدد المحافظات (SYRIAN_GOVERNORATES_COUNT)
// جنب إحصائيات الباك (متطوعين/منظمات/فرص) — نفس مصدر البيانات المستخدم
// أصلًا بصفحة About، بدون تكرار الرقم بمكان تاني.

import { Users, Building2, Heart, MapPin } from "lucide-react";
import StatsGrid from "../about/StatsGrid";
import { SYRIAN_GOVERNORATES_COUNT } from "../../services/syrianGovernorates";

export default function HomeStatsSection({ stats, loading }) {
  if (!loading && !stats) return null;

  // StatCard أصلًا بيدعم أيقونة بخلفية برتقالية فاتحة (bg-primary/10) —
  // ما كانت مُمرَّرة هون قبل، فالبطاقات كانت رقم/نص بس بدون أي أيقونة
  const statsArray = stats
    ? [
        { number: stats.volunteersCount, label: "Active Volunteers", icon: Users },
        { number: stats.organizationsCount, label: "Organizations", icon: Building2 },
        { number: stats.opportunitiesCount, label: "Opportunities", icon: Heart },
        { number: SYRIAN_GOVERNORATES_COUNT, label: "Governorates Covered", icon: MapPin },
      ]
    : [];

  return <StatsGrid stats={statsArray} loading={loading} className="mb-0" />;
}