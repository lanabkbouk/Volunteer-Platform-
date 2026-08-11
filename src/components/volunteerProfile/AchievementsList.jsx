import { AlertCircle, Trophy, Target } from "lucide-react";
import useAchievements from "../../hooks/useAchievements";
import AchievementCard from "./AchievementCard";
import Skeleton from "../ui/Skeleton";
import EmptyState from "../common/EmptyState";
import Typography from "../ui/Typography";
import { CARD_SURFACE, CARD_PADDING } from "../../utils/surfaceStyles";

export default function AchievementsList() {
  const { achievements, justUnlockedIds, loading, error, retry } = useAchievements();

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className={`${CARD_SURFACE} ${CARD_PADDING} flex flex-col gap-4`}>
            <div className="flex items-start justify-between gap-3">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Couldn't load your achievements"
        description={error}
        actionLabel="Try again"
        onAction={retry}
      />
    );
  }

  if (achievements.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="No achievements yet"
        description="Start volunteering to earn your first badge!"
      />
    );
  }

  // فصل بصري بين "المكتسبة" و"الأهداف القادمة" بدل شبكة واحدة مختلطة —
  // نفس ترتيب الكاتالوج الأصلي محفوظ داخل كل مجموعة (partition مستقر)،
  // بدون أي معيار ترتيب جديد أو بيانات إضافية
  const earnedAchievements = achievements.filter((item) => item.unlocked);
  const lockedAchievements = achievements.filter((item) => !item.unlocked);
  const unlockedCount = earnedAchievements.length;
  const overallPercent = achievements.length > 0 ? Math.round((unlockedCount / achievements.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-8">
      {/* ملخّص عام أبرز من مجرد سطر نص — نفس الرقمين المحسوبين أصلًا
          (unlockedCount/achievements.length)، بس بعرض أوضح مع شريط تقدّم إجمالي */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <Typography variant="bodySm" weight="semibold" className="text-heading">
            {unlockedCount} of {achievements.length} unlocked
          </Typography>
          <Typography variant="bodySm" className="text-heading/50">
            {overallPercent}%
          </Typography>
        </div>
        <div
          role="progressbar"
          aria-valuenow={unlockedCount}
          aria-valuemin={0}
          aria-valuemax={achievements.length}
          className="h-1.5 w-full overflow-hidden rounded-full bg-heading/10"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
            style={{ width: `${overallPercent}%` }}
          />
        </div>
      </div>

      {earnedAchievements.length > 0 && (
        <div className="flex flex-col gap-4">
          <Typography variant="bodySm" weight="semibold" className="text-heading/70">
            Earned
          </Typography>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {earnedAchievements.map((item) => (
              <AchievementCard
                key={item.id}
                achievement={item}
                justUnlocked={justUnlockedIds.has(item.id)}
              />
            ))}
          </div>
        </div>
      )}

      {lockedAchievements.length > 0 && (
        <div className="flex flex-col gap-4">
          <Typography
            variant="bodySm"
            weight="semibold"
            className="flex items-center gap-1.5 text-heading/70"
          >
            <Target size={14} className="text-heading/40" aria-hidden="true" />
            Still to unlock
          </Typography>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lockedAchievements.map((item) => (
              <AchievementCard key={item.id} achievement={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
