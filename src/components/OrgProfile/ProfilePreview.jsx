// بطاقة معاينة (Live Preview) تعرض القيم الحية بالفورم المجاور أثناء
// الكتابة — نفس آلية volunteerProfile/ProfilePreview.jsx بالضبط
// (useFormContext + watch)، بدل الاعتماد على لقطة ثابتة محمّلة مرة
// وحدة عند فتح الصفحة (كانت المشكلة: الكتابة بالفورم ما كانت تنعكس
// بالمعاينة إطلاقًا).

import { Info } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { PANEL_SURFACE } from "../../utils/surfaceStyles";
import InfoRow from "../ui/InfoRow";
import Typography from "../ui/Typography";

export default function OrgProfilePreview({ email, phone }) {
  const { watch } = useFormContext();
  const values = watch();

  return (
    <div className={`${PANEL_SURFACE} border-l-4 border-l-info p-6 md:p-8`}>
      <div className="flex items-center gap-2 mb-4">
        <Info size={18} className="text-info" />
        <Typography variant="h4">Preview</Typography>
      </div>

      <div className="space-y-4">
        <InfoRow label="Name" value={values.name} />
        <InfoRow label="Email" value={email} />
        <InfoRow label="Phone Number" value={phone} />
        <InfoRow label="Governorate" value={values.city} />
        <InfoRow label="Website" value={values.website} />

        {/* Description — نفس تنسيق قسم "About" بمعاينة بروفايل المتطوع بالضبط */}
        <div className="pt-2 border-t border-heading/10">
          <Typography variant="h5" className="mb-2">Description</Typography>
          <p className="text-sm text-heading/80 leading-relaxed wrap-break-word">
            {values.description || "Write something about your organization to appear here."}
          </p>
        </div>
      </div>
    </div>
  );
}