"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import { appDesktopStartMinWidth } from "@/constants";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetFooter,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetTrigger,
} from "@/components/ui/bottom-sheet";

interface ResponsiveBottomSheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  trigger?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function ResponsiveBottomSheet({
  open,
  onOpenChange,
  children,
  trigger,
  title,
  description,
  footer,
  className,
}: ResponsiveBottomSheetProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isDesktop = useMediaQuery(appDesktopStartMinWidth);

  const isOpen = open !== undefined ? open : internalOpen;
  const handleOpenChange = onOpenChange || setInternalOpen;

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        <DialogContent className={cn("sm:max-w-[425px]", className)}>
          {(title || description) && (
            <DialogHeader>
              {title && <DialogTitle>{title}</DialogTitle>}
              {description && (
                <DialogDescription>{description}</DialogDescription>
              )}
            </DialogHeader>
          )}
          <div className="px-0">{children}</div>
          {footer && <div className="mt-4">{footer}</div>}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      {trigger && <div onClick={() => handleOpenChange(true)}>{trigger}</div>}
      <BottomSheet open={isOpen} onOpenChange={handleOpenChange}>
        <BottomSheetContent>
          {(title || description) && (
            <BottomSheetHeader>
              {title && <BottomSheetTitle>{title}</BottomSheetTitle>}
              {description && (
                <BottomSheetDescription>{description}</BottomSheetDescription>
              )}
            </BottomSheetHeader>
          )}
          <div>{children}</div>
          {footer && <BottomSheetFooter>{footer}</BottomSheetFooter>}
        </BottomSheetContent>
      </BottomSheet>
    </>
  );
}

// Export a hook version for more control
export function useResponsiveBottomSheet() {
  const [open, setOpen] = React.useState(false);
  const isDesktop = useMediaQuery(appDesktopStartMinWidth);

  return {
    open,
    setOpen,
    isDesktop,
  };
}
