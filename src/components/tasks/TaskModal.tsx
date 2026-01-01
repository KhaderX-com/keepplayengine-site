"use client";

import { useState, useEffect } from 'react';
import type { Task, TaskStatus, TaskPriority, TaskLabel, TeamMember } from '@/types/tasks';
import { PRIORITY_CONFIG, STATUS_CONFIG } from '@/types/tasks';
import { createTask, updateTask } from '@/lib/tasks';

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    task?: Task | null;
    parentTaskId?: string;
    initialStatus?: TaskStatus;
    members: TeamMember[];
    labels: TaskLabel[];
}

export default function TaskModal({
    isOpen,
    onClose,
    onSave,
    task,
    parentTaskId,
    initialStatus = 'todo',
    members,
    labels,
}: TaskModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<TaskStatus>(initialStatus);
    const [priority, setPriority] = useState<TaskPriority>('medium');
    const [assigneeId, setAssigneeId] = useState<string>('');
    const [dueDate, setDueDate] = useState<string>('');
    const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset form when modal opens/closes or task changes
    useEffect(() => {
        if (isOpen) {
            if (task) {
                setTitle(task.title);
                setDescription(task.description || '');
                setStatus(task.status);
                setPriority(task.priority);
                setAssigneeId(task.assignee_id || '');
                setDueDate(task.due_date ? task.due_date.split('T')[0] : '');
                setSelectedLabels(task.labels?.map(l => l.id) || []);
            } else {
                setTitle('');
                setDescription('');
                setStatus(initialStatus);
                setPriority('medium');
                setAssigneeId('');
                setDueDate('');
                setSelectedLabels([]);
            }
            setError(null);
        }
    }, [isOpen, task, initialStatus]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            setError('Title is required');
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            const data = {
                title: title.trim(),
                description: description.trim() || undefined,
                status,
                priority,
                assignee_id: assigneeId || undefined,
                due_date: dueDate || undefined,
                label_ids: selectedLabels,
                parent_task_id: parentTaskId,
            };

            if (task) {
                await updateTask(task.id, data);
            } else {
                await createTask(data);
            }

            onSave();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save task');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleLabel = (labelId: string) => {
        setSelectedLabels(prev =>
            prev.includes(labelId)
                ? prev.filter(id => id !== labelId)
                : [...prev, labelId]
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
                <div className="relative w-full sm:max-w-lg bg-white dark:bg-gray-900 
                    rounded-t-2xl sm:rounded-2xl shadow-xl transform transition-all
                    max-h-[90vh] sm:max-h-[85vh] flex flex-col">

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b 
                        border-gray-200 dark:border-gray-700 shrink-0">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {task ? 'Edit Task' : parentTaskId ? 'Add Subtask' : 'New Task'}
                        </h2>
                        <button
                            onClick={onClose} aria-label="Close modal" className="p-2 rounded-lg text-gray-400 hover:text-gray-600 
                                hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
                            {/* Error Message */}
                            {error && (
                                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 
                                    text-red-600 dark:text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="What needs to be done?"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 
                                        bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                        focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                        placeholder-gray-400 transition-all text-base"
                                    autoFocus
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Add more details..."
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 
                                        bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                        focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                        placeholder-gray-400 transition-all text-base resize-none"
                                />
                            </div>

                            {/* Status & Priority Row */}
                            <div className="grid grid-cols-2 gap-3">
                                {/* Status */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        Status
                                    </label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value as TaskStatus)}
                                        aria-label="Select task status"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 
                                            bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                            focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                            transition-all text-base appearance-none"
                                    >
                                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                            <option key={key} value={key}>
                                                {config.icon} {config.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Priority */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        Priority
                                    </label>
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value as TaskPriority)}
                                        aria-label="Select task priority"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 
                                            bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                            focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                            transition-all text-base appearance-none"
                                    >
                                        {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                                            <option key={key} value={key}>
                                                {config.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Assignee & Due Date Row */}
                            <div className="grid grid-cols-2 gap-3">
                                {/* Assignee */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        Assignee
                                    </label>
                                    <select
                                        value={assigneeId}
                                        onChange={(e) => setAssigneeId(e.target.value)}
                                        aria-label="Select task assignee"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 
                                            bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                            focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                            transition-all text-base appearance-none"
                                    >
                                        <option value="">Unassigned</option>
                                        {members.map((member) => (
                                            <option key={member.id} value={member.id}>
                                                {member.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Due Date */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        Due Date
                                    </label>
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        aria-label="Select task due date"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 
                                            bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                            focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                            transition-all text-base"
                                    />
                                </div>
                            </div>

                            {/* Labels */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Labels
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {labels.map((label) => (
                                        <button
                                            key={label.id}
                                            type="button"
                                            onClick={() => toggleLabel(label.id)}
                                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium
                                                transition-all touch-manipulation active:scale-95
                                                ${selectedLabels.includes(label.id)
                                                    ? 'ring-2 ring-offset-2 ring-blue-500'
                                                    : 'opacity-60 hover:opacity-100'
                                                }`}
                                            style={{
                                                backgroundColor: `${label.color}20`,
                                                color: label.color,
                                            }}
                                        >
                                            {selectedLabels.includes(label.id) && (
                                                <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                            {label.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 px-4 sm:px-6 py-4 
                            border-t border-gray-200 dark:border-gray-700 shrink-0 bg-gray-50 dark:bg-gray-800/50">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="px-5 py-2.5 rounded-xl text-gray-700 dark:text-gray-300 
                                    font-medium hover:bg-gray-100 dark:hover:bg-gray-800 
                                    transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || !title.trim()}
                                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium
                                    hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                                    transition-all disabled:opacity-50 disabled:cursor-not-allowed
                                    flex items-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Saving...
                                    </>
                                ) : (
                                    task ? 'Save Changes' : 'Create Task'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
