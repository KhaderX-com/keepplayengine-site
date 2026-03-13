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
    color?: string | null;
    is_milestone?: boolean;
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
    milestone?: Milestone | null;

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
    admin_user_id?: string | null;
    action: string;
    field_changed?: string | null;
    old_value?: string | null;
    new_value?: string | null;
    metadata: Record<string, unknown>;
    created_at: string;

    // Joined relations
    actor?: TeamMember | null;
    admin_user?: {
        id: string;
        full_name: string | null;
        email: string;
        avatar_url?: string | null;
    } | null;
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
    color?: string | null;
    parent_task_id?: string;
    due_date?: string;
    estimated_hours?: number;
    label_ids?: string[];
    is_milestone?: boolean;
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
    color?: string | null;
    label_ids?: string[];
    is_milestone?: boolean;
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

// =====================================================
// MILESTONE SYSTEM TYPES
// =====================================================

export type MilestoneStatus = 'not_started' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
export type SubMilestonePriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Milestone {
    id: string;
    task_id: string;
    description?: string | null;
    target_date?: string | null;
    status: MilestoneStatus;
    progress_percentage: number;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;

    // Joined relations
    task?: Task;
    sub_milestones?: SubMilestone[];
}

export interface SubMilestone {
    id: string;
    milestone_id: string;
    major_number: number;
    minor_number: number;
    title: string;
    description?: string | null;
    status: MilestoneStatus;
    target_date?: string | null;
    completed_at?: string | null;
    progress_percentage: number;
    assignee_id?: string | null;
    priority: SubMilestonePriority;
    notes?: string | null;
    metadata: Record<string, unknown>;
    position: number;
    created_at: string;
    updated_at: string;

    // Joined relations
    assignee?: TeamMember | null;
}

// Request types for Milestone API
export interface CreateMilestoneRequest {
    task_id: string;
    description?: string;
    target_date?: string;
}

export interface UpdateMilestoneRequest {
    description?: string;
    target_date?: string | null;
    status?: MilestoneStatus;
}

export interface CreateSubMilestoneRequest {
    milestone_id: string;
    major_number: number;
    minor_number: number;
    title: string;
    description?: string;
    target_date?: string;
    assignee_id?: string;
    priority?: SubMilestonePriority;
    notes?: string;
}

export interface UpdateSubMilestoneRequest {
    title?: string;
    description?: string | null;
    status?: MilestoneStatus;
    target_date?: string | null;
    assignee_id?: string | null;
    priority?: SubMilestonePriority;
    notes?: string | null;
    position?: number;
}

// Milestone status configuration for UI
export const MILESTONE_STATUS_CONFIG: Record<MilestoneStatus, { label: string; color: string; bgColor: string; icon: string }> = {
    not_started: {
        label: 'Not Started',
        color: 'text-gray-500',
        bgColor: 'bg-gray-100 dark:bg-gray-800',
        icon: '○'
    },
    in_progress: {
        label: 'In Progress',
        color: 'text-blue-500',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        icon: '◐'
    },
    completed: {
        label: 'Completed',
        color: 'text-green-500',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        icon: '●'
    },
    delayed: {
        label: 'Delayed',
        color: 'text-orange-500',
        bgColor: 'bg-orange-100 dark:bg-orange-900/30',
        icon: '⚠'
    },
    cancelled: {
        label: 'Cancelled',
        color: 'text-red-500',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        icon: '✕'
    }
};
