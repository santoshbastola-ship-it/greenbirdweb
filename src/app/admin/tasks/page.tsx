"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, CheckCircle, Calendar, AlertCircle, ArrowLeft } from "lucide-react";
import { toNepali } from "@/lib/date-helper";

export default function TasksPage() {
    const [filter, setFilter] = useState<'open' | 'done'>('open');

    // Mock Tasks
    const tasks = [
        // ... (truncated for brevity in search replacement content, but needs to be careful)
        {
            id: "1",
            title: "Repair Fence at Sector 4",
            assignedTo: "Ram Bahadur",
            dueDate: "2026-01-25", // Future date
            priority: "high",
            status: "open",
        },
        {
            id: "2",
            title: "Vaccinate Goats",
            assignedTo: "Sita Kumari",
            dueDate: "2026-01-23",
            priority: "urgent",
            status: "open",
        },
        {
            id: "3",
            title: "Clean Water Tank",
            assignedTo: "Hari Krishna",
            dueDate: "2024-03-20",
            priority: "medium",
            status: "done",
            completedDate: "2024-03-20"
        }
    ];

    const filteredTasks = tasks.filter(t => filter === 'open' ? t.status !== 'done' : t.status === 'done');

    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'urgent': return "bg-red-100 text-red-700";
            case 'high': return "bg-orange-100 text-orange-700";
            case 'medium': return "bg-blue-100 text-blue-700";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="h-6 w-6 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
                        <p className="text-gray-500">Assign and track farm activities</p>
                    </div>
                </div>
                <Link
                    href="/admin/tasks/new"
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Assign Task
                </Link>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setFilter('open')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'open' ? 'bg-white shadow-sm text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Pending Tasks
                </button>
                <button
                    onClick={() => setFilter('done')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'done' ? 'bg-white shadow-sm text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Completed
                </button>
            </div>

            {/* List */}
            <div className="space-y-4">
                {filteredTasks.map((task) => (
                    <div key={task.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:border-green-300 transition-colors cursor-pointer">
                        <div className="flex items-start space-x-4">
                            <div className={`mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center ${task.priority === 'urgent' ? 'border-red-400' : 'border-gray-300'}`}>
                                {filter === 'done' && <div className="h-3 w-3 bg-green-500 rounded-full" />}
                            </div>
                            <div>
                                <h3 className={`font-medium text-gray-900 ${filter === 'done' ? 'line-through text-gray-500' : ''}`}>
                                    {task.title}
                                </h3>
                                <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                                    <span className="flex items-center">
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        <span className={`${getPriorityColor(task.priority)} px-1.5 rounded text-xs uppercase font-bold tracking-wider`}>
                                            {task.priority}
                                        </span>
                                    </span>
                                    <span className="flex items-center">
                                        <Calendar className="h-3 w-3 mr-1" />
                                        {/* Apply Nepali Date Format */}
                                        {task.dueDate.includes('-') ? toNepali(task.dueDate, 'DD MMM YYYY') : task.dueDate}
                                    </span>
                                    <span className="flex items-center">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Assigned to: <strong className="ml-1 text-gray-700">{task.assignedTo}</strong>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredTasks.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-500">No {filter} tasks found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
