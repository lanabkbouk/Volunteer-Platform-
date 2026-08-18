import { Info } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { PANEL_SURFACE } from "../../utils/surfaceStyles";
import InfoRow from "../ui/InfoRow";
import Chip from "../ui/Chip";
import Typography from "../ui/Typography";
import { calculateAge } from "../../utils/validators";

import {
  CATEGORY_ICONS,
  CATEGORY_COLORS
} from "../../utils/categoryStyles";

// Helpers
const splitCsvToChips = (input) => {
  if (!input) return [];
  return String(input)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

export default function ProfilePreview({ fullName, email, phone, availableSkills }) {
  const { watch } = useFormContext();
  const values = watch();

  const age = calculateAge(values.dateOfBirth);
  const isAdult = age !== null && age >= 18;

  // Full skill objects (now include category object)
  const selectedSkills = (values.skills || []).map((id) =>
    availableSkills.find((s) => s.id === id)
  );

  const interestsChips = splitCsvToChips(values.interests);

  return (
    <div className={`${PANEL_SURFACE} border-l-4 border-l-info p-6 md:p-8`}>
      <div className="flex items-center gap-2 mb-4">
        <Info size={18} className="text-info" />
        <Typography variant="h4">Preview</Typography>
      </div>

      <div className="space-y-4">
        <InfoRow label="Full Name" value={fullName} />
        <InfoRow label="Email" value={email} />
        <InfoRow label="Phone Number" value={phone} />
        <InfoRow label="Education Level" value={values.educationLevel} />

        {isAdult && <InfoRow label="Date of Birth" value={values.dateOfBirth} />}

        <InfoRow label="Gender" value={values.gender} />
        <InfoRow label="City" value={values.city} />

        {/* Skills */}
        <div className="pt-2 border-t border-heading/10">
          <Typography variant="h5" className="mb-2">Skills</Typography>

          <div className="flex flex-wrap gap-2">
            {selectedSkills.length ? (
              selectedSkills.map((skill) => {
                if (!skill) return null;

                const categoryName = skill.category?.name;
                const Icon = CATEGORY_ICONS[categoryName];
                const color = CATEGORY_COLORS[categoryName];

                return (
                  <Chip key={skill.id} customStyle={color} className="gap-1.5">
                    {Icon && <Icon size={14} />}
                    {skill.name}
                  </Chip>
                );
              })
            ) : (
              <Chip>—</Chip>
            )}
          </div>
        </div>

        {/* Interests */}
        <div className="pt-2 border-t border-heading/10">
          <Typography variant="h5" className="mb-2">Interests</Typography>
          <div className="flex flex-wrap gap-2">
            {(interestsChips.length ? interestsChips : ["—"]).map((s) => (
              <Chip key={s}>{s}</Chip>
            ))}
          </div>
        </div>

        {/* About */}
        <div className="pt-2 border-t border-heading/10">
          <Typography variant="h5" className="mb-2">About</Typography>
          <p className="text-sm text-heading/80 leading-relaxed wrap-break-word">
            {values.about || "Write something about yourself to appear here."}
          </p>
        </div>
      </div>
    </div>
  );
}