// معاينة سريعة (Read-only) لبروفايل المتطوع، تفتح من داخل بطاقة
// المتقدم عند ضغط المنظمة على اسمه. الساعات/الفرص المكتملة محسوبة
// "لدى هالمنظمة بالذات"، والإنجازات قائمة حقيقية عبر المنصة كلها —
// راجع services/participations.js لتوضيح ليش الفرق بينهم.

import Modal from "../ui/Modal";
import SkillChipsPreview from "../common/SkillChipsPreview";
import Avatar from "../common/Avatar";
import ClickableAvatar from "../common/ClickableAvatar";
import Typography from "../ui/Typography";
import { MapPin, Phone, Mail, GraduationCap, Cake, Clock3, Trophy, CheckCircle2 } from "lucide-react";
import { calculateAge } from "../../utils/validators";
import { CARD_SURFACE } from "../../utils/surfaceStyles";

// بطاقة إحصائية صغيرة مُعاد استخدامها 3 مرات بالمودال (ساعات/إنجازات/
// فرص مكتملة) — بدل تكرار نفس الـ JSX ثلاث مرات. نفس سطح CARD_SURFACE
// المركزي (بدون CARD_ELEVATION — تايل ثابت صغير، مش عنصر تفاعلي) بدل
// إعادة كتابة نفس تركيبة bg-field/border يدويًا
function StatBlock({ icon: Icon, value, label }) {
  return (
    <div className={`flex flex-col items-center text-center px-3 py-2.5 ${CARD_SURFACE}`}>
      <Icon size={16} className="text-primary mb-1" aria-hidden="true" />
      <p className="text-sm font-bold text-heading leading-none">{value}</p>
      <p className="text-[11px] text-heading/50 mt-1">{label}</p>
    </div>
  );
}

export default function VolunteerProfilePreviewModal({ open, onClose, volunteer }) {
  if (!volunteer) return null;

  const age = calculateAge(volunteer.dateOfBirth);
  const achievements = volunteer.achievements || [];
  const unlockedAchievements = achievements.filter((achievement) => achievement.unlocked);

  return (
    // ⚠️ عنوان المودال هو اسم المتقدّم نفسه (وليس نص عام مثل "Volunteer
    // profile")، لأنه هذا المودال أصلًا يُفتح من داخل بطاقة متقدّم واحد
    // بعينه، فاسمه هو أوضح عنوان مناسب للسياق
    <Modal open={open} onClose={onClose} title={volunteer.name || "Volunteer profile"} scrollBody>
      <div className="flex items-center gap-3 mb-5">
        <ClickableAvatar src={volunteer.photo} alt={volunteer.name}>
          <Avatar src={volunteer.photo} name={volunteer.name} size="lg" />
        </ClickableAvatar>
        {volunteer.city && (
          <span className="flex items-center gap-1 text-sm text-body">
            <MapPin size={13} className="text-primary shrink-0" aria-hidden="true" />
            {volunteer.city}
          </span>
        )}
      </div>

      {/* إحصائيات سريعة — الساعات والفرص المكتملة محسوبة "لدى هالمنظمة
          بالذات" (مش إجمالي المنصة)، تساعد المنظمة تقيّم خبرة المتطوع
          معها هي تحديدًا قبل ما تقرر */}
      <div className="grid grid-cols-3 gap-2 mb-1">
        <StatBlock icon={Clock3} value={volunteer.totalHoursVolunteered ?? 0} label="Hours here" />
        <StatBlock icon={Trophy} value={unlockedAchievements.length} label="Achievements" />
        <StatBlock icon={CheckCircle2} value={volunteer.completedOpportunitiesCount ?? 0} label="Completed here" />
      </div>
      <p className="text-[11px] text-heading/40 mb-5">
        Hours and completed opportunities are with your organization specifically. Achievements
        are earned across the whole platform.
      </p>

      {unlockedAchievements.length > 0 && (
        <div className="mb-5">
          <Typography as="p" variant="overline" weight="semibold" color="muted" className="mb-2">
            Achievements
          </Typography>
          <div className="flex flex-col gap-1.5">
            {unlockedAchievements.map((achievement) => (
              <span key={achievement.id} className="flex items-center gap-1.5 text-sm text-heading">
                <Trophy size={13} className="text-amber-500 shrink-0" aria-hidden="true" />
                {achievement.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {(volunteer.educationLevel || age || volunteer.gender) && (
        <div className="flex flex-wrap gap-x-5 gap-y-2 mb-5 text-sm text-body">
          {volunteer.educationLevel && (
            <span className="flex items-center gap-1.5">
              <GraduationCap size={14} className="text-primary shrink-0" aria-hidden="true" />
              {volunteer.educationLevel}
            </span>
          )}
          {age != null && (
            <span className="flex items-center gap-1.5">
              <Cake size={14} className="text-primary shrink-0" aria-hidden="true" />
              {age} years old
            </span>
          )}
          {volunteer.gender && (
            <span className="capitalize">{volunteer.gender}</span>
          )}
        </div>
      )}

      {/* بيانات التواصل — هاتف وإيميل، كل وحد رابط مباشر (tel: / mailto:)
          يفتح تطبيق الاتصال أو البريد مباشرة بدل نسخ يدوي */}
      {(volunteer.phone || volunteer.email) && (
        <div className="flex flex-col gap-2 mb-5">
          {volunteer.phone && (
            <a
              href={`tel:${volunteer.phone}`}
              className="flex items-center gap-2 text-sm text-body hover:text-primary w-fit rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <Phone size={14} className="text-primary shrink-0" aria-hidden="true" />
              {volunteer.phone}
            </a>
          )}
          {volunteer.email && (
            <a
              href={`mailto:${volunteer.email}`}
              className="flex items-center gap-2 text-sm text-body hover:text-primary w-fit rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <Mail size={14} className="text-primary shrink-0" aria-hidden="true" />
              {volunteer.email}
            </a>
          )}
        </div>
      )}

      {volunteer.skills?.length > 0 ? (
        <div>
          <Typography as="p" variant="overline" weight="semibold" color="muted" className="mb-2">
            Skills
          </Typography>
          <SkillChipsPreview skills={volunteer.skills} max={10} />
        </div>
      ) : null}
    </Modal>
  );
}