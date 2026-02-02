"use client";

import { useState, useEffect } from "react";
import { Plus, Loader2, Image as ImageIcon } from "lucide-react";
import { FarmActivity } from "@/types/extra";
import { getActivities, deleteActivity, updateActivityStatus } from "@/lib/services/activities";
import LogoLoader from "@/components/ui/LogoLoader";
import ActivityCard from "@/components/admin/ActivityCard";
import AddActivityModal from "@/components/admin/AddActivityModal";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function ActivitiesPage() {
    const { dbUser, loading: authLoading } = useAuth();
    const router = useRouter();

    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    useEffect(() => {
        if (!authLoading && dbUser && dbUser.role !== 'admin') {
            router.push("/admin");
        }
    }, [dbUser, authLoading, router]);

    useEffect(() => {
        // Only load activities if authentication is resolved and user is an admin
        if (!authLoading && dbUser && dbUser.role === 'admin') {
            loadActivities();
        } else if (!authLoading && !dbUser) {
            // If auth is resolved and no user, or user is not admin, and redirect hasn't happened
            // This case might be handled by the redirect useEffect, but good to consider.
            // For now, rely on the redirect useEffect.
        }
    }, [authLoading, dbUser]); // Depend on authLoading and dbUser

    const loadActivities = async () => {
        try {
            setLoading(true);
            const data = await getActivities();
            // Sort by date descending
            data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setActivities(data);
        } catch (error) {
            console.error("Failed to load activities", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this activity?")) return;

        try {
            await deleteActivity(id);
            setActivities(activities.filter(a => a.id !== id));
        } catch (error) {
            console.error("Failed to delete activity", error);
            alert("Failed to delete activity.");
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const newStatus = !currentStatus;
            await updateActivityStatus(id, newStatus);
            setActivities(activities.map(a =>
                a.id === id ? { ...a, isPublished: newStatus } : a
            ));
        } catch (error) {
            console.error("Failed to update activity status", error);
            alert("Failed to update status.");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <LogoLoader />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Farm Activities</h1>
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium"
                    >
                        <Plus className="h-5 w-5" />
                        Add Activity
                    </button>
                </div>

                {/* Activities List */}
                {activities.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
                        <ImageIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No activities recorded yet</h3>
                        <p className="text-gray-500">Click the "Add Activity" button to get started.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {activities.map((activity) => (
                            <ActivityCard
                                key={activity.id}
                                activity={activity}
                                onDelete={dbUser?.email === "greenbirdhomestead@gmail.com" ? handleDelete : undefined}
                                onToggleStatus={handleToggleStatus}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            {isAddModalOpen && (
                <AddActivityModal
                    onClose={() => setIsAddModalOpen(false)}
                    onSuccess={loadActivities}
                />
            )}
        </div>
    );
}
