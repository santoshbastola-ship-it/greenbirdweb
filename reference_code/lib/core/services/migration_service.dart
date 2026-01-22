import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:farm_management_app/core/services/customer_migration_service.dart';

class MigrationService {
  static const String _stockMigrationKey = 'migration_stock_v1_completed';
  static const String _customerMigrationKey = 'migration_customer_id_v1_completed';

  Future<void> runStockMigration() async {
    if (FirebaseAuth.instance.currentUser == null) {
      // print("Migration: Skipped (Not logged in)");
      return;
    }

    try {
      final prefs = await SharedPreferences.getInstance();
      if (prefs.getBool(_stockMigrationKey) == true) {
        // print("Migration: Stock migration already completed.");
        return;
      }

      print("Migration: Starting stock migration...");
      final firestore = FirebaseFirestore.instance;
      
      // 1. Get all products
      final productsSnapshot = await firestore.collection('products').get();
      
      if (productsSnapshot.docs.isEmpty) {
        print("Migration: No products found.");
        return;
      }

      final batch = firestore.batch();
      int updateCount = 0;

      // 2. For each product, find the LATEST stock entry
      for (var doc in productsSnapshot.docs) {
        final productData = doc.data();
        final productName = productData['name'] as String;
        final productId = doc.id;
        
        // Find latest stock entry for this product
        final stockSnapshot = await firestore
            .collection('stock_entries')
            .where('productName', isEqualTo: productName)
            .orderBy('date', descending: true)
            .limit(1)
            .get();

        if (stockSnapshot.docs.isNotEmpty) {
          final stockData = stockSnapshot.docs.first.data();
          final count = (stockData['count'] as num).toDouble();
          
          print("Migration: Queueing update for $productName to stock $count");
          
          batch.update(firestore.collection('products').doc(productId), {
            'currentStock': count,
          });
          updateCount++;
        } else {
             print("Migration: No stock entries found for $productName.");
        }
      }

      if (updateCount > 0) {
        await batch.commit();
        print("Migration: Committed $updateCount updates.");
      } else {
        print("Migration: No updates needed.");
      }

      await prefs.setBool(_stockMigrationKey, true);
      print("Migration: Stock migration completed successfully.");

    } catch (e) {
      if (e.toString().contains('permission-denied')) {
        print("Migration: Stock migration skipped (Permission Denied).");
      } else {
        print("Migration: Error during stock migration: $e");
      }
    }
  }

  Future<void> correctEggsStock() async {
    if (FirebaseAuth.instance.currentUser == null) {
      // print("Migration: Skipped correctEggsStock (Not logged in)");
      return;
    }

    try {
      final prefs = await SharedPreferences.getInstance();
      const migrationKey = 'migration_eggs_stock_fix_v2'; 
      if (prefs.getBool(migrationKey) == true) {
        print("Migration: Eggs stock correction already completed.");
        return;
      }

      print("Migration: Correcting Eggs stock...");
      final firestore = FirebaseFirestore.instance;
      
      // Find product "Eggs" (case insensitive search via iterating is safest for small set)
      final productsSnapshot = await firestore.collection('products').get();
      QueryDocumentSnapshot? eggProduct;
      
      for (var doc in productsSnapshot.docs) {
        final name = (doc.data()['name'] as String).toLowerCase();
        if (name.contains('egg')) {
          eggProduct = doc;
          break;
        }
      }

      if (eggProduct != null) {
        final productId = eggProduct.id;
        final productName = eggProduct.get('name') as String;
        final productData = eggProduct.data() as Map<String, dynamic>;
        
        print("Migration: Found product '$productName' (ID: $productId). Updating stock to 60.");

        final batch = firestore.batch();

        // 1. Update Product
        batch.update(eggProduct.reference, {
          'currentStock': 60.0,
        });

        // 2. Add StockEntry
        final newEntryRef = firestore.collection('stock_entries').doc();
        batch.set(newEntryRef, {
          'id': newEntryRef.id,
          'businessType': productData['businessType'] ?? 0, // Fallback safely
          'productName': productName,
          'count': 60.0,
          'unit': productData['unit'] ?? 0,
          'date': Timestamp.now(),
          'entryTimestamp': Timestamp.now(),
          'enteredBy': 'System Correction',
        });

        await batch.commit();
        await prefs.setBool(migrationKey, true);
        print("Migration: Eggs stock corrected successfully.");
      } else {
        print("Migration: Product 'Eggs' not found.");
      }

    } catch (e) {
       if (e.toString().contains('permission-denied')) {
        print("Migration: Eggs correction skipped (Permission Denied).");
      } else {
        print("Migration: Error correcting eggs stock: $e");
      }
    }
  }

  Future<void> runCustomerMigration() async {
    if (FirebaseAuth.instance.currentUser == null) {
      // print("Migration: Skipped runCustomerMigration (Not logged in)");
      return;
    }

    try {
      final prefs = await SharedPreferences.getInstance();
      if (prefs.getBool(_customerMigrationKey) == true) {
        print("Migration: Customer ID migration already completed.");
        return;
      }

      print("Migration: Starting customer ID migration...");
      
      final migrationService = CustomerMigrationService();
      final result = await migrationService.migrateTransactionRecords();
      
      print(result.summary);

      if (result.failed == 0) {
        await prefs.setBool(_customerMigrationKey, true);
        print("Migration: Customer ID migration completed successfully.");
      } else {
        print("Migration: Customer ID migration partially completed (${result.updated}/${result.total}). Will retry later.");
      }

    } catch (e) {
       if (e.toString().contains('permission-denied')) {
        print("Migration: Customer migration skipped (Permission Denied).");
      } else {
        print("Migration: Error during customer ID migration: $e");
      }
    }
  }
}
