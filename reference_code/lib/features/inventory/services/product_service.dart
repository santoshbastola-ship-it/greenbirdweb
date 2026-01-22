import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:farm_management_app/features/inventory/models/product.dart';
import 'package:farm_management_app/features/inventory/models/stock_entry.dart';

class ProductService {
  // Singleton pattern
  static final ProductService _instance = ProductService._internal();
  factory ProductService() => _instance;
  ProductService._internal();
  
  FirebaseFirestore? _firestoreOverride;
  FirebaseFirestore get _firestore => _firestoreOverride ?? FirebaseFirestore.instance;
  
  CollectionReference? _collectionOverride;

  CollectionReference get _productsCollection => 
      _collectionOverride ?? _firestore.collection('products');

  void setDependencies({FirebaseFirestore? firestore}) {
    if (firestore != null) {
      _firestoreOverride = firestore;
      _collectionOverride = _firestoreOverride!.collection('products');
    }
  }
  
  // Local cache to support synchronous access where needed temporarily
  List<Product> _cachedProducts = [];
  
  void clearCache() {
    _cachedProducts.clear();
  }

  // Hardcoded initial data for seeding
  final List<Product> _initialProducts = [
    Product(
      name: "Chicken - Hen",
      businessType: BusinessType.livestocks,
      unit: StockUnit.pcs,
      priceUnit: StockUnit.kg, // Separate price unit
      currentPrice: 900.0,
      createdBy: "System",
    ),
  ];

  // Seed initial data if collection is empty
  Future<void> seedInitialProducts() async {
    try {
      final snapshot = await _productsCollection.limit(1).get();
      if (snapshot.docs.isEmpty) {
        print("Seeding initial products...");
        final batch = FirebaseFirestore.instance.batch();
        for (var product in _initialProducts) {
          final docRef = _productsCollection.doc(product.id);
          batch.set(docRef, product.toMap());
        }
        await batch.commit();
        print("Seeding complete.");
      }
    } catch (e) {
      print("Error seeding products: $e");
    }
  }

  // Get products stream
  Stream<List<Product>> getProductsStream() {
    return _productsCollection.snapshots().map((snapshot) {
      final products = snapshot.docs.map((doc) {
        return Product.fromMap(doc.data() as Map<String, dynamic>, id: doc.id);
      }).toList();
      _cachedProducts = products; // Update cache
      return products;
    });
  }

  // Get products stream for Shop (Available for Sale only)
  Stream<List<Product>> getShopProductsStream() {
    return _productsCollection
        .where('isAvailableForSale', isEqualTo: true)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs.map((doc) {
        return Product.fromMap(doc.data() as Map<String, dynamic>, id: doc.id);
      }).toList();
    });
  }

  // Get all products (Returns cache - call getProductsStream first to ensure data)
  List<Product> getAllProducts() => List.unmodifiable(_cachedProducts);

  // Get products by business type (from cache)
  List<Product> getProductsByBusinessType(BusinessType businessType) {
    return _cachedProducts.where((p) => p.businessType == businessType).toList();
  }

  // Get product by ID (from cache)
  Product? getProductById(String id) {
    try {
      return _cachedProducts.firstWhere((p) => p.id == id);
    } catch (e) {
      return null;
    }
  }

  // Get product by name (from cache)
  Product? getProductByName(String name) {
    try {
      return _cachedProducts.firstWhere((p) => p.name == name);
    } catch (e) {
      return null;
    }
  }

  // Get product by name (Fresh from Firestore)
  Future<Product?> fetchProductByName(String name) async {
    try {
      final snapshot = await _productsCollection
          .where('name', isEqualTo: name)
          .limit(1)
          .get();
      
      if (snapshot.docs.isNotEmpty) {
        final doc = snapshot.docs.first;
        final product = Product.fromMap(doc.data() as Map<String, dynamic>, id: doc.id);
        
        // Update cache while we're at it
        final index = _cachedProducts.indexWhere((p) => p.id == product.id);
        if (index != -1) {
          _cachedProducts[index] = product;
        } else {
          _cachedProducts.add(product);
        }
        
        return product;
      }
      return null;
    } catch (e) {
      print("Error fetching product by name: $e");
      return null;
    }
  }

  // Add product to Firestore
  Future<void> addProduct(Product product) async {
    await _productsCollection.doc(product.id).set(product.toMap());
  }

  // Update product in Firestore
  Future<void> updateProduct(String id, Product updatedProduct) async {
    await _productsCollection.doc(id).update(updatedProduct.toMap());
  }

  // Delete product from Firestore
  Future<void> deleteProduct(String id) async {
    await _productsCollection.doc(id).delete();
  }

  // Update product price
  Future<void> updateProductPrice(String id, double newPrice, DateTime effectiveDate, String changedBy) async {
    final product = getProductById(id);
    if (product != null) {
      final updatedHistory = List<PriceHistoryEntry>.from(product.priceHistory);
      updatedHistory.add(PriceHistoryEntry(
        price: newPrice,
        effectiveDate: effectiveDate,
        changedBy: changedBy,
      ));
      
      final updatedProduct = product.copyWith(
        currentPrice: newPrice,
        priceHistory: updatedHistory,
      );

      await updateProduct(id, updatedProduct);
    }
  }

  // Update product stock directly
  Future<void> updateProductStock(String id, double newStock) async {
    await _productsCollection.doc(id).update({
      'currentStock': newStock,
    });
    
    // Update local cache if exists
    final index = _cachedProducts.indexWhere((p) => p.id == id);
    if (index != -1) {
      _cachedProducts[index] = _cachedProducts[index].copyWith(currentStock: newStock);
    }
  }
}
