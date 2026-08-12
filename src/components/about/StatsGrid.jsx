// شبكة الإحصائيات (متطوعين/منظمات/فرص...). البيانات تجي كـ prop "stats"
// من الصفحة الأب. البطاقة نفسها (StatCard) صارت بـ components/common
// لأنها تُستخدم هون وبصفحة Home كمان.

import { motion } from "framer-motion";
import StatCard from "../common/StatCard";
import Skeleton from "../ui/Skeleton";
import { CARD_SURFACE } from "../../utils/surfaceStyles";

export default function StatsGrid({ stats = [], loading = false, className = "" }) {
  const gridClasses = [`grid grid-cols-2 md:grid-cols-4 gap-6`, className]
    .filter(Boolean)
    .join(" ");

  if (loading) {
    return (
      <div className={gridClasses}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className={`${CARD_SURFACE} p-5 sm:p-8 flex flex-col items-center gap-3`}
          >
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className={gridClasses}
    >
      {(stats || []).map((stat) => (
        <StatCard key={stat.label} number={stat.number} label={stat.label} />
      ))}
    </motion.div>
  );
}