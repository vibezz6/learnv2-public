import { cn } from "@/lib/cn";
import { useId } from "react";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

interface FieldProps {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** When provided, label `htmlFor` is set; otherwise the form control inherits an auto-id. */
  htmlFor?: string;
  required?: boolean;
  /** Position the label inline (left) instead of above. */
  inline?: boolean;
  className?: string;
  children: (id: string) => ReactNode;
}

/**
 * Field — wraps a label, optional hint, optional error, and a render-prop child
 * that receives the generated id so the input can be associated reliably.
 *
 * Different from the other model's Field: render-prop API, error state,
 * inline option, mono uppercase label.
 */
export function Field({
  label,
  hint,
  error,
  htmlFor,
  required,
  inline,
  className,
  children,
}: FieldProps) {
  const auto = useId();
  const id = htmlFor || auto;
  return (
    <div className={cn(inline ? "flex items-baseline gap-3" : "space-y-1.5", className)}>
      <label
        htmlFor={id}
        className={cn(
          "block text-[11px] font-medium uppercase tracking-wide",
          error ? "text-[var(--danger-fg)]" : "text-[var(--text-muted)]",
          inline && "shrink-0",
        )}
      >
        <span>{label}</span>
        {required ? (
          <span aria-hidden className="ml-0.5 text-[var(--accent)]">
            *
          </span>
        ) : null}
      </label>
      <div className={cn("min-w-0", inline && "flex-1")}>
        {children(id)}
        {hint && !error ? (
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">{hint}</p>
        ) : null}
        {error ? (
          <p className="mt-1 text-xs leading-relaxed text-[var(--danger-fg)]">{error}</p>
        ) : null}
      </div>
    </div>
  );
}

const controlBase =
  "w-full rounded-[var(--radius)] border border-[var(--rule-strong)] bg-[var(--bg-sunken)] text-sm text-[var(--text)] placeholder:text-[var(--text-subtle)] outline-none transition focus:border-[var(--accent-border)] focus-visible:shadow-[var(--focus-ring)]";

const sizeClass = {
  sm: "min-h-9 px-2.5 py-1.5 text-[13px]",
  md: "min-h-10 px-3 py-2 text-sm",
  lg: "min-h-11 px-3.5 py-2.5 text-[15px]",
} as const;

interface InputBaseProps {
  size?: keyof typeof sizeClass;
  invalid?: boolean;
}

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & InputBaseProps;
export function Input({ className, size = "md", invalid, ...props }: InputProps) {
  return (
    <input
      className={cn(
        controlBase,
        sizeClass[size],
        invalid && "border-[var(--danger-border)]",
        className,
      )}
      {...props}
    />
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};
export function Textarea({ className, invalid, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        controlBase,
        "min-h-28 resize-y px-3 py-2",
        invalid && "border-[var(--danger-border)]",
        className,
      )}
      {...props}
    />
  );
}

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & InputBaseProps;
export function Select({ className, size = "md", invalid, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        controlBase,
        sizeClass[size],
        invalid && "border-[var(--danger-border)]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
