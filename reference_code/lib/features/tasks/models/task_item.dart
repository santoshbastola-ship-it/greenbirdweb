import 'package:flutter/material.dart';

enum TaskPriority { urgent, high, medium, low }
enum TaskStatus { open, inProgress, done }
enum TaskRepetition { 
  doesNotRepeat, 
  daily, 
  weekdays,  // Monday to Friday
  weekly, 
  monthly, 
  yearly 
}

extension TaskRepetitionExtension on TaskRepetition {
  String get displayName {
    switch (this) {
      case TaskRepetition.doesNotRepeat:
        return 'Does not repeat';
      case TaskRepetition.daily:
        return 'Daily';
      case TaskRepetition.weekdays:
        return 'Every weekday (Mon-Fri)';
      case TaskRepetition.weekly:
        return 'Weekly';
      case TaskRepetition.monthly:
        return 'Monthly';
      case TaskRepetition.yearly:
        return 'Yearly';
    }
  }
}

class TaskItem {
  final String id;
  final String taskId; // Auto-generated task number: T-XXXXX
  final String title;
  final String? description;
  final DateTime? dueDate;
  final bool hasTime;
  final TaskStatus status;
  final TaskPriority priority;
  final String? category;
  final String? assignedTo;
  final String? createdBy;
  final TaskRepetition repetition;
  final DateTime createdDate;
  final DateTime? completedDate;

  TaskItem({
    required this.id,
    String? taskId,
    required this.title,
    this.description,
    this.dueDate,
    this.hasTime = false,
    this.status = TaskStatus.open,
    this.priority = TaskPriority.medium,
    this.category,
    this.assignedTo,
    this.createdBy,
    this.repetition = TaskRepetition.doesNotRepeat,
    DateTime? createdDate,
    this.completedDate,
  }) : taskId = taskId ?? _generateTaskId(id),
       createdDate = createdDate ?? DateTime.now();

  // Generate task ID in format: T-XXXXX (5 digits)
  static String _generateTaskId(String id) {
    // Use hashCode of id to generate a 5-digit number
    final hash = id.hashCode.abs();
    final fiveDigit = (hash % 100000).toString().padLeft(5, '0');
    return 'T-$fiveDigit';
  }

  bool get isCompleted => status == TaskStatus.done;
  bool get isRepeating => repetition != TaskRepetition.doesNotRepeat;

  Map<String, dynamic> toMap() {
    return {
      'taskId': taskId,
      'title': title,
      'description': description,
      'dueDate': dueDate?.toIso8601String(),
      'hasTime': hasTime,
      'status': status.index,
      'priority': priority.index,
      'category': category,
      'assignedTo': assignedTo,
      'createdBy': createdBy,
      'repetition': repetition.index,
      'createdDate': createdDate.toIso8601String(),
      'completedDate': completedDate?.toIso8601String(),
    };
  }

  factory TaskItem.fromMap(Map<String, dynamic> map, String id) {
    return TaskItem(
      id: id,
      taskId: map['taskId'],
      title: map['title'] ?? '',
      description: map['description'],
      dueDate: map['dueDate'] != null ? DateTime.parse(map['dueDate']) : null,
      hasTime: map['hasTime'] ?? false,
      status: TaskStatus.values[map['status'] ?? 0],
      priority: TaskPriority.values[map['priority'] ?? 2], // Default to medium
      category: map['category'],
      assignedTo: map['assignedTo'],
      createdBy: map['createdBy'],
      repetition: TaskRepetition.values[map['repetition'] ?? 0],
      createdDate: map['createdDate'] != null ? DateTime.parse(map['createdDate']) : DateTime.now(),
      completedDate: map['completedDate'] != null ? DateTime.parse(map['completedDate']) : null,
    );
  }

  TaskItem copyWith({
    String? id,
    String? taskId,
    String? title,
    String? description,
    DateTime? dueDate,
    bool? hasTime,
    TaskStatus? status,
    TaskPriority? priority,
    String? category,
    String? assignedTo,
    String? createdBy,
    TaskRepetition? repetition,
    DateTime? createdDate,
    DateTime? completedDate,
    bool clearCompletedDate = false,
  }) {
    return TaskItem(
      id: id ?? this.id,
      taskId: taskId ?? this.taskId,
      title: title ?? this.title,
      description: description ?? this.description,
      dueDate: dueDate ?? this.dueDate,
      hasTime: hasTime ?? this.hasTime,
      status: status ?? this.status,
      priority: priority ?? this.priority,
      category: category ?? this.category,
      assignedTo: assignedTo ?? this.assignedTo,
      createdBy: createdBy ?? this.createdBy,
      repetition: repetition ?? this.repetition,
      createdDate: createdDate ?? this.createdDate,
      completedDate: clearCompletedDate ? null : (completedDate ?? this.completedDate),
    );
  }
}


