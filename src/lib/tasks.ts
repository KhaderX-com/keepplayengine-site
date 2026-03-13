"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Task, TaskLabel, TeamMember, TaskStatus, TaskPriority, TaskStats } from '@/types/tasks';

// =====================================================
// CUSTOM HOOKS FOR TASK MANAGER
// =====================================================

export function useTasks(filters?: { status?: TaskStatus; assignee_id?: string }) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTasks = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters?.status) params.set('status', filters.status);
            if (filters?.assignee_id) params.set('assignee_id', filters.assignee_id);

            const res = await fetch(`/api/tasks?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch tasks');

            const data = await res.json();
            setTasks(data.tasks || []);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, [filters?.status, filters?.assignee_id]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    return { tasks, loading, error, refetch: fetchTasks, setTasks };
}

export function useTeamMembers() {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/tasks/team-members')
            .then(res => res.json())
            .then(data => setMembers(data.members || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return { members, loading };
}

export function useLabels() {
    const [labels, setLabels] = useState<TaskLabel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/tasks/labels')
            .then(res => res.json())
            .then(data => setLabels(data.labels || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return { labels, loading };
}

export function useTaskStats() {
    const [stats, setStats] = useState<TaskStats | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch('/api/tasks/stats');
            if (!res.ok) throw new Error('Failed to fetch stats');
            const data = await res.json();
            setStats(data.stats);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return { stats, loading, refetch: fetchStats };
}

// =====================================================
// API FUNCTIONS
// =====================================================

export async function createTask(data: {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assignee_id?: string;
    parent_task_id?: string;
    due_date?: string;
    label_ids?: string[];
    color?: string | null;
}): Promise<Task> {
    const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create task');
    }

    const result = await res.json();
    return result.task;
}

export async function updateTask(
    id: string,
    data: {
        title?: string;
        description?: string;
        status?: TaskStatus;
        priority?: TaskPriority;
        assignee_id?: string | null;
        position?: number;
        due_date?: string | null;
        label_ids?: string[];
        color?: string | null;
    }
): Promise<Task> {
    const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update task');
    }

    const result = await res.json();
    return result.task;
}

export async function deleteTask(id: string): Promise<void> {
    const res = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete task');
    }
}

export async function addComment(taskId: string, content: string): Promise<void> {
    const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to add comment');
    }
}

// =====================================================
// MILESTONE HOOKS AND FUNCTIONS
// =====================================================

import type { Milestone, SubMilestone, MilestoneStatus, SubMilestonePriority } from '@/types/tasks';

export function useMilestones(filters?: { status?: string }) {
    const [milestones, setMilestones] = useState<(Task & { milestone?: Milestone })[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMilestones = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters?.status) params.set('status', filters.status);

            const res = await fetch(`/api/milestones?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch milestones');

            const data = await res.json();
            setMilestones(data.milestones || []);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, [filters?.status]);

    useEffect(() => {
        fetchMilestones();
    }, [fetchMilestones]);

    return { milestones, loading, error, refetch: fetchMilestones };
}

export function useMilestone(milestoneId: string | null) {
    const [milestone, setMilestone] = useState<Milestone | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMilestone = useCallback(async () => {
        if (!milestoneId) {
            setMilestone(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const res = await fetch(`/api/milestones/${milestoneId}`);
            if (!res.ok) throw new Error('Failed to fetch milestone');

            const data = await res.json();
            setMilestone(data.milestone);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, [milestoneId]);

    useEffect(() => {
        fetchMilestone();
    }, [fetchMilestone]);

    return { milestone, loading, error, refetch: fetchMilestone };
}

export function useMilestoneByTask(taskId: string | null) {
    const [milestone, setMilestone] = useState<Milestone | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMilestone = useCallback(async () => {
        if (!taskId) {
            setMilestone(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const res = await fetch(`/api/milestones/by-task/${taskId}`);
            if (!res.ok) {
                if (res.status === 404) {
                    setMilestone(null);
                    setError(null);
                    return;
                }
                throw new Error('Failed to fetch milestone');
            }

            const data = await res.json();
            setMilestone(data.milestone);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, [taskId]);

    useEffect(() => {
        fetchMilestone();
    }, [fetchMilestone]);

    return { milestone, loading, error, refetch: fetchMilestone };
}

// Milestone API Functions
export async function createMilestone(data: {
    task_id: string;
    description?: string;
    target_date?: string;
}): Promise<Milestone> {
    const res = await fetch('/api/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create milestone');
    }

    const result = await res.json();
    return result.milestone;
}

export async function updateMilestone(
    id: string,
    data: {
        description?: string;
        target_date?: string | null;
        status?: MilestoneStatus;
    }
): Promise<Milestone> {
    const res = await fetch(`/api/milestones/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update milestone');
    }

    const result = await res.json();
    return result.milestone;
}

export async function deleteMilestone(id: string): Promise<void> {
    const res = await fetch(`/api/milestones/${id}`, {
        method: 'DELETE',
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete milestone');
    }
}

// Sub-Milestone API Functions
export async function createSubMilestone(
    milestoneId: string,
    data: {
        title: string;
        major_number?: number;
        minor_number?: number;
        description?: string;
        target_date?: string;
        assignee_id?: string;
        priority?: SubMilestonePriority;
        notes?: string;
    }
): Promise<SubMilestone> {
    const res = await fetch(`/api/milestones/${milestoneId}/sub-milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create sub-milestone');
    }

    const result = await res.json();
    return result.subMilestone;
}

export async function updateSubMilestone(
    milestoneId: string,
    subMilestoneId: string,
    data: {
        title?: string;
        description?: string | null;
        status?: MilestoneStatus;
        target_date?: string | null;
        assignee_id?: string | null;
        priority?: SubMilestonePriority;
        notes?: string | null;
        position?: number;
    }
): Promise<SubMilestone> {
    const res = await fetch(`/api/milestones/${milestoneId}/sub-milestones/${subMilestoneId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update sub-milestone');
    }

    const result = await res.json();
    return result.subMilestone;
}

export async function deleteSubMilestone(
    milestoneId: string,
    subMilestoneId: string
): Promise<void> {
    const res = await fetch(`/api/milestones/${milestoneId}/sub-milestones/${subMilestoneId}`, {
        method: 'DELETE',
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete sub-milestone');
    }
}
