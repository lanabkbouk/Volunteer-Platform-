import { motion } from "framer-motion";
import Typography from "../ui/Typography";
import { PANEL_SURFACE } from "../../utils/surfaceStyles";
import { ABOUT_VALUES } from "../../constants/aboutContent";

export default function ValuesGrid() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
    >
      <Typography variant="h2" align="center" gutterBottom className="!mb-8">
        Our Values
      </Typography>

      <div className="grid md:grid-cols-3 gap-6">
        {ABOUT_VALUES.map((value) => (
          <div
            key={value.title}
            className={`${PANEL_SURFACE} p-6`}
          >
            <Typography variant="h5" color="primary" gutterBottom>
              {value.title}
            </Typography>
            <Typography variant="body">{value.desc}</Typography>
          </div>
        ))}
      </div>
    </motion.div>
  );
}