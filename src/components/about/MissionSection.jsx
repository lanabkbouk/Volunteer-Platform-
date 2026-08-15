
// قسم "رسالتنا" + بطاقة عدد المتطوعين. الرقم يُمرَّر من الصفحة الأب
// (قادم من services/stats.js)، هذا المكوّن لا يجلب بيانات بنفسه.
// بطاقة الرقم هي StatCard المشتركة نفسها المستخدمة أسفل هالصفحة بالضبط
// بـ StatsGrid — بدل إعادة بناء نفس منطق العد التصاعدي (useCountUp)
// والتنسيق يدويًا هون من جديد.

import { motion } from "framer-motion";
import { Users } from "lucide-react";
import Typography from "../ui/Typography";
import StatCard from "../common/StatCard";

export default function MissionSection({ volunteers }) {
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

      {/* استخدام لإمكانية icon الموجودة أصلًا بـ StatCard — نفس رمز
          "Active Volunteers" المستخدم بباقي الصفحة تحت */}
      <StatCard icon={Users} number={volunteers} label="Active Volunteers" />
    </motion.div>
  );
}