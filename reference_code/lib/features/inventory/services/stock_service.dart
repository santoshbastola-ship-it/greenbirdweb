import 'package:farm_management_app/features/inventory/models/stock_entry.dart';
import 'package:farm_management_app/features/inventory/services/product_service.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class StockService {
  static final StockService _instance = StockService._internal();
  factory StockService() => _instance;
  StockService._internal();
  
  FirebaseFirestore? _firestoreOverride;
  FirebaseFirestore get _firestore => _firestoreOverride ?? FirebaseFirestore.instance;

  CollectionReference? _collectionOverride;
  ProductService _productService = ProductService();

  CollectionReference get _stockCollection => 
      _collectionOverride ?? _firestore.collection('stock_entries');

  void setDependencies({FirebaseFirestore? firestore, ProductService? productService}) {
    if (firestore != null) {
      _firestoreOverride = firestore;
      _collectionOverride = _firestoreOverride!.collection('stock_entries');
    }
    if (productService != null) {
      _productService = productService;
    }
  }
  
  // Cache for synchronous access by helper methods
  List<StockEntry> _cachedEntries = [];

  // Stream of stock entries from Firestore
  Stream<List<StockEntry>> getStockEntriesStream() {
    try {
      return _stockCollection.snapshots().map((snapshot) {
        final entries = snapshot.docs.map((doc) {
          final data = doc.data() as Map<String, dynamic>;
          // Mapper needs to handle conversions, assuming StockEntry has a fromMap or we map manually
          // Since StockEntry model doesn't have fromMap visible in previous view, we map manually here
          // We need to parse Enums and Dates carefully
          return StockEntry(
            id: doc.id,
            productName: data['productName'] ?? '',
            count: (data['count'] as num).toDouble(),
            businessType: BusinessType.values.firstWhere(
                (e) => e.name == data['businessType'],
                orElse: () => BusinessType.livestocks),
            unit: StockUnit.values.firstWhere(
                (e) => e.name == data['unit'], 
                orElse: () => StockUnit.pcs),
            date: (data['date'] as Timestamp).toDate(),
            entryTimestamp: (data['entryTimestamp'] as Timestamp).toDate(),
            enteredBy: data['enteredBy'] ?? 'Admin',
          );
        }).toList();
        
        // Update cache
        _cachedEntries = entries;
        return entries;
      });
    } catch (e) {
      print("Error creating stock stream: $e");
      return Stream.value([]);
    }
  }

  // Get all stock entries (returns cache, might be empty initially)
  List<StockEntry> getAllStockEntries() => List.unmodifiable(_cachedEntries);

  Future<void> addStockEntry(StockEntry entry, {bool updateProduct = false}) async {
    try {
      await _stockCollection.add({
        'productName': entry.productName,
        'count': entry.count,
        'businessType': entry.businessType.name,
        'unit': entry.unit.name,
        'date': Timestamp.fromDate(entry.date),
        'entryTimestamp': Timestamp.fromDate(entry.entryTimestamp),
        'enteredBy': entry.enteredBy,
      });

      if (updateProduct) {
        final product = _productService.getProductByName(entry.productName);
        if (product != null) {
          final newStock = product.currentStock + entry.count;
          await _productService.updateProductStock(product.id, newStock);
        }
      }
    } catch (e) {
      print("Error adding to Firestore: $e");
      _cachedEntries.add(entry);
    }
  }
  
  // Mock data for pie chart
  Map<String, double> getLivestockDistribution() {
    final productService = ProductService();
    final livestockProducts = productService.getProductsByBusinessType(BusinessType.livestocks);
    
    final Map<String, double> distribution = {};
    
    for (var product in livestockProducts) {
      double stock = getCurrentStock(product.name);
      if (stock > 0) {
        distribution[product.name] = stock;
      }
    }
    
    return distribution;
  }







  void addMultipleStockEntries(List<StockEntry> entries) {
    _cachedEntries.addAll(entries);
  }

  void removeStockEntry(String id) {
    _cachedEntries.removeWhere((entry) => entry.id == id);
    // TODO: formatting delete from firestore
  }

  // Get current stock for a specific product (Optimized to use ProductService)
  double getCurrentStock(String productName) {
    // Try to get from ProductService first
    final product = _productService.getProductByName(productName);
    if (product != null) {
        return product.currentStock;
    }
    
    // Fallback: If product/stock not found in ProductService, return 0 or try deprecated calculation?
    // For now, return 0.0 as we expect ProductService to be source of truth.
    return 0.0;
  }

  // Get current stock (Async / Fresh)
  Future<double> fetchCurrentStock(String productName) async {
    // Try cache first? No, for validation we want fresh.
    final product = await _productService.fetchProductByName(productName);
    if (product != null) {
      return product.currentStock;
    }
    return 0.0;
  }

  // Get stock entries for a specific product
  List<StockEntry> getProductStockEntries(String productName) {
    return _cachedEntries.where((e) => e.productName == productName).toList();
  }

  // Check if sufficient stock is available
  bool hasSufficientStock(String productName, double requiredQuantity) {
    final currentStock = getCurrentStock(productName);
    return currentStock >= requiredQuantity;
  }

  // Check if stock can be deducted (for pre-validation)
  bool canDeductStock(String productName, double quantity) {
    return hasSufficientStock(productName, quantity);
  }

  // Update stock by adding a delta (positive or negative)
  Future<void> updateStock(String productName, double delta, {String? unit, String updatedBy = "System"}) async {
    // 1. Fetch product to validate and prepare update
    final product = _productService.getProductByName(productName);
    if (product == null) {
        print("WARNING: Updating stock for product '$productName' but product not found in ProductService.");
        return;
    }

    final currentTotal = product.currentStock;
    final newTotal = currentTotal + delta;
    
    // Validate: prevent negative stock
    // Validate: prevent negative stock only for deductions
    // If we are ADDING stock (delta > 0), we should always allow it, even if total remains negative (to fix negative stock).
    if (delta < 0 && newTotal < 0) {
      final errorMsg = 'Insufficient stock for $productName. Current: $currentTotal, Requested: ${delta.abs()}, Shortfall: ${newTotal.abs()}';
      print('ERROR: $errorMsg');
      throw Exception(errorMsg);
    }
    
    // 2. Create new stock entry (Audit log)
    final entry = StockEntry(
      productName: productName,
      count: delta, // Store the DELTA, not the new total
      businessType: product.businessType,
      unit: unit != null ? StockUnit.values.firstWhere((e) => e.name == unit, orElse: () => product.unit) : product.unit,
      date: DateTime.now(),
      entryTimestamp: DateTime.now(),
      enteredBy: updatedBy
    );
    
    // 3. Save entry and Update Product total
    await addStockEntry(entry, updateProduct: true);
  }

  // Clear all stock entries (for testing/reset)
  void clearAll() {
    _cachedEntries.clear();
  }

  // Sync stock counts from historical entries to Product model
  Future<void> syncStockCounts() async {
    try {
      print("Starting stock sync...");
      // 1. Fetch all stock entries
      final snapshot = await _stockCollection.get();
      
      // Calculate total stock by summing all DELTAS
      final Map<String, double> productStockMap = {};
      
      for (var doc in snapshot.docs) {
        final data = doc.data() as Map<String, dynamic>;
        final productName = data['productName'] ?? '';
        final count = (data['count'] as num).toDouble();
        
        final existing = productStockMap[productName] ?? 0.0;
        productStockMap[productName] = existing + count;
      }

      print("Calculated stock for ${productStockMap.length} products.");

      // 3. Update each product in Firestore
      for (var entry in productStockMap.entries) {
        final productName = entry.key;
        final totalStock = entry.value;

        // Find product by name
        final product = _productService.getProductByName(productName);
        if (product != null) {
          print("Syncing $productName: Setting total to $totalStock");
          await _productService.updateProductStock(product.id, totalStock);
        } else {
          print("Warning: Product '$productName' found in logs but not in Product catalog.");
        }
      }
      print("Stock sync complete.");
    } catch (e) {
      print("Error syncing stock: $e");
      rethrow;
    }
  }

  /// DESTRUCTIVE: Resets all stock to zero
  /// 1. Deletes all stock entries
  /// 2. Resets all product currentStock to 0.0
  Future<void> resetAllStock() async {
    try {
      print("CRITICAL: Starting full stock reset...");
      
      // 1. Delete all stock entries
      final stockSnapshot = await _stockCollection.get();
      final batch = _firestore.batch();
      for (var doc in stockSnapshot.docs) {
        batch.delete(doc.reference);
      }
      await batch.commit();
      print("Deleted ${stockSnapshot.docs.length} stock entries.");

      // 2. Reset all products stock to zero
      final products = _productService.getAllProducts();
      for (var product in products) {
        print("Resetting ${product.name} stock to 0.0");
        await _productService.updateProductStock(product.id, 0.0);
      }
      
      _cachedEntries.clear();
      print("Full stock reset complete.");
    } catch (e) {
      print("Error during stock reset: $e");
      rethrow;
    }
  }
}
