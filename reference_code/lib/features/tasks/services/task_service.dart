import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:farm_management_app/features/tasks/models/task_item.dart';
import 'package:farm_management_app/features/notifications/services/notification_service.dart';
import 'package:farm_management_app/features/notifications/models/notification_model.dart';
import 'package:farm_management_app/features/auth/services/auth_service.dart'; // Added

class TaskService {
  final FirebaseFirestore _firestore;
  late final CollectionReference _tasksCollection;
  final NotificationService _notificationService;
  final AuthService _authService;

  TaskService({
    FirebaseFirestore? firestore,
    NotificationService? notificationService,
    AuthService? authService,
  }) 
      : _firestore = firestore ?? FirebaseFirestore.instance,
        _notificationService = notificationService ?? NotificationService(),
        _authService = authService ?? AuthService() {
    _tasksCollection = _firestore.collection('tasks');
  }

  // Add a new task
  Future<void> addTask(TaskItem task) async {
    try {
      DocumentReference docRef = _tasksCollection.doc();
      
      TaskItem newTask = task.copyWith(id: docRef.id);
      
      await docRef.set(newTask.toMap());

      final currentUser = _authService.currentUser?.name ?? "Unknown User";

      await _notificationService.createNotification(
        title: 'New Task Assigned',
        body: 'Task "${newTask.title}" assigned to ${newTask.assignedTo} by $currentUser.',
        type: NotificationType.info,
        relatedEntityId: newTask.id,
        route: '/tasks',
      );
    } catch (e) {
      print('Error adding task: $e');
      rethrow;
    }
  }

  // Get tasks stream
  Stream<List<TaskItem>> getTasksStream() {
    return _tasksCollection.snapshots().map((snapshot) {
      return snapshot.docs.map((doc) {
        return TaskItem.fromMap(
          doc.data() as Map<String, dynamic>,
          doc.id,
        );
      }).toList();
    });
  }

  // Update a task
  Future<void> updateTask(TaskItem task) async {
    try {
      // Automatically manage completedDate based on status
      TaskItem taskToUpdate = task;
      
      // If marking as done and no completedDate is set, set it now
      if (task.status == TaskStatus.done && task.completedDate == null) {
        taskToUpdate = task.copyWith(completedDate: DateTime.now());
      }
      // If changing from done to another status, clear completedDate
      else if (task.status != TaskStatus.done && task.completedDate != null) {
        taskToUpdate = task.copyWith(clearCompletedDate: true);
      }
      
      await _tasksCollection.doc(taskToUpdate.id).update(taskToUpdate.toMap());

      final currentUser = _authService.currentUser?.name ?? "Unknown User";
      final status = task.status.name.replaceAll(RegExp(r'(?<!^)(?=[A-Z])'), ' '); // Improve formatting if needed, but display name logic is better if available.
      // TaskStatus enum names are camelCase usually? check model.
      // Assuming enum names like 'inProgress' -> 'inProgress'. 
      
      await _notificationService.createNotification(
        title: 'Task Updated',
        body: 'Task "${task.title}" status updated to ${task.status.name} by $currentUser.',
        type: NotificationType.info,
        relatedEntityId: task.id,
        route: '/tasks',
      );
    } catch (e) {
      print('Error updating task: $e');
      rethrow;
    }
  }

  // Delete a task
  Future<void> deleteTask(String taskId) async {
    try {
      await _tasksCollection.doc(taskId).delete();

      final currentUser = _authService.currentUser?.name ?? "Unknown User";

      await _notificationService.createNotification(
        title: 'Task Deleted',
        body: 'A task has been deleted by $currentUser.',
        type: NotificationType.warning,
        relatedEntityId: taskId,
      );
    } catch (e) {
      print('Error deleting task: $e');
      rethrow;
    }
  }
}
