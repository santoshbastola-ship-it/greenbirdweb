import 'package:cloud_firestore/cloud_firestore.dart';

import 'package:farm_management_app/features/sales/models/sales_record.dart';
import 'package:farm_management_app/core/models/payment_status.dart'; 
import 'package:farm_management_app/features/inventory/models/stock_entry.dart';
import 'package:farm_management_app/features/inventory/services/stock_service.dart';
import 'package:farm_management_app/features/sales/services/customer_service.dart';
import 'package:farm_management_app/features/notifications/services/notification_service.dart';
import 'package:farm_management_app/features/notifications/models/notification_model.dart';
import 'package:farm_management_app/features/auth/services/auth_service.dart'; // Added

class SalesService {
  final FirebaseFirestore _firestore;
  late final CollectionReference _salesCollection;
  final StockService _stockService;
  final CustomerService _customerService; 
  final NotificationService _notificationService; 
  final AuthService _authService;

  SalesService({
    FirebaseFirestore? firestore, 
    StockService? stockService,
    CustomerService? customerService,
    NotificationService? notificationService,
    AuthService? authService,
  }) 
      : _firestore = firestore ?? FirebaseFirestore.instance,
        _stockService = stockService ?? StockService(),
        _customerService = customerService ?? CustomerService(),
        _notificationService = notificationService ?? NotificationService(),
        _authService = authService ?? AuthService() { 
    _salesCollection = _firestore.collection('sales_records');
    
    // Register cascade update callback for customer name changes
    _customerService.registerCustomerNameChangeCallback(updateCustomerNameInRecords);
  }

  // Get sales trend with filters
  Future<Map<DateTime, double>> getSalesTrend({int days = 7, BusinessType? type}) async {
    try {
      final now = DateTime.now();
      final startDate = now.subtract(Duration(days: days));
      
      // Query Firestore
      // Note: This requires an index on 'date' if data is large, but for now filtering locally if needed
      // Filtering by 'type' == 'Sale' first
      final querySnapshot = await _salesCollection
          .where('type', isEqualTo: 'Sale')
          .where('date', isGreaterThanOrEqualTo: Timestamp.fromDate(startDate))
          .get();

      final Map<DateTime, double> salesData = {};
      
      // Initialize zero values for all days in range to ensure graph continuity
      for (int i = 0; i < days; i++) {
        final d = now.subtract(Duration(days: i));
        final dayDate = DateTime(d.year, d.month, d.day);
        salesData[dayDate] = 0.0;
      }

      for (var doc in querySnapshot.docs) {
        final data = doc.data() as Map<String, dynamic>;
        final dateTs = data['date'] as Timestamp;
        final date = dateTs.toDate();
        final dayDate = DateTime(date.year, date.month, date.day);
        
        // Calculate amount for this record based on type filter
        double recordAmount = 0.0;
        
        final itemsList = (data['items'] as List<dynamic>?) ?? [];
        
        if (type == null) {
          // No filter: use totalPayable from record if stored, or sum items
          // Assuming 'totalPayable' is stored. If not, sum items.
           if (data.containsKey('totalPayable')) {
             recordAmount = (data['totalPayable'] as num).toDouble();
           } else {
             // Fallback: sum items
             for (var item in itemsList) {
                recordAmount += (item['totalPrice'] as num).toDouble();
             }
             recordAmount -= (data['discount'] as num? ?? 0.0).toDouble();
           }
        } else {
          // Filter by BusinessType: Sum only matching items
          for (var item in itemsList) {
             final itemTypeStr = item['businessType'] as String?;
             if (itemTypeStr == type.name) {
               final itemPrice = (item['totalPrice'] as num).toDouble();
               // Distribute discount proportionally? Or ignore discount for item-level stats?
               // For simplicity, ignores discount distribution on filtered view or applies it linearly.
               // Let's just take item price.
               recordAmount += itemPrice;
             }
          }
        }
        
        if (salesData.containsKey(dayDate)) {
          salesData[dayDate] = salesData[dayDate]! + recordAmount;
        } else {
          // Should be covered by initialization, but safety check
          salesData[dayDate] = recordAmount;
        }
      }
      
      if (querySnapshot.docs.isEmpty) {
        throw Exception("No data, use mock"); // Fallback to mock if empty
      }
      
      return salesData;

    } catch (e) {
      if (e.toString().contains("No data")) {
         // Silently fall back
      } else {
         print("Error fetching sales trend: $e");
      }
      return {};
    }
  }

  Future<void> addSalesRecord(TransactionRecord record) async {
    try {
      // Validate stock availability for Sales before processing
      if (record.type == TransactionType.Sale) {
        for (var item in record.items) {
          final currentStock = await _stockService.fetchCurrentStock(item.productName);
          // Determine amount to deduct based on Stock Unit
          final deductionAmount = item.unit == StockUnit.kg ? (item.weight ?? 0.0) : item.quantity;
          
          if (!_stockService.canDeductStock(item.productName, deductionAmount)) {
            throw Exception(
              'Insufficient stock for ${item.productName}. '
              'Available: $currentStock ${item.unit.displayName}, Required: $deductionAmount ${item.unit.displayName}'
            );
          }
        }
      }

      final recordMap = {
        'id': record.id,
        'billNo': record.billNo,
        'type': record.type.name,
        'customerId': record.customerId, // Store customer ID for reference
        'partyName': record.partyName,
        'date': Timestamp.fromDate(record.date),
        'discount': record.discount,
        'soldBy': record.soldBy,
        'enteredBy': record.enteredBy,
        'entryTimestamp': Timestamp.fromDate(record.entryTimestamp),
        'paymentStatus': record.paymentStatus.name,
        'status': record.status.name, // Save Order Status
        'cancellationReason': record.cancellationReason,
        'totalPayable': record.totalPayable, // Store calculated value for easy querying
        'items': record.items.map((item) => {
          'productId': item.productId,
          'productName': item.productName,
          'businessType': item.businessType.name,
          'quantity': item.quantity,
          'weight': item.weight,
          'unit': item.unit.name,
          'priceUnit': item.priceUnit.name, // Save price unit
          'pricePerUnit': item.pricePerUnit,
          'totalPrice': item.totalPrice,
          'description': item.description,
        }).toList(),
        'payments': record.payments.map((p) => {
          'amount': p.amount,
          'date': Timestamp.fromDate(p.date),
          'note': p.note,
        }).toList(),
      };
      
      
      await _salesCollection.doc(record.id).set(recordMap);

      // Auto-update stock for Sales only (Initial deduction)
      if (record.type == TransactionType.Sale) {
        for (var item in record.items) {
          // Deduct from stock (Use weight if unit is Kg, else Quantity)
          final deductionAmount = item.unit == StockUnit.kg ? (item.weight ?? 0.0) : item.quantity;
          
          await _stockService.updateStock(
            item.productName, 
            -deductionAmount, 
            unit: item.unit.name,
            updatedBy: "Sale: ${record.id}"
          ); 
        }
      }
      
      // Update Customer/Vendor Total Balance
      // This runs in background, we don't await it to keep UI responsive? 
      // Actually better to await to ensure consistency if user navigates back immediately.
      await _updateCustomerBalance(record.partyName);

      // Trigger Notification
      final verb = record.type == TransactionType.Sale ? 'Sales' : 'Purchase';
      final currentUser = _authService.currentUser?.name ?? "Unknown User";

      await _notificationService.createNotification(
        title: 'New $verb Record',
        body: '$verb of Rs ${record.totalPayable} added for ${record.partyName} by $currentUser.',
        type: NotificationType.success,
        relatedEntityId: record.id,
        route: '/sales', // Route to sales screen
      );

    } catch (e) {
      print("Error adding sales record: $e");
      rethrow; 
    }
  }

  // Handle full updates where items might have changed
  Future<void> updateSalesRecord(TransactionRecord newRecord, TransactionRecord oldRecord) async {
    try {
      // 1. Revert stock for old items
      if (oldRecord.type == TransactionType.Sale) {
        for (var item in oldRecord.items) {
            // Revert stock (Add back)
            final addBackAmount = item.unit == StockUnit.kg ? (item.weight ?? 0.0) : item.quantity;

            await _stockService.updateStock(
            item.productName, 
            addBackAmount, 
            unit: item.unit.name,
            updatedBy: "Revert: ${oldRecord.id}"
          );
        }
      }

      // 2. Add New Record (this will validate and deduct new stock)
      await addSalesRecord(newRecord);

    } catch (e) {
      print("Error updating sales record: $e");
      rethrow;
    }
  }

  // Update Order Status (Admin/Manager)
  Future<void> updateOrderStatus(String id, OrderStatus newStatus, {String? reason, String? updatedBy}) async {
    try {
      final docFn = await _salesCollection.doc(id).get();
      if (!docFn.exists) throw Exception("Transaction not found");
      
      final data = docFn.data() as Map<String, dynamic>;
      
      // Parse current record to check previous status
      final currentType = data['type'] as String;
      final currentStatusStr = data['status'] as String?;
      final currentStatus = currentStatusStr != null 
          ? OrderStatus.values.firstWhere((e) => e.name == currentStatusStr)
          : OrderStatus.delivered; // Default for old records
          
      if (currentType != 'Sale') return; // Only for sales
      if (currentStatus == newStatus && newStatus != OrderStatus.cancelled) return; // No change (unless strictly cancelled to update reason?)

      // Logic:
      // 1. If moving TO Cancelled -> Restore Stock
      // 2. If moving FROM Cancelled TO Open/Delivered -> Deduct Stock again
      // 3. Open <-> Delivered logic: No stock change (already deducted on creation)
      
      final itemsList = (data['items'] as List<dynamic>?) ?? [];
      
      // RESTORE STOCK (Cancel)
      if (newStatus == OrderStatus.cancelled) {
         if (reason == null || reason.trim().isEmpty) {
           throw ArgumentError("Cancellation reason is mandatory");
         }

         for (var item in itemsList) {
             final name = item['productName'] as String;
             final unit = item['unit'] as String;
             final quantity = (item['quantity'] as num).toDouble();
             final weight = (item['weight'] as num?)?.toDouble();
             
             final amount = unit == 'kg' ? (weight ?? 0.0) : quantity;
             
             await _stockService.updateStock(
               name, 
               amount, // Positive adds back
               unit: unit,
               updatedBy: "Order Cancelled: $id"
             );
         }
      } 
      
      // RE-DEDUCT STOCK (Un-cancel)
      else if (currentStatus == OrderStatus.cancelled && (newStatus == OrderStatus.open || newStatus == OrderStatus.accepted || newStatus == OrderStatus.delivered)) {
         for (var item in itemsList) {
             final name = item['productName'] as String;
             final unit = item['unit'] as String;
             final quantity = (item['quantity'] as num).toDouble();
             final weight = (item['weight'] as num?)?.toDouble();
             
             final amount = unit == 'kg' ? (weight ?? 0.0) : quantity;
             
             // Check stock first?
             if (!_stockService.canDeductStock(name, amount)) {
               throw Exception("Insufficient stock to re-open order for $name");
             }

             await _stockService.updateStock(
               name, 
               -amount, // Negative deducts
               unit: unit,
               updatedBy: "Order Re-opened: $id"
             );
         }
      }

      // Update Status in Firestore
      await _salesCollection.doc(id).update({
        'status': newStatus.name,
        'cancellationReason': newStatus == OrderStatus.cancelled ? reason : FieldValue.delete(), // Save or clear reason
        'enteredBy': updatedBy != null ? "$updatedBy (Updated)" : FieldValue.delete(), // Optional audit
      });
      
      // Notification
      await _notificationService.createNotification(
        title: 'Order Updated',
        body: 'Order #$id status changed to ${newStatus.displayName}. ${reason != null ? "Reason: $reason" : ""}',
        type: newStatus == OrderStatus.cancelled ? NotificationType.warning : NotificationType.success,
        relatedEntityId: id,
        route: '/sales',
      );

    } catch (e) {
      print("Error updating order status: $e");
      rethrow;
    }
  }
  
  Future<void> deleteSalesRecord(String id) async {
    try {
      // Fetch record first to get partyName
      final doc = await _salesCollection.doc(id).get();
      if (!doc.exists) return;
      
      final data = doc.data() as Map<String, dynamic>;
      final partyName = data['partyName'] as String;
      final type = data['type'] as String;  // Get type to mention in notification
      
      // Update total balance
      await _updateCustomerBalance(partyName);

      final currentUser = _authService.currentUser?.name ?? "Unknown User";

      await _notificationService.createNotification(
        title: 'Transaction Deleted',
        body: '$type Transaction for $partyName has been deleted by $currentUser.',
        type: NotificationType.warning,
        relatedEntityId: id,
      );
      
      await _salesCollection.doc(id).delete();
      
    } catch (e) {
      print("Error deleting sales record: $e");
      rethrow;
    }
  }

  // Update only payment information (status, history) without affecting stock
  Future<void> updatePaymentInfo(TransactionRecord record) async {
    try {
      await _salesCollection.doc(record.id).update({
        'paymentStatus': record.paymentStatus.name,
        'payments': record.payments.map((p) => {
          'amount': p.amount,
          'date': Timestamp.fromDate(p.date),
          'note': p.note,
        }).toList(),
      });
      
      // Also update customer balance? No, balance is based on 'totalPayable', which doesn't change with payment.
      // Wait, is 'balance' the total sales volume or the outstanding debt?
      // _updateCustomerBalance calculates totalPayable sum. So payment doesn't affect it.
      // If we tracked "Due", then it would. But currently we track Sales Volume.
      
    } catch (e) {
      print("Error updating payment info: $e");
      rethrow;
    }
  }
  
  // Helper: Recalculate total transaction amount for a customer/vendor
  Future<void> _updateCustomerBalance(String partyName) async {
    try {
      final querySnapshot = await _salesCollection
          .where('partyName', isEqualTo: partyName)
          .get();
          
      double total = 0.0;
      for (var doc in querySnapshot.docs) {
        final data = doc.data() as Map<String, dynamic>;
        // Use totalPayable for volume calculation
        final amount = (data['totalPayable'] as num?)?.toDouble() ?? 0.0;
        total += amount;
      }
      
      await _customerService.updateCustomerTotal(partyName, total);
    } catch (e) {
      print("Error updating customer balance: $e");
    }
  }

  // Get Real-time stream of transactions
  Stream<List<TransactionRecord>> getTransactionsStream() {
    return _salesCollection
        .orderBy('date', descending: true)
        .limit(50) // Optimization: Limit to last 50 transactions
        .snapshots()
        .map((snapshot) {
      return snapshot.docs.map((doc) {
        final data = doc.data() as Map<String, dynamic>;
        
        // Convert timestamp back to DateTime
        final dateTs = data['date'] as Timestamp;
        final entryTs = data['entryTimestamp'] as Timestamp;
        
        // Parse items
        final itemsList = (data['items'] as List<dynamic>?) ?? [];
        final items = itemsList.map((i) {
           final stockUnit = StockUnit.values.firstWhere((e) => e.name == i['unit']);
           // Fallback for priceUnit is stockUnit (for old records)
           final priceUnitStr = i['priceUnit'] as String?;
           final priceUnit = priceUnitStr != null 
               ? StockUnit.values.firstWhere((e) => e.name == priceUnitStr, orElse: () => stockUnit)
               : stockUnit;

           return SalesItem(
            productId: i['productId'],
            productName: i['productName'],
            businessType: BusinessType.values.firstWhere((e) => e.name == i['businessType']),
            quantity: (i['quantity'] as num).toDouble(),
            weight: (i['weight'] as num?)?.toDouble(),
            unit: stockUnit,
            priceUnit: priceUnit,
            pricePerUnit: (i['pricePerUnit'] as num).toDouble(),
            description: i['description'],
          );
        }).toList();

        // Parse payments
        final paymentsList = (data['payments'] as List<dynamic>?) ?? [];
        final payments = paymentsList.map((p) => PaymentRecord(
           amount: (p['amount'] as num).toDouble(),
           date: (p['date'] as Timestamp).toDate(),
           note: p['note'] as String?,
        )).toList();

        return TransactionRecord(
          id: data['id'],
          billNo: data['billNo'] as String?, // Nullable for backward compatibility
          type: TransactionType.values.firstWhere((e) => e.name == data['type']),
          items: items,
          customerId: data['customerId'] as String?, // Nullable for backward compatibility
          partyName: data['partyName'],
          date: dateTs.toDate(),
          discount: (data['discount'] as num).toDouble(),
          soldBy: data['soldBy'],
          enteredBy: data['enteredBy'],
          entryTimestamp: entryTs.toDate(),
          paymentStatus: PaymentStatus.values.firstWhere(
              (e) => e.name == (data['paymentStatus'] ?? 'Pending'), 
              orElse: () => PaymentStatus.PaidCash), // Default for backward compatibility
          status: data['status'] != null 
              ? OrderStatus.values.firstWhere((e) => e.name == data['status'])
              : OrderStatus.delivered, // Default to delivered for old records
          cancellationReason: data['cancellationReason'] as String?,
          paidAmount: (data['paidAmount'] as num?)?.toDouble() ?? 0.0, // Legacy support, will be overridden by payments getter
          payments: payments,
        );
      }).toList();
    });
  }
  // Get transactions for a specific partner with client-side filtering and sorting
  Future<List<TransactionRecord>> getTransactionsByPartner({
    String? customerId,
    required String partyName,
    required TransactionType type,
    int limit = 10,
  }) async {
    try {
      // Query primarily by customerId if available, fall back to partyName
      Query query = _salesCollection;
      
      if (customerId != null && customerId.isNotEmpty) {
        query = query.where('customerId', isEqualTo: customerId);
      } else {
        query = query.where('partyName', isEqualTo: partyName);
      }
      
      // Get extra to account for client-side filtering by type
      final querySnapshot = await query.limit(limit * 3).get();

      // Parse, filter, and sort transactions client-side
      final transactions = querySnapshot.docs.map((doc) {
        final data = doc.data() as Map<String, dynamic>;
        
        // Convert timestamp back to DateTime
        final dateTs = data['date'] as Timestamp;
        final entryTs = data['entryTimestamp'] as Timestamp;
        
        // Parse items
        final itemsList = (data['items'] as List<dynamic>?) ?? [];
        final items = itemsList.map((i) {
           final stockUnit = StockUnit.values.firstWhere((e) => e.name == i['unit']);
           final priceUnitStr = i['priceUnit'] as String?;
           final priceUnit = priceUnitStr != null 
               ? StockUnit.values.firstWhere((e) => e.name == priceUnitStr, orElse: () => stockUnit)
               : stockUnit;

           return SalesItem(
            productId: i['productId'],
            productName: i['productName'],
            businessType: BusinessType.values.firstWhere((e) => e.name == i['businessType']),
            quantity: (i['quantity'] as num).toDouble(),
            weight: (i['weight'] as num?)?.toDouble(),
            unit: stockUnit,
            priceUnit: priceUnit,
            pricePerUnit: (i['pricePerUnit'] as num).toDouble(),
            description: i['description'],
          );
        }).toList();

        // Parse payments
        final paymentsList = (data['payments'] as List<dynamic>?) ?? [];
        final payments = paymentsList.map((p) => PaymentRecord(
           amount: (p['amount'] as num).toDouble(),
           date: (p['date'] as Timestamp).toDate(),
           note: p['note'] as String?,
        )).toList();

        return TransactionRecord(
          id: data['id'],
          billNo: data['billNo'] as String?, // Nullable for backward compatibility
          type: TransactionType.values.firstWhere((e) => e.name == data['type']),
          items: items,
          customerId: data['customerId'] as String?, // Nullable for backward compatibility
          partyName: data['partyName'],
          date: dateTs.toDate(),
          discount: (data['discount'] as num).toDouble(),
          soldBy: data['soldBy'],
          enteredBy: data['enteredBy'],
          entryTimestamp: entryTs.toDate(),
          paymentStatus: PaymentStatus.values.firstWhere(
              (e) => e.name == (data['paymentStatus'] ?? 'Pending'), 
              orElse: () => PaymentStatus.PaidCash),
          status: data['status'] != null 
              ? OrderStatus.values.firstWhere((e) => e.name == data['status'])
              : OrderStatus.delivered,
          cancellationReason: data['cancellationReason'] as String?,
          paidAmount: (data['paidAmount'] as num?)?.toDouble() ?? 0.0, // Legacy support, will be overridden by payments getter
          payments: payments,
        );
      }).where((t) => t.type == type) // Client-side filter by type
        .toList();

      // Sort by date descending (client-side)
      transactions.sort((a, b) => b.date.compareTo(a.date));
      
      // Limit results
      return transactions.take(limit).toList();
    } catch (e) {
      print("Error fetching transactions for partner: $e");
      rethrow;
    }
  }


  // Admin/Maintenance: Recalculate totals for ALL customers/vendors (Migration)
  Future<void> recalculateAllCustomerTotals() async {
    try {
      final allSales = await _salesCollection.get();
      final Map<String, double> tempTotals = {};

      // Aggregate all totals
      for (var doc in allSales.docs) {
        final data = doc.data() as Map<String, dynamic>;
        final partyName = data['partyName'] as String;
        final amount = (data['totalPayable'] as num?)?.toDouble() ?? 0.0;
        
        tempTotals[partyName] = (tempTotals[partyName] ?? 0.0) + amount;
      }

      // Update all customers
      for (var entry in tempTotals.entries) {
        await _customerService.updateCustomerTotal(entry.key, entry.value);
      }
      
      print("Successfully recalculated totals for ${tempTotals.length} partners.");
    } catch (e) {
      print("Error recalculating all totals: $e");
      rethrow;
    }
  }

  // Admin/Maintenance: Remove redundant paidAmount field from all records (Migration)
  Future<void> migratePaidAmountField() async {
    try {
      final allSales = await _salesCollection.get();
      int count = 0;
      
      for (var doc in allSales.docs) {
        final data = doc.data() as Map<String, dynamic>;
        
        // Only update if paidAmount field exists
        if (data.containsKey('paidAmount')) {
          await _salesCollection.doc(doc.id).update({
            'paidAmount': FieldValue.delete(),
          });
          count++;
        }
      }
      
      print("Successfully removed paidAmount field from $count records.");
    } catch (e) {
      print("Error migrating paidAmount field: $e");
      rethrow;
    }
  }

  // Cascade update: Update customer name in all transaction records
  Future<void> updateCustomerNameInRecords(String customerId, String newName) async {
    try {
      // Query all records with this customerId
      final querySnapshot = await _salesCollection
          .where('customerId', isEqualTo: customerId)
          .get();
      
      int count = 0;
      final batch = _firestore.batch();
      
      for (var doc in querySnapshot.docs) {
        batch.update(doc.reference, {'partyName': newName});
        count++;
        
        // Firestore batch limit is 500, commit if we reach it
        if (count % 500 == 0) {
          await batch.commit();
        }
      }
      
      // Commit remaining updates
      if (count % 500 != 0) {
        await batch.commit();
      }
      
      print("Successfully updated customer name in $count transaction records.");
    } catch (e) {
      print("Error updating customer name in records: $e");
      rethrow;
    }
  }
}

