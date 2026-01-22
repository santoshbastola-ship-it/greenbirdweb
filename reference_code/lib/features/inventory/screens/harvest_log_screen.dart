import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:farm_management_app/core/widgets/custom_button.dart';
import 'package:farm_management_app/core/widgets/custom_card.dart';
import 'package:farm_management_app/features/inventory/models/harvest_log.dart';
import 'package:farm_management_app/core/utils/nepali_date_helper.dart';

class HarvestLogScreen extends StatefulWidget {
  const HarvestLogScreen({super.key});

  @override
  State<HarvestLogScreen> createState() => _HarvestLogScreenState();
}

class _HarvestLogScreenState extends State<HarvestLogScreen> {
  final _formKey = GlobalKey<FormState>();
  final _cropController = TextEditingController();
  final _weightController = TextEditingController();
  final _locationController = TextEditingController();
  
  QualityGrade _selectedGrade = QualityGrade.A;
  
  // Fake list
  final List<HarvestLog> _logs = [];

  void _saveLog() {
    if (_formKey.currentState!.validate()) {
      final newLog = HarvestLog(
        cropName: _cropController.text,
        weightKg: double.tryParse(_weightController.text) ?? 0.0,
        grade: _selectedGrade,
        harvestDate: DateTime.now(),
        storageLocation: _locationController.text,
      );

      setState(() {
        _logs.insert(0, newLog);
      });

      _cropController.clear();
      _weightController.clear();
      _locationController.clear();
      // Keep grade as A

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Harvest Logged!')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Harvest Yields')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CustomCard(
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("Add New Harvest", style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _cropController,
                      decoration: const InputDecoration(labelText: 'Crop Name'),
                      validator: (v) => v!.isEmpty ? 'Required' : null,
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _weightController,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(labelText: 'Weight (Kg)'),
                            validator: (v) => v!.isEmpty ? 'Required' : null,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                           child: DropdownButtonFormField<QualityGrade>(
                             initialValue: _selectedGrade,
                             decoration: const InputDecoration(labelText: 'Quality Grade'),
                             items: QualityGrade.values.map((g) => DropdownMenuItem(
                               value: g,
                               child: Text("Grade ${g.name}"),
                             )).toList(),
                             onChanged: (v) => setState(() => _selectedGrade = v!),
                           ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _locationController,
                      decoration: const InputDecoration(labelText: 'Storage Location'),
                    ),
                    const SizedBox(height: 24),
                    CustomButton(
                      label: "Record Harvest",
                      icon: Icons.add_circle_outline,
                      onPressed: _saveLog,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
             const Text(
              "Recent Harvests",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
             if (_logs.isEmpty)
              const Center(child: Padding(
                padding: EdgeInsets.all(24.0),
                child: Text("No harvest records today."),
              ))
            else
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _logs.length,
                itemBuilder: (context, index) {
                  final log = _logs[index];
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12.0),
                    child: CustomCard(
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: Colors.green.shade100,
                          child: Text(log.grade.name, style: TextStyle(color: Colors.green.shade800, fontWeight: FontWeight.bold)),
                        ),
                        title: Text(log.cropName),
                        subtitle: Text("${log.weightKg} Kg • ${NepaliDateHelper.formatToNepaliShort(log.harvestDate)}"),
                        trailing: Icon(Icons.inventory_2_outlined, color: Colors.grey.shade400),
                      ),
                    ),
                  );
                },
              ),
          ],
        ),
      ),
    );
  }
}
