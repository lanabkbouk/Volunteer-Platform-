// src/components/volunteerProfile/AchievementUnlockedModal.jsx
//
// مودال احتفالي منفصل تمامًا عن AchievementCard — يظهر لحظة فتح إنجاز
// جديد. الكارد الأصلي (بتأثير الـShine Sweep فيه) يبقى بدون أي تعديل؛
// هاد المودال إضافة موازية مش بديلة.

import Modal from "../ui/Modal";
import Typography from "../ui/Typography";
import Button from "../ui/Button";
import { getAchievementStyle } from "../../utils/achievementStyles";
import AchievementFirstIllustration from "../icons/achievements/AchievementFirstIllustration";
import AchievementHoursIllustration from "../icons/achievements/AchievementHoursIllustration";
import AchievementGroupIllustration from "../icons/achievements/AchievementGroupIllustration";

// نفس منطق المطابقة بالاسم (ونفس شكل الخريطة) المستخدم بـ
// achievementStyles.js — إنجاز مستقبلي غير معروف بيرجع null،
// وبناخد fallback للأيقونة العادية
const ACHIEVEMENT_ILLUSTRATIONS = [
  { match: (name) => name.toLowerCase().includes("first"), Illustration: AchievementFirstIllustration },
  { match: (name) => name.toLowerCase().includes("hour"), Illustration: AchievementHoursIllustration },
  { match: (name) => name.toLowerCase().includes("group"), Illustration: AchievementGroupIllustration },
];

function getAchievementIllustration(name = "") {
  const found = ACHIEVEMENT_ILLUSTRATIONS.find((entry) => entry.match(name));
  return { Illustration: found ? found.Illustration : null };
}

export default function AchievementUnlockedModal({ achievement, isOpen, onClose }) {
  if (!achievement) return null;

  const { icon: Icon, colorClasses } = getAchievementStyle(achievement.name);
  const { Illustration } = getAchievementIllustration(achievement.name);

  return (
    <Modal open={isOpen} onClose={onClose} dialogClassName="max-w-sm">
      <div className="flex flex-col items-center gap-4 text-center">
        <Typography variant="h5" as="p">
           Achievement Unlocked!
        </Typography>

        {Illustration ? (
          <Illustration className="w-full max-w-55 mx-auto" />
        ) : (
          // fallback: نفس الأيقونة الصغيرة العادية من getAchievementStyle،
          // بحجم أكبر شوي، لأي إنجاز مستقبلي بلا illustration مخصصة
          <div className={`flex h-28 w-28 items-center justify-center rounded-2xl ${colorClasses}`}>
            <Icon size={48} aria-hidden="true" />
          </div>
        )}

        <div className="flex flex-col gap-1">
          <Typography variant="h6" as="h3">
            {achievement.name}
          </Typography>
          {achievement.description ? (
            <Typography variant="bodySm" className="text-heading/60 leading-relaxed">
              {achievement.description}
            </Typography>
          ) : null}
        </div>

        <Button variant="primary" fullWidth onClick={onClose} className="mt-2">
          Awesome!
        </Button>
      </div>
    </Modal>
  );
}
