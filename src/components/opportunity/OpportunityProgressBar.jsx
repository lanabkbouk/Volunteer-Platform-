// نسبة قريبة من الاكتمال (90%+) بتاخد لون success بدل primary — إحساس
// بصري "قربنا نخلص" بهالحالة المحددة بس، باقي الحالات تضل primary
// الافتراضي بدون أي تغيير
const NEAR_COMPLETE_THRESHOLD = 90;

export default function OpportunityProgressBar({ current, max }) {
  const safeMax = Math.max(max, 1);
  const percentage = Math.min(Math.round((current / safeMax) * 100), 100);
  const isNearComplete = percentage >= NEAR_COMPLETE_THRESHOLD;

  return (
    <div className="flex flex-col gap-2">
      <div className="w-full h-3 rounded-full bg-heading/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${isNearComplete ? "bg-success" : "bg-primary"}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-heading">
          {current} / {max} volunteers joined
        </span>
        <span className="text-heading/50">{percentage}%</span>
      </div>
    </div>
  );
}