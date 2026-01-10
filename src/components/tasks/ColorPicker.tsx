"use client";

import { useState, useRef, useEffect } from 'react';
import { Check, Palette, X } from 'lucide-react';
import { createPortal } from 'react-dom';

// Professional color palette with good contrast and accessibility
export const TASK_COLOR_PRESETS = [
    { name: 'Red', value: '#EF4444', hex: '#EF4444' },
    { name: 'Orange', value: '#F97316', hex: '#F97316' },
    { name: 'Amber', value: '#F59E0B', hex: '#F59E0B' },
    { name: 'Yellow', value: '#EAB308', hex: '#EAB308' },
    { name: 'Lime', value: '#84CC16', hex: '#84CC16' },
    { name: 'Green', value: '#10B981', hex: '#10B981' },
    { name: 'Emerald', value: '#059669', hex: '#059669' },
    { name: 'Teal', value: '#14B8A6', hex: '#14B8A6' },
    { name: 'Cyan', value: '#06B6D4', hex: '#06B6D4' },
    { name: 'Sky', value: '#0EA5E9', hex: '#0EA5E9' },
    { name: 'Blue', value: '#3B82F6', hex: '#3B82F6' },
    { name: 'Indigo', value: '#6366F1', hex: '#6366F1' },
    { name: 'Violet', value: '#8B5CF6', hex: '#8B5CF6' },
    { name: 'Purple', value: '#A855F7', hex: '#A855F7' },
    { name: 'Fuchsia', value: '#D946EF', hex: '#D946EF' },
    { name: 'Pink', value: '#EC4899', hex: '#EC4899' },
    { name: 'Rose', value: '#F43F5E', hex: '#F43F5E' },
    { name: 'Slate', value: '#64748B', hex: '#64748B' },
];

interface ColorPickerProps {
    value?: string | null;
    onChange: (color: string | null) => void;
    label?: string;
    showLabel?: boolean;
}

export default function ColorPicker({
    value,
    onChange,
    label = "Task Color",
    showLabel = true
}: ColorPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [customColor, setCustomColor] = useState(value || '#3B82F6');
    const [showCustomInput, setShowCustomInput] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

    // Track if component is mounted in the browser (for portal rendering)
    const isBrowser = typeof window !== 'undefined';

    // Calculate dropdown position dynamically
    useEffect(() => {
        if (isOpen && buttonRef.current && isBrowser) {
            const updatePosition = () => {
                if (!buttonRef.current) return;

                const buttonRect = buttonRef.current.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;

                const dropdownWidth = viewportWidth < 640 ? viewportWidth - 32 : 320;
                const dropdownHeight = 380;

                let top = buttonRect.bottom + 8;
                let left = buttonRect.left;

                // Mobile: center horizontally with margins
                if (viewportWidth < 640) {
                    left = 16;
                }
                // Desktop: ensure dropdown fits in viewport
                else {
                    if (left + dropdownWidth > viewportWidth - 16) {
                        left = viewportWidth - dropdownWidth - 16;
                    }
                    if (left < 16) left = 16;
                }

                // Check if dropdown fits below
                if (top + dropdownHeight > viewportHeight - 16) {
                    top = buttonRect.top - dropdownHeight - 8;
                    // If still doesn't fit, position at top with scroll
                    if (top < 16) {
                        top = 16;
                    }
                }

                setDropdownStyle({
                    position: 'fixed',
                    top: `${top}px`,
                    left: `${left}px`,
                    width: viewportWidth < 640 ? `${viewportWidth - 32}px` : '320px',
                    maxHeight: `${Math.min(dropdownHeight, viewportHeight - top - 16)}px`,
                    zIndex: 9999,
                });
            };

            updatePosition();
            window.addEventListener('resize', updatePosition);
            window.addEventListener('scroll', updatePosition, true);

            return () => {
                window.removeEventListener('resize', updatePosition);
                window.removeEventListener('scroll', updatePosition, true);
            };
        }
    }, [isOpen, isBrowser]);

    // Close dropdown when clicking outside
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
                const dropdown = document.getElementById('color-picker-dropdown');
                if (dropdown && !dropdown.contains(event.target as Node)) {
                    setIsOpen(false);
                    setShowCustomInput(false);
                }
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
                setShowCustomInput(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    const handleColorSelect = (color: string | null) => {
        onChange(color);
        setIsOpen(false);
        setShowCustomInput(false);
    };

    const handleCustomColorSubmit = () => {
        const hexRegex = /^#[0-9A-Fa-f]{6}$/;
        if (hexRegex.test(customColor)) {
            onChange(customColor);
            setIsOpen(false);
            setShowCustomInput(false);
        } else {
            alert('Please enter a valid hex color code (e.g., #FF5733)');
        }
    };

    return (
        <div className="relative w-full">
            {showLabel && (
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {label}
                </label>
            )}

            {/* Color Display Button */}
            <button
                ref={buttonRef}
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl 
                    border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 
                    hover:border-gray-400 dark:hover:border-gray-500 transition-all
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    touch-manipulation active:scale-[0.98]"
            >
                <div className="flex items-center gap-2 min-w-0">
                    {value ? (
                        <>
                            <div
                                className="w-5 h-5 sm:w-6 sm:h-6 rounded-md border-2 border-gray-200 dark:border-gray-700 shadow-sm shrink-0"
                                style={{ backgroundColor: value }}
                            />
                            <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                                {TASK_COLOR_PRESETS.find(c => c.value === value)?.name || value}
                            </span>
                        </>
                    ) : (
                        <>
                            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md border-2 border-dashed border-gray-300 dark:border-gray-600 
                                bg-gray-50 dark:bg-gray-700 flex items-center justify-center shrink-0">
                                <Palette className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400" />
                            </div>
                            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                                No color selected
                            </span>
                        </>
                    )}
                </div>
                <svg
                    className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Portal-based Dropdown - Prevents z-index issues */}
            {isOpen && isBrowser && createPortal(
                <>
                    {/* Backdrop for mobile */}
                    <div
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm sm:hidden"
                        style={{ zIndex: 9998 }}
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown Panel */}
                    <div
                        id="color-picker-dropdown"
                        style={dropdownStyle}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 
                            p-3 sm:p-4 overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3 pb-2 sm:pb-3 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                                Select Task Color
                            </h3>
                            {value && (
                                <button
                                    type="button"
                                    onClick={() => handleColorSelect(null)}
                                    className="text-xs text-red-500 hover:text-red-600 font-medium 
                                        flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20
                                        transition-colors touch-manipulation active:scale-95"
                                >
                                    <X className="w-3 h-3" />
                                    <span className="hidden sm:inline">Clear</span>
                                </button>
                            )}
                        </div>

                        {!showCustomInput ? (
                            <>
                                {/* Color Grid */}
                                <div className="grid grid-cols-6 gap-1.5 sm:gap-2 mb-3">
                                    {TASK_COLOR_PRESETS.map((color) => (
                                        <button
                                            key={color.value}
                                            type="button"
                                            onClick={() => handleColorSelect(color.value)}
                                            className="relative w-full aspect-square rounded-lg transition-all 
                                                hover:scale-110 active:scale-95
                                                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                                                dark:focus:ring-offset-gray-800 touch-manipulation"
                                            style={{ backgroundColor: color.value }}
                                            title={color.name}
                                            aria-label={`Select ${color.name} color`}
                                        >
                                            {value === color.value && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow-lg" strokeWidth={3} />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {/* Custom Color Button */}
                                <button
                                    type="button"
                                    onClick={() => setShowCustomInput(true)}
                                    className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg 
                                        border-2 border-dashed border-gray-300 dark:border-gray-600 
                                        text-gray-600 dark:text-gray-400 text-xs sm:text-sm font-medium
                                        hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 
                                        hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all
                                        touch-manipulation active:scale-[0.98]"
                                >
                                    <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    Custom Color
                                </button>
                            </>
                        ) : (
                            <>
                                {/* Custom Color Input */}
                                <div className="space-y-2 sm:space-y-3">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={customColor}
                                            onChange={(e) => setCustomColor(e.target.value)}
                                            placeholder="#3B82F6"
                                            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                                                bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm
                                                focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase
                                                touch-manipulation"
                                            maxLength={7}
                                            autoComplete="off"
                                            autoCorrect="off"
                                            autoCapitalize="off"
                                            spellCheck={false}
                                        />
                                        <div
                                            className="w-10 h-10 sm:w-12 sm:h-10 rounded-lg border-2 border-gray-200 dark:border-gray-700 
                                                shadow-sm shrink-0"
                                            style={{ backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(customColor) ? customColor : '#cccccc' }}
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowCustomInput(false)}
                                            className="flex-1 px-3 sm:px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                                                text-gray-700 dark:text-gray-300 text-xs sm:text-sm font-medium
                                                hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                                                touch-manipulation active:scale-[0.98]"
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleCustomColorSubmit}
                                            className="flex-1 px-3 sm:px-4 py-2 rounded-lg bg-blue-600 text-white text-xs sm:text-sm font-medium
                                                hover:bg-blue-700 transition-colors
                                                touch-manipulation active:scale-[0.98]"
                                        >
                                            Apply
                                        </button>
                                    </div>

                                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 text-center">
                                        Enter a hex color code (e.g., #FF5733)
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </>,
                document.body
            )}
        </div>
    );
}
