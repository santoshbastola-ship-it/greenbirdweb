import 'package:flutter/material.dart';
import 'package:farm_management_app/features/tasks/models/task_item.dart';
import 'package:farm_management_app/features/tasks/screens/task_form_modal.dart';
import 'package:farm_management_app/features/tasks/screens/task_detail_screen.dart';
import 'package:farm_management_app/features/tasks/services/task_service.dart';
import 'package:provider/provider.dart';


import 'package:farm_management_app/features/auth/models/user_model.dart';
import 'package:farm_management_app/features/auth/services/auth_service.dart';
import 'package:farm_management_app/core/widgets/notification_list.dart';
import 'package:farm_management_app/features/notifications/widgets/notification_bell.dart';
import 'package:farm_management_app/core/utils/nepali_date_helper.dart';
import 'package:farm_management_app/core/widgets/empty_state_widget.dart';

class TasksScreen extends StatefulWidget {
  const TasksScreen({super.key});

  @override
  State<TasksScreen> createState() => _TasksScreenState();
}

class _TasksScreenState extends State<TasksScreen> {
  final TaskService _taskService = TaskService();
  // AuthService is now accessed via Provider

  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  List<String> _adminNames = [];
  bool _isCompletedExpanded = false; // Track expansion state for completed section

  @override
  void initState() {
    super.initState();
    _loadAdminUsers();
    _searchController.addListener(() {
      setState(() {
        _searchQuery = _searchController.text.toLowerCase();
      });
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadAdminUsers() async {
    // Access singleton directly for one-off load or use Provider.of with listen:false if context is available. 
    // Since we are in initState, context is valid but listen:false is preferred.
    // However, AuthService() singleton still works and is simpler for async independent calls.
    final users = await AuthService().getUsers();
    if (mounted) {
      setState(() {
        _adminNames = users
            .where((u) => u.role == UserRole.admin)
            .map((u) => u.name)
            .toList();
      });
    }
  }

  // Get current user info from AuthService, watching for changes
  UserRole get _currentUserRole {
    final authService = Provider.of<AuthService>(context);
    return authService.currentUser?.role ?? UserRole.manager;
  }
  
  String get _currentUserName {
    final authService = Provider.of<AuthService>(context, listen: false); // Name likely doesn't change as often as status for this screen, but listen=false is safer for simple reads outside build if needed, but here it's property.
    // Actually, let's just listen to be safe.
    return authService.currentUser?.name ?? 'Unknown';
  }

  void _toggleTask(TaskItem task) async {
    // Permission check: Managers can only toggle their own tasks
    if (_currentUserRole != UserRole.admin && task.assignedTo != _currentUserName) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('You can only update your own tasks')),
      );
      return;
    }

    try {
      final updatedTask = task.copyWith(
        status: task.status == TaskStatus.done ? TaskStatus.open : TaskStatus.done
      );
      await _taskService.updateTask(updatedTask);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error updating task: $e')),
      );
    }
  }

  void _showAddTaskSheet() {
    // Permission check
    if (_currentUserRole != UserRole.admin && _currentUserRole != UserRole.manager) {
       ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Only Admins and Managers can assign tasks')),
      );
      return;
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => TaskFormModal(
        onSubmit: (tasks) async {
          try {
            for (var task in tasks) {
              await _taskService.addTask(task);
            }
            if (mounted) {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('${tasks.length} task(s) created!')),
              );
            }
          } catch (e) {
            if (mounted) {
               ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Error creating task: $e')),
              );
            }
          }
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("My Tasks"),
        actions: [
          const NotificationBell(),
        ],
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search by title, assignee, description...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                        },
                      )
                    : null,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
            ),
          ),
          Expanded(
            child: StreamBuilder<List<TaskItem>>(
              stream: _taskService.getTasksStream(),
              builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          
          if (snapshot.hasError) {
             return Center(child: Text('Error loading tasks: ${snapshot.error}'));
          }

          final tasks = snapshot.data ?? [];

          // Apply search filter
          List<TaskItem> searchFiltered = tasks;
          if (_searchQuery.isNotEmpty) {
            searchFiltered = tasks.where((t) {
              // Search in title
              if (t.title.toLowerCase().contains(_searchQuery)) return true;
              
              // Search in assignee
              if (t.assignedTo != null && t.assignedTo!.toLowerCase().contains(_searchQuery)) return true;
              
              // Search in description
              if (t.description != null && t.description!.toLowerCase().contains(_searchQuery)) return true;
              
              // Search in status
              if (t.status.toString().toLowerCase().contains(_searchQuery)) return true;
              
              return false;
            }).toList();
          }

          // Filter tasks based on role
          List<TaskItem> filteredTasks = searchFiltered;
          if (_currentUserRole == UserRole.manager) {
             // Manager logic:
             // Show tasks assigned to me OR created by me (including those assigned to admins)
             filteredTasks = searchFiltered.where((t) {
               final isAssignedToMe = t.assignedTo == _currentUserName;
               final isCreatedByMe = t.createdBy == _currentUserName;

               return isAssignedToMe || isCreatedByMe;
             }).toList();
          }

          // Sort tasks by deadline (earliest first), with null dates at the end
          final sortedTasks = List<TaskItem>.from(filteredTasks)..sort((a, b) {
            if (a.dueDate == null && b.dueDate == null) return 0;
            if (a.dueDate == null) return 1;
            if (b.dueDate == null) return -1;
            return a.dueDate!.compareTo(b.dueDate!);
          });
          
          final activeTasks = sortedTasks.where((t) => !t.isCompleted).toList();
          final completedTasks = sortedTasks.where((t) => t.isCompleted).toList();

          // Check if we have no results due to search
          if (filteredTasks.isEmpty && _searchQuery.isNotEmpty) {
            return Padding(
              padding: const EdgeInsets.only(top: 100),
              child: EmptyStateWidget(
                message: "No results found for '$_searchQuery'",
                icon: Icons.search_off,
              ),
            );
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (activeTasks.isNotEmpty) ...[
                  const Text("Active", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                  const SizedBox(height: 8),
                  ...activeTasks.map((t) => _buildTaskItem(t)),
                  const SizedBox(height: 24),
                ],
                
                
                if (completedTasks.isNotEmpty) ...[
                  Card(
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: BorderSide(color: Colors.grey.shade300),
                    ),
                    child: Column(
                      children: [
                        InkWell(
                          onTap: () {
                            setState(() {
                              _isCompletedExpanded = !_isCompletedExpanded;
                            });
                          },
                          borderRadius: BorderRadius.circular(12),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              children: [
                                Icon(
                                  Icons.check_circle,
                                  color: Colors.green.shade600,
                                  size: 20,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  "Completed",
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 18,
                                    color: Colors.grey.shade800,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: Colors.green.shade50,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: Colors.green.shade200),
                                  ),
                                  child: Text(
                                    '${completedTasks.length}',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.green.shade700,
                                    ),
                                  ),
                                ),
                                const Spacer(),
                                AnimatedRotation(
                                  turns: _isCompletedExpanded ? 0.5 : 0,
                                  duration: const Duration(milliseconds: 200),
                                  child: Icon(
                                    Icons.keyboard_arrow_down,
                                    color: Colors.grey.shade600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        AnimatedCrossFade(
                          firstChild: const SizedBox.shrink(),
                          secondChild: Padding(
                            padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                            child: Column(
                              children: completedTasks.map((t) => _buildTaskItem(t)).toList(),
                            ),
                          ),
                          crossFadeState: _isCompletedExpanded
                              ? CrossFadeState.showSecond
                              : CrossFadeState.showFirst,
                          duration: const Duration(milliseconds: 200),
                        ),
                      ],
                    ),
                  ),
                ],

                if (tasks.isEmpty)
                  const Padding(
                    padding: EdgeInsets.only(top: 100),
                    child: EmptyStateWidget(
                      message: "All caught up!",
                      icon: Icons.check_circle_outline,
                    ),
                  )
              ],
            ),
          );
        },
      ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddTaskSheet,
        icon: const Icon(Icons.add_task),
        label: const Text("Add Task"),
      ),
    );
  }

  Widget _buildTaskItem(TaskItem task) {
    // Check if task is overdue
    final isOverdue = !task.isCompleted && 
                      task.dueDate != null && 
                      task.dueDate!.isBefore(DateTime.now());
    
    // Priority colors
    Color priorityColor;
    String priorityLabel;
    switch (task.priority) {
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

    // Status colors and labels
    Color statusColor;
    String statusLabel;
    switch (task.status) {
      case TaskStatus.open:
        statusColor = Colors.grey;
        statusLabel = 'OPEN';
        break;
      case TaskStatus.inProgress:
        statusColor = Colors.blue;
        statusLabel = 'IN PROGRESS';
        break;
      case TaskStatus.done:
        statusColor = Colors.green;
        statusLabel = 'DONE';
        break;
    }

    return Card(
      elevation: 0,
      color: task.isCompleted ? Colors.grey.shade100 : (isOverdue ? Colors.red.shade50 : Colors.white),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: isOverdue ? Colors.red.shade300 : Colors.grey.shade200),
      ),
      margin: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => TaskDetailScreen(task: task),
            ),
          );
        },
        borderRadius: BorderRadius.circular(12),
        child: ListTile(
        leading: Transform.scale(
          scale: 1.2,
          child: Checkbox(
            value: task.isCompleted,
            shape: const CircleBorder(),
            activeColor: Theme.of(context).primaryColor,
            onChanged: (v) => _toggleTask(task),
          ),
        ),
        title: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                   Row(
                    children: [
                       Container(
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                        decoration: BoxDecoration(
                          color: Colors.blue.shade50,
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: Colors.blue.shade200, width: 0.5),
                        ),
                        child: Text(
                          task.taskId,
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: Colors.blue.shade800,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      // Status badge
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: statusColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: statusColor, width: 1),
                        ),
                        child: Text(
                          statusLabel,
                          style: TextStyle(
                            color: statusColor,
                            fontSize: 8,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(width: 4),
                      // Priority badge
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: priorityColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: priorityColor, width: 1),
                        ),
                        child: Text(
                          priorityLabel,
                          style: TextStyle(
                            color: priorityColor,
                            fontSize: 8,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    task.title,
                    style: TextStyle(
                      decoration: task.isCompleted ? TextDecoration.lineThrough : null,
                      color: task.isCompleted ? Colors.grey : Colors.black87,
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Row(
              children: [
                Icon(Icons.access_time, size: 12, color: Colors.grey.shade600),
                const SizedBox(width: 4),
                Text(
                  'Created: ${NepaliDateHelper.formatToNepaliShort(task.createdDate)}',
                  style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                ),
              ],
            ),
            if (task.dueDate != null) ...[
              const SizedBox(height: 4),
              Row(
                children: [
                  Icon(
                    isOverdue ? Icons.warning : Icons.calendar_today, 
                    size: 12, 
                    color: isOverdue ? Colors.red.shade700 : Colors.grey.shade600
                  ),
                  const SizedBox(width: 4),
                  Text(
                    'Due: ${NepaliDateHelper.formatToNepaliShort(task.dueDate!)}',
                    style: TextStyle(
                      fontSize: 11, 
                      color: isOverdue ? Colors.red.shade700 : Colors.grey.shade600,
                      fontWeight: isOverdue ? FontWeight.bold : FontWeight.normal,
                    ),
                  ),
                  if (isOverdue) ...[
                    const SizedBox(width: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                      decoration: BoxDecoration(
                        color: Colors.red.shade100,
                        borderRadius: BorderRadius.circular(3),
                        border: Border.all(color: Colors.red.shade300, width: 0.5),
                      ),
                      child: Text(
                        'OVERDUE',
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                          color: Colors.red.shade700,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ],
            if (task.assignedTo != null) ...[
              const SizedBox(height: 4),
              Row(
                children: [
                  Icon(Icons.person_outline, size: 12, color: Colors.grey.shade600),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      'Assigned to: ${task.assignedTo}',
                      style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ],
            if (task.isRepeating) ...[
              const SizedBox(height: 4),
              Row(
                children: [
                  Icon(Icons.repeat, size: 12, color: Colors.blue.shade600),
                  const SizedBox(width: 4),
                  Text(
                    task.repetition.displayName,
                    style: TextStyle(fontSize: 11, color: Colors.blue.shade600, fontWeight: FontWeight.w500),
                  ),
                ],
              ),
            ],
          ],
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: const Icon(Icons.edit, size: 20),
              onPressed: () => _showEditTaskSheet(task),
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
              tooltip: 'Edit task',
            ),
            if (_currentUserRole == UserRole.admin) ...[
              const SizedBox(width: 8),
              IconButton(
                icon: const Icon(Icons.delete, size: 20, color: Colors.red),
                onPressed: () => _confirmDeleteTask(task),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
                tooltip: 'Delete task',
              ),
            ],
          ],
        ),
        isThreeLine: true,
        ),
      ),
    );
  }

  void _confirmDeleteTask(TaskItem task) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Task'),
        content: Text('Are you sure you want to delete "${task.title}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await _taskService.deleteTask(task.id);
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Task deleted')),
                  );
                }
              } catch (e) {
                if (mounted) {
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

  void _showEditTaskSheet(TaskItem task) {
    // Permission check: Manager can only edit tasks assigned to them or created by them
    if (_currentUserRole == UserRole.manager) {
      if (task.assignedTo != _currentUserName && task.createdBy != _currentUserName) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('You can only edit tasks assigned to you or created by you')),
        );
        return;
      }
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => TaskFormModal(
        existingTask: task,
        onSubmit: (tasks) async {
          try {
            // Edit is always single task
            await _taskService.updateTask(tasks.first);
            if (mounted) {
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
}
