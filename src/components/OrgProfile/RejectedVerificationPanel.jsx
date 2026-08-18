// components/OrgProfile/RejectedVerificationPanel.jsx
//
// يحل محل VerificationStatusBanner + زر "Request Verification Review"
// القديم تحديدًا لما تكون حالة المنظمة "rejected". بدل الاكتفاء بتعطيل
// الأزرار وبانر صغير، بيشرح بوضوح إنه الحساب معطّل بالكامل لحد ما توثيق
// جديد يُراجع ويُقبل، وبيوفر رفع وثيقة جديدة مباشرة (بدل زر "إعادة
// الإرسال" اللي كان بيرجّع pending بنفس الوثيقة المرفوضة بدون أي تصليح
// فعلي ممكن).

import { XCircle, UploadCloud, ShieldOff, FileImage } from "lucide-react";
import Typography from "../ui/Typography";
import Button from "../ui/Button";
import { useImageUpload } from "../../hooks/useImageUpload";
import { useResubmitVerificationDocumentMutation } from "../../hooks/queries/useResubmitVerificationDocumentMutation";
import { FIELD_ERROR } from "../../utils/fieldStyles";

export default function RejectedVerificationPanel({ organizationId, rejectionReason, onUploadSuccess, onUploadError }) {
  const document = useImageUpload();
  const resubmitMutation = useResubmitVerificationDocumentMutation(organizationId);

  const handleUpload = async () => {
    if (!document.file) {
      return;
    }

    const result = await resubmitMutation.mutateAsync({ file: document.file, previewUrl: document.previewUrl });

    if (!result.success) {
      onUploadError?.(result.error || "Failed to upload the new document");
      return;
    }

    document.reset();
    onUploadSuccess?.("New document submitted. We'll review it and get back to you soon.");
  };

  return (
    // نفس لوحة الألوان القانونية المستخدمة أصلًا لحالة "rejected" بـ
    // ORGANIZATION_STATUS_META (bannerClassName: bg-danger/5 border-danger/20
    // text-danger) — توكن danger/dangerHover الموحّد بدل درجات red خام
    <div
      role="alert"
      className="mb-8 rounded-3xl border border-danger/20 bg-danger/5 p-6 md:p-8 text-danger"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-danger/10 text-danger">
          <XCircle size={24} aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <Typography variant="h4" className="text-danger">
            Verification rejected
          </Typography>
          <p className="mt-1 text-sm text-danger/90 leading-relaxed">
            Your organization account stays disabled — you can't post opportunities, review applicants, or use any
            organization service — until a new verification document is submitted and approved.
          </p>

          {rejectionReason && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-danger/20 bg-field/60 px-4 py-3">
              <ShieldOff size={16} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-danger">Reason from the admin</p>
                <p className="mt-1 text-sm text-danger italic">"{rejectionReason}"</p>
              </div>
            </div>
          )}

          <div className="mt-5 rounded-2xl border border-danger/20 bg-field/60 p-4">
            <p className="text-sm font-semibold text-danger">Upload a new verification document</p>
            <p className="mt-1 text-xs text-danger/80">
              Replace the rejected document with a clearer one. Submitting will send your account back to pending
              review automatically.
            </p>

            <label className="mt-3 flex w-full cursor-pointer items-center gap-4 rounded-xl border border-danger/20 bg-field px-4 py-3 transition-colors hover:border-dangerHover">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-danger/20 bg-danger/5 text-danger/60">
                {document.previewUrl ? (
                  <img src={document.previewUrl} alt="New verification document preview" className="h-full w-full object-cover" />
                ) : (
                  <FileImage size={20} aria-hidden="true" />
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-heading">
                  {document.file ? "Change selected document" : "Choose a document to upload"}
                </span>
                <span className="text-xs text-body/70">JPG, PNG or WEBP — up to 2MB</span>
              </div>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={document.handleFileChange}
              />
            </label>

            {document.error && <p className={FIELD_ERROR}>{document.error}</p>}

            <Button
              variant="danger"
              size="small"
              className="mt-4 flex items-center gap-2"
              onClick={handleUpload}
              disabled={!document.file}
              isLoading={resubmitMutation.isPending}
              loadingText="Uploading..."
            >
              <UploadCloud size={16} />
              Upload New Document
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
