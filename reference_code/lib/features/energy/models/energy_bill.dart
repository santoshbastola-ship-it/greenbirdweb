import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:farm_management_app/core/models/payment_status.dart';

enum EnergyType {
  electricity,
  water,
  gas,
  food;

  String get displayName {
    switch (this) {
      case EnergyType.electricity: return 'Electricity';
      case EnergyType.water: return 'Water';
      case EnergyType.gas: return 'Gas';
      case EnergyType.food: return 'Food Bill';
    }
  }
}



class EnergyBill {
  final String id;
  final EnergyType type;
  final String month; // Nepali Month e.g., "Baisakh"
  final int year;
  final DateTime? meterReadingDate;
  final DateTime? dueDate;
  final DateTime? purchaseDate; // For gas bills
  final String? remarks; // For food bills and optional notes
  final PaymentStatus paymentStatus;
  final double paidAmount; // Added for partial payments
  final String enteredBy;
  final double amount; // Total Bill Amount
  final DateTime entryDate;

  EnergyBill({
    required this.id,
    required this.type,
    required this.month,
    required this.year,
    this.meterReadingDate,
    this.dueDate,
    this.purchaseDate,
    this.remarks,
    required this.paymentStatus,
    this.paidAmount = 0.0,
    required this.enteredBy,
    required this.amount,
    required this.entryDate,
  });

  factory EnergyBill.fromMap(Map<String, dynamic> data, String id) {
    return EnergyBill(
      id: id,
      type: EnergyType.values.firstWhere(
        (e) => e.name == (data['type'] ?? 'electricity'),
        orElse: () => EnergyType.electricity,
      ),
      month: data['month'] ?? '',
      year: (data['year'] as num?)?.toInt() ?? DateTime.now().year,
      meterReadingDate: (data['meterReadingDate'] as Timestamp?)?.toDate(),
      dueDate: (data['dueDate'] as Timestamp?)?.toDate(),
      purchaseDate: (data['purchaseDate'] as Timestamp?)?.toDate(),
      remarks: data['remarks'] as String?,
      paymentStatus: PaymentStatus.values.firstWhere(
        (e) => e.name == (data['paymentStatus'] ?? 'Pending'),
        orElse: () => PaymentStatus.Pending,
      ),
      paidAmount: (data['paidAmount'] as num?)?.toDouble() ?? 0.0,
      enteredBy: data['enteredBy'] ?? '',
      amount: (data['amount'] as num?)?.toDouble() ?? 0.0,
      entryDate: (data['entryDate'] as Timestamp?)?.toDate() ?? DateTime.now(),
    );
  }

  EnergyBill copyWith({
    String? id,
    EnergyType? type,
    String? month,
    int? year,
    DateTime? meterReadingDate,
    DateTime? dueDate,
    DateTime? purchaseDate,
    String? remarks,
    PaymentStatus? paymentStatus,
    double? paidAmount,
    String? enteredBy,
    double? amount,
    DateTime? entryDate,
  }) {
    return EnergyBill(
      id: id ?? this.id,
      type: type ?? this.type,
      month: month ?? this.month,
      year: year ?? this.year,
      meterReadingDate: meterReadingDate ?? this.meterReadingDate,
      dueDate: dueDate ?? this.dueDate,
      purchaseDate: purchaseDate ?? this.purchaseDate,
      remarks: remarks ?? this.remarks,
      paymentStatus: paymentStatus ?? this.paymentStatus,
      paidAmount: paidAmount ?? this.paidAmount,
      enteredBy: enteredBy ?? this.enteredBy,
      amount: amount ?? this.amount,
      entryDate: entryDate ?? this.entryDate,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'type': type.name,
      'month': month,
      'year': year,
      'meterReadingDate': meterReadingDate != null ? Timestamp.fromDate(meterReadingDate!) : null,
      'dueDate': dueDate != null ? Timestamp.fromDate(dueDate!) : null,
      'purchaseDate': purchaseDate != null ? Timestamp.fromDate(purchaseDate!) : null,
      'remarks': remarks,
      'paymentStatus': paymentStatus.name,
      'paidAmount': paidAmount,
      'enteredBy': enteredBy,
      'amount': amount,
      'entryDate': Timestamp.fromDate(entryDate),
    };
  }
  
  double get remainingAmount {
    if (paymentStatus.isPartial) {
      return amount - paidAmount;
    }
    return paymentStatus.isPending ? amount : 0;
  }
}
