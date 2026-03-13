"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import type { Task, Milestone } from '@/types/tasks';
import { MILESTONE_STATUS_CONFIG, PRIORITY_CONFIG } from '@/types/tasks';
import { useMilestones } from '@/lib/tasks';
import {
    Flag,
    Search,
    Calendar,
    ArrowRight,
    TrendingUp,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Filter
} from 'lucide-react';

export default function MilestonesListPage() {
    const router = useRouter();
    const { data: session, status: authStatus } = useSession();
    const { milestones, loading, refetch } = useMilestones();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        if (authStatus === 'unauthenticated') {
            router.push('/admin/login');
        }
    }, [authStatus, router]);

    if (authStatus === 'loading' || loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    // Filter milestones
    const filteredMilestones = milestones.filter(m => {
        const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.description?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || m.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Stats calculations
    const stats = {
        total: milestones.length,
        completed: milestones.filter(m => m.milestone?.status === 'completed').length,
        inProgress: milestones.filter(m => m.milestone?.status === 'in_progress').length,
        delayed: milestones.filter(m => m.milestone?.status === 'delayed').length,
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <AdminSidebar
                isMobileMenuOpen={isMobileMenuOpen}
                onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
                userRole={session?.user?.role}
            />

            <div className="lg:ml-64">
                <AdminHeader
                    onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                />

                <main className="p-4 lg:p-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                                <Flag className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Milestones
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Track and manage your project milestones
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Total</span>
                                <TrendingUp className="w-5 h-5 text-purple-500" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Completed</span>
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                            </div>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completed}</p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-500 dark:text-gray-400">In Progress</span>
                                <Clock className="w-5 h-5 text-blue-500" />
                            </div>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.inProgress}</p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Delayed</span>
                                <AlertTriangle className="w-5 h-5 text-orange-500" />
                            </div>
                            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.delayed}</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 shadow-sm">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search milestones..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 
                                        rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                        focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <Filter className="w-5 h-5 text-gray-400" />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 
                                        rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                        focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    <option value="all">All Status</option>
                                    <option value="todo">To Do</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="done">Done</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Milestones Grid */}
                    {filteredMilestones.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center">
                            <div className="w-20 h-20 mx-auto mb-4 bg-purple-100 dark:bg-purple-900/30 rounded-full 
                                flex items-center justify-center">
                                <Flag className="w-10 h-10 text-purple-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                No Milestones Yet
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                                Mark tasks as milestones to track key deliverables and project phases here.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredMilestones.map((task) => (
                                <MilestoneCard
                                    key={task.id}
                                    task={task as Task & { milestone?: Milestone }}
                                    onClick={() => router.push(`/admin/milestones/${task.id}`)}
                                />
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

// Milestone Card Component
function MilestoneCard({
    task,
    onClick
}: {
    task: Task & {
        milestone?: Milestone;
        sub_milestone_count?: number;
        completed_sub_milestones?: number;
    };
    onClick: () => void;
}) {
    const milestone = task.milestone;
    const statusConfig = milestone?.status
        ? MILESTONE_STATUS_CONFIG[milestone.status]
        : MILESTONE_STATUS_CONFIG.not_started;
    const priorityConfig = PRIORITY_CONFIG[task.priority];

    const progress = milestone?.progress_percentage || 0;
    const subMilestoneCount = task.sub_milestone_count || 0;
    const completedSubMilestones = task.completed_sub_milestones || 0;

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div
            onClick={onClick}
            className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 
                dark:border-gray-700 hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700
                transition-all cursor-pointer group"
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <Flag className="w-4 h-4 text-purple-500 shrink-0" />
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                            ${priorityConfig.bgColor} ${priorityConfig.color}`}>
                            {priorityConfig.label}
                        </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-base line-clamp-2">
                        {task.title}
                    </h3>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-500 
                    transition-colors shrink-0 mt-1" />
            </div>

            {/* Description */}
            {task.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
                    {task.description}
                </p>
            )}

            {/* Progress Bar */}
            <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-500 dark:text-gray-400">Progress</span>
                    <span className="font-medium text-purple-600 dark:text-purple-400">{progress}%</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Meta Info */}
            <div className="flex items-center justify-between text-sm">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full
                    ${statusConfig.bgColor} ${statusConfig.color}`}>
                    {statusConfig.icon} {statusConfig.label}
                </span>

                <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                    {subMilestoneCount > 0 && (
                        <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            {completedSubMilestones}/{subMilestoneCount}
                        </span>
                    )}

                    {task.due_date && (
                        <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(task.due_date)}
                        </span>
                    )}
                </div>
            </div>

            {/* Assignee */}
            {task.assignee && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                        style={{ backgroundColor: task.assignee.color }}
                    >
                        {task.assignee.avatar_url ? (
                            <Image
                                src={task.assignee.avatar_url}
                                alt={task.assignee.name}
                                width={24}
                                height={24}
                                className="rounded-full"
                            />
                        ) : (
                            task.assignee.name.charAt(0).toUpperCase()
                        )}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                        {task.assignee.name}
                    </span>
                </div>
            )}
        </div>
    );
}
