"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Calendar, User, AlignLeft, AlertCircle, Repeat } from "lucide-react";
import { TaskPriority, TaskRepetition } from "@/types";
import { getTodayNepali } from "@/lib/date-helper";
import dynamic from 'next/dynamic';

// Use the named export 'NepaliDatePicker' found in the module
const NepaliDatePicker = dynamic(() => import("nepali-datepicker-reactjs").then(mod => mod.NepaliDatePicker), {
    ssr: false,
    loading: () => <input type="text" placeholder="Loading Date..." className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
});

import "nepali-datepicker-reactjs/dist/index.css";

export default function NewTaskPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        priority: "medium" as TaskPriority,
        assignedTo: "",
        // Initialize with today's Nepali date
        dueDate: getTodayNepali(),
        repetition: "doesNotRepeat" as TaskRepetition,
        repetitionInterval: 1,
        repetitionUnit: "days" as 'days' | 'weeks' | 'months' | 'years',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Mock Save
            console.log("Creating Task:", formData);
            await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay
            alert("Task created successfully (Mock)");
            router.push("/admin/tasks");
        } catch (error) {
            console.error("Error creating task:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: name === 'repetitionInterval' ? parseInt(value) || 1 : value
        });
    };

    const handleDateChange = (date: string) => {
        setFormData({ ...formData, dueDate: date });
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/admin/tasks" className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <ArrowLeft className="h-6 w-6 text-gray-600" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Create New Task</h1>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center disabled:opacity-70"
                >
                    <Save className="h-5 w-5 mr-2" />
                    {loading ? "Saving..." : "Save Task"}
                </button>
            </div>

            {/* Form */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">

                {/* Title */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Task Title <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <input
                            type="text"
                            name="title"
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                            placeholder="e.g. Vaccinate the goats"
                            value={formData.title}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <AlignLeft className="h-4 w-4 mr-1 text-gray-400" />
                        Description
                    </label>
                    <textarea
                        name="description"
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                        placeholder="Add details about the task..."
                        value={formData.description}
                        onChange={handleChange}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Due Date (Nepali Picker) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                            Due Date (BS)
                        </label>
                        <div className="nepali-datepicker-container">
                            <NepaliDatePicker
                                onChange={handleDateChange}
                                options={{ calenderLocale: "en", valueLocale: "en" }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Selected: {formData.dueDate}</p>
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1 text-gray-400" />
                            Priority
                        </label>
                        <select
                            name="priority"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                            value={formData.priority}
                            onChange={handleChange}
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Repetition */}
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                            <Repeat className="h-4 w-4 mr-1 text-gray-400" />
                            Repetition
                        </label>
                        <select
                            name="repetition"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                            value={formData.repetition}
                            onChange={handleChange}
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

                    {/* Custom Repetition Inputs */}
                    {formData.repetition === 'custom' && (
                        <div className="col-span-1 flex space-x-2">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Repeat Every</label>
                                <input
                                    type="number"
                                    name="repetitionInterval"
                                    min="1"
                                    value={formData.repetitionInterval}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                                <select
                                    name="repetitionUnit"
                                    value={formData.repetitionUnit}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500"
                                >
                                    <option value="days">Days</option>
                                    <option value="weeks">Weeks</option>
                                    <option value="months">Months</option>
                                    <option value="years">Years</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Assignee */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <User className="h-4 w-4 mr-1 text-gray-400" />
                        Assign To
                    </label>
                    <input
                        type="text"
                        name="assignedTo"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                        placeholder="Enter name (e.g. Ram Bahadur)"
                        value={formData.assignedTo}
                        onChange={handleChange}
                    />
                </div>

            </div>
        </div>
    );
}
