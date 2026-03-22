"use client";

import { useState } from "react";

interface AuditManagementProps {
    userRole: string;
}

export default function AuditManagement({ userRole }: AuditManagementProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string>("2days");
    const [customDate, setCustomDate] = useState<string>("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [deletionResult, setDeletionResult] = useState<{
        success: boolean;
        message: string;
    } | null>(null);

    // Custom date picker state
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [calViewDate, setCalViewDate] = useState(new Date());
    const [pickerDay, setPickerDay] = useState<Date | null>(null);
    const [pickerHour, setPickerHour] = useState(12);
    const [pickerMinute, setPickerMinute] = useState(0);
    const [pickerAmPm, setPickerAmPm] = useState<"AM" | "PM">("PM");

    // Only show for SUPER_ADMIN
    if (userRole !== "SUPER_ADMIN") {
        return null;
    }

    const pad2 = (n: number) => n.toString().padStart(2, "0");
    const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
    const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();
    const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const confirmPickerDate = () => {
        if (!pickerDay) return;
        const d = new Date(pickerDay);
        let h = pickerHour % 12;
        if (pickerAmPm === "PM") h += 12;
        d.setHours(h, pickerMinute, 0, 0);
        setCustomDate(`${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`);
        setIsCalendarOpen(false);
    };

    const getDeleteBeforeDate = (): Date => {
        const now = new Date();

        switch (selectedOption) {
            case "2days":
                now.setDate(now.getDate() - 2);
                break;
            case "7days":
                now.setDate(now.getDate() - 7);
                break;
            case "30days":
                now.setDate(now.getDate() - 30);
                break;
            case "90days":
                now.setDate(now.getDate() - 90);
                break;
            case "custom":
                if (customDate) {
                    return new Date(customDate);
                }
                break;
        }

        return now;
    };

    const handleDeleteClick = () => {
        // Validate custom date if selected
        if (selectedOption === "custom" && !customDate) {
            setDeletionResult({
                success: false,
                message: "Please select a custom date"
            });
            return;
        }

        setShowConfirmDialog(true);
    };

    const handleConfirmDelete = async () => {
        setIsDeleting(true);
        setDeletionResult(null);

        try {
            const deleteBeforeDate = getDeleteBeforeDate();

            const response = await fetch("/api/admin/activity-logs", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    deleteBeforeDate: deleteBeforeDate.toISOString(),
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setDeletionResult({
                    success: true,
                    message: data.message || `Successfully deleted ${data.deletedCount} audit log(s)`,
                });
            } else {
                setDeletionResult({
                    success: false,
                    message: data.error || "Failed to delete audit logs",
                });
            }
        } catch (error) {
            console.error("Error deleting audit logs:", error);
            setDeletionResult({
                success: false,
                message: "An error occurred while deleting audit logs",
            });
        } finally {
            setIsDeleting(false);
            setShowConfirmDialog(false);
        }
    };

    const formatDateForDisplay = (): string => {
        const date = getDeleteBeforeDate();
        return date.toLocaleDateString() + " " + date.toLocaleTimeString();
    };

    // Collapsed state - small delete button
    if (!isExpanded) {
        return (
            <div className="w-full">
                <button
                    onClick={() => setIsExpanded(true)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold rounded-full transition-all flex items-center justify-center sm:justify-start gap-2 group"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span className="text-sm">Delete Old Audit Logs</span>
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        );
    }

    // Expanded state - full management interface
    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4">
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="shrink-0 p-2 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Collapse audit management"
                    >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                        Audit Log Management
                    </h3>
                </div>
                <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full self-start sm:self-auto">
                    SUPER ADMIN ONLY
                </span>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
                Delete audit logs older than a specific date. This action cannot be undone.
            </p>

            {/* Date Selection Options */}
            <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Delete audit logs older than:
                </label>

                <div className="space-y-2">
                    <label className="flex items-center space-x-3 cursor-pointer touch-manipulation active:bg-gray-50 p-2 rounded-lg -mx-2">
                        <input
                            type="radio"
                            name="deleteOption"
                            value="2days"
                            checked={selectedOption === "2days"}
                            onChange={(e) => setSelectedOption(e.target.value)}
                            className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-xs sm:text-sm text-gray-700 font-medium">2 days ago</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer touch-manipulation active:bg-gray-50 p-2 rounded-lg -mx-2">
                        <input
                            type="radio"
                            name="deleteOption"
                            value="7days"
                            checked={selectedOption === "7days"}
                            onChange={(e) => setSelectedOption(e.target.value)}
                            className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-xs sm:text-sm text-gray-700 font-medium">7 days ago</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer touch-manipulation active:bg-gray-50 p-2 rounded-lg -mx-2">
                        <input
                            type="radio"
                            name="deleteOption"
                            value="30days"
                            checked={selectedOption === "30days"}
                            onChange={(e) => setSelectedOption(e.target.value)}
                            className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-xs sm:text-sm text-gray-700 font-medium">30 days ago</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer touch-manipulation active:bg-gray-50 p-2 rounded-lg -mx-2">
                        <input
                            type="radio"
                            name="deleteOption"
                            value="90days"
                            checked={selectedOption === "90days"}
                            onChange={(e) => setSelectedOption(e.target.value)}
                            className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-xs sm:text-sm text-gray-700 font-medium">90 days ago</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer touch-manipulation active:bg-gray-50 p-2 rounded-lg -mx-2">
                        <input
                            type="radio"
                            name="deleteOption"
                            value="custom"
                            checked={selectedOption === "custom"}
                            onChange={(e) => setSelectedOption(e.target.value)}
                            className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-xs sm:text-sm text-gray-700 font-medium">Custom date</span>
                    </label>
                </div>

                {/* Custom Date Picker */}
                {selectedOption === "custom" && (
                    <div className="ml-0 sm:ml-7 mt-3">
                        {/* Trigger button */}
                        <button
                            type="button"
                            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                            className="flex items-center gap-2.5 px-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm hover:border-gray-300 hover:bg-gray-50 transition-all group w-full sm:w-auto"
                        >
                            <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className={customDate ? "font-medium text-gray-900" : "text-gray-400"}>
                                {customDate
                                    ? new Date(customDate).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
                                    : "Select date & time"}
                            </span>
                            <svg className={`w-4 h-4 text-gray-400 ml-auto sm:ml-2 transition-transform ${isCalendarOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* Calendar + time popover */}
                        {isCalendarOpen && (
                            <div className="mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 w-full sm:w-72">
                                {/* Month navigation */}
                                <div className="flex items-center justify-between mb-4">
                                    <button
                                        type="button"
                                        aria-label="Previous month"
                                        onClick={() => setCalViewDate(prev => { const d = new Date(prev); d.setMonth(d.getMonth() - 1); return d; })}
                                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
                                    >
                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                    </button>
                                    <span className="text-sm font-bold text-gray-900">
                                        {MONTH_NAMES[calViewDate.getMonth()]} {calViewDate.getFullYear()}
                                    </span>
                                    <button
                                        type="button"
                                        aria-label="Next month"
                                        onClick={() => setCalViewDate(prev => { const d = new Date(prev); d.setMonth(d.getMonth() + 1); return d; })}
                                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
                                    >
                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                    </button>
                                </div>

                                {/* Day-of-week headers */}
                                <div className="grid grid-cols-7 mb-1">
                                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
                                        <div key={d} className="text-center text-[11px] font-semibold text-gray-400 py-1">{d}</div>
                                    ))}
                                </div>

                                {/* Day grid */}
                                <div className="grid grid-cols-7 gap-y-0.5">
                                    {Array.from({ length: getFirstDayOfMonth(calViewDate.getFullYear(), calViewDate.getMonth()) }).map((_, i) => (
                                        <div key={`e-${i}`} />
                                    ))}
                                    {Array.from({ length: getDaysInMonth(calViewDate.getFullYear(), calViewDate.getMonth()) }).map((_, i) => {
                                        const day = i + 1;
                                        const thisDate = new Date(calViewDate.getFullYear(), calViewDate.getMonth(), day);
                                        const maxDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
                                        const isDisabled = thisDate > maxDate;
                                        const isSelected = pickerDay &&
                                            pickerDay.getFullYear() === thisDate.getFullYear() &&
                                            pickerDay.getMonth() === thisDate.getMonth() &&
                                            pickerDay.getDate() === thisDate.getDate();
                                        const isToday = new Date().toDateString() === thisDate.toDateString();
                                        return (
                                            <button
                                                key={day}
                                                type="button"
                                                disabled={isDisabled}
                                                onClick={() => setPickerDay(thisDate)}
                                                className={`w-full aspect-square flex items-center justify-center text-xs font-medium rounded-full transition-colors ${
                                                    isSelected
                                                        ? "bg-black text-white"
                                                        : isToday
                                                        ? "border border-gray-400 text-gray-900 hover:bg-gray-100"
                                                        : isDisabled
                                                        ? "text-gray-300 cursor-not-allowed"
                                                        : "text-gray-700 hover:bg-gray-100 active:bg-gray-200"
                                                }`}
                                            >
                                                {day}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Divider */}
                                <div className="border-t border-gray-100 my-4" />

                                {/* Time picker */}
                                <div className="flex items-center justify-center gap-4">
                                    {/* Hour */}
                                    <div className="flex flex-col items-center gap-1">
                                        <button type="button" aria-label="Increase hour" onClick={() => setPickerHour(h => h === 12 ? 1 : h + 1)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors">
                                            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                                        </button>
                                        <span className="text-xl font-mono font-bold text-gray-900 w-8 text-center select-none">{pad2(pickerHour)}</span>
                                        <button type="button" aria-label="Decrease hour" onClick={() => setPickerHour(h => h === 1 ? 12 : h - 1)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors">
                                            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                        </button>
                                    </div>

                                    <span className="text-2xl font-bold text-gray-200 select-none">:</span>

                                    {/* Minute */}
                                    <div className="flex flex-col items-center gap-1">
                                        <button type="button" aria-label="Increase minute" onClick={() => setPickerMinute(m => (m + 5) % 60)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors">
                                            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                                        </button>
                                        <span className="text-xl font-mono font-bold text-gray-900 w-8 text-center select-none">{pad2(pickerMinute)}</span>
                                        <button type="button" aria-label="Decrease minute" onClick={() => setPickerMinute(m => m === 0 ? 55 : m - 5)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors">
                                            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                        </button>
                                    </div>

                                    {/* AM / PM toggle */}
                                    <button
                                        type="button"
                                        onClick={() => setPickerAmPm(a => a === "AM" ? "PM" : "AM")}
                                        className="px-3 py-1.5 bg-black hover:bg-gray-800 text-white text-xs font-bold rounded-full transition-colors select-none"
                                    >
                                        {pickerAmPm}
                                    </button>
                                </div>

                                {/* Confirm button */}
                                <button
                                    type="button"
                                    onClick={confirmPickerDate}
                                    disabled={!pickerDay}
                                    className="mt-4 w-full bg-black hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-semibold py-2.5 rounded-full transition-colors"
                                >
                                    Confirm
                                </button>
                            </div>
                        )}

                        <p className="text-xs text-gray-500 mt-2">
                            Select a date at least 24 hours in the past
                        </p>
                    </div>
                )}
            </div>

            {/* Preview */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                <div className="flex items-start space-x-2 sm:space-x-3">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-yellow-800">Warning</p>
                        <p className="text-xs sm:text-sm text-yellow-700 mt-1 wrap-break-word">
                            This will delete all audit logs created before:{" "}
                            <strong className="block sm:inline mt-1 sm:mt-0">{formatDateForDisplay()}</strong>
                        </p>
                    </div>
                </div>
            </div>

            {/* Result Message */}
            {deletionResult && (
                <div
                    className={`rounded-lg p-3 sm:p-4 mb-4 ${deletionResult.success
                            ? "bg-green-50 border border-green-200"
                            : "bg-red-50 border border-red-200"
                        }`}
                >
                    <div className="flex items-start space-x-2 sm:space-x-3">
                        <svg
                            className={`w-4 h-4 sm:w-5 sm:h-5 mt-0.5 shrink-0 ${deletionResult.success ? "text-green-600" : "text-red-600"
                                }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            {deletionResult.success ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            )}
                        </svg>
                        <p
                            className={`text-xs sm:text-sm flex-1 ${deletionResult.success ? "text-green-700" : "text-red-700"
                                }`}
                        >
                            {deletionResult.message}
                        </p>
                    </div>
                </div>
            )}

            {/* Delete Button */}
            <button
                onClick={handleDeleteClick}
                disabled={isDeleting || (selectedOption === "custom" && !customDate)}
                className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:bg-gray-300 text-white font-semibold py-2.5 px-5 rounded-full transition-colors flex items-center justify-center gap-2 touch-manipulation"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="text-sm">{isDeleting ? "Deleting..." : "Delete Audit Logs"}</span>
            </button>

            {/* Confirmation Dialog */}
            {showConfirmDialog && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={() => !isDeleting && setShowConfirmDialog(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Icon */}
                        <div className="flex items-center justify-center w-14 h-14 bg-red-100 rounded-full mx-auto">
                            <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>

                        {/* Text */}
                        <div className="text-center">
                            <h3 className="text-lg font-bold text-gray-900">Confirm Deletion</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Delete all audit logs older than
                            </p>
                            <p className="text-sm font-semibold text-gray-800 mt-0.5">
                                {formatDateForDisplay()}
                            </p>
                            <p className="text-xs text-red-500 font-medium mt-2">This action cannot be undone!</p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmDialog(false)}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2.5 rounded-full bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:bg-gray-300 text-sm font-semibold text-white transition-colors touch-manipulation"
                            >
                                {isDeleting ? "Deleting..." : "Yes, Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
