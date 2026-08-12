
// قسم "رسالتنا" + بطاقة عدد المتطوعين. الرقم يُمرَّر من الصفحة الأب
// (قادم من services/stats.js)، هذا المكوّن لا يجلب بيانات بنفسه.
// الرقم يظهر بعد تصاعدي (useCountUp) كحركة موحّدة مقصودة بالموقع.

import { motion } from "framer-motion";
import { useCountUp } from "../../hooks/useCountUp";
import Typography from "../ui/Typography";
import { PANEL_SURFACE } from "../../utils/surfaceStyles";

export default function MissionSection({ volunteers }) {
  const { displayValue, elementRef } = useCountUp(volunteers);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className="grid md:grid-cols-2 gap-12 items-center"
    >
      <div>
        <Typography variant="h2" gutterBottom>
          Our Mission
        </Typography>
        <Typography variant="body" className="leading-relaxed">
          We believe that every individual has the power to make a positive impact.
          Our mission is to connect volunteers with meaningful opportunities that
          strengthen communities and inspire long‑term change.
        </Typography>
      </div>

      <div ref={elementRef} className={`${PANEL_SURFACE} p-8 text-center`}>
        <div className="text-6xl font-bold text-primary mb-2">
          {displayValue}+
        </div>
        <Typography variant="body">Active Volunteers</Typography>
      </div>
    </motion.div>
  );
}