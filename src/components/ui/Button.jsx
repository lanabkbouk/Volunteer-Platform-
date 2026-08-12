import { useState } from "react";

export default function Button({
  as: Component = "button",
  variant = "primary",
  size = "medium",
  children,
  onClick,
  disabled = false,
  fullWidth = false,
  className = "",
  type = "button",
  isLoading = false,
  loadingText = "Saving...",
  ...props
}) {
  const variantStyles = {
    primary: "bg-primary text-bg hover:bg-primary/90",
    secondary: "bg-secondary text-bg hover:bg-secondary/90",
    ghost: "bg-bg border border-heading/20 text-heading hover:bg-heading/5",
    // نفس فكرة ghost بس مصمم لخلفية غامقة (Hero، أقسام سوداء) — حدود
    // وخط أبيض بدل الداكن، حتى ما نحتاج overrides يدوية بكل استخدام
    outlineLight: "bg-transparent border border-white/70 text-white hover:bg-white/10",
    success: "bg-green-600 text-white hover:bg-green-700",
    danger: "bg-danger text-white hover:bg-dangerHover",
  };

  const sizeStyles = {
    small: "px-3 py-2 text-sm",
    medium: "px-5 py-2.5 text-base",
    large: "px-7 py-3 text-lg",
  };

  const isDisabled = disabled || isLoading;
  // Component غير "button" (متل Link) ما إله خاصية disabled فعلية —
  // نحاكيها بصريًا ونمنع الضغط عبر onClick بدل ما نعتمد على disabled attribute
  const isNativeButton = Component === "button";

  // موجة الضغط (Ripple): دائرة شفافة تتوسّع من نقطة الضغطة بالضبط ثم
  // تخف تدريجيًا. اللون شفاف أبيض للأزرار الملوّنة الصلبة (primary,
  // secondary...) وغامق خفيف لزر ghost الفاتح، حتى تظل مرئية بأي حالة.
  const [ripples, setRipples] = useState([]);
  const rippleColor = variant === "ghost" ? "bg-heading/10" : "bg-white/30";

  function handleClick(event) {
    if (!isDisabled) {
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (!prefersReducedMotion) {
        const rect = event.currentTarget.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 2;
        const id = `${Date.now()}-${Math.random()}`;

        setRipples((current) => [
          ...current,
          {
            id,
            size,
            x: event.clientX - rect.left - size / 2,
            y: event.clientY - rect.top - size / 2,
          },
        ]);

        setTimeout(() => {
          setRipples((current) => current.filter((ripple) => ripple.id !== id));
        }, 600);
      }
    }

    onClick?.(event);
  }

  const classes = [
    "relative overflow-hidden rounded-xl font-medium transition-all duration-200",
    // <a> افتراضيًا display:inline ما بيستجيب لـ width:100% (fullWidth)
    // ولا بيوسّط محتواه متل <button> (inline-block) — نصلحها هون بس
    // لما Component مو button فعلي، بدون أي تأثير على استخدامات Button
    // العادية بباقي المشروع
    !isNativeButton ? "inline-flex items-center justify-center" : "",
    "focus:outline-none focus:ring-2 focus:ring-primary/40",
    variantStyles[variant],
    sizeStyles[size],
    isDisabled
      ? "opacity-60 cursor-not-allowed pointer-events-none"
      : "cursor-pointer hover:shadow-sm",
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Component
      type={isNativeButton ? type : undefined}
      className={classes}
      onClick={isDisabled ? undefined : handleClick}
      disabled={isNativeButton ? isDisabled : undefined}
      aria-disabled={!isNativeButton && isDisabled ? true : undefined}
      {...props}
    >
      {isLoading ? loadingText : children}

      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          aria-hidden="true"
          className={`pointer-events-none absolute rounded-full animate-button-ripple ${rippleColor}`}
          style={{ left: ripple.x, top: ripple.y, width: ripple.size, height: ripple.size }}
        />
      ))}
    </Component>
  );
}