import 'package:uuid/uuid.dart';

enum QualityGrade { A, B, C, D }

class HarvestLog {
  final String id;
  final String cropName;
  final double weightKg;
  final QualityGrade grade;
  final DateTime harvestDate;
  final String storageLocation;

  HarvestLog({
    String? id,
    required this.cropName,
    required this.weightKg,
    required this.grade,
    required this.harvestDate,
    required this.storageLocation,
  }) : id = id ?? const Uuid().v4();
}
