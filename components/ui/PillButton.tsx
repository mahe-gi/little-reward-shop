import React from "react";

export type PillButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type PillButtonSize = "sm" | "md" | "lg";

export interface PillButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: PillButtonVariant;
  size?: PillButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function PillButton({
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  icon,
  children,
  className = "",
  disabled,
  ...props
}: PillButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#E06D75]/40 focus:ring-offset-1 select-none active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer";

  const sizeStyles: Record<PillButtonSize, string> = {
    sm: "text-xs px-3.5 py-1.5 gap-1.5 min-h-[32px]",
    md: "text-sm px-5 py-2.5 gap-2 min-h-[42px]",
    lg: "text-base px-6 py-3 gap-2.5 min-h-[50px] font-semibold",
  };

  const variantStyles: Record<PillButtonVariant, string> = {
    primary:
      "bg-[#E06D75] text-white hover:bg-[#D45B63] shadow-[0_4px_16px_-2px_rgba(224,109,117,0.38)] active:shadow-[0_2px_8px_-1px_rgba(224,109,117,0.3)]",
    secondary:
      "bg-[#FDFBF7] text-[#24201D] border border-[#EAE6DE] hover:bg-[#F5F0E8] shadow-[0_2px_10px_-2px_rgba(60,45,40,0.05)]",
    ghost:
      "bg-transparent text-[#756963] hover:text-[#24201D] hover:bg-[#EAE6DE]/40 active:bg-[#EAE6DE]/60",
    danger:
      "bg-[#D97757] text-white hover:bg-[#C96645] shadow-[0_4px_16px_-2px_rgba(217,119,87,0.35)]",
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${
        fullWidth ? "w-full" : ""
      } ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin -ml-0.5 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        icon && <span className="inline-flex shrink-0 items-center">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
}
