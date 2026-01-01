"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Task, TaskComment, TaskActivityLog, TaskLabel, TeamMember } from '@/types/tasks';
import { PRIORITY_CONFIG, STATUS_CONFIG } from '@/types/tasks';
import { updateTask, deleteTask, addComment } from '@/lib/tasks';
import { AlertDialog } from '@/components/ui/alert-dialog';

interface TaskDetailProps {
    isOpen: boolean;
    onClose: () => void;
    taskId: string | null;
    members: TeamMember[];
    labels: TaskLabel[];
    onUpdate: () => void;
    onEdit: (task: Task) => void;
}

export default function TaskDetail({
    isOpen,
    onClose,
    taskId,
    onUpdate,
    onEdit,
}: TaskDetailProps) {
    const [task, setTask] = useState<Task | null>(null);
    const [comments, setComments] = useState<TaskComment[]>([]);
    const [activities, setActivities] = useState<TaskActivityLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'subtasks' | 'comments' | 'activity'>('subtasks');
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const fetchTaskDetails = useCallback(async () => {
        if (!taskId) return;

        try {
            setLoading(true);
            const res = await fetch(`/api/tasks/${taskId}`);
            if (!res.ok) throw new Error('Failed to fetch task');

            const data = await res.json();
            setTask(data.task);
            setComments(data.comments || []);
            setActivities(data.activities || []);
        } catch (error) {
            console.error('Error fetching task details:', error);
        } finally {
            setLoading(false);
        }
    }, [taskId]);

    useEffect(() => {
        if (isOpen && taskId) {
            fetchTaskDetails();
        }
    }, [isOpen, taskId, fetchTaskDetails]);

    const handleStatusChange = async (newStatus: Task['status']) => {
        if (!task) return;

        try {
            await updateTask(task.id, { status: newStatus });
            setTask({ ...task, status: newStatus });
            onUpdate();
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!task || !newComment.trim()) return;

        try {
            setIsSubmitting(true);
            await addComment(task.id, newComment.trim());
            setNewComment('');
            fetchTaskDetails();
        } catch (error) {
            console.error('Failed to add comment:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = () => {
        setShowDeleteDialog(true);
    };

    const handleDeleteConfirm = async () => {
        if (!task) return;

        try {
            await deleteTask(task.id);
            onUpdate();
            onClose();
        } catch (error) {
            console.error('Failed to delete task:', error);
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatRelativeTime = (date: string) => {
        const now = new Date();
        const d = new Date(date);
        const diff = now.getTime() - d.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return formatDate(date);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Slide-over Panel */}
            <div className="fixed inset-y-0 right-0 flex max-w-full">
                <div className="w-screen max-w-md sm:max-w-lg">
                    <div className="flex h-full flex-col bg-white dark:bg-gray-900 shadow-xl">
                        {loading ? (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
                            </div>
                        ) : task ? (
                            <>
                                {/* Header */}
                                <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0 pr-4">
                                            {/* Status Badge */}
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                                                    ${STATUS_CONFIG[task.status].bgColor} text-white`}>
                                                    <span>{STATUS_CONFIG[task.status].icon}</span>
                                                    {STATUS_CONFIG[task.status].label}
                                                </span>
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                                                    ${PRIORITY_CONFIG[task.priority].bgColor} ${PRIORITY_CONFIG[task.priority].color}`}>
                                                    {PRIORITY_CONFIG[task.priority].label}
                                                </span>
                                            </div>

                                            {/* Title */}
                                            <h2 className={`text-lg font-semibold text-gray-900 dark:text-white
                                                ${task.status === 'done' ? 'line-through opacity-70' : ''}`}>
                                                {task.title}
                                            </h2>
                                        </div>

                                        <button
                                            onClick={onClose}
                                            aria-label="Close task detail"
                                            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 
                                                hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="flex items-center gap-2 mt-4">
                                        <button
                                            onClick={() => onEdit(task)}
                                            className="flex-1 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 
                                                text-blue-600 dark:text-blue-400 font-medium text-sm
                                                hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                        >
                                            Edit
                                        </button>
                                        <select
                                            value={task.status}
                                            onChange={(e) => handleStatusChange(e.target.value as Task['status'])}
                                            aria-label="Change task status"
                                            className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 
                                                bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-medium
                                                focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                                <option key={key} value={key}>
                                                    {config.icon} {config.label}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={handleDeleteClick}
                                            className="p-2 rounded-xl text-red-500 hover:bg-red-50 
                                                dark:hover:bg-red-900/20 transition-colors"
                                            title="Delete task"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto">
                                    {/* Description */}
                                    {task.description && (
                                        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Description</h3>
                                            <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{task.description}</p>
                                        </div>
                                    )}

                                    {/* Meta Info */}
                                    <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
                                        {/* Assignee */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-500 dark:text-gray-400">Assignee</span>
                                            <div className="flex items-center gap-2">
                                                {task.assignee ? (
                                                    <>
                                                        <div
                                                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                                                            style={{ backgroundColor: task.assignee.color }}
                                                        >
                                                            {task.assignee.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {task.assignee.name}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-sm text-gray-400">Unassigned</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Due Date */}
                                        {task.due_date && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-500 dark:text-gray-400">Due Date</span>
                                                <span className={`text-sm font-medium
                                                    ${new Date(task.due_date) < new Date() && task.status !== 'done'
                                                        ? 'text-red-500'
                                                        : 'text-gray-900 dark:text-white'
                                                    }`}>
                                                    {new Date(task.due_date).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                    })}
                                                </span>
                                            </div>
                                        )}

                                        {/* Labels */}
                                        {task.labels && task.labels.length > 0 && (
                                            <div className="flex items-start justify-between">
                                                <span className="text-sm text-gray-500 dark:text-gray-400">Labels</span>
                                                <div className="flex flex-wrap gap-1.5 justify-end max-w-[60%]">
                                                    {task.labels.map((label) => (
                                                        <span
                                                            key={label.id}
                                                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                                                            style={{
                                                                backgroundColor: `${label.color}20`,
                                                                color: label.color,
                                                            }}
                                                        >
                                                            {label.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Created */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-500 dark:text-gray-400">Created</span>
                                            <span className="text-sm text-gray-900 dark:text-white">
                                                {formatRelativeTime(task.created_at)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Tabs */}
                                    <div className="border-b border-gray-200 dark:border-gray-700">
                                        <nav className="flex px-4 sm:px-6 -mb-px">
                                            {[
                                                { key: 'subtasks', label: 'Subtasks', count: task.subtask_count },
                                                { key: 'comments', label: 'Comments', count: comments.length },
                                                { key: 'activity', label: 'Activity', count: activities.length },
                                            ].map((tab) => (
                                                <button
                                                    key={tab.key}
                                                    onClick={() => setActiveTab(tab.key as typeof activeTab)}
                                                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors
                                                        ${activeTab === tab.key
                                                            ? 'border-blue-500 text-blue-600'
                                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                        }`}
                                                >
                                                    {tab.label}
                                                    {tab.count !== undefined && tab.count > 0 && (
                                                        <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-xs">
                                                            {tab.count}
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                        </nav>
                                    </div>

                                    {/* Tab Content */}
                                    <div className="px-4 sm:px-6 py-4">
                                        {activeTab === 'subtasks' && (
                                            <div className="space-y-2">
                                                {task.subtasks && task.subtasks.length > 0 ? (
                                                    task.subtasks.map((subtask) => (
                                                        <div
                                                            key={subtask.id}
                                                            className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                                                        >
                                                            <button
                                                                onClick={() => {
                                                                    const newStatus = subtask.status === 'done' ? 'todo' : 'done';
                                                                    updateTask(subtask.id, { status: newStatus })
                                                                        .then(fetchTaskDetails);
                                                                }}
                                                                className={`w-5 h-5 rounded border-2 flex items-center justify-center
                                                                    ${subtask.status === 'done'
                                                                        ? 'bg-green-500 border-green-500 text-white'
                                                                        : 'border-gray-300 dark:border-gray-600'
                                                                    }`}
                                                            >
                                                                {subtask.status === 'done' && (
                                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                    </svg>
                                                                )}
                                                            </button>
                                                            <span className={`flex-1 text-sm ${subtask.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                                                                {subtask.title}
                                                            </span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                                        No subtasks yet
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {activeTab === 'comments' && (
                                            <div className="space-y-4">
                                                {/* Comment Form */}
                                                <form onSubmit={handleAddComment} className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={newComment}
                                                        onChange={(e) => setNewComment(e.target.value)}
                                                        placeholder="Add a comment..."
                                                        className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 
                                                            bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm
                                                            focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                    <button
                                                        type="submit"
                                                        disabled={!newComment.trim() || isSubmitting}
                                                        className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium
                                                            hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Send
                                                    </button>
                                                </form>

                                                {/* Comments List */}
                                                {comments.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {comments.map((comment) => (
                                                            <div key={comment.id} className="flex gap-3">
                                                                <div
                                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0"
                                                                    style={{ backgroundColor: comment.author?.color || '#6B7280' }}
                                                                >
                                                                    {comment.author?.name?.charAt(0).toUpperCase() || '?'}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                                            {comment.author?.name || 'Unknown'}
                                                                        </span>
                                                                        <span className="text-xs text-gray-400">
                                                                            {formatRelativeTime(comment.created_at)}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                                        No comments yet
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {activeTab === 'activity' && (
                                            <div className="space-y-3">
                                                {activities.length > 0 ? (
                                                    activities.map((activity) => (
                                                        <div key={activity.id} className="flex gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 
                                                                flex items-center justify-center shrink-0">
                                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                                        {activity.actor?.name || 'Someone'}
                                                                    </span>
                                                                    {' '}
                                                                    {activity.action === 'created' && 'created this task'}
                                                                    {activity.action === 'status_changed' && (
                                                                        <>changed status from <span className="font-medium">{activity.old_value}</span> to <span className="font-medium">{activity.new_value}</span></>
                                                                    )}
                                                                    {activity.action === 'updated' && (
                                                                        <>updated {activity.field_changed}</>
                                                                    )}
                                                                    {activity.action === 'commented' && 'added a comment'}
                                                                </p>
                                                                <span className="text-xs text-gray-400">
                                                                    {formatRelativeTime(activity.created_at)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                                        No activity yet
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center">
                                <p className="text-gray-500 dark:text-gray-400">Task not found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <AlertDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                title="Delete Task"
                description={task ? `Are you sure you want to delete "${task.title}"? This action cannot be undone and will permanently remove the task and all its associated data including comments, subtasks, and activity history.` : "Are you sure you want to delete this task?"}
                onConfirm={handleDeleteConfirm}
                confirmText="Delete Task"
                cancelText="Cancel"
                variant="danger"
            />
        </div>
    );
}
