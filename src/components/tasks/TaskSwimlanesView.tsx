"use client";

import { useState } from 'react';
import type { Task, TaskStatus, TeamMember } from '@/types/tasks';
import { Users } from 'lucide-react';
import {
    DndContext,
    DragOverlay,
    closestCenter,
    KeyboardSensor,
    TouchSensor,
    MouseSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { updateTask } from '@/lib/tasks';
import TaskCard from './TaskCard';

interface TaskSwimlanesViewProps {
    tasks: Task[];
    members: TeamMember[];
    onUpdate: () => void;
    onOpenDetail: (task: Task) => void;
    onAddTask: (status: TaskStatus) => void;
    onSubtaskUpdate?: (parentTaskId: string, updatedSubtask: Task) => void;
    onSubtaskDelete?: (parentTaskId: string, deletedSubtaskId: string) => void;
}

interface SwimlaneTask extends Task {
    swimlaneId: string;
}

function SortableTaskCard({
    task,
    members,
    onUpdate,
    onOpenDetail,
    onSubtaskUpdate,
    onSubtaskDelete,
}: {
    task: Task;
    members: TeamMember[];
    onUpdate: () => void;
    onOpenDetail: (task: Task) => void;
    onSubtaskUpdate?: (parentTaskId: string, updatedSubtask: Task) => void;
    onSubtaskDelete?: (parentTaskId: string, deletedSubtaskId: string) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <TaskCard
                task={task}
                members={members}
                onUpdate={onUpdate}
                onOpenDetail={onOpenDetail}
                onSubtaskUpdate={onSubtaskUpdate}
                onSubtaskDelete={onSubtaskDelete}
                isDragging={isDragging}
            />
        </div>
    );
}

export default function TaskSwimlanesView({
    tasks,
    members,
    onUpdate,
    onOpenDetail,
    onAddTask,
    onSubtaskUpdate,
    onSubtaskDelete,
}: TaskSwimlanesViewProps) {
    const [activeTask, setActiveTask] = useState<SwimlaneTask | null>(null);

    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: { distance: 8 },
        }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 200, tolerance: 6 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Group tasks by assignee and status
    const swimlanes = members.map(member => {
        const memberTasks = tasks.filter(t => t.assignee_id === member.id);
        return {
            member,
            statuses: {
                todo: memberTasks.filter(t => t.status === 'todo'),
                in_progress: memberTasks.filter(t => t.status === 'in_progress'),
                done: memberTasks.filter(t => t.status === 'done'),
            },
            total: memberTasks.length,
        };
    });

    // Add unassigned swimlane
    const unassignedTasks = tasks.filter(t => !t.assignee_id);
    const unassignedSwimlane = {
        member: null,
        statuses: {
            todo: unassignedTasks.filter(t => t.status === 'todo'),
            in_progress: unassignedTasks.filter(t => t.status === 'in_progress'),
            done: unassignedTasks.filter(t => t.status === 'done'),
        },
        total: unassignedTasks.length,
    };

    const handleDragStart = (event: DragStartEvent) => {
        const taskId = event.active.id as string;
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            setActiveTask({
                ...task,
                swimlaneId: task.assignee_id || 'unassigned',
            });
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTask(null);

        if (!over || active.id === over.id) return;

        const task = tasks.find(t => t.id === active.id);
        if (!task) return;

        // Parse the drop target
        const overId = over.id as string;
        const [targetType, targetValue, targetMemberId] = overId.split('-');

        if (targetType === 'status') {
            const newStatus = targetValue as TaskStatus;
            const newAssigneeId = targetMemberId === 'unassigned' ? null : targetMemberId;

            // Update if status or assignee changed
            if (task.status !== newStatus || task.assignee_id !== newAssigneeId) {
                try {
                    await updateTask(task.id, {
                        status: newStatus,
                        assignee_id: newAssigneeId,
                    });
                    onUpdate();
                } catch (error) {
                    console.error('Error updating task:', error);
                }
            }
        }
    };

    const getStatusColor = (status: TaskStatus) => {
        switch (status) {
            case 'todo':
                return 'bg-gray-100 dark:bg-gray-900';
            case 'in_progress':
                return 'bg-blue-50 dark:bg-blue-900/20';
            case 'done':
                return 'bg-green-50 dark:bg-green-900/20';
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {/* Header */}
                <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                                Swimlanes by Assignee
                            </h2>
                            <span className="px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300">
                                {tasks.length}
                            </span>
                        </div>

                        <button
                            onClick={() => onAddTask('todo')}
                            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-95 transition-all font-medium text-sm touch-manipulation"
                        >
                            + Add Task
                        </button>
                    </div>
                </div>

                {/* Status Column Headers */}
                <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                    <div className="grid grid-cols-[180px_minmax(200px,1fr)_minmax(200px,1fr)_minmax(200px,1fr)] sm:grid-cols-[200px_1fr_1fr_1fr] gap-2 sm:gap-4 px-3 sm:px-6 py-2 sm:py-3 min-w-[700px]">
                        <div className="font-semibold text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            ASSIGNEE
                        </div>
                        <div className="font-semibold text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center">
                            TO DO
                        </div>
                        <div className="font-semibold text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center">
                            IN PROGRESS
                        </div>
                        <div className="font-semibold text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center">
                            DONE
                        </div>
                    </div>
                </div>

                {/* Swimlanes */}
                <div className="divide-y divide-gray-200 dark:divide-gray-700 overflow-x-auto">
                    {/* Member Swimlanes */}
                    {swimlanes.map(({ member, statuses, total }) => (
                        <div key={member.id} className="grid grid-cols-[180px_minmax(200px,1fr)_minmax(200px,1fr)_minmax(200px,1fr)] sm:grid-cols-[200px_1fr_1fr_1fr] gap-2 sm:gap-4 px-3 sm:px-6 py-3 sm:py-4 min-w-[700px]">
                            {/* Member Info */}
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div
                                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-semibold shrink-0"
                                    style={{ backgroundColor: member.color }}
                                >
                                    {member.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm sm:text-base text-gray-900 dark:text-white truncate">
                                        {member.name}
                                    </div>
                                    <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                                        {total} tasks
                                    </div>
                                </div>
                            </div>

                            {/* Status Columns */}
                            {(['todo', 'in_progress', 'done'] as TaskStatus[]).map(status => {
                                const statusTasks = statuses[status];
                                const dropId = `status-${status}-${member.id}`;

                                return (
                                    <SortableContext
                                        key={status}
                                        items={statusTasks.map(t => t.id)}
                                        strategy={verticalListSortingStrategy}
                                        id={dropId}
                                    >
                                        <div
                                            className={`min-h-[120px] p-3 rounded-lg ${getStatusColor(status)} border-2 border-dashed border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-colors`}
                                        >
                                            <div className="space-y-2">
                                                {statusTasks.map(task => (
                                                    <SortableTaskCard
                                                        key={task.id}
                                                        task={task}
                                                        members={members}
                                                        onUpdate={onUpdate}
                                                        onOpenDetail={onOpenDetail}
                                                        onSubtaskUpdate={onSubtaskUpdate}
                                                        onSubtaskDelete={onSubtaskDelete}
                                                    />
                                                ))}
                                                {statusTasks.length === 0 && (
                                                    <div className="text-center py-4 text-xs text-gray-400 dark:text-gray-500">
                                                        No tasks
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </SortableContext>
                                );
                            })}
                        </div>
                    ))}

                    {/* Unassigned Swimlane */}
                    {unassignedTasks.length > 0 && (
                        <div className="grid grid-cols-[180px_minmax(200px,1fr)_minmax(200px,1fr)_minmax(200px,1fr)] sm:grid-cols-[200px_1fr_1fr_1fr] gap-2 sm:gap-4 px-3 sm:px-6 py-3 sm:py-4 bg-gray-50 dark:bg-gray-900/30 min-w-[700px]">
                            {/* Unassigned Info */}
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 shrink-0">
                                    <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">
                                        Unassigned
                                    </div>
                                    <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                                        {unassignedSwimlane.total} tasks
                                    </div>
                                </div>
                            </div>

                            {/* Status Columns */}
                            {(['todo', 'in_progress', 'done'] as TaskStatus[]).map(status => {
                                const statusTasks = unassignedSwimlane.statuses[status];
                                const dropId = `status-${status}-unassigned`;

                                return (
                                    <SortableContext
                                        key={status}
                                        items={statusTasks.map(t => t.id)}
                                        strategy={verticalListSortingStrategy}
                                        id={dropId}
                                    >
                                        <div
                                            className={`min-h-[120px] p-3 rounded-lg ${getStatusColor(status)} border-2 border-dashed border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-colors`}
                                        >
                                            <div className="space-y-2">
                                                {statusTasks.map(task => (
                                                    <SortableTaskCard
                                                        key={task.id}
                                                        task={task}
                                                        members={members}
                                                        onUpdate={onUpdate}
                                                        onOpenDetail={onOpenDetail}
                                                        onSubtaskUpdate={onSubtaskUpdate}
                                                        onSubtaskDelete={onSubtaskDelete}
                                                    />
                                                ))}
                                                {statusTasks.length === 0 && (
                                                    <div className="text-center py-4 text-xs text-gray-400 dark:text-gray-500">
                                                        No tasks
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </SortableContext>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Drag Overlay */}
            <DragOverlay>
                {activeTask ? (
                    <TaskCard
                        task={activeTask}
                        members={members}
                        onUpdate={onUpdate}
                        onOpenDetail={onOpenDetail}
                        isDragging
                    />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
