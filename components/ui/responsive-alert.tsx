"use client";

import * as React from "react";

import { useMediaQuery } from "@/hooks/use-media-query";
import { appDesktopStartMinWidth } from "@/constants";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ResponsiveAlertProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  title: string;
  description?: string;
  confirmText?: string;
  confirmLoading?: boolean;
  cancelText?: string;
  confirmButtonText?: string;
  onConfirm?: () => void;
}

export function ResponsiveAlert({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  confirmText,
  confirmLoading = false,
  cancelText = "لغو",
  confirmButtonText = "تایید",
  onConfirm,
}: ResponsiveAlertProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [confirmInput, setConfirmInput] = React.useState("");
  const isDesktop = useMediaQuery(appDesktopStartMinWidth);

  const isOpen = open !== undefined ? open : internalOpen;
  const handleOpenChange = (value: boolean) => {
    if (onOpenChange) {
      onOpenChange(value);
    } else {
      setInternalOpen(value);
    }
    if (!value) {
      setConfirmInput("");
    }
  };

  const isConfirmValid = React.useMemo(() => {
    if (!confirmText) return true;
    return confirmInput === confirmText;
  }, [confirmInput, confirmText]);

  const handleConfirm = () => {
    if (isConfirmValid && onConfirm) {
      onConfirm();
    }
  };

  if (isDesktop) {
    return (
      <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
        {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            {description && (
              <AlertDialogDescription>{description}</AlertDialogDescription>
            )}
          </AlertDialogHeader>

          {confirmText && (
            <div className="space-y-2 ">
              <p className="text-muted-foreground text-sm">
                برای تایید، متن
                <span className="font-semibold mx-2">
                  &quot;{confirmText}&quot;
                </span>
                را وارد کنید
              </p>
              <Input
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder={confirmText}
                autoFocus
              />
            </div>
          )}

          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel onClick={() => handleOpenChange(false)}>
              {cancelText}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={confirmLoading || !isConfirmValid}
              onClick={handleConfirm}
            >
              {confirmButtonText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <>
      {trigger && <div onClick={() => handleOpenChange(true)}>{trigger}</div>}
      <Drawer open={isOpen} onOpenChange={handleOpenChange}>
        <DrawerContent className="fixed inset-x-4 data-[vaul-drawer-direction=bottom]:bottom-4  mx-auto max-w-sm overflow-hidden border rounded-[36px]! outline-none">
          <DrawerHeader className="text-center">
            <DrawerTitle>{title}</DrawerTitle>
            {description && (
              <p className="text-muted-foreground text-sm">{description}</p>
            )}
          </DrawerHeader>

          {confirmText && (
            <div className="px-4 space-y-2">
              <Label className="text-muted-foreground text-sm">
                برای تایید، متن
                <span className="font-semibold">&quot;{confirmText}&quot;</span>
                را وارد کنید
              </Label>
              <Input
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder={confirmText}
                autoFocus
                autoComplete="off"
              />
            </div>
          )}

          <DrawerFooter>
            <div className="flex gap-2">
              <div className="w-full">
                <DrawerClose asChild>
                  <Button variant="outline" className="w-full rounded-2xl">
                    {cancelText}
                  </Button>
                </DrawerClose>
              </div>
              <div className="w-full">
                <Button
                  variant="destructive"
                  disabled={confirmLoading || !isConfirmValid}
                  className="w-full rounded-2xl"
                  onClick={handleConfirm}
                >
                  {confirmButtonText}
                </Button>
              </div>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}

// Export a hook version for more control
export function useResponsiveAlert() {
  const [open, setOpen] = React.useState(false);
  const isDesktop = useMediaQuery(appDesktopStartMinWidth);

  return {
    open,
    setOpen,
    isDesktop,
  };
}
