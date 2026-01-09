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

    // Only show for SUPER_ADMIN
    if (userRole !== "SUPER_ADMIN") {
        return null;
    }

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
                    className="w-full sm:w-auto px-4 py-2.5 sm:px-6 sm:py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center sm:justify-start space-x-2 shadow-sm hover:shadow-md group"
                >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span className="text-sm sm:text-base">Delete Old Audit Logs</span>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        );
    }

    // Expanded state - full management interface
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4">
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors"
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

                {/* Custom Date Input */}
                {selectedOption === "custom" && (
                    <div className="ml-0 sm:ml-7 mt-2">
                        <input
                            type="datetime-local"
                            value={customDate}
                            onChange={(e) => setCustomDate(e.target.value)}
                            max={new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 16)}
                            aria-label="Select custom date for audit log deletion"
                            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
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
                        <p className="text-xs sm:text-sm text-yellow-700 mt-1 break-words">
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
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-2.5 sm:py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 touch-manipulation active:scale-95"
            >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="text-sm sm:text-base">{isDeleting ? "Deleting..." : "Delete Audit Logs"}</span>
            </button>

            {/* Confirmation Dialog */}
            {showConfirmDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 mx-4">
                        <div className="flex items-start space-x-3 sm:space-x-4">
                            <div className="shrink-0">
                                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                                    Confirm Deletion
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 break-words">
                                    Are you sure you want to delete all audit logs older than{" "}
                                    <strong className="text-gray-900 block sm:inline mt-1 sm:mt-0">{formatDateForDisplay()}</strong>?
                                </p>
                                <p className="text-xs sm:text-sm text-red-600 font-medium mb-4 sm:mb-6">
                                    This action cannot be undone!
                                </p>

                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                    <button
                                        onClick={() => setShowConfirmDialog(false)}
                                        disabled={isDeleting}
                                        className="flex-1 px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors duration-200 text-sm touch-manipulation active:scale-95 order-2 sm:order-1"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleConfirmDelete}
                                        disabled={isDeleting}
                                        className="flex-1 px-4 py-2.5 sm:py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200 text-sm touch-manipulation active:scale-95 order-1 sm:order-2"
                                    >
                                        {isDeleting ? "Deleting..." : "Yes, Delete"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
