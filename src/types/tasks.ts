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
    creator?: TeamMember | null;
    labels?: TaskLabel[];
    subtasks?: Task[];
    subtask_count?: number;
    completed_subtask_count?: number;
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

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bgColor: string }> = {
    low: { label: 'Low', color: 'text-gray-500', bgColor: 'bg-gray-100 dark:bg-gray-800' },
    medium: { label: 'Medium', color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
    high: { label: 'High', color: 'text-orange-500', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
    urgent: { label: 'Urgent', color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/30' },
};

export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bgColor: string; icon: string }> = {
    todo: { label: 'To Do', color: 'text-gray-500', bgColor: 'bg-gray-500', icon: '○' },
    in_progress: { label: 'In Progress', color: 'text-blue-500', bgColor: 'bg-blue-500', icon: '◐' },
    done: { label: 'Done', color: 'text-green-500', bgColor: 'bg-green-500', icon: '●' },
};
