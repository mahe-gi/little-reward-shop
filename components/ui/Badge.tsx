import React from "react";

export type BadgeVariant = "sage" | "honey" | "rose" | "amber" | "neutral";
export type BadgeSize = "sm" | "md";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function Badge({
  variant = "neutral",
  size = "md",
  dot = false,
  icon,
  children,
  className = "",
  ...props
}: BadgeProps) {
  const baseStyles =
    "inline-flex items-center font-medium rounded-full border transition-colors select-none";

  const sizeStyles: Record<BadgeSize, string> = {
    sm: "text-[11px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
  };

  const variantStyles: Record<BadgeVariant, { container: string; dot: string }> = {
    sage: {
      container: "bg-[#7E9F85]/15 text-[#3D6346] border-[#7E9F85]/30",
      dot: "bg-[#7E9F85]",
    },
    honey: {
      container: "bg-[#E8A838]/16 text-[#925C08] border-[#E8A838]/35",
      dot: "bg-[#E8A838]",
    },
    rose: {
      container: "bg-[#E06D75]/15 text-[#BA3F4A] border-[#E06D75]/30",
      dot: "bg-[#E06D75]",
    },
    amber: {
      container: "bg-[#D97757]/15 text-[#9C4629] border-[#D97757]/30",
      dot: "bg-[#D97757]",
    },
    neutral: {
      container: "bg-[#756963]/12 text-[#564B45] border-[#756963]/20",
      dot: "bg-[#756963]",
    },
  };

  const currentVariant = variantStyles[variant];

  return (
    <span
      className={`${baseStyles} ${sizeStyles[size]} ${currentVariant.container} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full shrink-0 ${currentVariant.dot}`}
          aria-hidden="true"
        />
      )}
      {icon && <span className="shrink-0 flex items-center">{icon}</span>}
      <span className="leading-none">{children}</span>
    </span>
  );
}
