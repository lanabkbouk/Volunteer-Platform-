import { Mars, Venus, User } from "lucide-react";
import Badge from "./Badge";

const GENDER_CONFIG = {
  Male: { icon: Mars, label: "Male" },
  Female: { icon: Venus, label: "Female" },
  "Prefer not to say": { icon: User, label: "Prefer not to say" },
};

export default function GenderBadge({ gender }) {
  const config = GENDER_CONFIG[gender];

  if (!config) return null;

  return <Badge label={config.label} tone="primary" icon={config.icon} className="px-4 py-2 text-sm" />;
}
