'use client';

import { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, Check, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TaskLabel {
    id: string;
    name: string;
    color: string;
    description?: string | null;
    created_at: string;
}

interface LabelManagementProps {
    onLabelsChange?: () => void;
}

export default function LabelManagement({ onLabelsChange }: LabelManagementProps) {
    const [labels, setLabels] = useState<TaskLabel[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [editingLabel, setEditingLabel] = useState<TaskLabel | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        color: '#6B7280',
        description: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchLabels();
    }, []);

    const fetchLabels = async () => {
        try {
            const response = await fetch('/api/tasks/labels');
            if (!response.ok) throw new Error('Failed to fetch labels');
            const data = await response.json();
            setLabels(data.labels || []);
        } catch (err) {
            console.error('Error fetching labels:', err);
            setError('Failed to load labels');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingLabel(null);
        setFormData({
            name: '',
            color: '#6B7280',
            description: '',
        });
        setError(null);
        setShowDialog(true);
    };

    const handleEdit = (label: TaskLabel) => {
        setEditingLabel(label);
        setFormData({
            name: label.name,
            color: label.color,
            description: label.description || '',
        });
        setError(null);
        setShowDialog(true);
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            setError('Label name is required');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const url = editingLabel
                ? `/api/tasks/labels/${editingLabel.id}`
                : '/api/tasks/labels';

            const method = editingLabel ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to save label');
            }

            await fetchLabels();
            setShowDialog(false);
            onLabelsChange?.();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to save label');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (label: TaskLabel) => {
        if (!confirm(`Are you sure you want to delete "${label.name}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/tasks/labels/${label.id}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete label');
            }

            await fetchLabels();
            onLabelsChange?.();
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : 'Failed to delete label');
        }
    };

    const predefinedColors = [
        '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
        '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6',
        '#6366F1', '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
        '#F43F5E', '#78716C', '#64748B', '#6B7280', '#374151',
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Tag className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Task Labels</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {labels.length} label{labels.length !== 1 ? 's' : ''} available
                        </p>
                    </div>
                </div>
                <Button onClick={handleCreate} className="gap-2 shadow-lg">
                    <Plus className="w-4 h-4" />
                    Create Label
                </Button>
            </div>

            {/* Labels Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {labels.map((label) => (
                    <div
                        key={label.id}
                        className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-4 flex-1 min-w-0">
                                {/* eslint-disable-next-line react/forbid-dom-props */}
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-md group-hover:shadow-lg transition-shadow"
                                    style={{ backgroundColor: label.color }}
                                >
                                    <Tag className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 dark:text-white text-base truncate">
                                        {label.name}
                                    </h3>
                                    {label.description && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5 line-clamp-2">
                                            {label.description}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-2 mt-3">
                                        <span className="inline-flex items-center gap-1 text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                            {label.color}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleEdit(label)}
                                    className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 transition-colors"
                                    title="Edit label"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(label)}
                                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400 transition-colors"
                                    title="Delete label"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {labels.length === 0 && (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="w-16 h-16 bg-linear-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Tag className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No labels yet</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                        Create your first label to start organizing your tasks more effectively
                    </p>
                    <Button onClick={handleCreate} className="gap-2 shadow-lg">
                        <Plus className="w-4 h-4" />
                        Create Your First Label
                    </Button>
                </div>
            )}

            {/* Create/Edit Modal */}
            {showDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setShowDialog(false)}
                    />

                    {/* Modal */}
                    <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                {editingLabel ? 'Edit Label' : 'Create New Label'}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {editingLabel
                                    ? 'Update the label information below'
                                    : 'Add a new label to categorize your tasks'}
                            </p>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-4 space-y-4">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="name">Label Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    placeholder="e.g., Bug, Feature, Enhancement"
                                    maxLength={50}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="color">Color *</Label>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Input
                                            id="color"
                                            type="text"
                                            value={formData.color}
                                            onChange={(e) =>
                                                setFormData({ ...formData, color: e.target.value })
                                            }
                                            placeholder="#6B7280"
                                            maxLength={7}
                                            className="flex-1"
                                        />
                                        {/* eslint-disable-next-line react/forbid-dom-props */}
                                        <div
                                            className="w-12 h-10 rounded border border-gray-300"
                                            style={{ backgroundColor: formData.color }}
                                        />
                                    </div>
                                    <div className="grid grid-cols-10 gap-2">
                                        {predefinedColors.map((color) => (
                                            /* eslint-disable-next-line react/forbid-dom-props */
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, color })}
                                                className={`w-8 h-8 rounded border-2 transition-all hover:scale-110 ${formData.color === color
                                                        ? 'border-gray-900 ring-2 ring-offset-2 ring-gray-900'
                                                        : 'border-gray-200'
                                                    }`}
                                                style={{ backgroundColor: color }}
                                                title={color}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                    placeholder="Brief description of when to use this label"
                                    rows={3}
                                    maxLength={200}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                    resize-none"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowDialog(false)}
                                disabled={submitting}
                                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                                    text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700
                                    disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Cancel
                            </button>
                            <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
                                {submitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4" />
                                        {editingLabel ? 'Update Label' : 'Create Label'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
