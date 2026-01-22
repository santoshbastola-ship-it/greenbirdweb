import 'package:uuid/uuid.dart';

class Worker {
  final String id;
  final String name;
  final String role;
  final String contact;
  bool isActive;

  Worker({
    String? id,
    required this.name,
    required this.role,
    required this.contact,
    this.isActive = true,
  }) : id = id ?? const Uuid().v4();
}

class TaskAssignment {
  final String id;
  final String title;
  final String workerId;
  final String workerName; // Denormalized for simple UI
  final DateTime dateAssigned;
  bool isCompleted;

  TaskAssignment({
    String? id,
    required this.title,
    required this.workerId,
    required this.workerName,
    required this.dateAssigned,
    this.isCompleted = false,
  }) : id = id ?? const Uuid().v4();
}
