import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:farm_management_app/features/sales/services/customer_service.dart';

/// Service to migrate existing transaction records to include customer IDs
class CustomerMigrationService {
  final FirebaseFirestore _firestore;
  final CustomerService _customerService;
  
  CustomerMigrationService({
    FirebaseFirestore? firestore,
    CustomerService? customerService,
  }) : _firestore = firestore ?? FirebaseFirestore.instance,
       _customerService = customerService ?? CustomerService();
  
  /// Migrate all transaction records to include customerId field
  /// Matches partyName to customer names and adds the customer ID
  Future<MigrationResult> migrateTransactionRecords({
    Function(int current, int total)? onProgress,
  }) async {
    try {
      final salesCollection = _firestore.collection('sales_records');
      final snapshot = await salesCollection.get();
      
      int total = snapshot.docs.length;
      int updated = 0;
      int skipped = 0;
      int failed = 0;
      List<String> unmatchedRecords = [];
      
      final batch = _firestore.batch();
      int batchCount = 0;
      
      for (int i = 0; i < snapshot.docs.length; i++) {
        final doc = snapshot.docs[i];
        final data = doc.data();
        
        // Skip if already has customerId
        if (data.containsKey('customerId') && data['customerId'] != null) {
          skipped++;
          onProgress?.call(i + 1, total);
          continue;
        }
        
        // Get partyName and try to match to a customer
        final partyName = data['partyName'] as String?;
        if (partyName == null || partyName.isEmpty) {
          failed++;
          unmatchedRecords.add('${doc.id}: No party name');
          onProgress?.call(i + 1, total);
          continue;
        }
        
        // Find customer by name
        final customer = _customerService.getCustomerByName(partyName);
        if (customer == null) {
          failed++;
          unmatchedRecords.add('${doc.id}: Customer "$partyName" not found');
          onProgress?.call(i + 1, total);
          continue;
        }
        
        // Add customerId to the record
        batch.update(doc.reference, {'customerId': customer.id});
        updated++;
        batchCount++;
        
        // Firestore batch limit is 500
        if (batchCount >= 500) {
          await batch.commit();
          batchCount = 0;
        }
        
        onProgress?.call(i + 1, total);
      }
      
      // Commit remaining updates
      if (batchCount > 0) {
        await batch.commit();
      }
      
      return MigrationResult(
        total: total,
        updated: updated,
        skipped: skipped,
        failed: failed,
        unmatchedRecords: unmatchedRecords,
      );
    } catch (e) {
      print('Error during migration: $e');
      rethrow;
    }
  }
  
  /// Verify migration status
  Future<VerificationResult> verifyMigration() async {
    try {
      final salesCollection = _firestore.collection('sales_records');
      final snapshot = await salesCollection.get();
      
      int total = snapshot.docs.length;
      int withCustomerId = 0;
      int withoutCustomerId = 0;
      List<String> recordsWithoutId = [];
      
      for (final doc in snapshot.docs) {
        final data = doc.data();
        
        if (data.containsKey('customerId') && data['customerId'] != null) {
          withCustomerId++;
        } else {
          withoutCustomerId++;
          final partyName = data['partyName'] as String? ?? 'Unknown';
          recordsWithoutId.add('${doc.id}: $partyName');
        }
      }
      
      return VerificationResult(
        total: total,
        withCustomerId: withCustomerId,
        withoutCustomerId: withoutCustomerId,
        recordsWithoutId: recordsWithoutId,
      );
    } catch (e) {
      print('Error during verification: $e');
      rethrow;
    }
  }
}

/// Result of migration operation
class MigrationResult {
  final int total;
  final int updated;
  final int skipped;
  final int failed;
  final List<String> unmatchedRecords;
  
  MigrationResult({
    required this.total,
    required this.updated,
    required this.skipped,
    required this.failed,
    required this.unmatchedRecords,
  });
  
  bool get isComplete => (updated + skipped) == total;
  
  String get summary => '''
Migration Complete:
- Total records: $total
- Updated: $updated
- Skipped (already migrated): $skipped
- Failed: $failed

${unmatchedRecords.isNotEmpty ? 'Unmatched records:\n${unmatchedRecords.join('\n')}' : 'All records matched successfully!'}
''';
}

/// Result of verification operation
class VerificationResult {
  final int total;
  final int withCustomerId;
  final int withoutCustomerId;
  final List<String> recordsWithoutId;
  
  VerificationResult({
    required this.total,
    required this.withCustomerId,
    required this.withoutCustomerId,
    required this.recordsWithoutId,
  });
  
  bool get isFullyMigrated => withoutCustomerId == 0;
  
  double get migrationPercentage => total > 0 ? (withCustomerId / total) * 100 : 0;
  
  String get summary => '''
Verification Results:
- Total records: $total
- With customer ID: $withCustomerId (${migrationPercentage.toStringAsFixed(1)}%)
- Without customer ID: $withoutCustomerId

${recordsWithoutId.isNotEmpty ? 'Records without ID:\n${recordsWithoutId.take(10).join('\n')}${recordsWithoutId.length > 10 ? '\n... and ${recordsWithoutId.length - 10} more' : ''}' : 'All records have customer IDs!'}
''';
}
