import 'package:farm_management_app/features/inventory/models/stock_entry.dart';

class CartItem {
  final String productId;
  final String productName;
  final double price;
  final double quantity;
  final String unit;
  final String? imageUrl;
  final double availableStock;
  final BusinessType? businessType; 
  final StockUnit? priceUnit; 

  CartItem({
    required this.productId,
    required this.productName,
    required this.price,
    required this.quantity,
    this.unit = 'pcs',
    this.imageUrl,
    required this.availableStock,
    this.businessType,
    this.priceUnit,
  });

  double get total => price * quantity;

  CartItem copyWith({
    String? productId,
    String? productName,
    double? price,
    double? quantity,
    String? unit,
    String? imageUrl,
    double? availableStock,
    BusinessType? businessType,
    StockUnit? priceUnit,
  }) {
    return CartItem(
      productId: productId ?? this.productId,
      productName: productName ?? this.productName,
      price: price ?? this.price,
      quantity: quantity ?? this.quantity,
      unit: unit ?? this.unit,
      imageUrl: imageUrl ?? this.imageUrl,
      availableStock: availableStock ?? this.availableStock,
      businessType: businessType ?? this.businessType,
      priceUnit: priceUnit ?? this.priceUnit,
    );
  }
}
