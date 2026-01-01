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
