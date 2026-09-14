import { SelectHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

interface SelectOption {
  value: any;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, className, id, children, options, ...props }, ref) => {
    const selectId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-ink">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={clsx(
            "rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none",
            "focus:border-primary focus:ring-1 focus:ring-primary",
            className
          )}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={String(opt.value)} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
      </div>
    );
  }
);
Select.displayName = "Select";
