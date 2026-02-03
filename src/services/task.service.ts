import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where, orderBy, writeBatch } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { TaskItem, TaskStatus, NotificationType } from "@/types";
import { NotificationService } from "./notification.service";

const COLLECTION_NAME = "tasks";

export const TaskService = {
    getAllTasks: async (): Promise<TaskItem[]> => {
        try {
            const q = query(collection(db, COLLECTION_NAME), orderBy("createdDate", "desc"));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TaskItem));
        } catch (error) {
            console.error("Error fetching tasks:", error);
            return [];
        }
    },

    getTask: async (id: string): Promise<TaskItem | null> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as TaskItem;
            }
            return null;
        } catch (error) {
            console.error("Error fetching task:", error);
            return null;
        }
    },

    createTask: async (task: Partial<TaskItem>): Promise<string> => {
        try {
            // Ensure essential defaults if not provided
            const newTask = {
                ...task,
                status: task.status || TaskStatus.Open,
                createdDate: new Date().toISOString(),
                taskId: task.taskId || `T-${Date.now()}`, // Simple ID generation
            };

            const docRef = await addDoc(collection(db, COLLECTION_NAME), newTask);

            // NOTIFICATION LOGIC: Notify Assignee
            if (newTask.assignedTo) {
                try {
                    await NotificationService.createNotification({
                        targetUserId: newTask.assignedTo,
                        title: "New Task Assigned",
                        message: `You have been assigned a new task: ${newTask.title}`,
                        type: 'info',
                        channels: ['in-app', 'whatsapp'],
                        relatedEntityId: docRef.id,
                        relatedEntityType: 'task',
                        route: `/admin/tasks`
                    });
                } catch (notifyError) {
                    console.error("Failed to notify assignee:", notifyError);
                }
            }

            // Notify Admins
            await NotificationService.notifyAdmins(
                "New Task Created",
                `New task created: ${newTask.title}`,
                docRef.id,
                'task',
                '/admin/tasks'
            );

            return docRef.id;
        } catch (error) {
            console.error("Error creating task:", error);
            throw error;
        }
    },

    createTasksBatch: async (tasks: Partial<TaskItem>[]): Promise<void> => {
        try {
            const batch = writeBatch(db);
            const collectionRef = collection(db, COLLECTION_NAME);

            // Prepare validation or enrichment if needed
            const newTasksWithRefs = tasks.map(task => {
                const newDocRef = doc(collectionRef);
                const newTask = {
                    ...task,
                    status: task.status || TaskStatus.Open,
                    createdDate: new Date().toISOString(),
                    taskId: task.taskId || `T-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    id: newDocRef.id // Ensure ID is in data if needed, though usually documentId is key
                };
                batch.set(newDocRef, newTask);
                return { ref: newDocRef, data: newTask };
            });

            await batch.commit();

            // NOTIFICATION LOGIC: Batch notify?
            // For now, let's skip complex batch notification to avoid spamming
            // or implement a summary notification later.

        } catch (error) {
            console.error("Error batch creating tasks:", error);
            throw error;
        }
    },

    updateTask: async (id: string, task: Partial<TaskItem>): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, {
                ...task,
                // Optional: updatedAt: new Date().toISOString()
            });

            // NOTIFICATION LOGIC: Notify when task is Done
            if (task.status === TaskStatus.Done) {
                try {
                    // Get the task to find createdBy or just notify admins
                    // For simplicity, let's notify the creator if we knew them, or just admins
                    // Since we don't store createdBy in the partial update usually, we might need to fetch
                    // But for now, let's notify admins that a task is completed

                    const q = query(collection(db, "users"), where("role", "==", "admin"));
                    const adminSnap = await getDocs(q);
                    const adminIds = adminSnap.docs.map(d => d.id);

                    await Promise.all(adminIds.map(adminId =>
                        NotificationService.createNotification({
                            targetUserId: adminId,
                            title: "Task Completed",
                            message: `Task "${task.title || 'A task'}" has been marked as Done.`,
                            type: 'success',
                            channels: ['in-app'],
                            relatedEntityId: id,
                            relatedEntityType: 'task',
                            route: `/admin/tasks`
                        })
                    ));
                } catch (notifyError) {
                    console.error("Failed to notify task completion:", notifyError);
                }
            }

            // Notify Admins of Update
            await NotificationService.notifyAdmins(
                "Task Updated",
                `Task updated: ${task.title || id}`,
                id,
                'task',
                '/admin/tasks'
            );
        } catch (error) {
            console.error("Error updating task:", error);
            throw error;
        }
    },

    deleteTask: async (id: string): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            let message = `Task deleted: ${id}`;

            if (docSnap.exists()) {
                const data = docSnap.data();
                const title = data.title || id;
                message = `Task "${title}" has been deleted.`;
            }

            await deleteDoc(docRef);

            // Notify Admins
            await NotificationService.notifyAdmins(
                "Task Deleted",
                message,
                undefined,
                'task',
                '/admin/tasks'
            );
        } catch (error) {
            console.error("Error deleting task:", error);
            throw error;
        }
    }
};
