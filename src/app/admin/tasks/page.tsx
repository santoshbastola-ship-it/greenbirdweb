"use client";

import { useState, useEffect } from "react";
import { Plus, CheckCircle, Calendar, AlertCircle, Circle, User, Trash2 } from "lucide-react";

import { TaskItem, TaskPriority, TaskStatus } from "@/types";
import { TaskService } from "@/services/task.service";
import { toNepali } from "@/lib/date-helper";
import AddTaskModal from "@/components/admin/AddTaskModal";
import TaskDetailsModal from "@/components/admin/TaskDetailsModal";
import NepaliDate from "nepali-date-converter";
import AdvancedSearch from "@/components/admin/AdvancedSearch";
import { useAuth } from "@/context/AuthContext";
import LogoLoader from "@/components/ui/LogoLoader";
import { FilterTab } from "@/components/ui/FilterTab";

type TabStatus = TaskStatus | 'All';

export default function TasksPage() {
    const { dbUser } = useAuth();
    const [tasks, setTasks] = useState<TaskItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabStatus>(TaskStatus.Open);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [showMyTasksOnly, setShowMyTasksOnly] = useState(false);

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

    // Optimistic UI state for visual feedback
    const [completingTaskIds, setCompletingTaskIds] = useState<Set<string>>(new Set());

    const loadTasks = async () => {
        setLoading(true);
        try {
            const fetchedTasks = await TaskService.getAllTasks();
            setTasks(fetchedTasks);
        } catch (error) {
            console.error("Failed to load tasks", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTasks();
    }, []);

    const handleToggleStatus = async (task: TaskItem, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent opening details modal

        const newStatus = task.status === TaskStatus.Done ? TaskStatus.Open : TaskStatus.Done;

        // Visual feedback logic
        if (newStatus === TaskStatus.Done) {
            // Show green tick immediately
            setCompletingTaskIds(prev => {
                const newSet = new Set(prev);
                newSet.add(task.id);
                return newSet;
            });

            // Delay the actual move/disappearance
            setTimeout(async () => {
                await updateTaskStatusSteps(task, newStatus);
                setCompletingTaskIds(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(task.id);
                    return newSet;
                });
            }, 800); // 800ms delay for user to see the tick
        } else {
            // If marking as Open (undoing), do it immediately
            await updateTaskStatusSteps(task, newStatus);
        }
    };

    const updateTaskStatusSteps = async (task: TaskItem, newStatus: TaskStatus) => {
        // Optimistic update
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));

        try {
            await TaskService.updateTask(task.id, { status: newStatus }, dbUser?.name || "Admin");
        } catch (error) {
            console.error("Failed to update status", error);
            // Revert on error
            loadTasks();
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this task?")) return;

        try {
            await TaskService.deleteTask(id, dbUser?.name || "Admin");
            setTasks(tasks.filter(t => t.id !== id));
        } catch (error) {
            console.error("Failed to delete task", error);
            alert("Failed to delete task.");
        }
    };

    const filteredTasks = tasks.filter(task => {
        // Status Filter
        let matchesStatus = true;
        if (activeTab !== 'All') {
            matchesStatus = task.status === activeTab;
        }

        // Search Filter
        const query = searchQuery.toLowerCase();
        const matchesSearch = !searchQuery ||
            task.title.toLowerCase().includes(query) ||
            (task.assignedTo && task.assignedTo.toLowerCase().includes(query));

        // Date Filter
        const taskDate = typeof task.dueDate === 'string' ? new NepaliDate(task.dueDate).toJsDate() : new Date();
        const matchesStartDate = !startDate || taskDate >= new NepaliDate(startDate).toJsDate();
        const matchesEndDate = !endDate || taskDate <= new Date(new NepaliDate(endDate).toJsDate().setHours(23, 59, 59, 999));

        // My Tasks Filter
        // Role-based filtering for Managers
        const isManager = dbUser?.role === 'manager';
        let matchesRole = true;
        if (isManager && dbUser?.name) {
            const isAssignedToMe = !!task.assignedTo && task.assignedTo.toLowerCase().includes(dbUser.name.toLowerCase());
            const isCreatedByMe = !!task.createdBy && (task.createdBy.toLowerCase().includes(dbUser.name.toLowerCase()) || task.createdBy === dbUser.id);
            matchesRole = isAssignedToMe || isCreatedByMe;
        }

        let matchesMyTasks = true;
        if (showMyTasksOnly && dbUser?.name) {
            matchesMyTasks = !!task.assignedTo && task.assignedTo.toLowerCase().includes(dbUser.name.toLowerCase());
        }
        return matchesStatus && matchesSearch && matchesStartDate && matchesEndDate && matchesMyTasks && matchesRole;
    }).sort((a, b) => {
        // Sort: Done at bottom if in "All" view?? Or just standard sort?
        // Let's keep standard sort: Priority -> Date

        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        const pA = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
        const pB = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;

        if (pA !== pB) return pB - pA; // Higher priority first

        // Then by date (due date)
        const dateA = typeof a.dueDate === 'string' ? new NepaliDate(a.dueDate).toJsDate().getTime() : 0;
        const dateB = typeof b.dueDate === 'string' ? new NepaliDate(b.dueDate).toJsDate().getTime() : 0;
        return dateB - dateA;
    });

    const getTabCount = (tab: TabStatus) => {
        if (tab === 'All') return tasks.length;
        return tasks.filter(t => t.status === tab).length;
    };

    const tabs: { label: string; status: TabStatus }[] = [
        { label: "Open", status: TaskStatus.Open },
        { label: "In Progress", status: TaskStatus.InProgress },
        { label: "Done", status: TaskStatus.Done },
        { label: "All", status: 'All' },
    ];

    const selectedTask = tasks.find(t => t.id === selectedTaskId) || null;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">

                        <h1 className="text-3xl font-bold text-gray-900">Task Management</h1>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                            onClick={() => setShowMyTasksOnly(!showMyTasksOnly)}
                            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors border ${showMyTasksOnly
                                ? "bg-green-100 text-green-700 border-green-200"
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                                }`}
                        >
                            <User className="h-5 w-5" />
                            <span className="inline">My Tasks</span>
                        </button>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium"
                        >
                            <Plus className="h-5 w-5" />
                            <span className="inline">Create Task</span>
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <AdvancedSearch
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    startDate={startDate}
                    onStartDateChange={setStartDate}
                    endDate={endDate}
                    onEndDateChange={setEndDate}
                    placeholder="Search"
                />

                {/* Tabs */}
                <div className="mb-6 -mx-4 px-4 overflow-x-auto pb-2 no-scrollbar">
                    <div className="flex gap-2 min-w-max">
                        {tabs.map((tab) => (
                            <FilterTab
                                key={tab.status}
                                label={tab.label}
                                count={getTabCount(tab.status)}
                                active={activeTab === tab.status}
                                onClick={() => setActiveTab(tab.status)}
                            />
                        ))}
                    </div>
                </div>

                {/* Task List */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <LogoLoader />
                    </div>
                ) : filteredTasks.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
                        <CheckCircle className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No {activeTab} tasks found</h3>
                        <p className="text-gray-500">Tasks matching your criteria will appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredTasks.map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onClick={() => setSelectedTaskId(task.id)}
                                onToggleStatus={(e) => handleToggleStatus(task, e)}
                                isCompleting={completingTaskIds.has(task.id)}
                                onDelete={dbUser?.email === "greenbirdhomestead@gmail.com" ? handleDelete : undefined}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            {isAddModalOpen && (
                <AddTaskModal
                    onClose={() => setIsAddModalOpen(false)}
                    onSuccess={loadTasks}
                />
            )}

            {selectedTask && (
                <TaskDetailsModal
                    task={selectedTask}
                    onClose={() => setSelectedTaskId(null)}
                    onUpdate={loadTasks}
                />
            )}
        </div>
    );
}

function TaskCard({ task, onClick, onToggleStatus, isCompleting, onDelete }: { task: TaskItem; onClick: () => void; onToggleStatus: (e: React.MouseEvent) => void; isCompleting?: boolean; onDelete?: (e: React.MouseEvent, id: string) => void }) {
    const getPriorityStyles = (p: string) => {
        switch (p) {
            case 'urgent': return { bg: "bg-red-50", text: "text-red-600", icon: AlertCircle };
            case 'high': return { bg: "bg-orange-50", text: "text-orange-600", icon: AlertCircle };
            case 'medium': return { bg: "bg-blue-50", text: "text-blue-600", icon: Circle };
            default: return { bg: "bg-gray-50", text: "text-gray-600", icon: Circle };
        }
    };

    const style = getPriorityStyles(task.priority);
    const PriorityIcon = style.icon;

    // Display Date
    const displayDate = typeof task.dueDate === 'string' ? task.dueDate : "N/A";
    const isDone = task.status === TaskStatus.Done || isCompleting; // Treat completing as done visually

    return (
        <div
            onClick={onClick}
            className={`bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-all cursor-pointer border-l-4 ${task.priority === 'urgent' ? 'border-l-red-500' :
                task.priority === 'high' ? 'border-l-orange-400' :
                    task.priority === 'medium' ? 'border-l-blue-400' : 'border-l-gray-300'
                } border-y-gray-100 border-r-gray-100 ${isCompleting ? 'bg-green-50' : ''}`} // Subtle background change for completing
        >
            <div className="flex items-start justify-between gap-4">
                {/* Left: Checkbox & Title */}
                <div className="min-w-0 flex items-start gap-4 flex-1">
                    {/* Clickable Circle for Status Toggle */}
                    <button
                        onClick={onToggleStatus}
                        className={`p-2 rounded-full flex-shrink-0 transition-colors ${isDone ? "bg-green-100 text-green-600" : style.bg + " " + style.text + " hover:bg-gray-200"
                            } mt-1`}
                        title={isDone ? "Mark as Open" : "Mark as Done"}
                    >
                        {isDone ? <CheckCircle className="h-5 w-5" /> : <PriorityIcon className="h-5 w-5" />}
                    </button>

                    <div className="flex-1 min-w-0">
                        <h3 className={`font-bold text-gray-900 text-base sm:text-lg break-words ${isDone ? 'line-through text-gray-500' : ''}`}>
                            {task.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
                            <div className="flex items-center">
                                <Calendar className="h-3.5 w-3.5 mr-1" />
                                {displayDate}
                            </div>
                            <div className="flex items-center">
                                <User className="h-3.5 w-3.5 mr-1" />
                                {task.assignedTo || "Unassigned"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Status Badge & Actions */}
                <div className="flex-shrink-0 flex flex-col items-end gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${task.status === TaskStatus.Done ? "bg-green-100 text-green-800" :
                            task.status === TaskStatus.InProgress ? "bg-blue-100 text-blue-800" :
                                "bg-gray-100 text-gray-800"}`}>
                        {task.status === TaskStatus.InProgress ? "In Progress" : task.status}
                    </span>
                    {/* Priority Text for clarity */}
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${style.text}`}>
                        {task.priority}
                    </span>

                    {/* Delete Button (Stop propagation to prevent card click) */}
                    {onDelete && (
                        <button
                            onClick={(e) => onDelete(e, task.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-1"
                            title="Delete Task"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
