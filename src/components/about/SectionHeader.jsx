import Typography from "../ui/Typography";

export default function SectionHeader() {
  return (
    <div className="text-center mb-16">
      {/* as="h1": sectionTitle variant بيرندر h2 افتراضيًا (راجع
          resolveElement بـ Typography.jsx)، بس هاي فعليًا العنوان
          الرئيسي الوحيد بصفحة About — بدونها التسلسل الهرمي للعناوين
          كان يبدأ من h2 مباشرة بدون أي h1 على الصفحة كاملة */}
      <Typography as="h1" variant="sectionTitle" gutterBottom>
        About Volunteer Platform
      </Typography>
      <Typography variant="lead" className="max-w-2xl mx-auto">
        We connect volunteers with organizations making a difference in their communities.
      </Typography>
    </div>
  );
}