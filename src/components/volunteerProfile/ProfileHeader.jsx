import ImageUploader from "../common/ImageUploader";
import GenderBadge from "../common/GenderBadge";
import Typography from "../ui/Typography";
import { PANEL_SURFACE } from "../../utils/surfaceStyles";

export default function ProfileHeader({
  fullName,
  gender,
  imagePreview,
  onImageChange,
}) {
  return (
    <div className={`flex flex-col md:flex-row md:items-center gap-8 ${PANEL_SURFACE} px-8 py-10`}>

      {/* الصورة + الاسم */}
      <div className="flex items-center gap-6">

        <ImageUploader
          previewUrl={imagePreview}
          onFileChange={onImageChange}
          shape="square"
          size="md"
          fallbackIcon={null}
          fallbackText={fullName?.[0]?.toUpperCase() || "V"}
          alt={fullName ? `${fullName}'s profile photo` : "Profile photo"}
        />

        <div className="flex flex-col">
          <Typography variant="h2" color="heading">
            {fullName}
          </Typography>

          <Typography variant="bodySm" color="muted" className="mt-1">
            Volunteer Profile
          </Typography>
        </div>
      </div>

      {/* الجنس */}
      <div className="md:ml-auto flex flex-col items-end gap-4">
        <GenderBadge gender={gender} />
      </div>
    </div>
  );
}