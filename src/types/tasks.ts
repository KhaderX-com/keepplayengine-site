// =====================================================
// TASK MANAGER TYPE DEFINITIONS
// =====================================================

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'done';

// =====================================================
// DATABASE MODELS
// =====================================================

export interface TeamMember {
    id: string;
    admin_user_id?: string | null;
    name: string;
    email?: string | null;
    avatar_url?: string | null;
    color: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface TaskLabel {
    id: string;
    name: string;
    color: string;
    description?: string | null;
    created_at: string;
}

export interface Task {
    id: string;
    title: string;
    description?: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    assignee_id?: string | null;
    created_by?: string | null;
    parent_task_id?: string | null;
    position: number;
    due_date?: string | null;
    completed_at?: string | null;
    estimated_hours?: number | null;
    actual_hours?: number | null;
    created_at: string;
    updated_at: string;

    // Joined relations (optional)
    assignee?: TeamMember | null;
    assignees?: TeamMember[]; // Multiple assignees support
    creator?: TeamMember | null;
    labels?: TaskLabel[];
    subtasks?: Task[];
    subtask_count?: number;
    completed_subtask_count?: number;

    // Hierarchical display properties
    depth?: number;
    has_children?: boolean;
}

export interface TaskComment {
    id: string;
    task_id: string;
    author_id?: string | null;
    content: string;
    created_at: string;
    updated_at: string;

    // Joined relations
    author?: TeamMember | null;
}

export interface TaskActivityLog {
    id: string;
    task_id: string;
    actor_id?: string | null;
    action: string;
    field_changed?: string | null;
    old_value?: string | null;
    new_value?: string | null;
    metadata: Record<string, unknown>;
    created_at: string;

    // Joined relations
    actor?: TeamMember | null;
}

// =====================================================
// API REQUEST/RESPONSE TYPES
// =====================================================

export interface CreateTaskRequest {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assignee_id?: string;
    assignee_ids?: string[]; // Multiple assignees support
    parent_task_id?: string;
    due_date?: string;
    estimated_hours?: number;
    label_ids?: string[];
}

export interface UpdateTaskRequest {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assignee_id?: string | null;
    position?: number;
    due_date?: string | null;
    estimated_hours?: number | null;
    actual_hours?: number | null;
    label_ids?: string[];
}

export interface TaskFilters {
    status?: TaskStatus | TaskStatus[];
    priority?: TaskPriority | TaskPriority[];
    assignee_id?: string;
    label_id?: string;
    parent_task_id?: string | null;
    search?: string;
    due_date_from?: string;
    due_date_to?: string;
}

export interface TaskStats {
    total: number;
    todo: number;
    in_progress: number;
    done: number;
    overdue: number;
    by_assignee: {
        member: TeamMember;
        total: number;
        completed: number;
    }[];
}

// =====================================================
// UI STATE TYPES
// =====================================================

export interface TaskBoardColumn {
    id: TaskStatus;
    title: string;
    tasks: Task[];
    color: string;
}

export interface DragItem {
    type: 'task';
    id: string;
    status: TaskStatus;
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bgColor: string; className: string }> = {
    low: {
        label: 'Low',
        color: 'text-gray-500',
        bgColor: 'bg-gray-100 dark:bg-gray-800',
        className: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
    },
    medium: {
        label: 'Medium',
        color: 'text-blue-500',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    },
    high: {
        label: 'High',
        color: 'text-orange-500',
        bgColor: 'bg-orange-100 dark:bg-orange-900/30',
        className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
    },
    urgent: {
        label: 'Urgent',
        color: 'text-red-500',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    },
};

export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bgColor: string; icon: string; className: string }> = {
    todo: {
        label: 'To Do',
        color: 'text-gray-500',
        bgColor: 'bg-gray-500',
        icon: '○',
        className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    },
    in_progress: {
        label: 'In Progress',
        color: 'text-blue-500',
        bgColor: 'bg-blue-500',
        icon: '◐',
        className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    },
    done: {
        label: 'Done',
        color: 'text-green-500',
        bgColor: 'bg-green-500',
        icon: '●',
        className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    },
};
