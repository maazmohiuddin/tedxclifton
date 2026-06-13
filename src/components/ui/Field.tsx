import { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

interface FieldShellProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  hint?: string;
}

export function Field({ label, htmlFor, required, error, children, hint }: FieldShellProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="kx-label">
        {label}
        {required && <span aria-hidden="true" className="text-khi-blue-bright"> *</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="mt-1 text-[11px] text-white/30">{hint}</p>
      )}
      {error && (
        <p role="alert" className="mt-1 text-[11px] text-[#FF6B8E]">{error}</p>
      )}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement>;
type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Input(props: InputProps) {
  return <input {...props} className={`kx-input ${props.className ?? ""}`} />;
}

export function Textarea(props: TextareaProps) {
  return <textarea {...props} className={`kx-input min-h-[130px] resize-y leading-relaxed ${props.className ?? ""}`} />;
}
