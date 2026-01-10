"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { Task, TaskStatus, TeamMember } from '@/types/tasks';
import { PRIORITY_CONFIG } from '@/types/tasks';
import { updateTask } from '@/lib/tasks';
import SubTaskList from './SubTaskList';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface TaskCardProps {
    task: Task;
    members: TeamMember[];
    onUpdate: () => void;
    onOpenDetail: (task: Task) => void;
    onSubtaskUpdate?: (parentTaskId: string, updatedSubtask: Task) => void;
    onSubtaskDelete?: (parentTaskId: string, deletedSubtaskId: string) => void;
    isDragging?: boolean;
}

export default function TaskCard({
    task,
    members,
    onUpdate,
    onOpenDetail,
    onSubtaskUpdate,
    onSubtaskDelete,
    isDragging = false
}: TaskCardProps) {
    const [isUpdating, setIsUpdating] = useState(false);
    const [showQuickActions, setShowQuickActions] = useState(false);
    const [showSubtasks, setShowSubtasks] = useState(true);

    // Load subtask visibility preference from localStorage
    useEffect(() => {
        const savedPreference = localStorage.getItem(`task-${task.id}-subtasks-visible`);
        if (savedPreference !== null) {
            setShowSubtasks(savedPreference === 'true');
        }
    }, [task.id]);

    const toggleSubtasks = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newState = !showSubtasks;
        setShowSubtasks(newState);
        localStorage.setItem(`task-${task.id}-subtasks-visible`, String(newState));
    };

    const priorityConfig = PRIORITY_CONFIG[task.priority];

    // Support multiple assignees
    const assignees = task.assignees && task.assignees.length > 0
        ? task.assignees
        : task.assignee
            ? [task.assignee]
            : task.assignee_id
                ? [members.find(m => m.id === task.assignee_id)].filter(Boolean)
                : [];

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

    // Compute border styles based on custom color
    const borderStyle = task.color
        ? {
            borderColor: task.color,
            borderWidth: '3px',
        }
        : {};

    return (
        <div
            className={`group bg-white dark:bg-gray-800 rounded-xl border-2 
                p-4 shadow-sm transition-all duration-200 cursor-pointer
                ${isDragging ? 'opacity-50 shadow-2xl scale-105' : ''}
                ${isUpdating ? 'opacity-70 pointer-events-none' : ''}
                ${task.color ? '' : 'border-gray-200 dark:border-gray-700'}
                touch-manipulation active:scale-[0.98] relative overflow-hidden
                ${task.color ? '' : 'hover:border-gray-300 dark:hover:border-gray-600'}`}
            style={borderStyle}
            onClick={() => onOpenDetail(task)}
            onMouseEnter={() => setShowQuickActions(true)}
            onMouseLeave={() => setShowQuickActions(false)}
        >
            {/* Drag Handle - hidden but drag functionality remains on the card */}

            {/* Header: Priority & Quick Actions */}
            <div className="flex items-center justify-between gap-2 mb-2 w-full">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium max-w-15 truncate shrink-0
                    ${priorityConfig.bgColor} ${priorityConfig.color}`}>
                    {priorityConfig.label}
                </span>



                {/* Mobile: Three dot menu */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowQuickActions(!showQuickActions);
                    }}
                    title="Task actions"
                    className="sm:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 
                        hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0"
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

            {/* Subtasks Section */}
            {task.subtasks && task.subtasks.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    {/* Toggle Button */}
                    <button
                        onClick={toggleSubtasks}
                        className="flex items-center justify-between w-full mb-2 px-2 py-1.5 rounded-lg 
                            hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group/subtasks"
                        aria-label={showSubtasks ? 'Hide subtasks' : 'Show subtasks'}
                    >
                        <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-900/30
                                text-blue-600 dark:text-blue-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {task.subtasks.filter(st => st.status === 'done').length}/{task.subtasks.length} Subtasks
                            </span>
                        </div>
                        {showSubtasks ? (
                            <ChevronUp className="w-4 h-4 text-gray-400 group-hover/subtasks:text-gray-600 dark:group-hover/subtasks:text-gray-300" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400 group-hover/subtasks:text-gray-600 dark:group-hover/subtasks:text-gray-300" />
                        )}
                    </button>

                    {/* Collapsible Subtasks */}
                    <div className={`transition-all duration-300 ease-in-out ${showSubtasks ? 'max-h-none opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                        }`}>
                        <SubTaskList
                            subtasks={task.subtasks}
                            members={members}
                            onSubTaskClick={onOpenDetail}
                            onSubtaskUpdate={onSubtaskUpdate ? (updated) => onSubtaskUpdate(task.id, updated) : undefined}
                            onSubtaskDelete={onSubtaskDelete ? (deletedId) => onSubtaskDelete(task.id, deletedId) : undefined}
                            parentTaskId={task.id}
                            allowDelete={false}
                        />
                    </div>
                </div>
            )}

            {/* Footer: Assignee & Due Date */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                {/* Assignees - show multiple */}
                <div className="flex items-center gap-1.5">
                    {assignees.length > 0 ? (
                        <>
                            {assignees.slice(0, 2).map((assignee, index) => (
                                <div
                                    key={assignee!.id}
                                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-gray-800"
                                    style={{
                                        backgroundColor: assignee!.color,
                                        marginLeft: index > 0 ? '-8px' : '0'
                                    }}
                                    title={assignee!.name}
                                >
                                    {assignee!.avatar_url ? (
                                        <Image
                                            src={assignee!.avatar_url}
                                            alt={assignee!.name}
                                            width={28}
                                            height={28}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    ) : (
                                        assignee!.name.charAt(0).toUpperCase()
                                    )}
                                </div>
                            ))}
                            {assignees.length > 2 && (
                                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-200 dark:bg-gray-700 
                                    flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300 -ml-2 border-2 border-white dark:border-gray-800"
                                    title={`+${assignees.length - 2} more`}
                                >
                                    +{assignees.length - 2}
                                </div>
                            )}
                            <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline ml-1">
                                {assignees.length === 1
                                    ? assignees[0]!.name
                                    : assignees.length === 2
                                        ? `${assignees[0]!.name} & ${assignees[1]!.name}`
                                        : `${assignees[0]!.name} +${assignees.length - 1}`}
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

                </div>
            )}
        </div>
    );
}
