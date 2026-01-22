import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:farm_management_app/features/inventory/services/product_service.dart';
import 'package:farm_management_app/features/inventory/services/stock_service.dart';

class AdminService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  Future<void> clearDatabase() async {
    try {
      // List of collections to clear
      final collections = [
        'products',
        'sales_records',
        'stock_entries',
        'energy_bills',
        'tasks',
        // 'energy_bills' (already listed)
      ];

      for (var collectionName in collections) {
        await _clearCollection(collectionName);
      }

      // Also clear local caches of services
      StockService().clearAll();
      ProductService().clearCache();
      
      print("Database cleared successfully.");
    } catch (e) {
      print("Error clearing database: $e");
      rethrow;
    }
  }

  Future<void> _clearCollection(String collectionPath) async {
    final collection = _firestore.collection(collectionPath);
    final snapshot = await collection.get();
    
    // Batch delete
    WriteBatch batch = _firestore.batch();
    int count = 0;
    
    for (var doc in snapshot.docs) {
      batch.delete(doc.reference);
      count++;
      
      // Firestore batch limit is 500
      if (count >= 400) {
        await batch.commit();
        batch = _firestore.batch();
        count = 0;
      }
    }
    
    if (count > 0) {
      await batch.commit();
    }
  }
}
