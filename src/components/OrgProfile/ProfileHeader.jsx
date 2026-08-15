import ImageUploader from "../common/ImageUploader";
import Badge from "../common/Badge";
import Typography from "../ui/Typography";
import { ORGANIZATION_STATUS_META } from "../../constants/organizationStatus";
import { PANEL_SURFACE } from "../../utils/surfaceStyles";

const STATUS_TONE = {
  pending: "warning",
  verified: "secondary",
  rejected: "danger",
};

export default function OrgProfileHeader({
  name,
  imagePreview,
  onImageChange,
  onImageRemove,
  status,
}) {
  const statusLabel = status ? ORGANIZATION_STATUS_META[status]?.label : "Status";

  return (
    <div className={`flex flex-col md:flex-row md:items-center gap-8 ${PANEL_SURFACE} px-8 py-10`}>
      <div className="flex items-center gap-6">
        <ImageUploader
          previewUrl={imagePreview}
          onFileChange={onImageChange}
          onRemove={onImageRemove}
          shape="square"
          size="md"
          fallbackIcon={null}
          fallbackText={name?.[0]?.toUpperCase() || "O"}
        />

        <div className="flex flex-col">
          <Typography variant="h2" color="heading">
            {name || "Your Organization"}
          </Typography>

          <Typography variant="bodySm" color="muted" className="mt-1">
            Organization Profile
          </Typography>
        </div>
      </div>

      <div className="md:ml-auto flex flex-col items-end gap-4">
        <Badge label={statusLabel} tone={STATUS_TONE[status]} />
      </div>
    </div>
  );
}