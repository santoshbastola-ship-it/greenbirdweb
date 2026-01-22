import 'package:flutter/material.dart';
import 'package:farm_management_app/core/widgets/custom_card.dart';
import 'package:farm_management_app/features/notifications/widgets/notification_bell.dart';
import 'package:farm_management_app/features/operations/models/worker.dart';

class WorkerScreen extends StatefulWidget {
  const WorkerScreen({super.key});

  @override
  State<WorkerScreen> createState() => _WorkerScreenState();
}

class _WorkerScreenState extends State<WorkerScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  
  // Dummy Data
  final List<Worker> _workers = [
    Worker(name: "Ram Bahadur", role: "Manager", contact: "9800000000"),
    Worker(name: "Sita Devi", role: "Harvester", contact: "9811111111"),
  ];
  
  final List<TaskAssignment> _tasks = [];
  
  final _workerNameController = TextEditingController();
  final _workerRoleController = TextEditingController();
  final _workerContactController = TextEditingController();
  
  final _taskTitleController = TextEditingController();
  Worker? _selectedWorkerForTask;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  void _addWorker() {
    if (_workerNameController.text.isNotEmpty) {
      setState(() {
        _workers.add(Worker(
          name: _workerNameController.text,
          role: _workerRoleController.text,
          contact: _workerContactController.text,
        ));
      });
      _workerNameController.clear();
      _workerRoleController.clear();
      _workerContactController.clear();
      Navigator.pop(context);
    }
  }

  void _assignTask() {
    if (_taskTitleController.text.isNotEmpty && _selectedWorkerForTask != null) {
      setState(() {
        _tasks.insert(0, TaskAssignment(
          title: _taskTitleController.text,
          workerId: _selectedWorkerForTask!.id,
          workerName: _selectedWorkerForTask!.name,
          dateAssigned: DateTime.now(),
        ));
      });
      _taskTitleController.clear();
      _selectedWorkerForTask = null;
      Navigator.pop(context);
    }
  }

  void _showAddWorkerDialog() {
    showDialog(context: context, builder: (c) => AlertDialog(
      title: const Text("Add New Worker"),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(controller: _workerNameController, decoration: const InputDecoration(labelText: "Name")),
          const SizedBox(height: 8),
          TextField(controller: _workerRoleController, decoration: const InputDecoration(labelText: "Role")),
          const SizedBox(height: 8),
          TextField(controller: _workerContactController, decoration: const InputDecoration(labelText: "Contact")),
        ],
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(c), child: const Text("Cancel")),
        ElevatedButton(onPressed: _addWorker, child: const Text("Add")),
      ],
    ));
  }

  void _showAssignTaskDialog() {
    showDialog(context: context, builder: (c) => StatefulBuilder(
      builder: (context, setState) {
        return AlertDialog(
          title: const Text("Assign Task"),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: _taskTitleController, decoration: const InputDecoration(labelText: "Task Description")),
              const SizedBox(height: 16),
              DropdownButton<Worker>(
                hint: const Text("Select Worker"),
                value: _selectedWorkerForTask,
                isExpanded: true,
                items: _workers.map((w) => DropdownMenuItem(value: w, child: Text(w.name))).toList(),
                onChanged: (v) => setState(() => _selectedWorkerForTask = v),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(c), child: const Text("Cancel")),
            ElevatedButton(onPressed: _assignTask, child: const Text("Assign")),
          ],
        );
      }
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Farm Operations'),
        actions: [
          const NotificationBell(),
        ],
        bottom: TabBar(
          controller: _tabController,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          indicatorColor: Colors.white,
          tabs: const [
            Tab(text: "Workers"),
            Tab(text: "Tasks"),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // Workers Tab
          Scaffold(
            floatingActionButton: FloatingActionButton(
              onPressed: _showAddWorkerDialog,
              child: const Icon(Icons.person_add),
            ),
            body: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _workers.length,
              itemBuilder: (context, index) {
                final w = _workers[index];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: CustomCard(
                    child: ListTile(
                      leading: CircleAvatar(child: Text(w.name[0])),
                      title: Text(w.name),
                      subtitle: Text("${w.role} • ${w.contact}"),
                    ),
                  ),
                );
              },
            ),
          ),
          // Tasks Tab
          Scaffold(
            floatingActionButton: FloatingActionButton(
              onPressed: _showAssignTaskDialog,
              child: const Icon(Icons.assignment_add),
            ),
            body: _tasks.isEmpty 
              ? const Center(child: Text("No active tasks"))
              : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _tasks.length,
                itemBuilder: (context, index) {
                  final t = _tasks[index];
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: CustomCard(
                      child: ListTile(
                        leading: const Icon(Icons.check_circle_outline),
                        title: Text(t.title),
                        subtitle: Text("Assigned to: ${t.workerName}"),
                        trailing: Checkbox(value: t.isCompleted, onChanged: (v) {
                          setState(() => t.isCompleted = v!);
                        }),
                      ),
                    ),
                  );
                },
              ),
          ),
        ],
      ),
    );
  }
}
