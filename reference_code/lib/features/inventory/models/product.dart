import 'package:uuid/uuid.dart';
import 'package:farm_management_app/features/inventory/models/stock_entry.dart';

class PriceHistoryEntry {
  final double price;
  final DateTime effectiveDate;
  final String changedBy;

  PriceHistoryEntry({
    required this.price,
    required this.effectiveDate,
    required this.changedBy,
  });

  Map<String, dynamic> toMap() {
    return {
      'price': price,
      'effectiveDate': effectiveDate.millisecondsSinceEpoch,
      'changedBy': changedBy,
    };
  }

  factory PriceHistoryEntry.fromMap(Map<String, dynamic> map) {
    return PriceHistoryEntry(
      price: (map['price'] as num).toDouble(),
      effectiveDate: DateTime.fromMillisecondsSinceEpoch(map['effectiveDate']),
      changedBy: map['changedBy'] ?? '',
    );
  }
}

class Product {
  final String id;
  final String name;
  final BusinessType businessType;
  final StockUnit unit;
  final StockUnit priceUnit;
  final double currentPrice;
  final double currentStock;
  final List<PriceHistoryEntry> priceHistory;
  final DateTime createdAt;
  final String createdBy;
  final List<String> images;
  final String? description;
  final bool isAvailableForSale;

  String? get imageUrl => images.isNotEmpty ? images.first : null;


  Product({
    String? id,
    required this.name,
    required this.businessType,
    required this.unit,
    StockUnit? priceUnit,
    required this.currentPrice,
    this.currentStock = 0.0,
    List<PriceHistoryEntry>? priceHistory,
    DateTime? createdAt,
    required this.createdBy,
    List<String>? images,
    String? imageUrl, // Legacy support
    this.description,
    this.isAvailableForSale = false,
  }) : id = id ?? const Uuid().v4(),
       priceUnit = priceUnit ?? unit,
       priceHistory = priceHistory ?? [],
       createdAt = createdAt ?? DateTime.now(),
       images = images ?? (imageUrl != null && imageUrl.isNotEmpty ? [imageUrl] : []);

  // Create a copy with updated fields
  Product copyWith({
    String? name,
    BusinessType? businessType,
    StockUnit? unit,
    StockUnit? priceUnit,
    double? currentPrice,
    double? currentStock,

    List<PriceHistoryEntry>? priceHistory,
    List<String>? images,
    String? imageUrl, // Legacy support
    String? description,
    bool? isAvailableForSale,
  }) {
    List<String> newImages = images ?? this.images;
    if (imageUrl != null && imageUrl.isNotEmpty && (images == null)) {
       newImages = [imageUrl];
    }
    
    return Product(
      id: id,
      name: name ?? this.name,
      businessType: businessType ?? this.businessType,
      unit: unit ?? this.unit,
      priceUnit: priceUnit ?? this.priceUnit,
      currentPrice: currentPrice ?? this.currentPrice,
      currentStock: currentStock ?? this.currentStock,
      priceHistory: priceHistory ?? this.priceHistory,
      createdAt: createdAt,
      createdBy: createdBy,
      images: newImages,
      description: description ?? this.description,
      isAvailableForSale: isAvailableForSale ?? this.isAvailableForSale,
    );
  }

  // Get price at a specific date (for historical transactions)
  double getPriceAt(DateTime date) {
    // Find the most recent price that was effective before or on the given date
    PriceHistoryEntry? applicablePrice;
    for (var entry in priceHistory) {
      if (entry.effectiveDate.isBefore(date) || entry.effectiveDate.isAtSameMomentAs(date)) {
        if (applicablePrice == null || entry.effectiveDate.isAfter(applicablePrice.effectiveDate)) {
          applicablePrice = entry;
        }
      }
    }
    return applicablePrice?.price ?? currentPrice;
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'businessType': businessType.name,
      'unit': unit.name,
      'priceUnit': priceUnit.name,
      'currentPrice': currentPrice,
      'currentStock': currentStock,
      'priceHistory': priceHistory.map((x) => x.toMap()).toList(),
      'createdAt': createdAt.millisecondsSinceEpoch,
      'createdBy': createdBy,
      'images': images,
      'imageUrl': imageUrl,
      'description': description,
      'isAvailableForSale': isAvailableForSale,
    };
  }

  factory Product.fromMap(Map<String, dynamic> map, {String? id}) {
    final stockUnit = StockUnit.values.firstWhere(
        (e) => e.name == map['unit'],
        orElse: () => StockUnit.pcs,
      );

    List<String> loadedImages = [];
    if (map['images'] != null) {
      loadedImages = List<String>.from(map['images']);
    } else if (map['imageUrl'] != null && map['imageUrl'] is String && (map['imageUrl'] as String).isNotEmpty) {
      loadedImages = [map['imageUrl']];
    }

    return Product(
      id: id ?? map['id'],
      name: map['name'] ?? '',
      businessType: BusinessType.values.firstWhere(
        (e) => e.name == map['businessType'],
        orElse: () => BusinessType.livestocks,
      ),
      unit: stockUnit,
      priceUnit: map['priceUnit'] != null 
          ? StockUnit.values.firstWhere(
              (e) => e.name == map['priceUnit'],
              orElse: () => stockUnit,
            )
          : stockUnit,
      currentPrice: (map['currentPrice'] as num).toDouble(),
      currentStock: (map['currentStock'] as num?)?.toDouble() ?? 0.0,
      priceHistory: map['priceHistory'] != null
          ? List<PriceHistoryEntry>.from(
              (map['priceHistory'] as List).map<PriceHistoryEntry?>((x) => PriceHistoryEntry.fromMap(x as Map<String, dynamic>)),
            )
          : [],
      createdAt: map['createdAt'] != null ? DateTime.fromMillisecondsSinceEpoch(map['createdAt']) : null,
      createdBy: map['createdBy'] ?? '',
      images: loadedImages,
      // imageUrl: map['imageUrl'], // Handled above
      description: map['description'],
      isAvailableForSale: map['isAvailableForSale'] ?? false,
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
  
    return other is Product &&
      other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}
