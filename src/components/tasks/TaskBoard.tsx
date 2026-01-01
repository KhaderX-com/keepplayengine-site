"use client";

import { useState } from 'react';
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

export default function TaskBoard({
    tasks,
    members,
    onUpdate,
    onOpenDetail,
    onAddTask,
}: TaskBoardProps) {
    const [draggedTask, setDraggedTask] = useState<Task | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

    const columns: { id: TaskStatus; title: string; color: string }[] = [
        { id: 'todo', title: 'To Do', color: 'bg-gray-500' },
        { id: 'in_progress', title: 'In Progress', color: 'bg-blue-500' },
        { id: 'done', title: 'Done', color: 'bg-green-500' },
    ];

    const getTasksByStatus = (status: TaskStatus) => {
        return tasks.filter(task => task.status === status);
    };

    const handleDragStart = (task: Task) => {
        setDraggedTask(task);
    };

    const handleDragEnd = () => {
        setDraggedTask(null);
        setDragOverColumn(null);
    };

    const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
        e.preventDefault();
        setDragOverColumn(status);
    };

    const handleDrop = async (e: React.DragEvent, newStatus: TaskStatus) => {
        e.preventDefault();

        if (draggedTask && draggedTask.status !== newStatus) {
            try {
                await updateTask(draggedTask.id, { status: newStatus });
                onUpdate();
            } catch (error) {
                console.error('Failed to update task status:', error);
            }
        }

        setDraggedTask(null);
        setDragOverColumn(null);
    };

    return (
        <div className="h-full overflow-x-auto pb-4">
            <div className="flex gap-4 sm:gap-6 min-w-max lg:min-w-0 h-full px-4 sm:px-0">
                {columns.map((column) => {
                    const columnTasks = getTasksByStatus(column.id);
                    const isDragOver = dragOverColumn === column.id;

                    return (
                        <div
                            key={column.id}
                            className={`flex-1 min-w-70 sm:min-w-80 lg:min-w-0 flex flex-col
                                bg-gray-100 dark:bg-gray-800/50 rounded-2xl transition-all duration-200
                                ${isDragOver ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900' : ''}`}
                            onDragOver={(e) => handleDragOver(e, column.id)}
                            onDrop={(e) => handleDrop(e, column.id)}
                            onDragLeave={() => setDragOverColumn(null)}
                        >
                            {/* Column Header */}
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

                            {/* Tasks */}
                            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                                {columnTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        draggable
                                        onDragStart={() => handleDragStart(task)}
                                        onDragEnd={handleDragEnd}
                                        className="cursor-grab active:cursor-grabbing"
                                    >
                                        <TaskCard
                                            task={task}
                                            members={members}
                                            onUpdate={onUpdate}
                                            onOpenDetail={onOpenDetail}
                                            isDragging={draggedTask?.id === task.id}
                                        />
                                    </div>
                                ))}

                                {/* Empty State */}
                                {columnTasks.length === 0 && (
                                    <div className={`flex flex-col items-center justify-center py-8 px-4 
                                        rounded-xl border-2 border-dashed transition-colors
                                        ${isDragOver
                                            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-300 dark:border-gray-600'
                                        }`}>
                                        <svg className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                        <p className="text-sm text-gray-400 dark:text-gray-500 text-center mb-3">
                                            {isDragOver ? 'Drop task here' : 'No tasks yet'}
                                        </p>
                                        {!isDragOver && (
                                            <button
                                                onClick={() => onAddTask(column.id)}
                                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                            >
                                                + Add a task
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
