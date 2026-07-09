import React, { forwardRef, useState } from "react";

type PasswordFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
};

const EyeIcon = ({ hidden }: { hidden: boolean }) => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    {hidden && <path d="M4 4l16 16" />}
  </svg>
);

const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(({
  label,
  value,
  onChange,
  placeholder = "••••••••",
  autoComplete,
  onKeyDown,
}, ref) => {
  const [visible, setVisible] = useState(false);
  const toggleLabel = visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`;

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative mt-2">
        <input
          ref={ref}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          required
          autoComplete={autoComplete}
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pr-12 text-slate-900 shadow-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          aria-label={toggleLabel}
          aria-pressed={visible}
        >
          <EyeIcon hidden={!visible} />
        </button>
      </div>
    </div>
  );
});

PasswordField.displayName = "PasswordField";

export default PasswordField;
