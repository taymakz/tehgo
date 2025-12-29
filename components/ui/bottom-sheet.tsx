"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import {
  BottomSheet as SpringBottomSheet,
  BottomSheetRef,
} from "react-spring-bottom-sheet";
import "../../styles/bottom-sheet.css";

import { cn } from "@/lib/utils";
import { useKeyboardVisible } from "@/hooks/use-keyboard-visible";

interface BottomSheetContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BottomSheetContext = React.createContext<
  BottomSheetContextValue | undefined
>(undefined);

function useBottomSheetContext() {
  const context = React.useContext(BottomSheetContext);
  if (!context) {
    throw new Error("BottomSheet components must be used within a BottomSheet");
  }
  return context;
}

interface BottomSheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

function BottomSheet({
  open: controlledOpen,
  onOpenChange,
  children,
}: BottomSheetProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const handleOpenChange = onOpenChange || setInternalOpen;

  return (
    <BottomSheetContext.Provider
      value={{ open: isOpen, onOpenChange: handleOpenChange }}
    >
      {children}
    </BottomSheetContext.Provider>
  );
}

function BottomSheetTrigger({
  className,
  children,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const { onOpenChange } = useBottomSheetContext();
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="bottom-sheet-trigger"
      className={className}
      onClick={() => onOpenChange(true)}
      {...props}
    >
      {children}
    </Comp>
  );
}

interface BottomSheetContentProps {
  className?: string;
  children?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  snapPoints?: (state: {
    headerHeight: number;
    footerHeight: number;
    height: number;
    minHeight: number;
    maxHeight: number;
  }) => number | number[];
  defaultSnap?:
  | number
  | ((state: {
    headerHeight: number;
    footerHeight: number;
    height: number;
    minHeight: number;
    maxHeight: number;
    snapPoints: number[];
    lastSnap: number | null;
  }) => number);
  expandOnContentDrag?: boolean;
  blocking?: boolean;
  scrollLocking?: boolean;
  maxHeight?: number;
}

const BottomSheetContent = React.forwardRef<
  BottomSheetRef,
  BottomSheetContentProps
>(
  (
    {
      className,
      children,
      header,
      footer,
      snapPoints,
      defaultSnap,
      expandOnContentDrag = false,
      blocking = true,
      scrollLocking = true,
      maxHeight,
    },
    ref,
  ) => {
    const { open, onOpenChange } = useBottomSheetContext();
    const isKeyboardVisible = useKeyboardVisible();
    const [adjustedMaxHeight, setAdjustedMaxHeight] = React.useState(
      maxHeight ||
      (typeof window !== "undefined" ? window.innerHeight * 0.9 : 600),
    );

    // Adjust max height when keyboard is visible
    React.useEffect(() => {
      if (typeof window === "undefined") return;

      if (isKeyboardVisible) {
        const currentViewportHeight =
          window.visualViewport?.height || window.innerHeight;
        // Use available viewport height minus some padding for keyboard
        // Ensure minimum height of 300px
        const availableHeight = Math.max(currentViewportHeight * 0.9, 300);
        setAdjustedMaxHeight(availableHeight);
      } else {
        setAdjustedMaxHeight(
          maxHeight ||
          (typeof window !== "undefined" ? window.innerHeight * 0.9 : 600),
        );
      }
    }, [isKeyboardVisible, maxHeight]);

    return (
      <SpringBottomSheet
        ref={ref}
        open={open}
        onDismiss={() => onOpenChange(false)}
        snapPoints={snapPoints}
        defaultSnap={defaultSnap}
        expandOnContentDrag={expandOnContentDrag}
        blocking={blocking}
        scrollLocking={scrollLocking}
        maxHeight={adjustedMaxHeight}
        initialFocusRef={false}
        header={header}
        footer={footer}
      >
        <div data-slot="bottom-sheet-content" className={cn("p-4", className)}>
          {children}
        </div>
      </SpringBottomSheet>
    );
  },
);
BottomSheetContent.displayName = "BottomSheetContent";

function BottomSheetHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="bottom-sheet-header"
      className={cn("flex flex-col gap-2 text-center mb-4", className)}
      {...props}
    />
  );
}

function BottomSheetFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="bottom-sheet-footer"
      className={cn("flex flex-col gap-2 px-4 pt-4", className)}
      {...props}
    />
  );
}

function BottomSheetTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="bottom-sheet-title"
      className={cn("leading-none font-semibold pt-2", className)}
      {...props}
    />
  );
}

function BottomSheetDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="bottom-sheet-description"
      className={cn(
        "text-muted-foreground text-sm max-w-80 mx-auto",
        className,
      )}
      {...props}
    />
  );
}

function BottomSheetClose({
  className,
  children,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const { onOpenChange } = useBottomSheetContext();
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="bottom-sheet-close"
      className={className}
      onClick={() => onOpenChange(false)}
      {...props}
    >
      {children}
    </Comp>
  );
}

export {
  BottomSheet,
  BottomSheetTrigger,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetFooter,
  BottomSheetTitle,
  BottomSheetDescription,
  BottomSheetClose,
};

export type { BottomSheetRef };
