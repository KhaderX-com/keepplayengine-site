"use client";

import React, { useState, useMemo } from 'react';
import type { Task, TeamMember, TaskLabel, TaskStatus } from '@/types/tasks';
import { PRIORITY_CONFIG, STATUS_CONFIG } from '@/types/tasks';
import { ArrowUpDown, ArrowUp, ArrowDown, Table as TableIcon } from 'lucide-react';
import SubTaskList from './SubTaskList';

interface TaskTableViewProps {
    tasks: Task[];
    members: TeamMember[];
    labels: TaskLabel[];
    onOpenDetail: (task: Task) => void;
    onAddTask: (status: TaskStatus) => void;
    onSubtaskUpdate: (parentTaskId: string, updatedSubtask: Task) => void;
    onSubtaskDelete: (parentTaskId: string, deletedSubtaskId: string) => void;
}

type SortField = 'title' | 'status' | 'priority' | 'assignee' | 'due_date' | 'created_at';
type SortDirection = 'asc' | 'desc';

// Sort icon component - defined outside to prevent recreation on each render
function SortIcon({ field, sortField, sortDirection }: {
    field: SortField;
    sortField: SortField;
    sortDirection: SortDirection;
}) {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 opacity-30" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
}

export default function TaskTableView({
    tasks,
    members,
    onOpenDetail,
    onAddTask,
    onSubtaskUpdate,
    onSubtaskDelete,
}: TaskTableViewProps) {
    const [sortField, setSortField] = useState<SortField>('created_at');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    // Sort tasks
    const sortedTasks = useMemo(() => {
        const sorted = [...tasks].sort((a, b) => {
            let aValue: string | number | undefined;
            let bValue: string | number | undefined;

            switch (sortField) {
                case 'title':
                    aValue = a.title.toLowerCase();
                    bValue = b.title.toLowerCase();
                    break;
                case 'status':
                    aValue = a.status;
                    bValue = b.status;
                    break;
                case 'priority':
                    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
                    aValue = priorityOrder[a.priority];
                    bValue = priorityOrder[b.priority];
                    break;
                case 'assignee':
                    aValue = members.find(m => m.id === a.assignee_id)?.name?.toLowerCase() || '';
                    bValue = members.find(m => m.id === b.assignee_id)?.name?.toLowerCase() || '';
                    break;
                case 'due_date':
                    aValue = a.due_date ? new Date(a.due_date).getTime() : 0;
                    bValue = b.due_date ? new Date(b.due_date).getTime() : 0;
                    break;
                case 'created_at':
                    aValue = new Date(a.created_at).getTime();
                    bValue = new Date(b.created_at).getTime();
                    break;
            }

            if (aValue === undefined || aValue === '') return 1;
            if (bValue === undefined || bValue === '') return -1;

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return sorted;
    }, [tasks, sortField, sortDirection, members]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const toggleRowExpand = (taskId: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(taskId)) {
            newExpanded.delete(taskId);
        } else {
            newExpanded.add(taskId);
        }
        setExpandedRows(newExpanded);
    };

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const isPastDue = (dueDate: string | null | undefined, status: TaskStatus) => {
        if (!dueDate || status === 'done') return false;
        return new Date(dueDate) < new Date();
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <TableIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                            Table View
                        </h2>
                        <span className="px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300">
                            {tasks.length}
                        </span>
                    </div>

                    <button
                        onClick={() => onAddTask('todo')}
                        className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-95 transition-all font-medium text-sm touch-manipulation"
                    >
                        + Add Task
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto -mx-px">
                <table className="w-full min-w-[640px]">
                    <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className="w-8 sm:w-12 px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                                #
                            </th>
                            <th
                                onClick={() => handleSort('title')}
                                className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-manipulation active:scale-95"
                            >
                                <div className="flex items-center gap-1 sm:gap-2">
                                    Task
                                    <SortIcon field="title" sortField={sortField} sortDirection={sortDirection} />
                                </div>
                            </th>
                            <th
                                onClick={() => handleSort('status')}
                                className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-manipulation active:scale-95"
                            >
                                <div className="flex items-center gap-1 sm:gap-2">
                                    Status
                                    <SortIcon field="status" sortField={sortField} sortDirection={sortDirection} />
                                </div>
                            </th>
                            <th
                                onClick={() => handleSort('priority')}
                                className="hidden md:table-cell px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-manipulation active:scale-95"
                            >
                                <div className="flex items-center gap-1 sm:gap-2">
                                    Priority
                                    <SortIcon field="priority" sortField={sortField} sortDirection={sortDirection} />
                                </div>
                            </th>
                            <th
                                onClick={() => handleSort('assignee')}
                                className="hidden lg:table-cell px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-manipulation active:scale-95"
                            >
                                <div className="flex items-center gap-1 sm:gap-2">
                                    Assignee
                                    <SortIcon field="assignee" sortField={sortField} sortDirection={sortDirection} />
                                </div>
                            </th>
                            <th className="hidden lg:table-cell px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                                Labels
                            </th>
                            <th
                                onClick={() => handleSort('due_date')}
                                className="hidden sm:table-cell px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-manipulation active:scale-95"
                            >
                                <div className="flex items-center gap-1 sm:gap-2">
                                    Due Date
                                    <SortIcon field="due_date" sortField={sortField} sortDirection={sortDirection} />
                                </div>
                            </th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                                Progress
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {sortedTasks.map((task, idx) => {
                            const assignee = members.find(m => m.id === task.assignee_id);
                            const priorityConfig = PRIORITY_CONFIG[task.priority];
                            const statusConfig = STATUS_CONFIG[task.status];
                            const isExpanded = expandedRows.has(task.id);
                            const hasSubtasks = task.subtasks && task.subtasks.length > 0;
                            const pastDue = isPastDue(task.due_date, task.status);

                            return (
                                <React.Fragment key={task.id}>
                                    <tr
                                        onClick={() => onOpenDetail(task)}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-900/50 active:bg-gray-100 dark:active:bg-gray-800 cursor-pointer transition-colors touch-manipulation"
                                    >
                                        <td className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                            {idx + 1}
                                        </td>
                                        <td className="px-2 sm:px-4 py-3 sm:py-4">
                                            <div className="flex items-center gap-2">
                                                {hasSubtasks && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleRowExpand(task.id);
                                                        }}
                                                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                                        title={isExpanded ? "Collapse subtasks" : "Expand subtasks"}
                                                    >
                                                        <svg
                                                            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''
                                                                }`}
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </button>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className={`font-medium text-gray-900 dark:text-white ${task.status === 'done' ? 'line-through opacity-70' : ''
                                                        }`}>
                                                        {task.title}
                                                    </div>
                                                    {task.description && (
                                                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                                                            {task.description}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span
                                                className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap"
                                                style={{
                                                    backgroundColor: `${statusConfig.color}20`,
                                                    color: statusConfig.color,
                                                }}
                                            >
                                                <span
                                                    className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full"
                                                    style={{ backgroundColor: statusConfig.color }}
                                                />
                                                <span className="hidden sm:inline">{statusConfig.label}</span>
                                                <span className="sm:hidden">{statusConfig.label.charAt(0)}</span>
                                            </span>
                                        </td>
                                        <td className="hidden md:table-cell px-2 sm:px-4 py-3 sm:py-4">
                                            <span
                                                className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap"
                                                style={{
                                                    backgroundColor: `${priorityConfig.color}20`,
                                                    color: priorityConfig.color,
                                                }}
                                            >
                                                {priorityConfig.label}
                                            </span>
                                        </td>
                                        <td className="hidden lg:table-cell px-2 sm:px-4 py-3 sm:py-4">
                                            {assignee ? (
                                                <div className="flex items-center gap-1.5 sm:gap-2">
                                                    <div
                                                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-[10px] sm:text-xs font-medium shrink-0"
                                                        style={{ backgroundColor: assignee.color }}
                                                    >
                                                        {assignee.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                                                        {assignee.name}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs sm:text-sm text-gray-400 dark:text-gray-500">
                                                    Unassigned
                                                </span>
                                            )}
                                        </td>
                                        <td className="hidden lg:table-cell px-2 sm:px-4 py-3 sm:py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {task.labels?.slice(0, 2).map((label) => (
                                                    <span
                                                        key={label.id}
                                                        className="px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap"
                                                        style={{
                                                            backgroundColor: `${label.color}20`,
                                                            color: label.color,
                                                        }}
                                                    >
                                                        {label.name}
                                                    </span>
                                                ))}
                                                {(task.labels?.length || 0) > 2 && (
                                                    <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                                        +{(task.labels?.length || 0) - 2}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="hidden sm:table-cell px-2 sm:px-4 py-3 sm:py-4">
                                            <span className={`text-sm ${pastDue
                                                ? 'text-red-600 dark:text-red-400 font-semibold'
                                                : 'text-gray-600 dark:text-gray-400'
                                                }`}>
                                                {formatDate(task.due_date)}
                                            </span>
                                        </td>
                                        <td className="px-2 sm:px-4 py-3 sm:py-4">
                                            {hasSubtasks ? (
                                                <div className="flex items-center gap-1.5 sm:gap-2 min-w-[80px]">
                                                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 sm:h-2 overflow-hidden min-w-[40px]">
                                                        <div
                                                            className="h-full bg-green-500 transition-all"
                                                            style={{
                                                                width: `${((task.completed_subtask_count || 0) / (task.subtask_count || 1)) * 100}%`,
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap shrink-0">
                                                        {task.completed_subtask_count}/{task.subtask_count}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs sm:text-sm text-gray-400 dark:text-gray-500">-</span>
                                            )}
                                        </td>
                                    </tr>

                                    {/* Expanded Subtasks Row */}
                                    {isExpanded && hasSubtasks && (
                                        <tr className="bg-gray-50 dark:bg-gray-900/30">
                                            <td colSpan={8} className="px-2 sm:px-4 py-3 sm:py-4">
                                                <div className="ml-4 sm:ml-12">
                                                    <SubTaskList
                                                        subtasks={task.subtasks!}
                                                        members={members}
                                                        onSubTaskClick={onOpenDetail}
                                                        onSubtaskUpdate={(updated) => onSubtaskUpdate(task.id, updated)}
                                                        onSubtaskDelete={(deletedId) => onSubtaskDelete(task.id, deletedId)}
                                                        parentTaskId={task.id}
                                                        allowDelete={false}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>

                {/* Empty State */}
                {sortedTasks.length === 0 && (
                    <div className="text-center py-8 sm:py-12 px-4">
                        <TableIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3 sm:mb-4" />
                        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">No tasks found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
