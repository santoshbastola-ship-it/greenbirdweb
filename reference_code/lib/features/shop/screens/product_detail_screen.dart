import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:farm_management_app/features/inventory/models/product.dart';
import 'package:farm_management_app/features/shop/services/cart_service.dart';
import 'package:farm_management_app/features/shop/widgets/cart_icon.dart'; 

class ProductDetailScreen extends StatefulWidget {
  final Product product;

  const ProductDetailScreen({super.key, required this.product});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  int _quantity = 1;
  int _currentImageIndex = 0;

  void _addToCart() {
    final cartService = Provider.of<CartService>(context, listen: false);
    cartService.addToCart(widget.product, _quantity.toDouble());
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Added $_quantity ${widget.product.name} to cart')),
    );
     // Optional: Go back to shop or stay here?
     // Navigator.pop(context); // Let's stay on page so they can read more
  }

  @override
  Widget build(BuildContext context) {
    // Price formatting: "Rs 8000 / pcs"
    final formattedPrice = "Rs ${widget.product.currentPrice.toStringAsFixed(0)} / ${widget.product.priceUnit.name}";

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.product.name),
        actions: [
          const Padding(
            padding: EdgeInsets.only(right: 16.0),
            child: CartIcon(),
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Product Image (Placeholder or Actual)
            // Product Images Carousel
            Container(
              height: 300,
              width: double.infinity,
              color: Colors.grey.shade200,
              child: widget.product.images.isNotEmpty
                ? Stack(
                    alignment: Alignment.bottomCenter,
                    children: [
                      PageView.builder(
                        itemCount: widget.product.images.length,
                        onPageChanged: (index) => setState(() => _currentImageIndex = index),
                        itemBuilder: (context, index) {
                          return Image.network(
                            widget.product.images[index],
                            fit: BoxFit.cover,
                            loadingBuilder: (context, child, loadingProgress) {
                              if (loadingProgress == null) return child;
                              return const Center(child: CircularProgressIndicator());
                            },
                            errorBuilder: (ctx, err, stack) {
                              print("Detail Screen Image Error: $err");
                              return const Icon(Icons.broken_image, size: 100, color: Colors.grey);
                            },
                          );
                        },
                      ),
                      if (widget.product.images.length > 1)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 16.0),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: widget.product.images.asMap().entries.map((entry) {
                              return Container(
                                width: 8.0,
                                height: 8.0,
                                margin: const EdgeInsets.symmetric(horizontal: 4.0),
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: _currentImageIndex == entry.key
                                      ? Theme.of(context).primaryColor
                                      : Colors.grey.withOpacity(0.5),
                                ),
                              );
                            }).toList(),
                          ),
                        ),
                    ],
                  )
                : const Icon(Icons.inventory_2, size: 100, color: Colors.grey),
            ),
            
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title and Price
                  Text(
                    widget.product.name,
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    formattedPrice,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: Theme.of(context).primaryColor,
                      fontWeight: FontWeight.w600,
                    ),
                  ),

                  const SizedBox(height: 24),
                  
                  // Description
                  Text(
                    "Description",
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    widget.product.description ?? "No description available.",
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(height: 1.5),
                  ),

                  const SizedBox(height: 32),

                  // Quantity Selector & Add to Cart
                  Row(
                    children: [
                      // Quantity Selector
                      Container(
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.grey.shade300),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            IconButton(
                              onPressed: () {
                                if (_quantity > 1) setState(() => _quantity--);
                              },
                              icon: const Icon(Icons.remove),
                            ),
                            Text(
                              '$_quantity',
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                            ),
                            IconButton(
                              onPressed: () {
                                setState(() => _quantity++);
                              },
                              icon: const Icon(Icons.add),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 16),
                      // Add to Cart Button
                      Expanded(
                        child: SizedBox(
                          height: 50,
                          child: ElevatedButton.icon(
                            onPressed: _addToCart,
                            icon: const Icon(Icons.shopping_cart),
                            label: const Text("Add to Cart"),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Theme.of(context).primaryColor,
                              foregroundColor: Colors.white,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
