"use client";

import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import type { Task, TaskStatus, TeamMember, TaskLabel } from '@/types/tasks';
import { useTasks, useTeamMembers, useLabels, useTaskStats } from '@/lib/tasks';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import TaskBoard from '@/components/tasks/TaskBoard';
import TaskModal from '@/components/tasks/TaskModal';
import TaskDetail from '@/components/tasks/TaskDetail';
import TaskStatsCards, { TeamProgress } from '@/components/tasks/TaskStats';

export default function TaskManagerPage() {
    const { status } = useSession();
    const router = useRouter();

    // State
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [view, setView] = useState<'board' | 'list'>('board');
    const [filterAssignee, setFilterAssignee] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal States
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [initialStatus, setInitialStatus] = useState<TaskStatus>('todo');
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    // Data Hooks
    const { tasks, loading: tasksLoading, refetch: refetchTasks } = useTasks();
    const { members } = useTeamMembers();
    const { labels } = useLabels();
    const { stats, loading: statsLoading, refetch: refetchStats } = useTaskStats();

    // Handlers - defined before any conditionals
    const handleRefresh = useCallback(() => {
        refetchTasks();
        refetchStats();
    }, [refetchTasks, refetchStats]);

    // Auth redirect
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/admin/login');
        }
    }, [status, router]);

    // Auth check - loading state
    if (status === 'loading' || status === 'unauthenticated') {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    const handleAddTask = (status: TaskStatus = 'todo') => {
        setEditingTask(null);
        setInitialStatus(status);
        setIsTaskModalOpen(true);
    };

    const handleEditTask = (task: Task) => {
        setEditingTask(task);
        setIsTaskModalOpen(true);
        setIsDetailOpen(false);
    };

    const handleOpenDetail = (task: Task) => {
        setSelectedTaskId(task.id);
        setIsDetailOpen(true);
    };

    // Filter tasks
    const filteredTasks = tasks.filter(task => {
        if (filterAssignee && task.assignee_id !== filterAssignee) return false;
        if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            {/* Sidebar */}
            <AdminSidebar
                isMobileMenuOpen={isMobileMenuOpen}
                onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
            />

            {/* Main Content */}
            <div className="lg:pl-64">
                {/* Header */}
                <AdminHeader
                    onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
                    title="Task Manager"
                    subtitle="Manage and track tasks with your team"
                />

                {/* Page Content */}
                <main className="p-4 sm:p-6 lg:p-8 pt-20 lg:pt-24">
                    {/* Page Header */}
                    <div className="mb-6 sm:mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                                    Task Manager
                                </h1>
                                <p className="text-gray-500 dark:text-gray-400 mt-1">
                                    Manage and track tasks with your team
                                </p>
                            </div>
                            <button
                                onClick={() => handleAddTask()}
                                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 
                                    bg-blue-600 text-white rounded-xl font-medium
                                    hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                                    transition-all shadow-lg shadow-blue-600/25 active:scale-[0.98]"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span>New Task</span>
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="mb-6">
                        <TaskStatsCards stats={stats} loading={statsLoading} />
                    </div>

                    {/* Filters & View Toggle - Mobile Optimized */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 sm:p-4 mb-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="space-y-3">
                            {/* Top Row: Search */}
                            <div className="relative">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400"
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search tasks..."
                                    className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 rounded-xl 
                                        border border-gray-200 dark:border-gray-600 
                                        bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm sm:text-base
                                        focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                        placeholder-gray-400 transition-all shadow-sm"
                                />
                            </div>

                            {/* Bottom Row: Filter, View Toggle & Refresh */}
                            <div className="flex items-center gap-2">
                                {/* Assignee Filter */}
                                <div className="relative flex-1">
                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <select
                                        value={filterAssignee}
                                        onChange={(e) => setFilterAssignee(e.target.value)}
                                        aria-label="Filter by team member"
                                        className="w-full pl-9 pr-8 py-2.5 sm:py-3 rounded-xl 
                                            border border-gray-200 dark:border-gray-600 
                                            bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm sm:text-base
                                            focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                            transition-all shadow-sm appearance-none cursor-pointer"
                                    >
                                        <option value="">All Members</option>
                                        {members.map((member) => (
                                            <option key={member.id} value={member.id}>
                                                {member.name}
                                            </option>
                                        ))}
                                    </select>
                                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>

                                {/* View Toggle */}
                                <div className="flex rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden shadow-sm shrink-0">
                                    <button
                                        onClick={() => setView('board')}
                                        title="Board view"
                                        className={`px-3 sm:px-4 py-2.5 sm:py-3 transition-all
                                            ${view === 'board'
                                                ? 'bg-blue-600 text-white shadow-inner'
                                                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                                            }`}
                                    >
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                                                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                                        </svg>
                                    </button>
                                    <div className="w-px bg-gray-200 dark:bg-gray-600"></div>
                                    <button
                                        onClick={() => setView('list')}
                                        title="List view"
                                        className={`px-3 sm:px-4 py-2.5 sm:py-3 transition-all
                                            ${view === 'list'
                                                ? 'bg-blue-600 text-white shadow-inner'
                                                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                                            }`}
                                    >
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                                                d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Refresh */}
                                <button
                                    onClick={handleRefresh}
                                    className="p-2.5 sm:p-3 rounded-xl border border-gray-200 dark:border-gray-600 
                                        bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400
                                        hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm
                                        active:scale-95 shrink-0"
                                    title="Refresh"
                                >
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                        {/* Task Board / List */}
                        <div className="xl:col-span-3">
                            {tasksLoading ? (
                                <div className="flex items-center justify-center py-20">
                                    <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full" />
                                </div>
                            ) : view === 'board' ? (
                                <TaskBoard
                                    tasks={filteredTasks}
                                    members={members}
                                    onUpdate={handleRefresh}
                                    onOpenDetail={handleOpenDetail}
                                    onAddTask={handleAddTask}
                                />
                            ) : (
                                <TaskListView
                                    tasks={filteredTasks}
                                    members={members}
                                    labels={labels}
                                    onUpdate={handleRefresh}
                                    onOpenDetail={handleOpenDetail}
                                    onAddTask={handleAddTask}
                                />
                            )}
                        </div>

                        {/* Sidebar: Team Progress */}
                        <div className="xl:col-span-1">
                            <TeamProgress stats={stats} loading={statsLoading} />
                        </div>
                    </div>
                </main>
            </div>

            {/* Task Modal */}
            <TaskModal
                isOpen={isTaskModalOpen}
                onClose={() => {
                    setIsTaskModalOpen(false);
                    setEditingTask(null);
                }}
                onSave={handleRefresh}
                task={editingTask}
                initialStatus={initialStatus}
                members={members}
                labels={labels}
            />

            {/* Task Detail */}
            <TaskDetail
                isOpen={isDetailOpen}
                onClose={() => {
                    setIsDetailOpen(false);
                    setSelectedTaskId(null);
                }}
                taskId={selectedTaskId}
                members={members}
                labels={labels}
                onUpdate={handleRefresh}
                onEdit={handleEditTask}
            />
        </div>
    );
}

// List View Component
function TaskListView({
    tasks,
    onOpenDetail,
    onAddTask,
}: {
    tasks: Task[];
    members: TeamMember[];
    labels: TaskLabel[];
    onUpdate: () => void;
    onOpenDetail: (task: Task) => void;
    onAddTask: (status: TaskStatus) => void;
}) {
    const groupedTasks = {
        todo: tasks.filter(t => t.status === 'todo'),
        in_progress: tasks.filter(t => t.status === 'in_progress'),
        done: tasks.filter(t => t.status === 'done'),
    };

    return (
        <div className="space-y-6">
            {Object.entries(groupedTasks).map(([status, statusTasks]) => (
                <div key={status} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full 
                                    ${status === 'todo' ? 'bg-gray-500' : ''}
                                    ${status === 'in_progress' ? 'bg-blue-500' : ''}
                                    ${status === 'done' ? 'bg-green-500' : ''}`}
                                />
                                <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
                                    {status.replace('_', ' ')}
                                </h3>
                                <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 
                                    text-xs font-medium text-gray-600 dark:text-gray-300">
                                    {statusTasks.length}
                                </span>
                            </div>
                            <button
                                onClick={() => onAddTask(status as TaskStatus)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 
                                    hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-95"
                                title={`Add task to ${status.replace('_', ' ')}`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {statusTasks.length > 0 ? (
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {statusTasks.map((task) => (
                                <div
                                    key={task.id}
                                    onClick={() => onOpenDetail(task)}
                                    className="px-4 sm:px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 
                                        cursor-pointer transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1 min-w-0">
                                            <h4 className={`font-medium text-gray-900 dark:text-white truncate
                                                ${task.status === 'done' ? 'line-through opacity-70' : ''}`}>
                                                {task.title}
                                            </h4>
                                            {task.description && (
                                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                                                    {task.description}
                                                </p>
                                            )}
                                        </div>

                                        {/* Labels */}
                                        <div className="hidden sm:flex gap-1.5">
                                            {task.labels?.slice(0, 2).map((label) => (
                                                <span
                                                    key={label.id}
                                                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                                                    style={{
                                                        backgroundColor: `${label.color}20`,
                                                        color: label.color,
                                                    }}
                                                >
                                                    {label.name}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Assignee */}
                                        {task.assignee && (
                                            <div
                                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0"
                                                style={{ backgroundColor: task.assignee.color }}
                                                title={task.assignee.name}
                                            >
                                                {task.assignee.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="px-4 sm:px-6 py-8 text-center text-gray-400 dark:text-gray-500">
                            No tasks
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
