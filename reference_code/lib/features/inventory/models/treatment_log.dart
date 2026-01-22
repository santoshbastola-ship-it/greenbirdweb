import 'package:uuid/uuid.dart';

class TreatmentLog {
  final String id;
  final String plantType;
  final String chemicalName;
  final double quantityApplied;
  final String unit; // ml, l, kg, g
  final DateTime dateApplied;
  final String notes;

  TreatmentLog({
    String? id,
    required this.plantType,
    required this.chemicalName,
    required this.quantityApplied,
    required this.unit,
    required this.dateApplied,
    this.notes = '',
  }) : id = id ?? const Uuid().v4();

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'plantType': plantType,
      'chemicalName': chemicalName,
      'quantityApplied': quantityApplied,
      'unit': unit,
      'dateApplied': dateApplied.toIso8601String(),
      'notes': notes,
    };
  }
}
