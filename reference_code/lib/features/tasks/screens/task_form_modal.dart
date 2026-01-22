import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:farm_management_app/features/auth/models/user_model.dart';
import 'package:farm_management_app/features/tasks/models/task_item.dart';
import 'package:farm_management_app/features/auth/services/auth_service.dart';
import 'package:farm_management_app/core/widgets/custom_button.dart';
import 'package:farm_management_app/core/utils/nepali_date_helper.dart';

class TaskFormModal extends StatefulWidget {
  final Function(List<TaskItem>) onSubmit;
  final TaskItem? existingTask;
  
  const TaskFormModal({super.key, required this.onSubmit, this.existingTask});

  @override
  State<TaskFormModal> createState() => _TaskFormModalState();
}

class _TaskFormModalState extends State<TaskFormModal> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _detailsController = TextEditingController();
  
  DateTime _selectedDate = DateTime.now();
  TimeOfDay? _selectedTime;
  bool _hasTime = false;
  TaskPriority _priority = TaskPriority.medium;
  TaskStatus _status = TaskStatus.open;
  TaskRepetition _repetition = TaskRepetition.doesNotRepeat;
  String? _assignedTo = 'Ganesh Bam';
  
  List<UserModel> _availableUsers = [];
  List<TaskItem> _draftTasks = [];
  bool _showAdvanced = false;

  @override
  void initState() {
    super.initState();
    _loadUsers();
    
    if (widget.existingTask != null) {
      final task = widget.existingTask!;
      _titleController.text = task.title;
      _detailsController.text = task.description ?? '';
      _selectedDate = task.dueDate ?? DateTime.now();
      _hasTime = task.hasTime;
      _priority = task.priority;
      _status = task.status;
      _repetition = task.repetition;
      _assignedTo = task.assignedTo;
      _showAdvanced = true; // Show advanced for editing
    }
  }

  Future<void> _loadUsers() async {
    final users = await AuthService().getUsers();
    if (mounted) {
      setState(() {
        _availableUsers = users;
      });
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _detailsController.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final picked = await NepaliDateHelper.pickNepaliDate(
      context,
      initialDate: _selectedDate,
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
    );
    if (picked != null) {
      setState(() => _selectedDate = picked);
    }
  }

  Future<void> _pickTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: _selectedTime ?? TimeOfDay.now(),
    );
    if (picked != null) {
      setState(() {
        _selectedTime = picked;
        _hasTime = true;
      });
    }
  }

  void _addNextTask() {
    if (_formKey.currentState!.validate()) {
      final task = _createTaskItem();
      setState(() {
        _draftTasks.add(task);
        // Reset only persistent fields
        _titleController.clear();
        _detailsController.clear();
        // Keep assignedTo, priority, etc. for next task convenience? 
        // User said "default medium priority, open", so let's keep those defaults but reset others.
        _selectedDate = DateTime.now();
        _selectedTime = null;
        _hasTime = false;
        _repetition = TaskRepetition.doesNotRepeat;
        // Keep _assignedTo as it might be same for next task
      });
    }
  }

  TaskItem _createTaskItem() {
    return TaskItem(
      id: DateTime.now().millisecondsSinceEpoch.toString() + _draftTasks.length.toString(),
      title: _titleController.text,
      description: _detailsController.text.isEmpty ? null : _detailsController.text,
      dueDate: _selectedDate,
      hasTime: _hasTime,
      priority: _priority,
      status: _status,
      repetition: _repetition,
      assignedTo: _assignedTo,
      createdBy: AuthService().currentUser?.name ?? 'Admin',
      category: 'General',
    );
  }

  void _submit() {
    if (widget.existingTask != null) {
       if (_formKey.currentState!.validate()) {
         final task = TaskItem(
            id: widget.existingTask!.id,
            taskId: widget.existingTask!.taskId,
            title: _titleController.text,
            description: _detailsController.text.isEmpty ? null : _detailsController.text,
            dueDate: _selectedDate,
            hasTime: _hasTime,
            priority: _priority,
            status: _status,
            repetition: _repetition,
            assignedTo: _assignedTo,
            createdBy: widget.existingTask?.createdBy ?? AuthService().currentUser?.name ?? 'Admin',
            category: 'General',
          );
      widget.onSubmit([task]);
       }
       return;
    }

    if (_draftTasks.isNotEmpty || _formKey.currentState!.validate()) {
      if (_titleController.text.isNotEmpty) {
        final task = _createTaskItem();
        _draftTasks.add(task);
      }
      
      if (_draftTasks.isNotEmpty) {
        widget.onSubmit(_draftTasks);
      } else {
        // Just close if nothing to add
        Navigator.pop(context);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 16,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Handle
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),
          
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                widget.existingTask != null ? 'Edit Task' : 'Create New Task',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
              ),
              if (widget.existingTask == null && _draftTasks.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.blue.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.blue.shade200),
                  ),
                  child: Text(
                    '${_draftTasks.length} pending',
                    style: TextStyle(color: Colors.blue.shade800, fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),
          
          Flexible(
            child: SingleChildScrollView(
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title
                    TextFormField(
                      controller: _titleController,
                      decoration: InputDecoration(
                        labelText: 'Task Title *',
                        hintText: 'What needs to be done?',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        filled: true,
                        fillColor: Colors.grey.shade50,
                      ),
                      validator: (v) => v!.isEmpty && _draftTasks.isEmpty ? 'Title is required' : null,
                    ),
                    const SizedBox(height: 16),

                    // Assigned To
                    DropdownButtonFormField<String?>(
                      value: _assignedTo,
                      decoration: InputDecoration(
                        labelText: 'Assigned To',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        prefixIcon: const Icon(Icons.person_add_outlined),
                        filled: true,
                        fillColor: Colors.grey.shade50,
                      ),
                      items: [
                         const DropdownMenuItem(value: null, child: Text("Unassigned")),
                         ..._availableUsers.map((u) => DropdownMenuItem(
                           value: u.name,
                           child: Text(u.name),
                         )).toList(),
                      ],
                      onChanged: (v) => setState(() => _assignedTo = v),
                    ),
                    const SizedBox(height: 16),
                    
                    // Advanced Toggle
                    InkWell(
                      onTap: () => setState(() => _showAdvanced = !_showAdvanced),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8.0),
                        child: Row(
                          children: [
                            Icon(_showAdvanced ? Icons.remove_circle_outline : Icons.add_circle_outline, size: 20, color: Colors.blue),
                            const SizedBox(width: 8),
                            Text(
                              _showAdvanced ? 'Hide Details' : 'Add Details, Deadline & Priority',
                              style: const TextStyle(color: Colors.blue, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ),
                    ),
                    
                    if (_showAdvanced) ...[
                      const SizedBox(height: 8),
                      // Details
                      TextFormField(
                        controller: _detailsController,
                        decoration: InputDecoration(
                          labelText: 'Details / Description',
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          filled: true,
                          fillColor: Colors.grey.shade50,
                        ),
                        maxLines: 2,
                      ),
                      const SizedBox(height: 16),
                      
                      // Priority
                      DropdownButtonFormField<TaskPriority>(
                        value: _priority,
                        decoration: InputDecoration(
                          labelText: 'Priority',
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          filled: true,
                          fillColor: Colors.grey.shade50,
                        ),
                        items: TaskPriority.values.map((p) {
                          String label;
                          Color color;
                          switch (p) {
                            case TaskPriority.urgent: label = 'Urgent'; color = Colors.red; break;
                            case TaskPriority.high: label = 'High'; color = Colors.orange; break;
                            case TaskPriority.medium: label = 'Medium'; color = Colors.blue; break;
                            case TaskPriority.low: label = 'Low'; color = Colors.green; break;
                          }
                          return DropdownMenuItem(
                            value: p,
                            child: Row(
                              children: [
                                Container(width: 10, height: 10, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
                                const SizedBox(width: 8),
                                Text(label),
                              ],
                            ),
                          );
                        }).toList(),
                        onChanged: (v) => setState(() => _priority = v!),
                      ),
                      const SizedBox(height: 16),

                      // Deadline Row
                      Row(
                        children: [
                          Expanded(
                            child: InkWell(
                              onTap: _pickDate,
                              child: InputDecorator(
                                decoration: InputDecoration(
                                  labelText: 'Deadline',
                                  suffixIcon: const Icon(Icons.calendar_today_outlined, size: 20),
                                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                                  filled: true,
                                  fillColor: Colors.grey.shade50,
                                ),
                                child: Text(NepaliDateHelper.formatToNepali(_selectedDate), style: const TextStyle(fontSize: 13)),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: InkWell(
                              onTap: _pickTime,
                              child: InputDecorator(
                                decoration: InputDecoration(
                                  labelText: 'Time (opt)',
                                  suffixIcon: const Icon(Icons.access_time_outlined, size: 20),
                                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                                  filled: true,
                                  fillColor: Colors.grey.shade50,
                                ),
                                child: Text(
                                  _selectedTime != null ? _selectedTime!.format(context) : 'Not set',
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: _selectedTime != null ? Colors.black : Colors.grey,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                    
                    if (widget.existingTask == null) ...[
                      const SizedBox(height: 24),
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton.icon(
                          onPressed: _addNextTask,
                          icon: const Icon(Icons.add),
                          label: const Text('ADD NEXT TASK'),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            side: BorderSide(color: Theme.of(context).primaryColor),
                          ),
                        ),
                      ),
                    ],
                    
                    if (_draftTasks.isNotEmpty) ...[
                      const SizedBox(height: 24),
                      const Text('Draft Tasks:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                      const SizedBox(height: 8),
                      ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: _draftTasks.length,
                        itemBuilder: (context, index) {
                          final task = _draftTasks[index];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            color: Colors.blue.shade50.withOpacity(0.5),
                            elevation: 0,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            child: ListTile(
                              dense: true,
                              title: Text(task.title, style: const TextStyle(fontWeight: FontWeight.bold)),
                              subtitle: Text(task.assignedTo ?? 'Unassigned'),
                              trailing: IconButton(
                                icon: const Icon(Icons.close, size: 18, color: Colors.grey),
                                onPressed: () => setState(() => _draftTasks.removeAt(index)),
                              ),
                            ),
                          );
                        },
                      ),
                    ],
                    const SizedBox(height: 24),
                    
                    // Final Submit Button
                    CustomButton(
                      label: widget.existingTask != null 
                          ? 'Update Task' 
                          : (_draftTasks.isEmpty ? 'Save Task' : 'Save All Tasks'),
                      icon: widget.existingTask != null ? Icons.save : Icons.check_circle,
                      onPressed: _submit,
                    ),
                    const SizedBox(height: 8),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
