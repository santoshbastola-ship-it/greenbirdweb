"use client";

import { useState, useEffect } from "react";
import { X, Calendar, User, AlignLeft, AlertCircle, Repeat, Loader2 } from "lucide-react";
import { TaskItem, TaskPriority, TaskRepetition, TaskStatus, User as AppUser } from "@/types";
import { TaskService } from "@/services/task.service";
import { UserService } from "@/services/user.service";
import { toNepali, getTodayNepali } from "@/lib/date-helper";
import dynamic from 'next/dynamic';

const NepaliDatePicker = dynamic(() => import("nepali-datepicker-reactjs").then(mod => mod.NepaliDatePicker), {
    ssr: false,
    loading: () => <input type="text" placeholder="Loading..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
});

import "nepali-datepicker-reactjs/dist/index.css";
import DocumentUpload from "./DocumentUpload";

import { useAuth } from "@/context/AuthContext";

interface AddTaskModalProps {
    task?: TaskItem;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddTaskModal({ onClose, onSuccess, task }: { onClose: () => void, onSuccess?: () => void, task?: TaskItem }) {
    const { dbUser } = useAuth();
    const isEditing = !!task;
    const [creationMode, setCreationMode] = useState<'single' | 'bulk'>('single');

    const [formData, setFormData] = useState({
        title: "", // used for single task edit/create
        tasksBlob: "", // used for bulk creation
        description: "",
        priority: "medium" as TaskPriority,
        assignedTo: "",
        dueDate: getTodayNepali(),
        repetition: "doesNotRepeat" as TaskRepetition,
        status: TaskStatus.Open,
    });

    const [documentUrls, setDocumentUrls] = useState<string[]>(task?.documentUrls || []);

    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<AppUser[]>([]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const fetchedUsers = await UserService.getAllUsers();
                setUsers(fetchedUsers);
            } catch (error) {
                console.error("Failed to fetch users", error);
            }
        };
        fetchUsers();
    }, []);

    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title || "",
                tasksBlob: "",
                description: task.description || "",
                priority: task.priority || "medium",
                assignedTo: task.assignedTo || "",
                dueDate: typeof task.dueDate === 'string' ? task.dueDate : getTodayNepali(),
                repetition: task.repetition || "doesNotRepeat",
                status: task.status || TaskStatus.Open,
            });
            setDocumentUrls(task.documentUrls || []);
        }
    }, [task]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleDateChange = (date: string) => {
        setFormData({ ...formData, dueDate: date });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isEditing || creationMode === 'single') {
                // Single Create or Update
                if (!formData.title.trim()) {
                    alert("Title is required");
                    setLoading(false);
                    return;
                }

                const taskData = {
                    title: formData.title,
                    description: formData.description,
                    priority: formData.priority,
                    assignedTo: formData.assignedTo,
                    repetition: formData.repetition,
                    status: formData.status,
                    dueDate: formData.dueDate,
                    documentUrls: documentUrls,
                };

                if (isEditing && task) {
                    await TaskService.updateTask(task.id, taskData, dbUser?.name || "Admin");
                } else {
                    await TaskService.createTask({
                        ...taskData,
                        createdBy: dbUser?.name || "admin",
                        createdDate: new Date()
                    } as any, dbUser?.name || "Admin");
                }

            } else {
                // Bulk Create
                if (!formData.tasksBlob.trim()) {
                    alert("Please enter at least one task");
                    setLoading(false);
                    return;
                }

                const tasksToCreate = formData.tasksBlob
                    .split('\n')
                    .map(t => t.trim())
                    .filter(t => t.length > 0);

                await Promise.all(tasksToCreate.map(title =>
                    TaskService.createTask({
                        title,
                        description: formData.description, // Apply description to all
                        priority: formData.priority,
                        assignedTo: formData.assignedTo,
                        status: formData.status,
                        repetition: formData.repetition,
                        dueDate: formData.dueDate,
                        documentUrls: documentUrls,
                        createdBy: dbUser?.name || "admin",
                        createdDate: new Date()
                    }, dbUser?.name || "Admin")
                ));
            }
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error("Error saving task:", error);
            alert("Failed to save task");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            {isEditing ? "Edit Task" : "Add Tasks"}
                        </h2>
                        {!isEditing && (
                            <div className="flex gap-4 mt-4 text-sm font-medium">
                                <button
                                    type="button"
                                    onClick={() => setCreationMode('single')}
                                    className={`pb-2 border-b-2 transition-colors ${creationMode === 'single' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    Single Task
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCreationMode('bulk')}
                                    className={`pb-2 border-b-2 transition-colors ${creationMode === 'bulk' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    Bulk Import
                                </button>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors -mt-8"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    {/* Mode Specific Input */}
                    {!isEditing && creationMode === 'bulk' ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Task Titles <span className="text-gray-400 text-xs font-normal">(One per line)</span>
                            </label>
                            <textarea
                                name="tasksBlob"
                                value={formData.tasksBlob}
                                onChange={handleChange}
                                required
                                rows={5}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-400"
                                placeholder="Buy Milk&#10;Call Plumber&#10;Update Website"
                            />
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required={creationMode === 'single' || isEditing}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="Enter task title"
                            />
                        </div>
                    )}

                    {/* Description - NOW AVAILABLE IN ALL MODES */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                            <AlignLeft className="h-4 w-4 mr-1 text-gray-400" />
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Add details..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Due Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                                Due Date (BS)
                            </label>
                            <div className="nepali-datepicker-container">
                                <NepaliDatePicker
                                    value={formData.dueDate}
                                    onChange={handleDateChange}
                                    options={{ calenderLocale: "en", valueLocale: "en" }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Priority */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                <AlertCircle className="h-4 w-4 mr-1 text-gray-400" />
                                Priority
                            </label>
                            <select
                                name="priority"
                                value={formData.priority}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Assignee */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                <User className="h-4 w-4 mr-1 text-gray-400" />
                                Assign To
                            </label>
                            <select
                                name="assignedTo"
                                value={formData.assignedTo}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            >
                                <option value="">Unassigned</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.name}>
                                        {user.name} ({user.role})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Status - NOW AVAILABLE IN ALL MODES */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                <AlertCircle className="h-4 w-4 mr-1 text-gray-400" />
                                Status
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            >
                                <option value="open">Open</option>
                                <option value="inProgress">In Progress</option>
                                <option value="done">Done</option>
                            </select>
                        </div>
                    </div>

                    {/* Repetition - NOW AVAILABLE IN ALL MODES */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                            <Repeat className="h-4 w-4 mr-1 text-gray-400" />
                            Repetition
                        </label>
                        <select
                            name="repetition"
                            value={formData.repetition}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                            <option value="doesNotRepeat">Does not repeat</option>
                            <option value="daily">Daily</option>
                            <option value="weekdays">Every weekday (Mon-Fri)</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                            <option value="custom">Custom...</option>
                        </select>
                    </div>

                    {/* Document Upload */}
                    <div className="pt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Task Attachments (Images/PDFs)
                        </label>
                        <DocumentUpload
                            documentUrls={documentUrls}
                            onChange={setDocumentUrls}
                            folder="task-attachments"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                isEditing ? "Update Task" : "Create Tasks"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
