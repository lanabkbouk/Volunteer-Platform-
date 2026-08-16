
// صفحة 404 الرسمية — تستبدل الـ <div>Page not found</div> الخام يلي كان
// موجود مباشرة بملف App.jsx. مبنية بنفس هوية باقي الصفحات (Typography +
// Button + نفس المسافات)، وتُعرض جوا MainLayout فيصير عندها Navbar/Footer
// عاديين بدل ما تظهر كصفحة يتيمة بدون أي تنقّل.

import { Link, useNavigate } from "react-router-dom";
import Typography from "../components/ui/Typography";
import Button from "../components/ui/Button";
import { ROUTES } from "../constants/paths";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center gap-6 px-4 py-20 text-center sm:px-6">
      {/* illustration بوصلة "مكسورة" هندسية بسيطة (SVG محلي، بلونين
          primary/primary-10 بس) — تحل محل أيقونة Compass الصغيرة السابقة،
          كنجم بصري للصفحة يعبّر عن "ضياع الطريق" (404) */}
      <svg
        width="192"
        height="192"
        viewBox="0 0 192 192"
        fill="none"
        aria-hidden="true"
        className="h-48 w-48 sm:h-56 sm:w-56"
      >
        <circle cx="96" cy="96" r="96" className="fill-primary/10" />

        <circle
          cx="96"
          cy="96"
          r="60"
          className="stroke-primary"
          strokeWidth="6"
          fill="none"
          strokeDasharray="18 10"
        />

        <path
          d="M96 50 L108 96 L96 142 L84 96 Z"
          className="fill-primary"
          transform="rotate(25 96 96)"
        />
        <circle cx="96" cy="96" r="7" className="fill-primary/10" />

        <circle cx="152" cy="38" r="5" className="fill-primary" />
        <circle cx="32" cy="150" r="4" className="fill-primary" />
      </svg>

      <Typography variant="overline" color="primary">
        Error 404
      </Typography>

      <Typography variant="display" className="!text-5xl sm:!text-6xl">
        Page not found
      </Typography>

      <Typography variant="lead" className="max-w-md text-body">
        The page you're looking for doesn't exist or may have moved. Check the
        address, or head back to a page that does.
      </Typography>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Button as={Link} to={ROUTES.HOME} variant="primary" size="large">
          Back to Home
        </Button>
        <Button variant="ghost" size="large" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    </div>
  );
}