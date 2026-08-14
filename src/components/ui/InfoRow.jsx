import Typography from "./Typography";

export default function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-1 gap-3">
      <Typography
        variant="bodySm"
        color="muted"
        className="whitespace-nowrap shrink-0"
      >
        {label}
      </Typography>

      <Typography
        variant="bodySm"
        color="heading"
        weight="medium"
        className="min-w-0 flex-1 truncate text-left"
      >
        {value || "—"}
      </Typography>
    </div>
  );
}
