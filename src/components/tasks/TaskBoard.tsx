"use client";

import { useState, useEffect } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    MouseSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
    DragOverEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task, TaskStatus, TeamMember } from '@/types/tasks';
import { updateTask } from '@/lib/tasks';
import TaskCard from './TaskCard';

interface TaskBoardProps {
    tasks: Task[];
    members: TeamMember[];
    onUpdate: () => void;
    onOpenDetail: (task: Task) => void;
    onAddTask: (status: TaskStatus) => void;
}

// Sortable wrapper for TaskCard
function SortableTaskCard({
    task,
    members,
    onUpdate,
    onOpenDetail,
}: {
    task: Task;
    members: TeamMember[];
    onUpdate: () => void;
    onOpenDetail: (task: Task) => void;
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
        // Inline styles required for @dnd-kit animations
        // eslint-disable-next-line react/forbid-dom-props
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <TaskCard
                task={task}
                members={members}
                onUpdate={onUpdate}
                onOpenDetail={onOpenDetail}
                isDragging={isDragging}
            />
        </div>
    );
}

export default function TaskBoard({
    tasks,
    members,
    onUpdate,
    onOpenDetail,
    onAddTask,
}: TaskBoardProps) {
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [localTasks, setLocalTasks] = useState<Task[]>(tasks);
    const [activeColumn, setActiveColumn] = useState<TaskStatus>('todo');
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile viewport
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Update local tasks when props change
    useEffect(() => {
        setLocalTasks(tasks);
    }, [tasks]);

    // Enhanced sensors with touch support for mobile
    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 10,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250, // Long press delay for touch devices
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const columns: { id: TaskStatus; title: string; color: string }[] = [
        { id: 'todo', title: 'To Do', color: 'bg-gray-500' },
        { id: 'in_progress', title: 'In Progress', color: 'bg-blue-500' },
        { id: 'done', title: 'Done', color: 'bg-green-500' },
    ];

    const getTasksByStatus = (status: TaskStatus) => {
        return localTasks
            .filter(task => task.status === status)
            .sort((a, b) => a.position - b.position);
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const task = localTasks.find(t => t.id === active.id);
        setActiveTask(task || null);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeTask = localTasks.find(t => t.id === active.id);
        if (!activeTask) return;

        // Check if we're dragging over a different column
        const overColumn = columns.find(col => col.id === over.id);
        if (overColumn && activeTask.status !== overColumn.id) {
            // Update task status optimistically
            setLocalTasks(prev =>
                prev.map(t =>
                    t.id === active.id ? { ...t, status: overColumn.id } : t
                )
            );
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTask(null);

        if (!over) return;

        const activeTask = localTasks.find(t => t.id === active.id);
        if (!activeTask) return;

        // Get the target column (either from a column drop zone or from another task)
        let targetStatus = activeTask.status;
        const overColumn = columns.find(col => col.id === over.id);
        if (overColumn) {
            targetStatus = overColumn.id;
        } else {
            const overTask = localTasks.find(t => t.id === over.id);
            if (overTask) {
                targetStatus = overTask.status;
            }
        }

        // Get tasks in the target column
        const columnTasks = localTasks
            .filter(t => t.status === targetStatus)
            .sort((a, b) => a.position - b.position);

        const oldIndex = columnTasks.findIndex(t => t.id === active.id);
        const newIndex = columnTasks.findIndex(t => t.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
            // Reorder within the same column
            const reordered = arrayMove(columnTasks, oldIndex, newIndex);

            // Update positions
            const updatedTasks = localTasks.map(task => {
                const reorderedTask = reordered.find(t => t.id === task.id);
                if (reorderedTask) {
                    const newPosition = reordered.indexOf(reorderedTask);
                    return { ...task, position: newPosition };
                }
                return task;
            });

            setLocalTasks(updatedTasks);

            // Update positions in the backend
            try {
                await Promise.all(
                    reordered.map((task, index) =>
                        updateTask(task.id, { position: index })
                    )
                );
                onUpdate();
            } catch (error) {
                console.error('Failed to update task positions:', error);
                setLocalTasks(tasks); // Revert on error
            }
        } else if (activeTask.status !== targetStatus) {
            // Moving to a different column
            try {
                const newPosition = columnTasks.length;
                await updateTask(activeTask.id, {
                    status: targetStatus,
                    position: newPosition,
                });
                onUpdate();
            } catch (error) {
                console.error('Failed to update task status:', error);
                setLocalTasks(tasks); // Revert on error
            }
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="h-full flex flex-col">
                {/* Mobile Tab Navigation */}
                {isMobile && (
                    <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
                        {columns.map((column) => {
                            const columnTasks = getTasksByStatus(column.id);
                            const isActive = activeColumn === column.id;
                            return (
                                <button
                                    key={column.id}
                                    onClick={() => setActiveColumn(column.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all touch-manipulation
                                        ${isActive
                                            ? 'bg-blue-600 text-white shadow-md scale-105'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : column.color}`} />
                                    <span>{column.title}</span>
                                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold
                                        ${isActive ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                        {columnTasks.length}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Board Container */}
                <div className="flex-1 overflow-hidden">
                    {isMobile ? (
                        // Mobile: Single Column View
                        <div className="h-full">
                            {columns.map((column) => {
                                if (column.id !== activeColumn) return null;
                                const columnTasks = getTasksByStatus(column.id);

                                return (
                                    <div key={column.id} className="h-full flex flex-col bg-gray-50 dark:bg-gray-900/50">
                                        {/* Mobile Column Header */}
                                        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full ${column.color}`} />
                                                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                                                    {column.title}
                                                </h3>
                                            </div>
                                            <button
                                                onClick={() => onAddTask(column.id)}
                                                className="p-2 rounded-xl bg-blue-600 text-white shadow-lg active:scale-95 transition-transform touch-manipulation"
                                                title={`Add task to ${column.title}`}
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                                </svg>
                                            </button>
                                        </div>

                                        {/* Mobile Tasks List */}
                                        <SortableContext
                                            items={columnTasks.map(t => t.id)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                                                {columnTasks.map((task) => (
                                                    <SortableTaskCard
                                                        key={task.id}
                                                        task={task}
                                                        members={members}
                                                        onUpdate={onUpdate}
                                                        onOpenDetail={onOpenDetail}
                                                    />
                                                ))}

                                                {columnTasks.length === 0 && (
                                                    <div className="flex flex-col items-center justify-center py-16 px-4">
                                                        <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                                                            <svg className="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                            </svg>
                                                        </div>
                                                        <p className="text-base text-gray-500 dark:text-gray-400 text-center mb-4 font-medium">
                                                            No tasks yet
                                                        </p>
                                                        <button
                                                            onClick={() => onAddTask(column.id)}
                                                            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium shadow-lg hover:bg-blue-700 active:scale-95 transition-all touch-manipulation"
                                                        >
                                                            + Add your first task
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </SortableContext>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        // Desktop: Multi-Column Board View
                        <div className="h-full overflow-x-auto pb-4">
                            <div className="flex gap-4 sm:gap-6 min-w-max lg:min-w-0 h-full px-4 sm:px-0">
                                {columns.map((column) => {
                                    const columnTasks = getTasksByStatus(column.id);

                                    return (
                                        <div
                                            key={column.id}
                                            className="flex-1 min-w-[320px] lg:min-w-0 flex flex-col
                                                bg-gray-100 dark:bg-gray-800/50 rounded-2xl transition-all duration-200"
                                        >
                                            {/* Desktop Column Header */}
                                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-3 h-3 rounded-full ${column.color}`} />
                                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                                        {column.title}
                                                    </h3>
                                                    <span className="px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 
                                                        text-xs font-medium text-gray-600 dark:text-gray-300">
                                                        {columnTasks.length}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => onAddTask(column.id)}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 
                                                        hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-95"
                                                    title={`Add task to ${column.title}`}
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                    </svg>
                                                </button>
                                            </div>

                                            {/* Desktop Tasks */}
                                            <SortableContext
                                                items={columnTasks.map(t => t.id)}
                                                strategy={verticalListSortingStrategy}
                                            >
                                                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                                                    {columnTasks.map((task) => (
                                                        <SortableTaskCard
                                                            key={task.id}
                                                            task={task}
                                                            members={members}
                                                            onUpdate={onUpdate}
                                                            onOpenDetail={onOpenDetail}
                                                        />
                                                    ))}

                                                    {/* Empty State */}
                                                    {columnTasks.length === 0 && (
                                                        <div className="flex flex-col items-center justify-center py-8 px-4 
                                                            rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                                                            <svg className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                            </svg>
                                                            <p className="text-sm text-gray-400 dark:text-gray-500 text-center mb-3">
                                                                No tasks yet
                                                            </p>
                                                            <button
                                                                onClick={() => onAddTask(column.id)}
                                                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                                            >
                                                                + Add a task
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </SortableContext>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Drag Overlay */}
            <DragOverlay>
                {activeTask ? (
                    <div className="opacity-50">
                        <TaskCard
                            task={activeTask}
                            members={members}
                            onUpdate={onUpdate}
                            onOpenDetail={onOpenDetail}
                            isDragging={true}
                        />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
