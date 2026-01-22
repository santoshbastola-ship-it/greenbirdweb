import 'package:flutter/material.dart';
import 'package:farm_management_app/features/tasks/models/task_item.dart';
import 'package:farm_management_app/features/tasks/services/task_service.dart';
import 'package:farm_management_app/core/utils/nepali_date_helper.dart';
import 'package:provider/provider.dart';
import 'package:farm_management_app/features/auth/services/auth_service.dart';
import 'package:farm_management_app/features/tasks/screens/task_form_modal.dart';
import 'package:farm_management_app/features/auth/models/user_model.dart';

class TaskDetailScreen extends StatefulWidget {
  final TaskItem task;

  const TaskDetailScreen({super.key, required this.task});

  @override
  State<TaskDetailScreen> createState() => _TaskDetailScreenState();
}

class _TaskDetailScreenState extends State<TaskDetailScreen> {
  late TaskItem _task;
  final TaskService _taskService = TaskService();

  @override
  void initState() {
    super.initState();
    _task = widget.task;
  }

  @override
  Widget build(BuildContext context) {
    final currentUser = context.watch<AuthService>().currentUser;
    final isAdmin = currentUser?.role == UserRole.admin;
    final currentUserName = currentUser?.name ?? '';
    
    // Check if user can edit this task
    final canEdit = isAdmin || 
                    _task.assignedTo == currentUserName || 
                    _task.createdBy == currentUserName;

    // Priority colors
    Color priorityColor;
    String priorityLabel;
    switch (_task.priority) {
      case TaskPriority.urgent:
        priorityColor = Colors.red;
        priorityLabel = 'URGENT';
        break;
      case TaskPriority.high:
        priorityColor = Colors.orange;
        priorityLabel = 'HIGH';
        break;
      case TaskPriority.medium:
        priorityColor = Colors.blue;
        priorityLabel = 'MEDIUM';
        break;
      case TaskPriority.low:
        priorityColor = Colors.green;
        priorityLabel = 'LOW';
        break;
    }

    // Status colors
    Color statusColor;
    switch (_task.status) {
      case TaskStatus.open:
        statusColor = Colors.grey;
        break;
      case TaskStatus.inProgress:
        statusColor = Colors.blue;
        break;
      case TaskStatus.done:
        statusColor = Colors.green;
        break;
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Task Details'),
        actions: [
          if (isAdmin)
            IconButton(
              icon: const Icon(Icons.delete, color: Colors.red, size: 20),
              onPressed: () => _confirmDelete(context),
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
              tooltip: 'Delete task',
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Task ID Badge
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: Colors.blue.shade200),
              ),
              child: Text(
                _task.taskId,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: Colors.blue.shade800,
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Title
            Text(
              _task.title,
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 16),

            // Status and Priority Badges
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _buildStatusDropdown(_task, statusColor),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: priorityColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: priorityColor, width: 1.5),
                  ),
                  child: Text(
                    priorityLabel,
                    style: TextStyle(
                      color: priorityColor,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                if (_task.isRepeating)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.purple.shade50,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: Colors.purple.shade300, width: 1.5),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.repeat, size: 14, color: Colors.purple.shade700),
                        const SizedBox(width: 4),
                        Text(
                          _task.repetition.displayName,
                          style: TextStyle(
                            color: Colors.purple.shade700,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 24),

            // Dates Section
            _InfoCard(
              title: 'Dates',
              children: [
                _InfoRow(
                  icon: Icons.access_time,
                  label: 'Created',
                  value: NepaliDateHelper.formatToNepali(_task.createdDate),
                  iconColor: Colors.blue,
                ),
                if (_task.dueDate != null) ...[
                  const SizedBox(height: 12),
                  _InfoRow(
                    icon: Icons.calendar_today,
                    label: 'Due Date',
                    value: NepaliDateHelper.formatToNepali(_task.dueDate!),
                    iconColor: Colors.orange,
                  ),
                ],
                if (_task.completedDate != null) ...[
                  const SizedBox(height: 12),
                  _InfoRow(
                    icon: Icons.check_circle,
                    label: 'Completed',
                    value: NepaliDateHelper.formatToNepali(_task.completedDate!),
                    iconColor: Colors.green,
                  ),
                ],
              ],
            ),
            const SizedBox(height: 16),

            // Assignment Section
            _InfoCard(
              title: 'Assignment',
              children: [
                if (_task.assignedTo != null)
                  _InfoRow(
                    icon: Icons.person,
                    label: 'Assigned To',
                    value: _task.assignedTo!,
                    iconColor: Colors.green,
                  ),
                if (_task.createdBy != null) ...[
                  if (_task.assignedTo != null) const SizedBox(height: 12),
                  _InfoRow(
                    icon: Icons.person_outline,
                    label: 'Created By',
                    value: _task.createdBy!,
                    iconColor: Colors.grey,
                  ),
                ],
              ],
            ),
            const SizedBox(height: 16),

            // Description Section
            if (_task.description != null && _task.description!.isNotEmpty) ...[
              _InfoCard(
                title: 'Description',
                children: [
                  Text(
                    _task.description!,
                    style: const TextStyle(
                      fontSize: 14,
                      color: Colors.black87,
                      height: 1.5,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 80),
            ] else
              const SizedBox(height: 80),
          ],
        ),
      ),
      floatingActionButton: canEdit
          ? FloatingActionButton.extended(
              onPressed: () => _showEditTaskSheet(_task),
              icon: const Icon(Icons.edit),
              label: const Text('Edit Task'),
            )
          : null,
    );
  }

  Widget _buildStatusDropdown(TaskItem task, Color color) {
    String statusLabel;
    switch (task.status) {
      case TaskStatus.open:
        statusLabel = 'OPEN';
        break;
      case TaskStatus.inProgress:
        statusLabel = 'IN PROGRESS';
        break;
      case TaskStatus.done:
        statusLabel = 'DONE';
        break;
    }

    return PopupMenuButton<TaskStatus>(
      initialValue: task.status,
      onSelected: (TaskStatus newStatus) async {
        if (newStatus != task.status) {
          try {
            final updatedTask = task.copyWith(status: newStatus);
            await _taskService.updateTask(updatedTask);
            setState(() {
              _task = updatedTask;
              // If marking as done, the completed date will be updated in next refresh or locally
              // but updateTask service handles the date, so let's fetch if possible or just update locally
              if (newStatus == TaskStatus.done) {
                 _task = _task.copyWith(completedDate: DateTime.now());
              } else {
                 _task = _task.copyWith(clearCompletedDate: true);
              }
            });
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Status updated to ${newStatus.name.toUpperCase()}')),
              );
            }
          } catch (e) {
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Error updating status: $e'), backgroundColor: Colors.red),
              );
            }
          }
        }
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: color, width: 1.5),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              statusLabel,
              style: TextStyle(
                color: color,
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(width: 4),
            Icon(Icons.arrow_drop_down, size: 16, color: color),
          ],
        ),
      ),
      itemBuilder: (BuildContext context) => <PopupMenuEntry<TaskStatus>>[
        const PopupMenuItem<TaskStatus>(
          value: TaskStatus.open,
          child: Text('Open'),
        ),
        const PopupMenuItem<TaskStatus>(
          value: TaskStatus.inProgress,
          child: Text('In Progress'),
        ),
        const PopupMenuItem<TaskStatus>(
          value: TaskStatus.done,
          child: Text('Done'),
        ),
      ],
    );
  }

  void _showEditTaskSheet(TaskItem task) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => TaskFormModal(
        existingTask: task,
        onSubmit: (tasks) async {
          try {
            await _taskService.updateTask(tasks.first);
            if (mounted) {
              setState(() {
                _task = tasks.first;
              });
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Task updated!')),
              );
            }
          } catch (e) {
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Error updating task: $e')),
              );
            }
          }
        },
      ),
    );
  }

  void _confirmDelete(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Task'),
        content: Text('Are you sure you want to delete "${_task.title}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              try {
                await _taskService.deleteTask(_task.id);
                if (context.mounted) {
                  Navigator.pop(ctx); // Close dialog
                  Navigator.pop(context); // Close detail screen
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Task deleted')),
                  );
                }
              } catch (e) {
                if (context.mounted) {
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Error deleting task: $e')),
                  );
                }
              }
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  final String title;
  final List<Widget> children;

  const _InfoCard({
    required this.title,
    required this.children,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.grey.shade700,
            ),
          ),
          const SizedBox(height: 12),
          ...children,
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color iconColor;

  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
    required this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 20, color: iconColor),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey.shade600,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Colors.black87,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
