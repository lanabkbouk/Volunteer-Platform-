import { AlertCircle, Trophy } from "lucide-react";
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

  const unlockedCount = achievements.filter((item) => item.unlocked).length;

  return (
    <div className="flex flex-col gap-5">
      <Typography variant="bodySm" className="font-medium text-heading/50">
        {unlockedCount} of {achievements.length} unlocked
      </Typography>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map((item) => (
          <AchievementCard
            key={item.id}
            achievement={item}
            justUnlocked={justUnlockedIds.has(item.id)}
          />
        ))}
      </div>
    </div>
  );
}
