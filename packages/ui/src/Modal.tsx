"use client";

import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  size?: "md" | "lg" | "xl";
  children: ReactNode;
}

const SIZE_CLASS = {
  md: "max-w-lg",
  lg: "max-w-3xl",
  xl: "max-w-6xl",
} as const;

export function Modal({ open, onOpenChange, title, description, size = "md", children }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className={`fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] ${SIZE_CLASS[size]} max-h-[calc(100vh-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-[var(--color-bg)] p-6 shadow-xl`}>
          <Dialog.Title className="text-lg font-semibold font-heading">{title}</Dialog.Title>
          {description ? (
            <Dialog.Description className="mt-1 text-sm text-black/55">{description}</Dialog.Description>
          ) : (
            <Dialog.Description className="sr-only">{title}</Dialog.Description>
          )}
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
