// components/about/VisionGoals.jsx
//
// قسم "رؤيتنا وأهدافنا" — مكوّن جديد (مو موجود بالمشروع سابقًا)،
// بيانات ثابتة تسويقية (مو من الباك اند)، بنفس ثيم بقية أقسام الصفحة.

import { motion } from "framer-motion";
import Typography from "../ui/Typography";
import { PANEL_SURFACE } from "../../utils/surfaceStyles";

const GOALS = [
  "Expand volunteer opportunities across diverse sectors.",
  "Strengthen partnerships with organizations.",
  "Provide transparent tracking of contributions.",
  "Encourage youth engagement and community initiatives.",
];

export default function VisionGoals() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
    >
      <Typography variant="h2" align="center" gutterBottom className="!mb-8">
        Our Vision & Goals
      </Typography>

      <div className="grid md:grid-cols-2 gap-10">
        <div className={`${PANEL_SURFACE} p-8`}>
          <Typography variant="h4" color="primary" gutterBottom>
            Our Vision
          </Typography>
          <Typography variant="body" className="leading-relaxed">
            To create a world where volunteering is accessible, impactful, and deeply
            connected to the needs of every community.
          </Typography>
        </div>

        <div className={`${PANEL_SURFACE} p-8`}>
          <Typography variant="h4" color="primary" gutterBottom>
            Our Goals
          </Typography>
          <ul className="space-y-3 text-body">
            {GOALS.map((goal) => (
              <li key={goal} className="flex items-start gap-3">
                <span className="text-primary text-xl leading-none">•</span>
                {goal}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}