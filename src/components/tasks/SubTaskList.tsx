"use client";

import { useState, useEffect } from 'react';
import type { Task, TeamMember } from '@/types/tasks';
import { PRIORITY_CONFIG, STATUS_CONFIG } from '@/types/tasks';
import { Check, Clock, User } from 'lucide-react';

interface SubTaskListProps {
    subtasks: Task[];
    members: TeamMember[];
    onSubTaskClick: (task: Task) => void;
    onUpdate: () => void;
    parentTaskId: string;
}

export default function SubTaskList({
    subtasks,
    members,
    onSubTaskClick,
    onUpdate,
    parentTaskId
}: SubTaskListProps) {
    const [localSubtasks, setLocalSubtasks] = useState<Task[]>(subtasks);

    // Update local state when props change
    useEffect(() => {
        setLocalSubtasks(subtasks);
    }, [subtasks]);

    if (!localSubtasks || localSubtasks.length === 0) {
        return null;
    }

    const handleCheckboxClick = async (e: React.MouseEvent, subtask: Task) => {
        e.stopPropagation(); // Prevent opening detail panel

        const newStatus = subtask.status === 'done' ? 'todo' : 'done';

        // Optimistic update - update UI immediately
        setLocalSubtasks(prev =>
            prev.map(st =>
                st.id === subtask.id
                    ? { ...st, status: newStatus }
                    : st
            )
        );

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
                // Revert on error
                setLocalSubtasks(subtasks);
            }
        } catch (error) {
            console.error('Error updating subtask status:', error);
            // Revert on error
            setLocalSubtasks(subtasks);
        }
    };

    const completedCount = localSubtasks.filter(st => st.status === 'done').length;
    const progressPercentage = (completedCount / localSubtasks.length) * 100;

    return (
        <div className="mt-4 space-y-3">
            {/* Progress indicator */}
            <div className="flex items-center gap-3 px-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-green-500 to-green-600 text-white shadow-sm">
                        {completedCount}
                    </div>
                    <span className="text-gray-500 dark:text-gray-400">/</span>
                    <span className="text-gray-600 dark:text-gray-300">{subtasks.length}</span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs">subtasks</span>
                </div>

                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-green-500 transition-all duration-500 ease-out rounded-full"
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>

                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-[3rem] text-right">
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
                                p-3 rounded-lg border transition-colors duration-200
                                ${isCompleted
                                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                                    : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                                }
                            `}
                        >
                            <div className="flex items-start gap-3">
                                {/* Green checkbox */}
                                <div
                                    onClick={(e) => handleCheckboxClick(e, subtask)}
                                    className={`
                                        flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-200 cursor-pointer
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
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <h4 className={`
                                            font-medium text-sm leading-snug
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
                                                flex-shrink-0 px-2 py-0.5 rounded text-xs font-semibold uppercase
                                                ${priorityConfig.className}
                                            `}
                                        >
                                            {subtask.priority}
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
                                                    <img
                                                        src={assignee.avatar_url}
                                                        alt={assignee.name}
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
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
