"use client";

import { useState, useEffect } from 'react';
import type { Task, TaskStatus, TaskPriority, TaskLabel, TeamMember } from '@/types/tasks';
import { PRIORITY_CONFIG, STATUS_CONFIG } from '@/types/tasks';
import { createTask, updateTask } from '@/lib/tasks';
import ColorPicker from './ColorPicker';

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
    const [color, setColor] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Subtasks state
    const [subtasks, setSubtasks] = useState<{ id?: string; title: string; priority: TaskPriority; isExisting?: boolean }[]>([]);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

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
                setColor(task.color || null);
                // Load existing subtasks when editing
                setSubtasks(
                    task.subtasks?.map(st => ({
                        id: st.id,
                        title: st.title,
                        priority: st.priority,
                        isExisting: true,
                    })) || []
                );
            } else {
                setTitle('');
                setDescription('');
                setStatus(initialStatus);
                setPriority('medium');
                setAssigneeId('');
                setDueDate('');
                setSelectedLabels([]);
                setColor(null);
                setSubtasks([]);
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

            // Handle "both" assignee by sending both IDs
            let assigneeIds: string[] | undefined;
            if (assigneeId === 'both') {
                const khaderMember = members.find(m => m.name === 'Khader');
                const amroMember = members.find(m => m.name === 'Amro');
                if (khaderMember && amroMember) {
                    assigneeIds = [khaderMember.id, amroMember.id];
                }
            } else if (assigneeId) {
                assigneeIds = [assigneeId];
            }

            const data = {
                title: title.trim(),
                description: description.trim() || undefined,
                status,
                priority,
                assignee_id: assigneeId && assigneeId !== 'both' ? assigneeId : undefined,
                assignee_ids: assigneeIds,
                due_date: dueDate || undefined,
                color: color || undefined,
                label_ids: selectedLabels,
                parent_task_id: parentTaskId,
            };

            let taskId: string;

            if (task) {
                await updateTask(task.id, data);
                taskId = task.id;
            } else {
                const createdTask = await createTask(data);
                taskId = createdTask.id;
            }

            // Create ONLY NEW subtasks (not existing ones) to prevent duplication
            const newSubtasks = subtasks.filter(st => !st.isExisting);
            if (newSubtasks.length > 0 && taskId) {
                for (const subtask of newSubtasks) {
                    await createTask({
                        title: subtask.title,
                        priority: subtask.priority,
                        status: 'todo',
                        parent_task_id: taskId,
                    });
                }
            }

            onSave();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save task');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddSubtask = () => {
        if (newSubtaskTitle.trim()) {
            setSubtasks([...subtasks, { title: newSubtaskTitle.trim(), priority: 'medium', isExisting: false }]);
            setNewSubtaskTitle('');
        }
    };

    const handleRemoveSubtask = (index: number) => {
        setSubtasks(subtasks.filter((_, i) => i !== index));
    };

    const handleSubtaskPriorityChange = (index: number, priority: TaskPriority) => {
        const updated = [...subtasks];
        updated[index].priority = priority;
        setSubtasks(updated);
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
                    <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b 
                        border-gray-200 dark:border-gray-700 shrink-0 sticky top-0 bg-white dark:bg-gray-900 z-10">
                        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                            {task ? 'Edit Task' : parentTaskId ? 'Add Subtask' : 'New Task'}
                        </h2>
                        <button
                            onClick={onClose}
                            aria-label="Close modal"
                            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 
                                hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-manipulation active:scale-95"
                        >
                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4">
                            {/* Error Message */}
                            {error && (
                                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 
                                    text-red-600 dark:text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Title */}
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="What needs to be done?"
                                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-gray-300 dark:border-gray-600 
                                        bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm sm:text-base
                                        placeholder-gray-400 dark:placeholder-gray-500
                                        focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                        transition-colors touch-manipulation"
                                    required
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
                                        {!task && <option value="both">Both Khader & Amro</option>}
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

                            {/* Task Color */}
                            <div>
                                <ColorPicker
                                    value={color}
                                    onChange={setColor}
                                    label="Task Color"
                                    showLabel={true}
                                />
                            </div>

                            {/* Subtasks Section - Only show when NOT editing a subtask */}
                            {!parentTaskId && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Subtasks
                                    </label>

                                    {/* Add subtask input */}
                                    <div className="flex gap-2 mb-3">
                                        <input
                                            type="text"
                                            value={newSubtaskTitle}
                                            onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddSubtask();
                                                }
                                            }}
                                            placeholder="Add a subtask..."
                                            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 
                                                bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm
                                                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                                placeholder-gray-400 transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddSubtask}
                                            disabled={!newSubtaskTitle.trim()}
                                            className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium
                                                hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                                                flex items-center gap-2 shrink-0"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            Add
                                        </button>
                                    </div>

                                    {/* Subtasks list */}
                                    {subtasks.length > 0 && (
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {subtasks.map((subtask, index) => (
                                                <div
                                                    key={subtask.id || index}
                                                    className={`flex items-center gap-2 p-3 rounded-xl group
                                                        ${subtask.isExisting
                                                            ? 'bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800'
                                                            : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700'
                                                        }`}
                                                >
                                                    {subtask.isExisting && (
                                                        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 shrink-0" title="Existing subtask">
                                                            <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                            {subtask.title}
                                                        </p>
                                                        {subtask.isExisting && (
                                                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                                                                Already exists - edit in task detail
                                                            </p>
                                                        )}
                                                    </div>

                                                    {!subtask.isExisting && (
                                                        <>
                                                            <select
                                                                value={subtask.priority}
                                                                onChange={(e) => handleSubtaskPriorityChange(index, e.target.value as TaskPriority)}
                                                                aria-label="Select subtask priority"
                                                                className="px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-600 
                                                                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs
                                                                    focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            >
                                                                {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                                                                    <option key={key} value={key}>
                                                                        {config.label}
                                                                    </option>
                                                                ))}
                                                            </select>

                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveSubtask(index)}
                                                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 
                                                                    dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
                                                                title="Remove subtask"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {subtasks.length === 0 && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                            No subtasks added yet. Add subtasks to break down this task into smaller steps.
                                        </p>
                                    )}
                                </div>
                            )}

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
