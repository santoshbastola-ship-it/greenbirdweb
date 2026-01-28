"use client";

import { useState } from "react";
import { X, Plus, Trash2, Edit2, Save, AlertCircle, ChevronDown, Check } from "lucide-react";
import { TaskItem, TaskPriority, TaskStatus, TaskRepetition } from "@/types";
import { TaskService } from "@/services/task.service";

interface BulkAddTaskModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

// Temporary interface for pending tasks before they are full TaskItems
interface PendingTask {
    tempId: string;
    title: string;
    priority: TaskPriority;
    status: TaskStatus;
    // We can store other fields if edited
    description?: string;
    assignedTo?: string;
    dueDate?: string | Date;
    repetition?: TaskRepetition;
}

export default function BulkAddTaskModal({ onClose, onSuccess }: BulkAddTaskModalProps) {
    const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
    const [currentTitle, setCurrentTitle] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingTaskTempId, setEditingTaskTempId] = useState<string | null>(null);

    // State for the "Edit" modal (reusing TaskDetailsModal or a similar form?)
    // Actually, reusing TaskDetails might be complex because it expects a saved TaskItem.
    // Let's us a simplified edit view or just open a modified version of AddTaskModal?
    // OR: We can just expand the item in the list to show more fields.
    // Let's try expanding the item in the list or a separate small modal for "Edit Details".
    // For simplicity as requested: "user likes will add".
    // So let's allow basic editing.

    // To reusing existing UI, maybe we just mock a TaskItem for TaskDetailsModal?
    // But TaskDetailsModal usually fetches or updates directly.
    // Let's stick to a simple inline expansion or a side modal. 
    // Given the requirement "hide other details which if user likes will add", 
    // let's assume clicking "Edit" opens a minimal form or the full form in a modal state.

    // Let's create a temporary TaskItem for the editing modal
    const [taskToEdit, setTaskToEdit] = useState<PendingTask | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const handleAdd = () => {
        if (!currentTitle.trim()) return;

        const newTask: PendingTask = {
            tempId: Date.now().toString(),
            title: currentTitle,
            priority: TaskPriority.Medium, // Default
            status: TaskStatus.Open,
        };

        setPendingTasks(prev => [...prev, newTask]);
        setCurrentTitle("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
        }
    };

    const handleDelete = (tempId: string) => {
        setPendingTasks(prev => prev.filter(t => t.tempId !== tempId));
    };

    const handleEdit = (task: PendingTask) => {
        setTaskToEdit(task);
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = (updatedTask: Partial<TaskItem>) => {
        if (!taskToEdit) return;

        setPendingTasks(prev => prev.map(t =>
            t.tempId === taskToEdit.tempId
                ? { ...t, ...updatedTask }
                : t
        ));
        setIsEditModalOpen(false);
        setTaskToEdit(null);
    };

    const handleSaveAll = async () => {
        if (pendingTasks.length === 0) return;

        setIsSubmitting(true);
        try {
            // Convert PendingTask to Partial<TaskItem>
            const tasksToCreate: Partial<TaskItem>[] = pendingTasks.map(({ tempId, ...rest }) => rest);
            await TaskService.createTasksBatch(tasksToCreate);
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to save tasks", error);
            alert("Failed to save tasks. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div
                    className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full relative z-10"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Create Tasks
                            </h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-500 focus:outline-none">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Input Area */}
                        <div className="flex gap-2 mb-6">
                            <input
                                type="text"
                                value={currentTitle}
                                onChange={(e) => setCurrentTitle(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Enter task title and press Enter..."
                                className="flex-1 focus:ring-green-500 focus:border-green-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-3 border"
                                autoFocus
                            />
                            <button
                                onClick={handleAdd}
                                disabled={!currentTitle.trim()}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                <Plus className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Pending List */}
                        {pendingTasks.length > 0 ? (
                            <div className="max-h-[400px] overflow-y-auto border rounded-md divide-y divide-gray-100">
                                {pendingTasks.map((task, index) => (
                                    <div key={task.tempId} className="p-3 flex items-center justify-between hover:bg-gray-50 group">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <span className="text-gray-400 font-mono text-sm">{index + 1}.</span>
                                            <div className="min-w-0">
                                                <p className="font-medium text-gray-900 truncate">{task.title}</p>
                                                {task.description && <p className="text-xs text-gray-500 truncate">{task.description}</p>}
                                                <div className="flex gap-2 text-xs text-gray-400 items-center mt-0.5">
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold 
                                                        ${task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                                            task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                                                'bg-blue-50 text-blue-600'}`}>
                                                        {task.priority}
                                                    </span>
                                                    {task.assignedTo && <span>• Assigned: {task.assignedTo}</span>}
                                                    {task.dueDate && <span>• Due: {task.dueDate instanceof Date ? task.dueDate.toLocaleDateString() : task.dueDate}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(task)}
                                                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                                title="Edit details"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(task.tempId)}
                                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                                title="Remove"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                                <p className="text-gray-500 text-sm">No tasks added yet. Type a title above and press Enter.</p>
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            onClick={handleSaveAll}
                            disabled={pendingTasks.length === 0 || isSubmitting}
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Saving..." : `Save All Tasks (${pendingTasks.length})`}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>

            {/* Simple Edit Modal Overlay */}
            {isEditModalOpen && taskToEdit && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    {/* Reuse AddTaskModal logic but simplified or just a custom small form */}
                    {/* For now, let's create a quick inline form here to avoid circular dependencies with AddTaskModal if it's large */}
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                        <h4 className="text-lg font-bold mb-4">Edit Task Details</h4>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Title</label>
                                <input
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                                    value={taskToEdit.title}
                                    onChange={e => setTaskToEdit({ ...taskToEdit, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Priority</label>
                                <select
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                                    value={taskToEdit.priority}
                                    onChange={e => setTaskToEdit({ ...taskToEdit, priority: e.target.value as TaskPriority })}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>
                            {/* Add more fields as requested "if user likes will add" */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                                    value={taskToEdit.description || ''}
                                    onChange={e => setTaskToEdit({ ...taskToEdit, description: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleSaveEdit(taskToEdit)}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
