"use client";

import { useState, useEffect, useCallback } from 'react';
import type { AdminUserBasic, NotificationType, NotificationPriority } from '@/types/notifications';

interface SendNotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    preSelectedRecipient?: AdminUserBasic;
}

export default function SendNotificationModal({
    isOpen,
    onClose,
    onSuccess,
    preSelectedRecipient
}: SendNotificationModalProps) {
    const [recipients, setRecipients] = useState<AdminUserBasic[]>([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Form state
    const [selectedRecipient, setSelectedRecipient] = useState<string>(preSelectedRecipient?.email || '');
    const [notificationType, setNotificationType] = useState<NotificationType>('direct_message');
    const [priority, setPriority] = useState<NotificationPriority>('normal');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');

    // Fetch recipients
    const fetchRecipients = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/notifications/recipients');
            if (response.ok) {
                const data = await response.json();
                setRecipients(data.recipients);
            }
        } catch (err) {
            console.error('Error fetching recipients:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchRecipients();
            setError(null);
            setSuccess(false);
        }
    }, [isOpen, fetchRecipients]);

    useEffect(() => {
        if (preSelectedRecipient) {
            setSelectedRecipient(preSelectedRecipient.email);
        }
    }, [preSelectedRecipient]);

    // Send notification
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSending(true);

        try {
            const response = await fetch('/api/notifications/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipient_email: selectedRecipient,
                    type: notificationType,
                    title,
                    message,
                    priority
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send notification');
            }

            setSuccess(true);
            onSuccess?.();

            // Reset form after success
            setTimeout(() => {
                setTitle('');
                setMessage('');
                setSelectedRecipient(preSelectedRecipient?.email || '');
                setNotificationType('direct_message');
                setPriority('normal');
                setSuccess(false);
                onClose();
            }, 1500);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setSending(false);
        }
    };

    if (!isOpen) return null;

    const selectedRecipientData = recipients.find(r => r.email === selectedRecipient);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Send Notification</h2>
                            <p className="text-sm text-gray-500">Notify your team member</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Close modal"
                        aria-label="Close modal"
                    >
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Success Message */}
                    {success && (
                        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-green-800">Notification sent!</p>
                                <p className="text-sm text-green-600">Your message has been delivered.</p>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}

                    {/* Recipient Selection */}
                    <div>
                        <label htmlFor="recipient-select" className="block text-sm font-medium text-gray-700 mb-2">
                            Send to
                        </label>
                        {loading ? (
                            <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
                        ) : (
                            <div className="relative">
                                <select
                                    id="recipient-select"
                                    value={selectedRecipient}
                                    onChange={(e) => setSelectedRecipient(e.target.value)}
                                    required
                                    aria-label="Select recipient"
                                    className="w-full h-12 px-4 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
                                >
                                    <option value="">Select a team member...</option>
                                    {recipients.map((recipient) => (
                                        <option key={recipient.id} value={recipient.email}>
                                            {recipient.full_name || recipient.email} ({recipient.role})
                                        </option>
                                    ))}
                                </select>
                                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        )}
                        {selectedRecipientData && (
                            <div className="flex items-center gap-2 mt-2 p-2 bg-blue-50 rounded-lg">
                                <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-sm font-semibold text-blue-700">
                                    {(selectedRecipientData.full_name || selectedRecipientData.email)[0].toUpperCase()}
                                </div>
                                <div className="text-sm">
                                    <p className="font-medium text-blue-900">{selectedRecipientData.full_name || 'No name'}</p>
                                    <p className="text-blue-600">{selectedRecipientData.email}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Type & Priority Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="notification-type" className="block text-sm font-medium text-gray-700 mb-2">
                                Type
                            </label>
                            <select
                                id="notification-type"
                                value={notificationType}
                                onChange={(e) => setNotificationType(e.target.value as NotificationType)}
                                aria-label="Notification type"
                                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="direct_message">💬 Direct Message</option>
                                <option value="announcement">📢 Announcement</option>
                                <option value="reminder">⏰ Reminder</option>
                                <option value="task_assigned">📋 Task Assignment</option>
                                <option value="approval_request">🔐 Approval Request</option>
                                <option value="system_alert">⚠️ System Alert</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="notification-priority" className="block text-sm font-medium text-gray-700 mb-2">
                                Priority
                            </label>
                            <select
                                id="notification-priority"
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as NotificationPriority)}
                                aria-label="Notification priority"
                                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="low">Low</option>
                                <option value="normal">Normal</option>
                                <option value="high">⚡ High</option>
                                <option value="urgent">🔥 Urgent</option>
                            </select>
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            placeholder="Enter a concise title..."
                            className="w-full h-10 px-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Message */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Message
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            required
                            placeholder="Write your notification message..."
                            rows={4}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={sending || !selectedRecipient || !title || !message}
                            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {sending ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                    Send Notification
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
