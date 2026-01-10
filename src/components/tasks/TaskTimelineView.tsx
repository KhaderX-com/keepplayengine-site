"use client";

import { useState, useMemo } from 'react';
import type { Task, TeamMember, TaskStatus } from '@/types/tasks';
import { PRIORITY_CONFIG } from '@/types/tasks';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface TaskTimelineViewProps {
    tasks: Task[];
    members: TeamMember[];
    onOpenDetail: (task: Task) => void;
    onAddTask: (status: TaskStatus) => void;
}

export default function TaskTimelineView({
    tasks,
    members,
    onOpenDetail,
    onAddTask,
}: TaskTimelineViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

    // Get calendar days
    const timelineDates = useMemo(() => {
        const dates = [];
        const start = new Date(currentDate);
        start.setDate(start.getDate() - start.getDay()); // Start of week

        const days = viewMode === 'week' ? 7 : 30;
        for (let i = 0; i < days; i++) {
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            dates.push(date);
        }
        return dates;
    }, [currentDate, viewMode]);

    // Filter tasks with due dates
    const tasksWithDates = useMemo(() => {
        return tasks.filter(t => t.due_date).sort((a, b) => {
            return new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime();
        });
    }, [tasks]);

    // Group tasks by date - for future enhancements
    // const tasksByDate = useMemo(() => { ... }, [tasksWithDates]);

    const navigateWeek = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        const days = viewMode === 'week' ? 7 : 30;
        newDate.setDate(newDate.getDate() + (direction === 'next' ? days : -days));
        setCurrentDate(newDate);
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isPastDue = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Timeline View
                        </h2>
                        <span className="px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300">
                            {tasksWithDates.length} tasks
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* View Mode Toggle */}
                        <div className="flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                            <button
                                onClick={() => setViewMode('week')}
                                className={`px-3 py-1.5 text-sm font-medium transition-all ${viewMode === 'week'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                            >
                                Week
                            </button>
                            <button
                                onClick={() => setViewMode('month')}
                                className={`px-3 py-1.5 text-sm font-medium transition-all ${viewMode === 'month'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                            >
                                Month
                            </button>
                        </div>

                        {/* Navigation */}
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-1 xs:flex-none justify-between xs:justify-start">
                            <button
                                onClick={() => navigateWeek('prev')}
                                className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-90 transition-all touch-manipulation"
                                title="Previous period"
                            >
                                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
                            </button>
                            <button
                                onClick={() => setCurrentDate(new Date())}
                                className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors touch-manipulation active:scale-95"
                            >
                                Today
                            </button>
                            <button
                                onClick={() => navigateWeek('next')}
                                className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-90 transition-all touch-manipulation"
                                title="Next period"
                            >
                                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Add Task Button */}
                <button
                    onClick={() => onAddTask('todo')}
                    className="mt-3 w-full py-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 active:scale-95 transition-all touch-manipulation"
                >
                    + Add Task
                </button>
            </div>

            {/* Timeline Grid */}
            <div className="p-6 overflow-x-auto">
                <div className="min-w-[800px]">
                    {/* Date Headers */}
                    <div className="grid gap-2 mb-4" style={{ gridTemplateColumns: `repeat(${timelineDates.length}, minmax(100px, 1fr))` }}>
                        {timelineDates.map((date, idx) => {
                            const today = isToday(date);
                            return (
                                <div
                                    key={idx}
                                    className={`text-center p-2 rounded-lg ${today
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400'
                                        }`}
                                >
                                    <div className="text-xs font-medium">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                    <div className={`text-lg font-bold ${today ? 'text-white' : ''}`}>
                                        {date.getDate()}
                                    </div>
                                    <div className="text-xs">{date.toLocaleDateString('en-US', { month: 'short' })}</div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Task Rows */}
                    <div className="space-y-2">
                        {tasksWithDates.map(task => {
                            const dueDate = new Date(task.due_date!);
                            const dateKey = dueDate.toDateString();
                            const columnIndex = timelineDates.findIndex(d => d.toDateString() === dateKey);

                            if (columnIndex === -1) return null;

                            const assignee = members.find(m => m.id === task.assignee_id);
                            const priorityConfig = PRIORITY_CONFIG[task.priority];
                            const pastDue = isPastDue(dueDate) && task.status !== 'done';

                            return (
                                <div
                                    key={task.id}
                                    className="grid gap-2"
                                    style={{ gridTemplateColumns: `repeat(${timelineDates.length}, minmax(100px, 1fr))` }}
                                >
                                    <div
                                        style={{ gridColumn: `${columnIndex + 1} / span 1` }}
                                        onClick={() => onOpenDetail(task)}
                                        className={`p-3 rounded-lg cursor-pointer transition-all hover:shadow-md border-l-4 ${task.status === 'done'
                                            ? 'bg-green-50 dark:bg-green-900/20 border-green-500 opacity-70'
                                            : pastDue
                                                ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                                                : task.status === 'in_progress'
                                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                                                    : 'bg-gray-50 dark:bg-gray-900 border-gray-400'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span
                                                        className="w-2 h-2 rounded-full shrink-0"
                                                        style={{ backgroundColor: priorityConfig.color }}
                                                    />
                                                    <h4 className={`text-sm font-medium text-gray-900 dark:text-white truncate ${task.status === 'done' ? 'line-through opacity-70' : ''
                                                        }`}>
                                                        {task.title}
                                                    </h4>
                                                </div>
                                                {task.description && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                        {task.description}
                                                    </p>
                                                )}
                                                {task.subtasks && task.subtasks.length > 0 && (
                                                    <div className="mt-1 text-xs text-gray-500">
                                                        {task.completed_subtask_count}/{task.subtask_count} subtasks
                                                    </div>
                                                )}
                                            </div>
                                            {assignee && (
                                                <div
                                                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0"
                                                    style={{ backgroundColor: assignee.color }}
                                                    title={assignee.name}
                                                >
                                                    {assignee.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Empty State */}
                    {tasksWithDates.length === 0 && (
                        <div className="text-center py-8 sm:py-12 px-4">
                            <Calendar className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3 sm:mb-4" />
                            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">No tasks with due dates</p>
                            <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-1">
                                Add due dates to your tasks to see them in the timeline
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
