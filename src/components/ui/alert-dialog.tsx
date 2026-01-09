"use client";

import * as React from "react";

interface AlertDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info";
}

export function AlertDialog({
    open,
    onOpenChange,
    title,
    description,
    onConfirm,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "danger",
}: AlertDialogProps) {
    if (!open) return null;

    const handleConfirm = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        onConfirm();
        onOpenChange(false);
    };

    const handleCancel = (e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        onOpenChange(false);
    };

    const variantStyles = {
        danger: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
        warning: "bg-orange-600 hover:bg-orange-700 focus:ring-orange-500",
        info: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={(e) => e.stopPropagation()}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleCancel}
            />

            {/* Dialog */}
            <div
                className="relative bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-lg shadow-xl max-w-full sm:max-w-md w-full mx-0 sm:mx-4 p-5 sm:p-6 animate-in slide-in-from-bottom sm:fade-in sm:zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Icon */}
                <div className={`mx-auto flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full ${variant === "danger" ? "bg-red-100 dark:bg-red-900/20" :
                    variant === "warning" ? "bg-orange-100 dark:bg-orange-900/20" :
                        "bg-blue-100 dark:bg-blue-900/20"
                    }`}>
                    <svg
                        className={`h-5 w-5 sm:h-6 sm:w-6 ${variant === "danger" ? "text-red-600 dark:text-red-400" :
                            variant === "warning" ? "text-orange-600 dark:text-orange-400" :
                                "text-blue-600 dark:text-blue-400"
                            }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                        />
                    </svg>
                </div>

                {/* Content */}
                <div className="mt-3 text-center sm:mt-5">
                    <h3 className="text-base sm:text-lg font-semibold leading-6 text-gray-900 dark:text-gray-100">
                        {title}
                    </h3>
                    <div className="mt-2">
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            {description}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-4 sm:mt-6 flex flex-col-reverse sm:flex-row sm:gap-3 gap-2">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="w-full inline-flex justify-center rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 sm:py-3 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 active:bg-gray-100 dark:active:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors touch-manipulation"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className={`w-full inline-flex justify-center rounded-xl px-4 py-2.5 sm:py-3 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors touch-manipulation ${variantStyles[variant]}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
