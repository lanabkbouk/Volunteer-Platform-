// components/home/HomeHero.jsx
//
// قسم الـ Hero بالصفحة الرئيسية: خلفية غامقة بصورة حقيقية + تدرّج،
// عنوان ضخم، إحصائية واحدة (عدد المتطوعين)، وزرّي فعل. Component عرض
// بحت، البيانات (عدد المتطوعين، حالة التحميل) جاية كـ props من الصفحة.

import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Search, UserPlus } from "lucide-react";
import Typography from "../ui/Typography";
import Button from "../ui/Button";
import { ROUTES } from "../../constants/paths";

const HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=2000&q=80";

// Ease احترافي (خروج ناعم بدون ارتداد) — نفس المنحنى لكل عناصر الدخول
// حتى يحس المستخدم بإيقاع واحد متسق للـ Hero كامل
const EASE_OUT = [0.16, 1, 0.3, 1];

// حاوية العناصر النصية: كل child بيدخل بعد اللي قبله بفاصل زمني بسيط
// (staggerChildren) بدل ما نكتب delay يدوي لكل عنصر لحاله
const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.16, delayChildren: 0.05 },
  },
};

const fadeUpVariants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE_OUT },
  },
};

export default function HomeHero({ volunteersCount, loading }) {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative min-h-[85vh] w-full flex items-center overflow-hidden bg-black text-white">
      <div className="absolute inset-0 z-0">
        <motion.img
          src={HERO_IMAGE_URL}
          alt=""
          className="w-full h-full object-cover opacity-70"
          initial={{ scale: 1 }}
          animate={prefersReducedMotion ? { scale: 1 } : { scale: 1.08 }}
          transition={{ duration: 24, ease: "easeOut" }}
        />
        {/* Gradient overlay: أغمق خلف النص (يسار) وبيتدرّج تدريجيًا باتجاه
            الصورة (يمين) بدل الطبقة السوداء المسطحة السابقة */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/10" />
        {/* تدرّج سفلي خفيف يعطي عمق ويثبّت النص بصريًا فوق الصورة */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-2xl"
        >
          {/* !important على أحجام الخط كمان (مش بس اللون) — variant="display"
              أصلًا بيحدد text-4xl sm:text-5xl md:text-6xl بدون !important،
              فبدونها هون كان أي حجم يفوز فعليًا غير مضمون (يعتمد على ترتيب
              توليد CSS من Tailwind، مش على ترتيب الكتابة بالـ className) */}
          <motion.div variants={fadeUpVariants}>
            <Typography
              variant="display"
              className="!text-white !text-5xl sm:!text-6xl md:!text-7xl leading-[1.1] tracking-tight mb-6"
            >
              Give Your Time, <br /> Change Lives
            </Typography>
          </motion.div>

          <motion.div variants={fadeUpVariants}>
            <Typography variant="lead" className="!text-white/75 mb-10 max-w-lg">
              Connect with organizations that need you — find opportunities that
              match your skills, or post a cause and reach people ready to help.
            </Typography>
          </motion.div>

          {!loading && volunteersCount ? (
            <motion.div
              variants={fadeUpVariants}
              animate={
                prefersReducedMotion
                  ? undefined
                  : { y: [0, -6, 0], transition: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.4 } }
              }
              className="inline-flex items-center gap-3 mb-10 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm px-5 py-3 shadow-lg shadow-black/20"
            >
              <Typography variant="h3" as="span" color="primary" weight="extrabold">
                {volunteersCount.toLocaleString("en-US")}+
              </Typography>
              <Typography variant="body" as="span" className="!text-white/80">
                Volunteers Making an Impact
              </Typography>
            </motion.div>
          ) : null}

          <motion.div variants={fadeUpVariants} className="flex flex-wrap items-center gap-4">
            <Button
              variant="primary"
              size="large"
              onClick={() => navigate(ROUTES.OPPORTUNITIES)}
              className="flex items-center gap-2"
            >
              <Search size={18} /> Explore Opportunities
            </Button>
            <Button
              variant="outlineLight"
              size="large"
              onClick={() => navigate(ROUTES.REGISTER)}
              className="flex items-center gap-2"
            >
              <UserPlus size={18} /> Get Started
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}