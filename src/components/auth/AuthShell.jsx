import LogoIcon from "../ui/LogoIcon";

// قالب موحّد لصفحات المصادقة (Login/Register). كان مصمَّم سابقًا بالأسود
// والأبيض بمعزل عن هوية المنصة (البرتقالي الدافئ المعرّف بـ index.css)،
// فتم توحيده هون مع باقي الصفحات: خلفية دافئة، بطاقة بيضاء نظيفة،
// وشارة شعار دائرية بلون primary تعزّز إحساس الثقة من أول ثانية.
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <section className="relative min-h-screen overflow-hidden bg-bg px-4 py-10">
      {/* توهّج برتقالي خفيف بالخلفية — لمسة لون واحدة بس، بدون مبالغة */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl"
      />

      <div className="relative mx-auto flex min-h-[80vh] w-full max-w-xl items-center justify-center">
        <div className="animate-shell-in w-full rounded-2xl border border-heading/10 bg-field p-6 shadow-xl sm:p-8">
          <header className="mb-6 flex flex-col items-center">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-sm">
              <LogoIcon className="h-6 w-6" />
            </span>
            <h1 className="text-center text-2xl font-bold text-heading">{title}</h1>
            {subtitle && <p className="mt-2 text-center text-sm text-body">{subtitle}</p>}
          </header>

          {children}

          {footer ? (
            <footer className="mt-6 text-center text-sm text-body">
              {footer}
            </footer>
          ) : null}
        </div>
      </div>
    </section>
  );
}