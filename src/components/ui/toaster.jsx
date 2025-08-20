import React from 'react';
import { useToast } from "@/components/ui/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  const renderToast = (toast) => {
    const { id, title, description, action, onOpenChange, ...props } = toast;
    
    const handleOpenChange = (isOpen) => {
      if (!isOpen) {
        dismiss(id);
      }
      onOpenChange?.(isOpen);
    };

    const handleClose = () => {
      handleOpenChange(false);
    };

    const toastId = `toast-${id}`;

    return (
      <Toast
        key={id}
        id={toastId}
        onOpenChange={handleOpenChange}
        className="relative"
        {...props}
      >
        <div className="grid gap-1">
          {title && <ToastTitle>{title}</ToastTitle>}
          {description && (
            <ToastDescription>{description}</ToastDescription>
          )}
        </div>
        {action}
        <ToastClose 
          onClick={handleClose}
          className="absolute right-2 top-2"
        />
      </Toast>
    );
  };

  return (
    <ToastProvider>
      {toasts.map(renderToast)}
      <ToastViewport />
    </ToastProvider>
  );
}