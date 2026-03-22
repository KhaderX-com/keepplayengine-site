"use client";

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import type { SubMilestone, TeamMember, MilestoneStatus, SubMilestonePriority } from '@/types/tasks';
import { MILESTONE_STATUS_CONFIG, PRIORITY_CONFIG } from '@/types/tasks';
import {
    useMilestoneByTask,
    useTeamMembers,
    createMilestone,
    createSubMilestone,
    updateSubMilestone,
    deleteSubMilestone
} from '@/lib/tasks';
import {
    Flag,
    Plus,
    ChevronLeft,
    Calendar,
    MoreVertical,
    Check,
    Clock,
    AlertTriangle,
    X,
    Trash2,
    Edit3
} from 'lucide-react';

export default function MilestoneDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session, status: authStatus } = useSession();
    const taskId = params?.taskId as string;

    const { milestone, loading, error, refetch } = useMilestoneByTask(taskId);
    const { members } = useTeamMembers();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingSubMilestone, setEditingSubMilestone] = useState<SubMilestone | null>(null);
    const [isCreatingMilestone, setIsCreatingMilestone] = useState(false);
    const [selectedMajorNumber, setSelectedMajorNumber] = useState<number>(1);

    useEffect(() => {
        if (authStatus === 'unauthenticated') {
            router.push('/admin/login');
        }
    }, [authStatus, router]);

    // Create milestone record if task is marked as milestone but has no record yet
    const handleCreateMilestoneRecord = async () => {
        if (!taskId) return;

        setIsCreatingMilestone(true);
        try {
            await createMilestone({ task_id: taskId });
            refetch();
        } catch (err) {
            console.error('Failed to create milestone record:', err);
        } finally {
            setIsCreatingMilestone(false);
        }
    };

    if (authStatus === 'loading' || loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !milestone) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <AdminSidebar
                    isMobileMenuOpen={isMobileMenuOpen}
                    onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
                    userRole={session?.user?.role}
                />
                <div className="lg:ml-64">
                    <AdminHeader
                        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    />
                    <main className="p-4 lg:p-6">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center">
                            <Flag className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                No Milestone Found
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">
                                This task doesn&apos;t have a milestone record yet.
                            </p>
                            <button
                                onClick={handleCreateMilestoneRecord}
                                disabled={isCreatingMilestone}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg
                                    hover:bg-purple-700 transition-colors disabled:opacity-50"
                            >
                                {isCreatingMilestone ? 'Creating...' : 'Create Milestone Record'}
                            </button>
                            <button
                                onClick={() => router.back()}
                                className="ml-4 inline-flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300
                                    hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Go Back
                            </button>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    // Group sub-milestones by major number
    const subMilestonesByMajor = milestone.sub_milestones?.reduce((acc, sm) => {
        const major = sm.major_number;
        if (!acc[major]) acc[major] = [];
        acc[major].push(sm);
        return acc;
    }, {} as Record<number, SubMilestone[]>) || {};

    const majorNumbers = Object.keys(subMilestonesByMajor).map(Number).sort((a, b) => a - b);
    const nextMajorNumber = majorNumbers.length > 0 ? Math.max(...majorNumbers) + 1 : 1;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <AdminSidebar
                isMobileMenuOpen={isMobileMenuOpen}
                onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
                userRole={session?.user?.role}
            />

            <div className="lg:ml-64">
                <AdminHeader
                    onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                />

                <main className="p-4 lg:p-6">
                    {/* Header */}
                    <div className="mb-6">
                        <button
                            onClick={() => router.back()}
                            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 
                                hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Back to Tasks
                        </button>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                        <Flag className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {milestone.task?.title || 'Milestone'}
                                    </h1>
                                </div>
                                {milestone.description && (
                                    <p className="text-gray-500 dark:text-gray-400 ml-11">
                                        {milestone.description}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                <div className={`px-3 py-1.5 rounded-full text-sm font-medium
                                    ${MILESTONE_STATUS_CONFIG[milestone.status]?.bgColor || ''} 
                                    ${MILESTONE_STATUS_CONFIG[milestone.status]?.color || ''}`}>
                                    {MILESTONE_STATUS_CONFIG[milestone.status]?.label || milestone.status}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {milestone.progress_percentage}% Complete
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-900 dark:text-white">Overall Progress</h3>
                            <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                {milestone.progress_percentage}%
                            </span>
                        </div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-linear-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500"
                                style={{ width: `${milestone.progress_percentage}%` }}
                            />
                        </div>
                        <div className="flex justify-between mt-2 text-sm text-gray-500 dark:text-gray-400">
                            <span>{milestone.sub_milestones?.filter(sm => sm.status === 'completed').length || 0} completed</span>
                            <span>{milestone.sub_milestones?.length || 0} total sub-milestones</span>
                        </div>
                    </div>

                    {/* Add Sub-Milestone Section */}
                    <div className="flex flex-wrap gap-3 mb-6">
                        <button
                            onClick={() => {
                                setSelectedMajorNumber(nextMajorNumber);
                                setShowAddModal(true);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white 
                                rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Add M{nextMajorNumber}.1
                        </button>

                        {majorNumbers.map(major => (
                            <button
                                key={major}
                                onClick={() => {
                                    setSelectedMajorNumber(major);
                                    setShowAddModal(true);
                                }}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 
                                    text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 
                                    dark:hover:bg-gray-600 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add to M{major}
                            </button>
                        ))}
                    </div>

                    {/* Sub-Milestones Grid */}
                    {majorNumbers.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center">
                            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full 
                                flex items-center justify-center">
                                <Flag className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                No Sub-Milestones Yet
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                                Break down this milestone into smaller, trackable sub-milestones to better manage your progress.
                            </p>
                            <button
                                onClick={() => {
                                    setSelectedMajorNumber(1);
                                    setShowAddModal(true);
                                }}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white 
                                    rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                                Create First Sub-Milestone (M1.1)
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {majorNumbers.map(major => (
                                <div key={major} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-visible">
                                    <div className="px-6 py-4 bg-linear-to-r from-purple-50 to-purple-100 
                                        dark:from-purple-900/20 dark:to-purple-900/10 border-b border-purple-100 dark:border-purple-900/30 rounded-t-2xl">
                                        <h3 className="text-lg font-bold text-purple-900 dark:text-purple-200">
                                            M{major} - Phase {major}
                                        </h3>
                                    </div>

                                    <div className="divide-y divide-gray-100 dark:divide-gray-700 rounded-b-2xl overflow-hidden">
                                        {subMilestonesByMajor[major]
                                            .sort((a, b) => a.minor_number - b.minor_number)
                                            .map(sm => (
                                                <SubMilestoneCard
                                                    key={sm.id}
                                                    subMilestone={sm}
                                                    milestoneId={milestone.id}
                                                    members={members}
                                                    onUpdate={refetch}
                                                    onEdit={() => setEditingSubMilestone(sm)}
                                                />
                                            ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>

            {/* Add Sub-Milestone Modal */}
            {showAddModal && (
                <AddSubMilestoneModal
                    milestoneId={milestone.id}
                    majorNumber={selectedMajorNumber}
                    existingMinorNumbers={
                        subMilestonesByMajor[selectedMajorNumber]?.map(sm => sm.minor_number) || []
                    }
                    members={members}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        setShowAddModal(false);
                        refetch();
                    }}
                />
            )}

            {/* Edit Sub-Milestone Modal */}
            {editingSubMilestone && (
                <EditSubMilestoneModal
                    milestoneId={milestone.id}
                    subMilestone={editingSubMilestone}
                    members={members}
                    onClose={() => setEditingSubMilestone(null)}
                    onSuccess={() => {
                        setEditingSubMilestone(null);
                        refetch();
                    }}
                />
            )}
        </div>
    );
}

// Sub-Milestone Card Component
function SubMilestoneCard({
    subMilestone,
    milestoneId,
    members,
    onUpdate,
    onEdit,
}: {
    subMilestone: SubMilestone;
    milestoneId: string;
    members: TeamMember[];
    onUpdate: () => void;
    onEdit: () => void;
}) {
    const [showMenu, setShowMenu] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, openUpward: false });
    const buttonRef = useRef<HTMLButtonElement>(null);

    const statusConfig = MILESTONE_STATUS_CONFIG[subMilestone.status];
    const priorityConfig = PRIORITY_CONFIG[subMilestone.priority as keyof typeof PRIORITY_CONFIG];
    const assignee = members.find(m => m.id === subMilestone.assignee_id);

    const handleMenuToggle = () => {
        if (!showMenu && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const menuHeight = 200; // Approximate menu height
            const menuWidth = 192; // w-48 = 12rem = 192px
            const spaceBelow = window.innerHeight - rect.bottom;
            const openUpward = spaceBelow < menuHeight;

            setMenuPosition({
                top: openUpward ? rect.top - menuHeight - 8 : rect.bottom + 8,
                left: rect.right - menuWidth,
                openUpward
            });
        }
        setShowMenu(!showMenu);
    };

    const handleStatusChange = async (status: MilestoneStatus) => {
        setIsUpdating(true);
        try {
            await updateSubMilestone(milestoneId, subMilestone.id, { status });
            onUpdate();
        } catch (err) {
            console.error('Failed to update status:', err);
        } finally {
            setIsUpdating(false);
            setShowMenu(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this sub-milestone?')) return;

        setIsUpdating(true);
        try {
            await deleteSubMilestone(milestoneId, subMilestone.id);
            onUpdate();
        } catch (err) {
            console.error('Failed to delete:', err);
        } finally {
            setIsUpdating(false);
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className={`p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors
            ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-start gap-4">
                {/* Status Checkbox */}
                <button
                    aria-label="Toggle completion status"
                    onClick={() => handleStatusChange(
                        subMilestone.status === 'completed' ? 'not_started' : 'completed'
                    )}
                    className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                        ${subMilestone.status === 'completed'
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 dark:border-gray-600 hover:border-green-500'
                        }`}
                >
                    {subMilestone.status === 'completed' && <Check className="w-4 h-4" />}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                                    M{subMilestone.major_number}.{subMilestone.minor_number}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                                    ${priorityConfig?.bgColor || ''} ${priorityConfig?.color || ''}`}>
                                    {priorityConfig?.label || subMilestone.priority}
                                </span>
                            </div>
                            <h4 className={`text-base font-medium text-gray-900 dark:text-white
                                ${subMilestone.status === 'completed' ? 'line-through opacity-60' : ''}`}>
                                {subMilestone.title}
                            </h4>
                            {subMilestone.description && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {subMilestone.description}
                                </p>
                            )}
                        </div>

                        {/* Actions Menu */}
                        <div className="relative">
                            <button
                                ref={buttonRef}
                                onClick={handleMenuToggle}
                                aria-label="More actions"
                                className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                <MoreVertical className="w-4 h-4 text-gray-400" />
                            </button>

                            {showMenu && createPortal(
                                <>
                                    <div
                                        className="fixed inset-0 z-9998"
                                        onClick={() => setShowMenu(false)}
                                    />
                                    <div
                                        className="fixed w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-9999 py-1"
                                        style={{
                                            top: `${menuPosition.top}px`,
                                            left: `${menuPosition.left}px`
                                        }}
                                    >
                                        <button
                                            onClick={() => {
                                                setShowMenu(false);
                                                onEdit();
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300
                                                hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                        >
                                            <Edit3 className="w-4 h-4" /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleStatusChange('in_progress')}
                                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300
                                                hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                        >
                                            <Clock className="w-4 h-4" /> Mark In Progress
                                        </button>
                                        <button
                                            onClick={() => handleStatusChange('delayed')}
                                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300
                                                hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                        >
                                            <AlertTriangle className="w-4 h-4" /> Mark Delayed
                                        </button>
                                        <hr className="my-1 border-gray-200 dark:border-gray-700" />
                                        <button
                                            onClick={handleDelete}
                                            className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400
                                                hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                        >
                                            <Trash2 className="w-4 h-4" /> Delete
                                        </button>
                                    </div>
                                </>,
                                document.body
                            )}
                        </div>
                    </div>

                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-4 mt-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                            ${statusConfig?.bgColor || ''} ${statusConfig?.color || ''}`}>
                            {statusConfig?.icon} {statusConfig?.label || subMilestone.status}
                        </span>

                        {assignee && (
                            <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                                <div
                                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs"
                                    style={{ backgroundColor: assignee.color }}
                                >
                                    {assignee.avatar_url ? (
                                        <Image
                                            src={assignee.avatar_url}
                                            alt={assignee.name}
                                            width={20}
                                            height={20}
                                            className="rounded-full"
                                        />
                                    ) : (
                                        assignee.name.charAt(0).toUpperCase()
                                    )}
                                </div>
                                {assignee.name}
                            </div>
                        )}

                        {subMilestone.target_date && (
                            <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                                <Calendar className="w-4 h-4" />
                                {formatDate(subMilestone.target_date)}
                            </div>
                        )}

                        {subMilestone.completed_at && (
                            <div className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
                                <Check className="w-4 h-4" />
                                Completed {formatDate(subMilestone.completed_at)}
                            </div>
                        )}
                    </div>

                    {subMilestone.notes && (
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2 italic">
                            Note: {subMilestone.notes}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

// Add Sub-Milestone Modal
function AddSubMilestoneModal({
    milestoneId,
    majorNumber,
    existingMinorNumbers,
    members,
    onClose,
    onSuccess,
}: {
    milestoneId: string;
    majorNumber: number;
    existingMinorNumbers: number[];
    members: TeamMember[];
    onClose: () => void;
    onSuccess: () => void;
}) {
    const nextMinorNumber = existingMinorNumbers.length > 0
        ? Math.max(...existingMinorNumbers) + 1
        : 1;

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        target_date: '',
        assignee_id: '',
        priority: 'medium' as SubMilestonePriority,
        notes: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) return;

        setIsSubmitting(true);
        try {
            await createSubMilestone(milestoneId, {
                ...formData,
                major_number: majorNumber,
                minor_number: nextMinorNumber,
                assignee_id: formData.assignee_id || undefined,
                target_date: formData.target_date || undefined,
            });
            onSuccess();
        } catch (err) {
            console.error('Failed to create sub-milestone:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Add Sub-Milestone M{majorNumber}.{nextMinorNumber}
                        </h2>
                        <button
                            onClick={onClose}
                            aria-label="Close"
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Title *
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Enter sub-milestone title"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            placeholder="Optional description"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Priority
                            </label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value as SubMilestonePriority })}
                                title="Priority"
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                    focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Target Date
                            </label>
                            <input
                                type="date"
                                value={formData.target_date}
                                onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                                title="Target Date"
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                    focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Assignee
                        </label>
                        <select
                            value={formData.assignee_id}
                            onChange={(e) => setFormData({ ...formData, assignee_id: e.target.value })}
                            title="Assignee"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            <option value="">Unassigned</option>
                            {members.map(member => (
                                <option key={member.id} value={member.id}>{member.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Notes
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={2}
                            placeholder="Additional notes"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 
                                dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !formData.title.trim()}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 
                                transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Creating...' : `Create M${majorNumber}.${nextMinorNumber}`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Edit Sub-Milestone Modal
function EditSubMilestoneModal({
    milestoneId,
    subMilestone,
    members,
    onClose,
    onSuccess,
}: {
    milestoneId: string;
    subMilestone: SubMilestone;
    members: TeamMember[];
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [formData, setFormData] = useState({
        title: subMilestone.title,
        description: subMilestone.description || '',
        target_date: subMilestone.target_date ? subMilestone.target_date.split('T')[0] : '',
        assignee_id: subMilestone.assignee_id || '',
        priority: subMilestone.priority,
        status: subMilestone.status,
        notes: subMilestone.notes || '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) return;

        setIsSubmitting(true);
        try {
            await updateSubMilestone(milestoneId, subMilestone.id, {
                ...formData,
                assignee_id: formData.assignee_id || null,
                target_date: formData.target_date || null,
                description: formData.description || null,
                notes: formData.notes || null,
            });
            onSuccess();
        } catch (err) {
            console.error('Failed to update sub-milestone:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Edit M{subMilestone.major_number}.{subMilestone.minor_number}
                        </h2>
                        <button
                            onClick={onClose}
                            aria-label="Close"
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Title *
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Enter sub-milestone title"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            placeholder="Optional description"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Status
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as MilestoneStatus })}
                                title="Status"
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                    focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="not_started">Not Started</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="delayed">Delayed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Priority
                            </label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value as SubMilestonePriority })}
                                title="Priority"
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                    focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Target Date
                        </label>
                        <input
                            type="date"
                            value={formData.target_date}
                            onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                            title="Target Date"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Assignee
                        </label>
                        <select
                            value={formData.assignee_id}
                            onChange={(e) => setFormData({ ...formData, assignee_id: e.target.value })}
                            title="Assignee"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            <option value="">Unassigned</option>
                            {members.map(member => (
                                <option key={member.id} value={member.id}>{member.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Notes
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={2}
                            placeholder="Additional notes"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 
                                dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !formData.title.trim()}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 
                                transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
