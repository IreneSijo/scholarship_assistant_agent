export function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="flex items-start justify-between gap-6 mb-8">
      <div>
        {eyebrow && (
          <p className="font-mono text-xs uppercase tracking-widest text-seal-dark mb-2">{eyebrow}</p>
        )}
        <h1 className="font-display text-3xl font-semibold text-ink-800">{title}</h1>
        {description && <p className="mt-2 text-ink-400 max-w-2xl">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-xl border border-ink-100 shadow-card p-6 ${className}`}>{children}</div>
  );
}

export function Badge({ children, tone = "neutral" }) {
  const tones = {
    neutral: "bg-ink-50 text-ink-600",
    success: "bg-moss/10 text-moss",
    warning: "bg-seal/15 text-seal-dark",
    danger: "bg-rust/10 text-rust",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function SealProgress({ percent, label }) {
  const clamped = Math.min(100, Math.max(0, percent));
  const circumference = 2 * Math.PI * 34;
  const offset = circumference - (clamped / 100) * circumference;
  return (
    <div className="flex items-center gap-4">
      <svg width="84" height="84" viewBox="0 0 84 84" className="shrink-0">
        <circle cx="42" cy="42" r="34" fill="none" stroke="#EEF2F4" strokeWidth="8" />
        <circle
          cx="42"
          cy="42"
          r="34"
          fill="none"
          stroke="#B98A2E"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 42 42)"
        />
        <text x="42" y="47" textAnchor="middle" className="font-mono" fontSize="18" fill="#132A3A">
          {clamped}%
        </text>
      </svg>
      {label && <p className="text-sm text-ink-400 max-w-[10rem]">{label}</p>}
    </div>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <Card className="text-center py-14">
      <div className="w-12 h-12 mx-auto rounded-seal border-2 border-dashed border-ink-200 flex items-center justify-center text-ink-200 font-display text-xl mb-4">
        ✦
      </div>
      <p className="font-display text-lg text-ink-700">{title}</p>
      {description && <p className="text-ink-400 mt-1 text-sm max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}

export function Button({ children, variant = "primary", className = "", ...props }) {
  const variants = {
    primary: "bg-ink-800 text-paper hover:bg-ink-700",
    seal: "bg-seal text-white hover:bg-seal-dark",
    ghost: "bg-transparent text-ink-600 hover:bg-ink-50 border border-ink-100",
    danger: "bg-rust text-white hover:bg-rust/90",
  };
  return (
    <button
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
