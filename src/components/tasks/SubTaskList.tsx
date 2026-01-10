"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { Task, TeamMember } from '@/types/tasks';
import { PRIORITY_CONFIG, STATUS_CONFIG } from '@/types/tasks';
import { Check, Clock, User } from 'lucide-react';

interface SubTaskListProps {
    subtasks: Task[];
    members: TeamMember[];
    onSubTaskClick: (task: Task) => void;
    onUpdate?: () => void;
    onSubtaskUpdate?: (updatedSubtask: Task) => void;
    onSubtaskDelete?: (deletedSubtaskId: string) => void;
    parentTaskId: string;
    allowDelete?: boolean;
}

export default function SubTaskList({
    subtasks,
    members,
    onSubTaskClick,
    onUpdate,
    onSubtaskUpdate,
    onSubtaskDelete,
    parentTaskId: _parentTaskId,
    allowDelete = true,
}: SubTaskListProps) {
    const [localSubtasks, setLocalSubtasks] = useState<Task[]>(subtasks);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Reserved for future enhancements (optimistic refresh, nested operations)
    void _parentTaskId;

    // Update local state when props change
    useEffect(() => {
        setLocalSubtasks(subtasks);
    }, [subtasks]);

    if (!localSubtasks || localSubtasks.length === 0) {
        return null;
    }

    const handleCheckboxClick = async (e: React.MouseEvent, subtask: Task) => {
        e.stopPropagation(); // Prevent opening detail panel

        const newStatus: Task['status'] = subtask.status === 'done' ? 'todo' : 'done';
        const updatedSubtask: Task = { ...subtask, status: newStatus };

        // Optimistic update - update UI immediately
        setLocalSubtasks(prev =>
            prev.map(st =>
                st.id === subtask.id
                    ? updatedSubtask
                    : st
            )
        );

        // Notify parent component immediately for optimistic update
        if (onSubtaskUpdate) {
            onSubtaskUpdate(updatedSubtask);
        }

        try {
            const response = await fetch(`/api/tasks/${subtask.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: newStatus,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to update task status');
            }

            // Only call onUpdate if no optimistic update callback is provided (backward compatibility)
            if (!onSubtaskUpdate && onUpdate) {
                onUpdate();
            }
        } catch (error) {
            console.error('Error updating subtask status:', error);
            // Revert on error
            setLocalSubtasks(subtasks);
            // Revert parent state as well
            if (onSubtaskUpdate) {
                onSubtaskUpdate(subtask);
            }
        }
    };

    const handleDeleteSubtask = async (e: React.MouseEvent, subtask: Task) => {
        e.stopPropagation(); // Prevent opening detail panel

        if (!allowDelete) return;

        // Confirm deletion
        if (!confirm(`Are you sure you want to delete the subtask "${subtask.title}"?`)) {
            return;
        }

        try {
            setDeletingId(subtask.id);

            const response = await fetch(`/api/tasks/${subtask.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete subtask');
            }

            // Remove from local state
            setLocalSubtasks(prev => prev.filter(st => st.id !== subtask.id));

            // Notify parent component for optimistic update
            if (onSubtaskDelete) {
                onSubtaskDelete(subtask.id);
            }

            // Only call onUpdate if no optimistic delete callback is provided (backward compatibility)
            if (!onSubtaskDelete && onUpdate) {
                onUpdate();
            }
        } catch (error) {
            console.error('Error deleting subtask:', error);
            alert('Failed to delete subtask. Please try again.');
        } finally {
            setDeletingId(null);
        }
    };

    const completedCount = localSubtasks.filter(st => st.status === 'done').length;
    const progressPercentage = (completedCount / localSubtasks.length) * 100;

    return (
        <div className="mt-4 space-y-3">
            {/* Progress indicator */}
            <div className="flex items-center gap-3 px-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-linear-to-br from-green-500 to-green-600 text-white shadow-sm">
                        {completedCount}
                    </div>
                    <span className="text-gray-500 dark:text-gray-400">/</span>
                    <span className="text-gray-600 dark:text-gray-300">{subtasks.length}</span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs">subtasks</span>
                </div>

                <progress
                    value={completedCount}
                    max={localSubtasks.length}
                    aria-label="Subtask completion"
                    className="flex-1 h-2 rounded-full overflow-hidden
                        bg-gray-200 dark:bg-gray-700
                        [&::-webkit-progress-bar]:bg-gray-200 dark:[&::-webkit-progress-bar]:bg-gray-700
                        [&::-webkit-progress-value]:bg-green-500 dark:[&::-webkit-progress-value]:bg-green-500
                        [&::-moz-progress-bar]:bg-green-500"
                />

                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-12 text-right">
                    {Math.round(progressPercentage)}%
                </span>
            </div>

            {/* Subtask list */}
            <div className="space-y-2">
                {localSubtasks.map((subtask) => {
                    const assignee = subtask.assignee || members.find(m => m.id === subtask.assignee_id);
                    const priorityConfig = PRIORITY_CONFIG[subtask.priority];
                    const statusConfig = STATUS_CONFIG[subtask.status];
                    const isCompleted = subtask.status === 'done';
                    const isOverdue = subtask.due_date &&
                        new Date(subtask.due_date) < new Date() &&
                        !isCompleted;

                    return (
                        <div
                            key={subtask.id}
                            className={`
                                group p-3 rounded-lg border transition-colors duration-200
                                ${isCompleted
                                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                                    : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                                }
                                ${deletingId === subtask.id ? 'opacity-50 pointer-events-none' : ''}
                            `}
                        >
                            <div className="flex items-start gap-3">
                                {/* Green checkbox */}
                                <div
                                    onClick={(e) => handleCheckboxClick(e, subtask)}
                                    className={`
                                        shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-200 cursor-pointer
                                        ${isCompleted
                                            ? 'bg-green-100 border-green-500 dark:bg-green-500/30 dark:border-green-500'
                                            : 'bg-white border-gray-300 dark:bg-gray-700 dark:border-gray-600'
                                        }
                                    `}
                                >
                                    {isCompleted && (
                                        <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onSubTaskClick(subtask)}>
                                    <div className="flex items-start gap-2 mb-2 min-w-0">
                                        <h4 className={`
                                            flex-1 min-w-0 font-medium text-sm leading-snug wrap-break-word
                                            ${isCompleted
                                                ? 'text-gray-500 dark:text-gray-400 line-through'
                                                : 'text-gray-900 dark:text-gray-100'
                                            }
                                        `}>
                                            {subtask.title}
                                        </h4>

                                        {/* Priority badge */}
                                        <span
                                            className={`
                                                ml-auto shrink-0 px-2 py-0.5 rounded text-xs font-semibold uppercase whitespace-nowrap
                                                ${priorityConfig.className}
                                            `}
                                        >
                                            {priorityConfig.label}
                                        </span>
                                    </div>

                                    {/* Description */}
                                    {subtask.description && (
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                                            {subtask.description}
                                        </p>
                                    )}

                                    {/* Meta information */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {/* Status badge */}
                                        <div className={`
                                            flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium
                                            ${statusConfig.className}
                                        `}>
                                            {statusConfig.label}
                                        </div>

                                        {/* Assignee */}
                                        {assignee && (
                                            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700">
                                                {assignee.avatar_url ? (
                                                    <Image
                                                        src={assignee.avatar_url}
                                                        alt={assignee.name}
                                                        width={14}
                                                        height={14}
                                                        className="w-3.5 h-3.5 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <User className="w-3 h-3 text-gray-500" />
                                                )}
                                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                    {assignee.name}
                                                </span>
                                            </div>
                                        )}

                                        {/* Due date */}
                                        {subtask.due_date && (
                                            <div className={`
                                                flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium
                                                ${isOverdue
                                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                }
                                            `}>
                                                <Clock className="w-3 h-3" />
                                                {new Date(subtask.due_date).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Delete Button - Only show if allowed and on hover */}
                                {allowDelete && (
                                    <button
                                        onClick={(e) => handleDeleteSubtask(e, subtask)}
                                        disabled={deletingId === subtask.id}
                                        className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 
                                            dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100
                                            disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Delete subtask"
                                        aria-label="Delete subtask"
                                    >
                                        {deletingId === subtask.id ? (
                                            <div className="animate-spin w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full" />
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
