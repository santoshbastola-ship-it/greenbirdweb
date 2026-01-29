"use client";

import { useState } from "react";
import { X, Calendar, User, AlignLeft, AlertCircle, Repeat, Edit2, Trash2 } from "lucide-react";
import { TaskItem, TaskPriority, TaskStatus } from "@/types";
import { TaskService } from "@/services/task.service";
import AddTaskModal from "./AddTaskModal";

interface TaskDetailsModalProps {
    task: TaskItem;
    onClose: () => void;
    onUpdate: () => void;
}

export default function TaskDetailsModal({ task, onClose, onUpdate }: TaskDetailsModalProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'urgent': return "text-red-600 bg-red-50 border-red-200";
            case 'high': return "text-orange-600 bg-orange-50 border-orange-200";
            case 'medium': return "text-blue-600 bg-blue-50 border-blue-200";
            default: return "text-gray-600 bg-gray-50 border-gray-200";
        }
    };

    const getStatusColor = (s: string) => {
        switch (s) {
            case 'done': return "text-green-600 bg-green-50 border-green-200";
            case 'inProgress': return "text-blue-600 bg-blue-50 border-blue-200";
            default: return "text-gray-600 bg-gray-50 border-gray-200";
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this task?")) return;

        setIsDeleting(true);
        try {
            await TaskService.deleteTask(task.id);
            onUpdate();
            onClose();
        } catch (error) {
            console.error("Error deleting task:", error);
            alert("Failed to delete task");
            setIsDeleting(false);
        }
    };

    // Date formatting helper
    const formatDate = (date: any) => {
        if (!date) return "N/A";
        if (typeof date === 'string') return date;
        // Basic fallback if needed
        return "N/A";
    };


    const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value as TaskStatus;
        try {
            // Optimistic UI update could be tricky with props, but we can call onUpdate which refreshes parent
            await TaskService.updateTask(task.id, { status: newStatus });
            onUpdate();
        } catch (error) {
            console.error("Failed to update status:", error);
            alert("Failed to update status");
        }
    };

    if (isEditing) {
        return (
            <AddTaskModal
                task={task}
                onClose={() => setIsEditing(false)}
                onSuccess={() => {
                    setIsEditing(false);
                    onUpdate();
                }}
            />
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-start justify-between sticky top-0 bg-white z-10 gap-3">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 break-words">{task.title}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                                {task.priority} Priority
                            </span>

                            {/* Status Dropdown */}
                            <div className="relative">
                                <select
                                    value={task.status}
                                    onChange={handleStatusChange}
                                    className={`appearance-none pl-2 pr-6 py-0.5 rounded-full text-xs font-medium border cursor-pointer outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${getStatusColor(task.status)}`}
                                >
                                    <option value={TaskStatus.Open}>Open</option>
                                    <option value={TaskStatus.InProgress}>In Progress</option>
                                    <option value={TaskStatus.Done}>Done</option>
                                </select>
                                {/* Custom arrow to make it look cleaner if needed, or rely on browser default but styled */}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsEditing(true)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                            title="Edit Task"
                        >
                            <Edit2 className="h-5 w-5" />
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="Delete Task"
                        >
                            <Trash2 className="h-5 w-5" />
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="h-6 w-6 text-gray-500" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-8">
                    {/* Description */}
                    <div>
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <AlignLeft className="h-3 w-3" /> Description
                        </h4>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 min-h-[100px]">
                            {task.description ? (
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.description}</p>
                            ) : (
                                <p className="text-sm text-gray-400 italic">No description provided.</p>
                            )}
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Details</h4>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-sm">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">Due Date</p>
                                        <p className="font-medium text-gray-900">{formatDate(task.dueDate)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <User className="h-4 w-4 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">Assigned To</p>
                                        <p className="font-medium text-gray-900">{task.assignedTo || "Unassigned"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Settings</h4>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-sm">
                                    <Repeat className="h-4 w-4 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">Repetition</p>
                                        <p className="font-medium text-gray-900 capitalize">{task.repetition?.replace(/([A-Z])/g, ' $1').trim() || "Does Not Repeat"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end sticky bottom-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-100 transition-colors shadow-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
