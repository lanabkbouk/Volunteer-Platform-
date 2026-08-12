import { motion } from "framer-motion";
import Typography from "../ui/Typography";
import { PANEL_SURFACE } from "../../utils/surfaceStyles";

const VALUES = [
  { title: "Community", desc: "Building stronger communities through collective action" },
  { title: "Transparency", desc: "Open communication and clear impact tracking" },
  { title: "Inclusion", desc: "Everyone has something to contribute" },
];

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
        {VALUES.map((value) => (
          <div
            key={value.title}
            className={`${PANEL_SURFACE} p-6 hover:border-primary transition-colors`}
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