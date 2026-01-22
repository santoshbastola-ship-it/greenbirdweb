import 'package:uuid/uuid.dart';

enum BusinessType {
  livestocks,
  restaurant,
  farm;

  String get displayName {
    switch (this) {
      case BusinessType.livestocks: return 'Livestocks';
      case BusinessType.restaurant: return 'Restaurant';
      case BusinessType.farm: return 'Farm';
    }
  }
}

enum StockUnit {
  pcs,
  kg,
  carat,
  plate;

  String get displayName {
    switch (this) {
      case StockUnit.pcs: return 'Pcs';
      case StockUnit.kg: return 'Kg';
      case StockUnit.carat: return 'Carat';
      case StockUnit.plate: return 'Plate';
    }
  }
}

class StockEntry {
  final String id;
  final BusinessType businessType;
  final String productName;
  final double count;
  final StockUnit unit;
  final DateTime date; // "Stock Update of"
  final DateTime entryTimestamp;
  final String enteredBy;

  StockEntry({
    String? id,
    required this.businessType,
    required this.productName,
    required this.count,
    required this.unit,
    required this.date,
    required this.entryTimestamp,
    required this.enteredBy,
  }) : id = id ?? const Uuid().v4();
}
