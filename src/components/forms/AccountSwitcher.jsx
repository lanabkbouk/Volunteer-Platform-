import { Link } from "react-router-dom";
import { ROUTES, AUTH_QUERY_KEYS } from "../../constants/paths";
import { ACCOUNT_TYPES } from "../../constants/auth/accountTypes";

export default function AccountSwitch({ accountType }) {
  const isVolunteer = accountType === ACCOUNT_TYPES.VOLUNTEER;

  // مش role="tablist"/role="tab" — هاي روابط تنقّل كاملة (query param
  // بيغيّر الفورم المعروض بـ Register.jsx)، مش تبديل لوحة بمكانها. نمط
  // tab بالمعيار يفرض تنقّل بالسهم ولوحة مرتبطة (aria-controls)، ولا
  // واحد منهم متوفر هون فعليًا. aria-current="page" هي السمة الصحيحة
  // لمجموعة روابط تنقّل عادية
  return (
    <nav aria-label="Account type" className="flex bg-heading/5 rounded-lg p-1 mb-6 border border-heading/10">
      <Link
        aria-current={isVolunteer ? "page" : undefined}
        to={`${ROUTES.REGISTER}?${AUTH_QUERY_KEYS.TYPE}=${ACCOUNT_TYPES.VOLUNTEER}`}
        className={`flex-1 text-center py-2 rounded-md text-sm font-medium transition ${
          isVolunteer ? "bg-primary text-white shadow-sm" : "text-body hover:text-heading"
        }`}
      >
        Volunteer
      </Link>

      <Link
        aria-current={!isVolunteer ? "page" : undefined}
        to={`${ROUTES.REGISTER}?${AUTH_QUERY_KEYS.TYPE}=${ACCOUNT_TYPES.ORGANIZATION}`}
        className={`flex-1 text-center py-2 rounded-md text-sm font-medium transition ${
          !isVolunteer ? "bg-primary text-white shadow-sm" : "text-body hover:text-heading"
        }`}
      >
        Organization
      </Link>
    </nav>
  );
}