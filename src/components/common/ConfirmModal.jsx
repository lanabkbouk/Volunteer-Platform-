// نافذة تأكيد عامة قابلة لإعادة الاستخدام — بديل موحّد لـ window.confirm()
// المتفرق سابقًا بأكثر من مكان (حذف قضية، تبديل حالة التسجيل، الانسحاب
// من فرصة...). نافذة المتصفح الافتراضية غير المصممة كانت تكسر الاتساق
// البصري في مشروع بنى أصلًا Modal مخصص ويستخدمه بأماكن أخرى (سبب الرفض،
// الموافقة على منظمة). مبني فوق Modal.jsx فقط، بدون منطق جديد.

import Button from "../ui/Button";
import Typography from "../ui/Typography";
import Modal from "../ui/Modal";

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  confirmVariant = "danger",
  cancelLabel = "Cancel",
  isLoading = false,
  loadingText = "Working...",
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            isLoading={isLoading}
            loadingText={loadingText}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {description && (
        <Typography variant="bodySm" className="text-body">
          {description}
        </Typography>
      )}
    </Modal>
  );
}
