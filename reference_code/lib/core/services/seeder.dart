import 'dart:io';
import 'package:flutter/services.dart'; // for rootBundle
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:uuid/uuid.dart';

class SeederService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseStorage _storage = FirebaseStorage.instance;

  Future<void> seedProductImages() async {
    print("Seeder: Starting image seeding...");

    // Map of Name -> Asset Path
    // Also need details for creation: Name -> {Type, Unit, Price}
    final List<Map<String, dynamic>> productsToSeed = [
      {
        'name': 'Chicken Bhale',
        'asset': 'assets/seeding/product_rooster.png',
        'type': 'livestocks',
        'unit': 'pcs',
        'price': 1500.0,
      },
      {
        'name': 'Boka sana',
        'asset': 'assets/seeding/product_goat.png',
        'type': 'livestocks',
        'unit': 'pcs',
        'price': 12000.0,
      },
      {
        'name': 'Bakhara',
        'asset': 'assets/seeding/product_goat.png',
        'type': 'livestocks',
        'unit': 'pcs',
        'price': 18000.0,
      },
      {
        'name': 'Boka',
        'asset': 'assets/seeding/product_he_goat.png',
        'type': 'livestocks',
        'unit': 'pcs',
        'price': 25000.0,
      },
      {
        'name': 'Chicken Hen',
        'asset': 'assets/seeding/product_hen.png',
        'type': 'livestocks',
        'unit': 'pcs',
        'price': 1000.0,
      },
      {
        'name': 'Seasonal Veggie',
        'asset': 'assets/seeding/product_vegetables.png',
        'type': 'farm',
        'unit': 'kg',
        'price': 150.0,
      },
      {
        'name': 'momo',
        'asset': 'assets/seeding/product_momo.png',
        'type': 'restaurant',
        'unit': 'plate',
        'price': 200.0,
      },
      {
        'name': 'Eggs',
        'asset': 'assets/seeding/product_eggs.png',
        'type': 'farm',
        'unit': 'pcs', // Using pcs for individual eggs or crates? usually crate. Let's say pcs for now.
        'price': 20.0,
      },
    ];

    int successCount = 0;

    for (var item in productsToSeed) {
      final productName = item['name'] as String;
      final assetPath = item['asset'] as String;

      try {
        // 1. Find Product by Name
        final querySnapshot = await _firestore
            .collection('products')
            .where('name', isEqualTo: productName)
            .limit(1)
            .get();

        DocumentReference docRef;

        if (querySnapshot.docs.isEmpty) {
          print("Seeder: Product '$productName' not found. Creating...");
          // Create new product
          // Need to map strings to enums manually or direct map
          // BusinessType: livestocks, restaurant, farm
          // StockUnit: pcs, kg, carat, plate
          
          String businessTypeStr = item['type'];
          String unitStr = item['unit'];
          
          docRef = await _firestore.collection('products').add({
            'id': const Uuid().v4(), // Placeholder, ID is doc ID usually but we store it too
            'name': productName,
            'businessType': businessTypeStr, // Storing as string matches enum serialization usually? 
                             // Wait, enum serialization often index or string.
                             // Product.toMap() uses `.name` (variable name) or index? 
                             // Let's assume string matching 'livestocks', 'farm', 'restaurant'.
            'unit': unitStr, 
            'priceUnit': unitStr, 
            'currentPrice': item['price'],
            'currentStock': 10.0, // Default stock
            'isAvailableForSale': true, // Make available in shop
            'createdAt': DateTime.now().toIso8601String(),
            'createdBy': 'Seeder',
            'images': [],
            'priceHistory': [],
          });
          // Update the 'id' field to match document ID if our model expects it
           await docRef.update({'id': docRef.id});
        } else {
           docRef = querySnapshot.docs.first.reference;
           // Ensure it is available for sale
           await docRef.update({'isAvailableForSale': true});
        }
        
        // 2. Read Asset Data
        final ByteData byteData = await rootBundle.load(assetPath);
        final Uint8List imageData = byteData.buffer.asUint8List();

        // 3. Upload to Storage
        final String uuid = const Uuid().v4();
        final String storagePath = 'product_images/$uuid.png';
        final Reference ref = _storage.ref().child(storagePath);
        
        final UploadTask task = ref.putData(imageData, SettableMetadata(contentType: 'image/png'));
        final TaskSnapshot snapshot = await task;
        final String downloadUrl = await snapshot.ref.getDownloadURL();

        // 4. Update Firestore Document
        await docRef.update({
          'images': [downloadUrl],
          'imageUrl': downloadUrl, 
        });

        print("Seeder: Successfully seeded '$productName'.");
        successCount++;

      } catch (e) {
        print("Seeder: Error processing '$productName': $e");
      }
    }
    
    print("Seeder: Finished. Updated $successCount products.");
  }
}
