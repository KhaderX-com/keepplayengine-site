"use client";

import { useState } from 'react';
import Image from 'next/image';
import type { Task, TaskStatus, TeamMember } from '@/types/tasks';
import { PRIORITY_CONFIG } from '@/types/tasks';
import { updateTask, deleteTask } from '@/lib/tasks';
import { AlertDialog } from '@/components/ui/alert-dialog';

interface TaskCardProps {
    task: Task;
    members: TeamMember[];
    onUpdate: () => void;
    onOpenDetail: (task: Task) => void;
    isDragging?: boolean;
}

export default function TaskCard({
    task,
    members,
    onUpdate,
    onOpenDetail,
    isDragging = false
}: TaskCardProps) {
    const [isUpdating, setIsUpdating] = useState(false);
    const [showQuickActions, setShowQuickActions] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const priorityConfig = PRIORITY_CONFIG[task.priority];
    const assignee = task.assignee || members.find(m => m.id === task.assignee_id);

    const isOverdue = task.due_date &&
        new Date(task.due_date) < new Date() &&
        task.status !== 'done';

    const handleStatusChange = async (newStatus: TaskStatus) => {
        try {
            setIsUpdating(true);
            await updateTask(task.id, { status: newStatus });
            onUpdate();
        } catch (error) {
            console.error('Failed to update status:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteClick = () => {
        setShowDeleteDialog(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            setIsUpdating(true);
            await deleteTask(task.id);
            onUpdate();
        } catch (error) {
            console.error('Failed to delete task:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    const formatDueDate = (date: string) => {
        const d = new Date(date);
        const now = new Date();
        const diff = d.getTime() - now.getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Today';
        if (days === 1) return 'Tomorrow';
        if (days === -1) return 'Yesterday';
        if (days < -1) return `${Math.abs(days)} days ago`;
        if (days < 7) return `In ${days} days`;

        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div
            className={`group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 
                p-3 sm:p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer
                ${isDragging ? 'opacity-50 rotate-2 scale-105' : ''}
                ${isUpdating ? 'opacity-70 pointer-events-none' : ''}
                touch-manipulation active:scale-[0.98]`}
            onClick={() => onOpenDetail(task)}
            onMouseEnter={() => setShowQuickActions(true)}
            onMouseLeave={() => setShowQuickActions(false)}
        >
            {/* Header: Priority & Quick Actions */}
            <div className="flex items-start justify-between gap-2 mb-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                    ${priorityConfig.bgColor} ${priorityConfig.color}`}>
                    {priorityConfig.label}
                </span>

                {/* Quick Actions - Desktop */}
                <div className={`hidden sm:flex items-center gap-1 transition-opacity duration-200
                    ${showQuickActions ? 'opacity-100' : 'opacity-0'}`}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick();
                        }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 
                            dark:hover:bg-red-900/20 transition-colors"
                        title="Delete task"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>

                {/* Mobile: Three dot menu */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowQuickActions(!showQuickActions);
                    }}
                    title="Task actions"
                    className="sm:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 
                        hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                </button>
            </div>

            {/* Title */}
            <h3 className={`font-medium text-gray-900 dark:text-white text-sm sm:text-base mb-2 line-clamp-2
                ${task.status === 'done' ? 'line-through text-gray-500' : ''}`}>
                {task.title}
            </h3>

            {/* Description Preview */}
            {task.description && (
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                    {task.description}
                </p>
            )}

            {/* Labels */}
            {task.labels && task.labels.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                    {task.labels.slice(0, 3).map((label) => (
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
                    {task.labels.length > 3 && (
                        <span className="text-xs text-gray-400">
                            +{task.labels.length - 3}
                        </span>
                    )}
                </div>
            )}

            {/* Subtasks Progress */}
            {task.subtask_count !== undefined && task.subtask_count > 0 && (
                <div className="mb-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        <span>{task.completed_subtask_count}/{task.subtask_count} subtasks</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-300"
                            style={{
                                width: `${(task.completed_subtask_count! / task.subtask_count) * 100}%`
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Footer: Assignee & Due Date */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                {/* Assignee */}
                <div className="flex items-center gap-2">
                    {assignee ? (
                        <>
                            <div
                                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-white text-xs font-medium"
                                style={{ backgroundColor: assignee.color }}
                                title={assignee.name}
                            >
                                {assignee.avatar_url ? (
                                    <Image
                                        src={assignee.avatar_url}
                                        alt={assignee.name}
                                        width={28}
                                        height={28}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    assignee.name.charAt(0).toUpperCase()
                                )}
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                                {assignee.name}
                            </span>
                        </>
                    ) : (
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-200 dark:bg-gray-700 
                            flex items-center justify-center text-gray-400"
                            title="Unassigned"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                    )}
                </div>

                {/* Due Date */}
                {task.due_date && (
                    <div className={`flex items-center gap-1 text-xs
                        ${isOverdue ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{formatDueDate(task.due_date)}</span>
                    </div>
                )}
            </div>

            {/* Mobile Quick Actions Dropdown */}
            {showQuickActions && (
                <div className="sm:hidden absolute right-2 top-12 z-10 bg-white dark:bg-gray-800 
                    rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-35"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={() => {
                            handleStatusChange('todo');
                            setShowQuickActions(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 
                            hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                        <span className="text-gray-400">○</span> To Do
                    </button>
                    <button
                        onClick={() => {
                            handleStatusChange('in_progress');
                            setShowQuickActions(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 
                            hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                        <span className="text-blue-500">◐</span> In Progress
                    </button>
                    <button
                        onClick={() => {
                            handleStatusChange('done');
                            setShowQuickActions(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 
                            hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                        <span className="text-green-500">●</span> Done
                    </button>
                    <hr className="my-1 border-gray-200 dark:border-gray-700" />
                    <button
                        onClick={() => {
                            handleDeleteClick();
                            setShowQuickActions(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-500 
                            hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                    </button>
                </div>
            )}

            <AlertDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                title="Delete Task"
                description={`Are you sure you want to delete "${task.title}"? This action cannot be undone and will permanently remove the task and all its associated data.`}
                onConfirm={handleDeleteConfirm}
                confirmText="Delete Task"
                cancelText="Cancel"
                variant="danger"
            />
        </div>
    );
}
