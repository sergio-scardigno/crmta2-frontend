import { forwardRef, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/app/lib/utils";

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "success" | "error" | "warning" | "info";
  children?: ReactNode;
}

const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "info", children, ...props }, ref) => {
    const variants = {
      success: "bg-emerald-950/40 border-emerald-700 text-emerald-100",
      error: "bg-red-950/40 border-red-700 text-red-100",
      warning: "bg-yellow-950/40 border-yellow-700 text-yellow-100",
      info: "bg-blue-950/40 border-blue-700 text-blue-100",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border p-4 text-sm",
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Alert.displayName = "Alert";

export { Alert };
