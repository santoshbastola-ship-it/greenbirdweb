import 'package:uuid/uuid.dart';
import 'package:farm_management_app/features/inventory/models/stock_entry.dart';
import 'package:farm_management_app/core/models/payment_status.dart';

enum TransactionType { Sale, Purchase }


/// Represents a single item in a sales transaction
class SalesItem {
  final String productId;
  final String productName;
  final BusinessType businessType;
  final double quantity;
  final double? weight; // Added weight in kg
  final StockUnit unit;
  final StockUnit priceUnit; // Added to track what unit the price is based on
  final double pricePerUnit;
  final double totalPrice;
  final String? description;
  
  SalesItem({
    required this.productId,
    required this.productName,
    required this.businessType,
    required this.quantity,
    this.weight,
    required this.unit,
    StockUnit? priceUnit,
    required this.pricePerUnit,
    this.description,
  }) : priceUnit = priceUnit ?? unit,
       totalPrice = (priceUnit == StockUnit.kg && weight != null && weight > 0) 
          ? (weight * pricePerUnit) 
          : (quantity * pricePerUnit);
  
  SalesItem copyWith({
    String? productId,
    String? productName,
    BusinessType? businessType,
    double? quantity,
    double? weight,
    StockUnit? unit,
    StockUnit? priceUnit,
    double? pricePerUnit,
    String? description,
  }) {
    return SalesItem(
      productId: productId ?? this.productId,
      productName: productName ?? this.productName,
      businessType: businessType ?? this.businessType,
      quantity: quantity ?? this.quantity,
      weight: weight ?? this.weight,
      unit: unit ?? this.unit,
      priceUnit: priceUnit ?? this.priceUnit,
      pricePerUnit: pricePerUnit ?? this.pricePerUnit,
      description: description ?? this.description,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'productId': productId,
      'productName': productName,
      'businessType': businessType.index,
      'quantity': quantity,
      'weight': weight,
      'unit': unit.index,
      'priceUnit': priceUnit.index,
      'pricePerUnit': pricePerUnit,
      'description': description,
    };
  }

  factory SalesItem.fromMap(Map<String, dynamic> map) {
    return SalesItem(
      productId: map['productId'] ?? '',
      productName: map['productName'] ?? '',
      businessType: BusinessType.values[map['businessType'] ?? 0],
      quantity: (map['quantity'] ?? 0).toDouble(),
      weight: map['weight']?.toDouble(),
      unit: StockUnit.values[map['unit'] ?? 0],
      priceUnit: map['priceUnit'] != null ? StockUnit.values[map['priceUnit']] : null,
      pricePerUnit: (map['pricePerUnit'] ?? 0).toDouble(),
      description: map['description'],
    );
  }
}

class PaymentRecord {
  final double amount;
  final DateTime date;
  final String? note;

  PaymentRecord({required this.amount, required this.date, this.note});

  Map<String, dynamic> toMap() {
    return {
      'amount': amount,
      // We'll handle Timestamp conversion in Service if needed, or stick to basic types here?
      // Models usually shouldn't depend on cloud_firestore unless they are DTOs. 
      // But this file already imports cloud_firestore in other places? No, it imports uuid, stock_entry, payment_status.
      // Wait, this file does NOT import cloud_firestore. So I shouldn't use Timestamp here.
      // I'll keep it as a clean model and let Service handle map conversion, 
      // OR I can't put toMap/fromMap here if it depends on Timestamp.
      // Let's just define the class here. Service handles serialization.
    };
  }
}

enum OrderStatus {
  open,
  accepted,
  delivered,
  cancelled;

  String get displayName {
    switch (this) {
      case OrderStatus.open: return 'Open';
      case OrderStatus.accepted: return 'Accepted';
      case OrderStatus.delivered: return 'Delivered';
      case OrderStatus.cancelled: return 'Cancelled';
    }
  }
}

/// Represents a complete sales or purchase transaction
class TransactionRecord {
  final String id;
  final String billNo; // Auto-generated bill number
  final TransactionType type;
  final List<SalesItem> items;
  final String? customerId; // Customer/Vendor ID for reference (nullable for backward compatibility)
  final String partyName; // Customer or Vendor name (for display and backward compatibility)
  final DateTime date;
  final double discount; // Total discount for the transaction
  final String soldBy; // User who sold the goods (for sales)
  final String enteredBy; // User who entered this data
  final DateTime entryTimestamp; // When this record was created
  final PaymentStatus paymentStatus; // Combined payment status
  final OrderStatus status; // New: Track order lifecycle
  final String? cancellationReason; // Reason for cancellation if status is cancelled
  final double _legacyPaidAmount; // Store the passed value
  final List<PaymentRecord> payments; // New history

  TransactionRecord({
    String? id,
    String? billNo,
    required this.type,
    required this.items,
    this.customerId, // Optional for backward compatibility
    required this.partyName,
    required this.date,
    this.discount = 0.0,
    required this.soldBy,
    required this.enteredBy,
    DateTime? entryTimestamp,
    PaymentStatus? paymentStatus,
    OrderStatus? status,
    this.cancellationReason,
    double paidAmount = 0.0,
    List<PaymentRecord>? payments,
  }) : id = id ?? const Uuid().v4(),
       billNo = billNo ?? _generateBillNo(type, date, id ?? const Uuid().v4()),
       entryTimestamp = entryTimestamp ?? DateTime.now(),
       paymentStatus = paymentStatus ?? (type == TransactionType.Sale ? PaymentStatus.PaidCash : PaymentStatus.Pending),
       status = status ?? (type == TransactionType.Sale ? OrderStatus.delivered : OrderStatus.delivered), // Default old records to delivered. CRITICAL: Provide status explicitly for new Open orders.
       _legacyPaidAmount = paidAmount,
       payments = payments ?? [];
  
  // Generate bill number in format: S-XXXXX or P-XXXXX (5 digits)
  static String _generateBillNo(TransactionType type, DateTime date, String id) {
    final prefix = type == TransactionType.Sale ? 'S' : 'P';
    // Use hashCode of id to generate a 5-digit number
    final hash = id.hashCode.abs();
    final fiveDigit = (hash % 100000).toString().padLeft(5, '0');
    return '$prefix-$fiveDigit';
  }
  
  // Calculate paid amount: Sum of payments, or fallback to legacy value if no history (migration support)
  double get paidAmount {
    if (payments.isNotEmpty) {
      return payments.fold(0.0, (sum, p) => sum + p.amount);
    }
    return _legacyPaidAmount;
  }

  // Calculate total price of all items
  double get totalPrice {
    return items.fold(0.0, (sum, item) => sum + item.totalPrice);
  }
  
  // Calculate total payable (total price - discount)
  double get totalPayable {
    return totalPrice - discount;
  }
  
  // Calculate remaining amount (for partial payments)
  double get remainingAmount {
    if (paymentStatus.isPartial) {
      return totalPayable - paidAmount;
    }
    return paymentStatus.isPending ? totalPayable : 0.0;
  }
  
  // Get a summary of item names for display
  String get itemsSummary {
    if (items.isEmpty) return 'No items';
    if (items.length == 1) return items.first.productName;
    return '${items.first.productName} +${items.length - 1} more';
  }

  // Get a summary of item quantities for display
  String get qtySummary {
    if (items.isEmpty) return '-';
    return items.map((item) {
      String qty = '${item.quantity.toStringAsFixed(0)} ${item.unit.displayName}'; // format quantity without decimal if possible
      // If sold by weight (e.g. Birds by Kg), show weight detail
      // Assuming if priceUnit is Kg and unit is Pcs, it's a weight based sale of pieces
      if (item.weight != null && item.weight! > 0) {
        qty += ' (${item.weight!.toStringAsFixed(2)} Kg)';
      }
      return qty;
    }).join(', ');
  }
  
  TransactionRecord copyWith({
    TransactionType? type,
    List<SalesItem>? items,
    String? customerId,
    String? partyName,
    DateTime? date,
    double? discount,
    String? soldBy,
    String? enteredBy,
    PaymentStatus? paymentStatus,
    OrderStatus? status,
    String? cancellationReason,
    double? paidAmount,
    List<PaymentRecord>? payments,
  }) {
    return TransactionRecord(
      id: id,
      billNo: billNo, // Keep the same bill number
      type: type ?? this.type,
      items: items ?? this.items,
      customerId: customerId ?? this.customerId,
      partyName: partyName ?? this.partyName,
      date: date ?? this.date,
      discount: discount ?? this.discount,
      soldBy: soldBy ?? this.soldBy,
      enteredBy: enteredBy ?? this.enteredBy,
      entryTimestamp: entryTimestamp,
      paymentStatus: paymentStatus ?? this.paymentStatus,
      status: status ?? this.status,
      cancellationReason: cancellationReason ?? this.cancellationReason,
      paidAmount: paidAmount ?? this.paidAmount,
      payments: payments ?? this.payments,
    );
  }
}
