import 'package:flutter/material.dart';
import 'package:farm_management_app/core/widgets/custom_card.dart';
import 'package:farm_management_app/features/notifications/widgets/notification_bell.dart';
import 'package:intl/intl.dart';
import 'package:farm_management_app/core/utils/nepali_date_helper.dart';

enum CropStageStatus { Pending, InProgress, Completed }

class CropStage {
  final String id;
  final String cropName;
  final String stageName; // e.g. "Sowing", "Fertilizing"
  final DateTime startDate;
  final DateTime endDate;
  CropStageStatus status;

  CropStage({
    required this.id, 
    required this.cropName, 
    required this.stageName, 
    required this.startDate, 
    required this.endDate,
    this.status = CropStageStatus.Pending,
  });
}

class CropCalendarScreen extends StatefulWidget {
  const CropCalendarScreen({super.key});

  @override
  State<CropCalendarScreen> createState() => _CropCalendarScreenState();
}

class _CropCalendarScreenState extends State<CropCalendarScreen> {
  // Mock Data
  final List<CropStage> _stages = [
    CropStage(id: '1', cropName: 'Rice', stageName: 'Sowing', startDate: DateTime.now().subtract(const Duration(days: 10)), endDate: DateTime.now(), status: CropStageStatus.Completed),
    CropStage(id: '2', cropName: 'Rice', stageName: 'Watering Phase 1', startDate: DateTime.now(), endDate: DateTime.now().add(const Duration(days: 5)), status: CropStageStatus.InProgress),
    CropStage(id: '3', cropName: 'Rice', stageName: 'Fertilizing', startDate: DateTime.now().add(const Duration(days: 6)), endDate: DateTime.now().add(const Duration(days: 10))),
    CropStage(id: '4', cropName: 'Wheat', stageName: 'Soil Prep', startDate: DateTime.now().add(const Duration(days: 20)), endDate: DateTime.now().add(const Duration(days: 25))),
  ];

  void _addStage(String crop, String stage, DateTime start, DateTime end) {
    setState(() {
      _stages.add(CropStage(
        id: DateTime.now().toString(),
        cropName: crop,
        stageName: stage,
        startDate: start,
        endDate: end,
      ));
      // Sort by start date
      _stages.sort((a, b) => a.startDate.compareTo(b.startDate));
    });
  }

  void _showAddDialog() {
    final cropController = TextEditingController();
    final stageController = TextEditingController();
    DateTime start = DateTime.now();
    DateTime end = DateTime.now().add(const Duration(days: 7));

    showDialog(context: context, builder: (c) => StatefulBuilder(
      builder: (context, setState) {
        return AlertDialog(
          title: const Text("New Crop Stage"),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(controller: cropController, autofocus: true, decoration: const InputDecoration(labelText: "Crop Name")),
                const SizedBox(height: 8),
                TextField(controller: stageController, decoration: const InputDecoration(labelText: "Task / Stage Name")),
                const SizedBox(height: 16),
                ListTile(
                  title: const Text("Start Date"),
                  trailing: Text(NepaliDateHelper.formatToNepaliShort(start)),
                  onTap: () async {
                    // Use 'c' or 'context' from builder? 'context' from builder is safe for dialog re-renders
                    final d = await NepaliDateHelper.pickNepaliDate(context, initialDate: start, firstDate: DateTime(2023), lastDate: DateTime(2030));
                    if (d != null) setState(() => start = d);
                  },
                ),
                ListTile(
                  title: const Text("End Date"),
                  trailing: Text(NepaliDateHelper.formatToNepaliShort(end)),
                  onTap: () async {
                    final d = await NepaliDateHelper.pickNepaliDate(context, initialDate: end, firstDate: DateTime(2023), lastDate: DateTime(2030));
                    if (d != null) setState(() => end = d);
                  },
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(c), child: const Text("Cancel")),
            ElevatedButton(onPressed: () {
              if (cropController.text.isNotEmpty && stageController.text.isNotEmpty) {
                _addStage(cropController.text, stageController.text, start, end);
                Navigator.pop(c);
              }
            }, child: const Text("Add Stage")),
          ],
        );
      }
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Crop Calendar"),
        actions: [
          const NotificationBell(),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showAddDialog,
        child: const Icon(Icons.add),
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _stages.length,
        itemBuilder: (context, index) {
          final stage = _stages[index];
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: CustomCard(
              child: ListTile(
                leading: _buildStatusIcon(stage.status),
                title: Text("${stage.cropName} - ${stage.stageName}", style: const TextStyle(fontWeight: FontWeight.bold)),
                subtitle: Text("${NepaliDateHelper.formatToNepaliShort(stage.startDate)} - ${NepaliDateHelper.formatToNepaliShort(stage.endDate)}"),
                trailing: PopupMenuButton<CropStageStatus>(
                  onSelected: (s) => setState(() => stage.status = s),
                  itemBuilder: (context) => CropStageStatus.values.map((s) => PopupMenuItem(value: s, child: Text(s.name))).toList(),
                  child: const Icon(Icons.more_vert),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildStatusIcon(CropStageStatus status) {
    switch (status) {
      case CropStageStatus.Pending: return const CircleAvatar(backgroundColor: Colors.grey, child: Icon(Icons.schedule, color: Colors.white, size: 16));
      case CropStageStatus.InProgress: return const CircleAvatar(backgroundColor: Colors.blue, child: Icon(Icons.sync, color: Colors.white, size: 16));
      case CropStageStatus.Completed: return const CircleAvatar(backgroundColor: Colors.green, child: Icon(Icons.check, color: Colors.white, size: 16));
    }
  }
}
