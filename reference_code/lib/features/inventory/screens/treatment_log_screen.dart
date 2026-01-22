import 'package:flutter/material.dart';
import 'package:farm_management_app/core/widgets/custom_button.dart';
import 'package:farm_management_app/core/widgets/custom_card.dart';
import 'package:farm_management_app/features/inventory/models/treatment_log.dart';

class TreatmentLogScreen extends StatefulWidget {
  const TreatmentLogScreen({super.key});

  @override
  State<TreatmentLogScreen> createState() => _TreatmentLogScreenState();
}

class _TreatmentLogScreenState extends State<TreatmentLogScreen> {
  final _formKey = GlobalKey<FormState>();
  final _plantController = TextEditingController();
  final _chemicalController = TextEditingController();
  final _quantityController = TextEditingController();
  final _notesController = TextEditingController();
  
  // Fake list for demo
  final List<TreatmentLog> _logs = [];

  void _saveLog() {
    if (_formKey.currentState!.validate()) {
      final newLog = TreatmentLog(
        plantType: _plantController.text,
        chemicalName: _chemicalController.text,
        quantityApplied: double.tryParse(_quantityController.text) ?? 0.0,
        unit: 'L', // Hardcoded for demo
        dateApplied: DateTime.now(),
        notes: _notesController.text,
      );

      setState(() {
        _logs.insert(0, newLog);
      });
      
      _plantController.clear();
      _chemicalController.clear();
      _quantityController.clear();
      _notesController.clear();

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Treatment Logged!')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Chemical Treatments')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              "New Treatment Log",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            CustomCard(
              child: Form(
                key: _formKey,
                child: Column(
                  children: [
                    TextFormField(
                      controller: _plantController,
                      decoration: const InputDecoration(labelText: 'Plant / Crop Type'),
                      validator: (v) => v!.isEmpty ? 'Required' : null,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _chemicalController,
                      decoration: const InputDecoration(labelText: 'Chemical Name'),
                      validator: (v) => v!.isEmpty ? 'Required' : null,
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _quantityController,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(labelText: 'Quantity'),
                            validator: (v) => v!.isEmpty ? 'Required' : null,
                          ),
                        ),
                        const SizedBox(width: 16),
                        const SizedBox(
                          width: 100,
                          child: Text("Unit: L", style: TextStyle(fontWeight: FontWeight.bold)),
                        )
                      ],
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _notesController,
                      decoration: const InputDecoration(labelText: 'Notes (Optional)'),
                      maxLines: 2,
                    ),
                    const SizedBox(height: 24),
                    CustomButton(
                      label: "Save Log",
                      onPressed: _saveLog,
                      icon: Icons.save,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 32),
            const Text(
              "Recent Logs",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            if (_logs.isEmpty)
              const Center(child: Padding(
                padding: EdgeInsets.all(24.0),
                child: Text("No records yet."),
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
                        contentPadding: EdgeInsets.zero,
                        title: Text("${log.plantType} - ${log.chemicalName}"),
                        subtitle: Text("Applied: ${log.quantityApplied} ${log.unit}\n${log.dateApplied.toString().split(' ')[0]}"),
                        isThreeLine: true,
                        trailing: const Icon(Icons.history_edu, color: Colors.green),
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
