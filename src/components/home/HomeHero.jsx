// components/home/HomeHero.jsx
//
// قسم الـ Hero بالصفحة الرئيسية: خلفية غامقة بصورة حقيقية + تدرّج،
// عنوان ضخم، إحصائية واحدة (عدد المتطوعين)، وزرّي فعل. Component عرض
// بحت، البيانات (عدد المتطوعين، حالة التحميل) جاية كـ props من الصفحة.

import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, UserPlus } from "lucide-react";
import Typography from "../ui/Typography";
import Button from "../ui/Button";
import { ROUTES } from "../../constants/paths";

const HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=2000&q=80";

export default function HomeHero({ volunteersCount, loading }) {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[85vh] w-full flex items-center overflow-hidden bg-black text-white">
      <div className="absolute inset-0 z-0">
        <img src={HERO_IMAGE_URL} alt="" className="w-full h-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl"
        >
          <Typography variant="display" className="!text-white text-5xl sm:text-6xl md:text-7xl leading-[1.1] mb-6">
            Give Your Time, <br /> Change Lives
          </Typography>

          <Typography variant="lead" className="!text-white/70 mb-10 max-w-lg">
            Connect with organizations that need you — find opportunities that
            match your skills, or post a cause and reach people ready to help.
          </Typography>

          {!loading && volunteersCount ? (
            <div className="flex items-center gap-3 mb-10">
              <Typography variant="h3" as="span" color="primary" weight="extrabold">
                {volunteersCount.toLocaleString("en-US")}+
              </Typography>
              <Typography variant="body" as="span" className="!text-white/80">
                Volunteers Making an Impact
              </Typography>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-4">
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
          </div>
        </motion.div>
      </div>
    </section>
  );
}