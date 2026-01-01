"use client";

import Image from 'next/image';
import type { TaskStats } from '@/types/tasks';

interface TaskStatsCardsProps {
    stats: TaskStats | null;
    loading: boolean;
}

export default function TaskStatsCards({ stats, loading }: TaskStatsCardsProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-3" />
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12" />
                    </div>
                ))}
            </div>
        );
    }

    if (!stats) return null;

    const cards = [
        {
            title: 'Total Tasks',
            value: stats.total,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            ),
            color: 'text-blue-600',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        },
        {
            title: 'To Do',
            value: stats.todo,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            color: 'text-gray-600',
            bgColor: 'bg-gray-50 dark:bg-gray-800',
        },
        {
            title: 'In Progress',
            value: stats.in_progress,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
            color: 'text-amber-600',
            bgColor: 'bg-amber-50 dark:bg-amber-900/20',
        },
        {
            title: 'Completed',
            value: stats.done,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            color: 'text-green-600',
            bgColor: 'bg-green-50 dark:bg-green-900/20',
        },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {cards.map((card) => (
                <div
                    key={card.title}
                    className={`${card.bgColor} rounded-2xl p-4 sm:p-5 transition-all hover:shadow-md`}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <span className={card.color}>{card.icon}</span>
                        <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                            {card.title}
                        </span>
                    </div>
                    <p className={`text-2xl sm:text-3xl font-bold ${card.color}`}>
                        {card.value}
                    </p>
                </div>
            ))}
        </div>
    );
}

interface TeamProgressProps {
    stats: TaskStats | null;
    loading: boolean;
}

export function TeamProgress({ stats, loading }: TeamProgressProps) {
    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 animate-pulse">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4" />
                <div className="space-y-4">
                    {[1, 2].map((i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
                            <div className="flex-1">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2" />
                                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!stats || !stats.by_assignee || stats.by_assignee.length === 0) {
        return null;
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Team Progress
            </h3>
            <div className="space-y-4">
                {stats.by_assignee.map(({ member, total, completed }) => {
                    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

                    return (
                        <div key={member.id} className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium shrink-0"
                                style={{ backgroundColor: member.color }}
                            >
                                {member.avatar_url ? (
                                    <Image
                                        src={member.avatar_url}
                                        alt={member.name}
                                        width={40}
                                        height={40}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    member.name.charAt(0).toUpperCase()
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {member.name}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0 ml-2">
                                        {completed}/{total} ({percentage}%)
                                    </span>
                                </div>
                                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${percentage}%`,
                                            backgroundColor: member.color,
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
