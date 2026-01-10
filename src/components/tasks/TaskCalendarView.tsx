"use client";

import { useState, useMemo } from 'react';
import type { Task, TeamMember, TaskStatus } from '@/types/tasks';
import { PRIORITY_CONFIG } from '@/types/tasks';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface TaskCalendarViewProps {
    tasks: Task[];
    members: TeamMember[];
    onOpenDetail: (task: Task) => void;
    onAddTask: (status: TaskStatus) => void;
}

export default function TaskCalendarView({
    tasks,
    members,
    onOpenDetail,
    onAddTask,
}: TaskCalendarViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date());

    // Get calendar days
    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - startDate.getDay());

        const days = [];
        const current = new Date(startDate);

        for (let i = 0; i < 42; i++) {
            days.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }

        return days;
    }, [currentDate]);

    // Group tasks by date
    const tasksByDate = useMemo(() => {
        const grouped: Record<string, Task[]> = {};
        tasks.filter(t => t.due_date).forEach(task => {
            const dateKey = new Date(task.due_date!).toDateString();
            if (!grouped[dateKey]) grouped[dateKey] = [];
            grouped[dateKey].push(task);
        });
        return grouped;
    }, [tasks]);

    const navigateMonth = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        setCurrentDate(newDate);
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isCurrentMonth = (date: Date) => {
        return date.getMonth() === currentDate.getMonth();
    };

    const isPastDue = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            {/* Header */}
            <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 shrink-0" />
                        <h2 className="text-base sm:text-xl font-semibold text-gray-900 dark:text-white truncate">
                            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h2>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-between sm:justify-end">
                        <button
                            onClick={() => navigateMonth('prev')}
                            className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-90 transition-all touch-manipulation"
                            title="Previous month"
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
                            onClick={() => navigateMonth('next')}
                            className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-90 transition-all touch-manipulation"
                            title="Next month"
                        >
                            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
                        </button>
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

            {/* Calendar Grid */}
            <div className="p-3 sm:p-6">
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div
                            key={day}
                            className="text-center text-[10px] sm:text-sm font-semibold text-gray-600 dark:text-gray-400 py-1 sm:py-2"
                        >
                            <span className="hidden xs:inline">{day}</span>
                            <span className="xs:hidden">{day.charAt(0)}</span>
                        </div>
                    ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {calendarDays.map((date, idx) => {
                        const dateKey = date.toDateString();
                        const dateTasks = tasksByDate[dateKey] || [];
                        const today = isToday(date);
                        const currentMonth = isCurrentMonth(date);
                        const pastDue = isPastDue(date);

                        return (
                            <div
                                key={idx}
                                className={`min-h-[120px] p-2 rounded-lg border transition-all ${today
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : currentMonth
                                        ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
                                        : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 opacity-50'
                                    }`}
                            >
                                {/* Date Number */}
                                <div className={`text-sm font-semibold mb-1 ${today
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : currentMonth
                                        ? 'text-gray-900 dark:text-white'
                                        : 'text-gray-400 dark:text-gray-600'
                                    }`}>
                                    {date.getDate()}
                                </div>

                                {/* Tasks */}
                                <div className="space-y-1">
                                    {dateTasks.slice(0, 3).map(task => {
                                        const assignee = members.find(m => m.id === task.assignee_id);
                                        const priorityConfig = PRIORITY_CONFIG[task.priority];
                                        const taskPastDue = pastDue && task.status !== 'done';

                                        return (
                                            <button
                                                key={task.id}
                                                onClick={() => onOpenDetail(task)}
                                                className={`w-full text-left p-1.5 rounded text-xs font-medium transition-all hover:shadow-md border-l-2 ${task.status === 'done'
                                                    ? 'bg-green-100 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-400 line-through'
                                                    : taskPastDue
                                                        ? 'bg-red-100 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-400'
                                                        : task.status === 'in_progress'
                                                            ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-400'
                                                            : 'bg-gray-100 dark:bg-gray-800 border-gray-400 text-gray-700 dark:text-gray-300'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-1">
                                                    <span
                                                        className="w-1.5 h-1.5 rounded-full shrink-0"
                                                        style={{ backgroundColor: priorityConfig.color }}
                                                    />
                                                    <span className="truncate flex-1">{task.title}</span>
                                                    {assignee && (
                                                        <div
                                                            className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold shrink-0"
                                                            style={{ backgroundColor: assignee.color }}
                                                        >
                                                            {assignee.name.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}

                                    {/* More tasks indicator */}
                                    {dateTasks.length > 3 && (
                                        <div className="text-[10px] text-gray-500 dark:text-gray-400 text-center py-1">
                                            +{dateTasks.length - 3} more
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1 sm:gap-2">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded bg-blue-100 dark:bg-blue-900/30 border-l-2 border-blue-500" />
                        <span>In Progress</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded bg-green-100 dark:bg-green-900/30 border-l-2 border-green-500" />
                        <span>Completed</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded bg-red-100 dark:bg-red-900/30 border-l-2 border-red-500" />
                        <span>Overdue</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded bg-gray-100 dark:bg-gray-800 border-l-2 border-gray-400" />
                        <span>To Do</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
