import 'package:flutter/foundation.dart';
import 'package:farm_management_app/features/shop/models/cart_item.dart';
import 'package:farm_management_app/features/inventory/models/product.dart';

class CartService extends ChangeNotifier {
  final List<CartItem> _items = [];

  List<CartItem> get items => List.unmodifiable(_items);

  int get itemCount => _items.length;

  double get totalAmount => _items.fold(0.0, (sum, item) => sum + item.total);

  void addToCart(Product product, double quantity) {
    if (quantity <= 0) return;

    // Check if item already exists
    final index = _items.indexWhere((item) => item.productId == product.id);
    double currentQtyInCart = 0;
    
    if (index != -1) {
      currentQtyInCart = _items[index].quantity;
    }

    if (currentQtyInCart + quantity > product.currentStock) {
      throw Exception("Stock Limit: ${product.currentStock} ${product.unit.name}. You have $currentQtyInCart in cart.");
    }

    if (index != -1) {
      final existing = _items[index];
      _items[index] = existing.copyWith(
        quantity: existing.quantity + quantity,
        availableStock: product.currentStock, // Update stock info on add
      );
    } else {
      // Add new
      _items.add(CartItem(
        productId: product.id,
        productName: product.name,
        // Use currentPrice. If nullable, default to 0.0
        price: product.currentPrice, 
        quantity: quantity,
        unit: product.unit.name, 
        imageUrl: product.imageUrl,
        availableStock: product.currentStock,
        businessType: product.businessType,
        priceUnit: product.priceUnit,
      ));
    }
    notifyListeners();
  }

  void removeFromCart(String productId) {
    _items.removeWhere((item) => item.productId == productId);
    notifyListeners();
  }

  void updateQuantity(String productId, double quantity) {
    final index = _items.indexWhere((item) => item.productId == productId);
    if (index != -1) {
      if (quantity <= 0) {
        removeFromCart(productId);
      } else {
        // Check stock limit for update
        if (quantity > _items[index].availableStock) {
           // We could throw here, but for UI binding it's better to clamp or simple ignore
           // However, throwing allows UI to catch and show message
           return; 
        }
        _items[index] = _items[index].copyWith(quantity: quantity);
        notifyListeners();
      }
    }
  }

  void clearCart() {
    _items.clear();
    notifyListeners();
  }
}
