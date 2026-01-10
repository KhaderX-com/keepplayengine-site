"use client";

import type { Task, TaskStatus, TeamMember } from '@/types/tasks';
import TaskBoard from './TaskBoard';

interface SingleColumnBoardProps {
    tasks: Task[];
    members: TeamMember[];
    onUpdate: () => void;
    onOpenDetail: (task: Task) => void;
    onAddTask: (status: TaskStatus) => void;
    onSubtaskUpdate?: (parentTaskId: string, updatedSubtask: Task) => void;
    onSubtaskDelete?: (parentTaskId: string, deletedSubtaskId: string) => void;
    focusStatus: TaskStatus;
}

export default function SingleColumnBoard({
    tasks,
    members,
    onUpdate,
    onOpenDetail,
    onAddTask,
    onSubtaskUpdate,
    onSubtaskDelete,
    focusStatus,
}: SingleColumnBoardProps) {
    // Filter tasks to show only the focused status
    const filteredTasks = tasks.filter(task => task.status === focusStatus);

    return (
        <TaskBoard
            tasks={filteredTasks}
            members={members}
            onUpdate={onUpdate}
            onOpenDetail={onOpenDetail}
            onAddTask={onAddTask}
            onSubtaskUpdate={onSubtaskUpdate}
            onSubtaskDelete={onSubtaskDelete}
            singleColumn={focusStatus}
        />
    );
}
