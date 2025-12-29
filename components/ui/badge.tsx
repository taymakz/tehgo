import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-sm font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-primary hover:bg-primary/90 text-primary-foreground border-transparent",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "text-foreground bg-card",

        info: "bg-info text-black hover:bg-info/80",

        success: "bg-success text-black hover:bg-success/80",

        alert: "bg-alert text-black hover:bg-alert/80",

        warning: "bg-warning text-black hover:bg-warning/80",
        violet:
          "bg-violet-600 text-white hover:bg-violet-600/80 dark:bg-violet-400 dark:text-black dark:hover:bg-violet-400/80 ",
        slate:
          "bg-slate-600 text-white hover:bg-slate-600/80 dark:bg-slate-400 dark:text-black dark:hover:bg-slate-400/80",
        gray: "bg-gray-600 text-white hover:bg-gray-600/80 dark:bg-gray-400 dark:text-black dark:hover:bg-gray-400/80",
        zinc: "bg-zinc-600 text-white hover:bg-zinc-600/80 dark:bg-zinc-400 dark:text-black dark:hover:bg-zinc-400/80",
        neutral:
          "bg-neutral-600 text-white hover:bg-neutral-600/80 dark:bg-neutral-400 dark:text-black dark:hover:bg-neutral-400/80",
        stone:
          "bg-stone-600 text-white hover:bg-stone-600/80 dark:bg-stone-400 dark:text-black dark:hover:bg-stone-400/80",
        red: "bg-red-600 text-white hover:bg-red-600/80 dark:bg-red-400 dark:text-black dark:hover:bg-red-400/80",
        orange:
          "bg-orange-600 text-white hover:bg-orange-600/80 dark:bg-orange-400 dark:text-black dark:hover:bg-orange-400/80",
        amber:
          "bg-amber-600 text-white hover:bg-amber-600/80 dark:bg-amber-400 dark:text-black dark:hover:bg-amber-400/80",
        yellow:
          "bg-yellow-600 text-white hover:bg-yellow-600/80 dark:bg-yellow-400 dark:text-black dark:hover:bg-yellow-400/80",
        lime: "bg-lime-600 text-white hover:bg-lime-600/80 dark:bg-lime-400 dark:text-black dark:hover:bg-lime-400/80",
        green:
          "bg-green-600 text-white hover:bg-green-600/80 dark:bg-green-400 dark:text-black dark:hover:bg-green-400/80",
        emerald:
          "bg-emerald-600 text-white hover:bg-emerald-600/80 dark:bg-emerald-400 dark:text-black dark:hover:bg-emerald-400/80",
        teal: "bg-teal-600 text-white hover:bg-teal-600/80 dark:bg-teal-400 dark:text-black dark:hover:bg-teal-400/80",
        cyan: "bg-cyan-600 text-white hover:bg-cyan-600/80 dark:bg-cyan-400 dark:text-black dark:hover:bg-cyan-400/80",
        sky: "bg-sky-600 text-white hover:bg-sky-600/80 dark:bg-sky-400 dark:text-black dark:hover:bg-sky-400/80",
        blue: "bg-blue-600 text-white hover:bg-blue-600/80 dark:bg-blue-400 dark:text-black dark:hover:bg-blue-400/80",
        indigo:
          "bg-indigo-600 text-white hover:bg-indigo-600/80 dark:bg-indigo-400 dark:text-black dark:hover:bg-indigo-400/80",
        purple:
          "bg-purple-600 text-white hover:bg-purple-600/80 dark:bg-purple-400 dark:text-black dark:hover:bg-purple-400/80",
        fuchsia:
          "bg-fuchsia-600 text-white hover:bg-fuchsia-600/80 dark:bg-fuchsia-400 dark:text-black dark:hover:bg-fuchsia-400/80",
        pink: "bg-pink-600 text-white hover:bg-pink-600/80 dark:bg-pink-400 dark:text-black dark:hover:bg-pink-400/80",
        rose: "bg-rose-600 text-white hover:bg-rose-600/80 dark:bg-rose-400 dark:text-black dark:hover:bg-rose-400/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
