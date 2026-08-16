// components/home/HomeHowToJoin.jsx
//
// سكشن "How to Join": عمودين (متطوع/منظمة) مبنيين على HowToJoinColumn
// الموحّد. البيانات (الخطوات) جاية من constants/homeContent.js.

import Typography from "../ui/Typography";
import HowToJoinColumn from "./HowToJoinColumn";
import { VOLUNTEER_STEPS, ORGANIZATION_STEPS } from "../../constants/homeContent";
import { ACCOUNT_TYPES } from "../../constants/auth/accountTypes";
import { ROUTES, AUTH_QUERY_KEYS } from "../../constants/paths";

export default function HomeHowToJoin() {
  return (
    <section>
      <div className="text-center mb-10">
        <Typography variant="h2" className="mb-2">
          How to Join
        </Typography>
        <Typography variant="body" className="max-w-xl mx-auto">
          Whether you want to volunteer or need volunteers, here's how to get started.
        </Typography>
      </div>

      {/* illustration بسيطة (SVG محلي، بلا مكتبة خارجية) تفصل بصريًا بين
          العنوان والعمودين — دوائر primary/10 كخلفية + شكل "شخص" مبسّط
          (دائرة رأس + قوس جسم، بروح أيقونة User من Lucide) لكل طرف،
          وخط متقطّع بينهم يرمز للتواصل بين المتطوع والمنظمة */}
      <div className="flex justify-center mb-10" aria-hidden="true">
        <svg width="280" height="72" viewBox="0 0 280 72" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="90" cy="36" r="32" className="fill-primary/10" />
          <circle cx="190" cy="36" r="32" className="fill-primary/10" />

          <circle cx="90" cy="24" r="9" className="fill-primary" />
          <path d="M70 58c0-12 9-20 20-20s20 8 20 20" className="fill-primary" />

          <circle cx="190" cy="24" r="9" className="fill-primary" />
          <path d="M170 58c0-12 9-20 20-20s20 8 20 20" className="fill-primary" />

          <line
            x1="120"
            y1="40"
            x2="160"
            y2="40"
            className="stroke-primary"
            strokeWidth="2"
            strokeDasharray="4 4"
            strokeLinecap="round"
          />
          <circle cx="140" cy="40" r="4" className="fill-primary" />
        </svg>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <HowToJoinColumn
          title="For Volunteers"
          description="Find opportunities that match your skills, apply in one click, and track your volunteering journey in one place."
          steps={VOLUNTEER_STEPS}
          ctaLabel="Join as a Volunteer"
          ctaHref={`${ROUTES.REGISTER}?${AUTH_QUERY_KEYS.TYPE}=${ACCOUNT_TYPES.VOLUNTEER}`}
          buttonVariant="primary"
        />

        <HowToJoinColumn
          title="For Organizations"
          description="Reach verified volunteers, publish your causes, and manage applicants — all from one dashboard."
          steps={ORGANIZATION_STEPS}
          ctaLabel="Register Your Organization"
          ctaHref={`${ROUTES.REGISTER}?${AUTH_QUERY_KEYS.TYPE}=${ACCOUNT_TYPES.ORGANIZATION}`}
          buttonVariant="secondary"
        />
      </div>
    </section>
  );
}