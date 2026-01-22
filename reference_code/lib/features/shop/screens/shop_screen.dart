import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:farm_management_app/features/inventory/services/product_service.dart';
import 'package:farm_management_app/features/inventory/models/product.dart';
import 'package:farm_management_app/features/inventory/models/stock_entry.dart';
import 'package:farm_management_app/features/shop/services/cart_service.dart';
import 'package:farm_management_app/features/shop/widgets/cart_icon.dart';
import 'package:flutter/foundation.dart'; // For kDebugMode
import 'package:farm_management_app/features/auth/services/auth_service.dart';
import 'package:farm_management_app/features/auth/models/user_model.dart';
import 'package:farm_management_app/features/shop/screens/product_detail_screen.dart';
import 'package:farm_management_app/features/shop/screens/my_orders_screen.dart';

class ShopScreen extends StatefulWidget {
  const ShopScreen({super.key});

  @override
  State<ShopScreen> createState() => _ShopScreenState();
}

class _ShopScreenState extends State<ShopScreen> {
  String _selectedFilter = 'All';

  final List<String> _filters = ['All', 'Livestock', 'Farm', 'Restaurant'];
  
  BusinessType? _getBusinessTypeFromFilter(String filter) {
    switch (filter) {
      case 'Livestock':
        return BusinessType.livestocks;
      case 'Farm':
        return BusinessType.farm;
      case 'Restaurant':
        return BusinessType.restaurant;
      default:
        return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final productService = Provider.of<ProductService>(context, listen: false);

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
             const Icon(Icons.storefront, color: Colors.green),
             const SizedBox(width: 8),
             Text("Greenbird Farm", style: TextStyle(color: Colors.green.shade800, fontWeight: FontWeight.bold)),
          ],
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        actions: [
          Consumer<AuthService>(
            builder: (context, authService, _) {
              final user = authService.currentUser;
              final isLoggedIn = user != null;
              final isCustomer = user?.role == UserRole.customer;

              return PopupMenuButton<String>(
                tooltip: 'Profile',
                icon: const Icon(Icons.account_circle, color: Colors.green, size: 28),
                offset: const Offset(0, 45),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                onSelected: (String value) {
                  switch (value) {
                    case 'login':
                      context.go('/login');
                      break;
                    case 'my_orders':
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => const MyOrdersScreen()),
                      );
                      break;
                    case 'logout':
                      authService.signOut();
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text("Logged out successfully")),
                      );
                      break;
                    case 'role_admin':
                      authService.debugSwitchRole(UserRole.admin);
                       context.go('/'); // Go to dashboard
                      break;
                    case 'role_manager':
                      authService.debugSwitchRole(UserRole.manager);
                       context.go('/'); // Go to dashboard
                      break;
                     case 'role_customer':
                      authService.debugSwitchRole(UserRole.customer);
                      break;
                  }
                },
                itemBuilder: (BuildContext context) {
                  return [
                    if (!isLoggedIn)
                      const PopupMenuItem(
                        value: 'login',
                        child: Row(
                          children: [
                            Icon(Icons.login, color: Colors.green, size: 20),
                            SizedBox(width: 12),
                            Text('Staff / Customer Login'),
                          ],
                        ),
                      ),
                    
                    if (isLoggedIn && isCustomer)
                      const PopupMenuItem(
                         value: 'my_orders',
                         child: Row(
                           children: [
                             Icon(Icons.shopping_bag, color: Colors.blue, size: 20),
                             SizedBox(width: 12),
                             Text('My Orders'),
                           ],
                         ),
                      ),

                    if (isLoggedIn)
                       const PopupMenuItem(
                        value: 'logout',
                        child: Row(
                          children: [
                            Icon(Icons.logout, color: Colors.red, size: 20),
                            SizedBox(width: 12),
                            Text('Logout'),
                          ],
                        ),
                      ),
                      
                    // Dev / Debug Options
                    if (kDebugMode || const bool.fromEnvironment('SHOW_ROLE_SWITCHER')) ...[
                      const PopupMenuDivider(),
                      const PopupMenuItem(
                        enabled: false,
                        height: 24,
                        child: Text("DEV: Switch Role", style: TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold)),
                      ),
                      const PopupMenuItem(
                        value: 'role_admin',
                        child: Text('Switch to Admin'),
                      ),
                      const PopupMenuItem(
                        value: 'role_manager',
                        child: Text('Switch to Manager'),
                      ),
                       const PopupMenuItem(
                        value: 'role_customer',
                        child: Text('Switch to Customer'),
                      ),
                    ]
                  ];
                },
              );
            },
          ),
          const SizedBox(width: 4),
          const CartIcon(),
          const SizedBox(width: 12),
        ],
      ),
      body: Column(
        children: [
          // Filter Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: _filters.map((filter) {
                final isSelected = _selectedFilter == filter;
                return Padding(
                  padding: const EdgeInsets.only(right: 8.0),
                  child: FilterChip(
                    selected: isSelected,
                    label: Text(filter),
                    onSelected: (bool selected) {
                      setState(() {
                        _selectedFilter = filter;
                      });
                    },
                    selectedColor: Colors.green.shade100,
                    checkmarkColor: Colors.green.shade800,
                    labelStyle: TextStyle(
                      color: isSelected ? Colors.green.shade900 : Colors.black87,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    ),
                    backgroundColor: Colors.grey.shade100,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                      side: BorderSide(
                        color: isSelected ? Colors.green : Colors.transparent, 
                        width: 1
                      ),
                    ),
                    showCheckmark: false,
                  ),
                );
              }).toList(),
            ),
          ),
          
          // Product List
          Expanded(
            child: StreamBuilder<List<Product>>(
              stream: productService.getShopProductsStream(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (snapshot.hasError) {
                   return Center(child: Text("Error loading products: ${snapshot.error}"));
                }

                var products = snapshot.data ?? [];
                
                // Client-side filtering
                if (_selectedFilter != 'All') {
                  final type = _getBusinessTypeFromFilter(_selectedFilter);
                  if (type != null) {
                    products = products.where((p) => p.businessType == type).toList();
                  }
                }

                if (products.isEmpty) {
                  return const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.inventory_2_outlined, size: 64, color: Colors.grey),
                        SizedBox(height: 16),
                        Text("No products found in this category.", style: TextStyle(color: Colors.grey)),
                      ],
                    ),
                  );
                }

                return ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                  itemCount: products.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 24),
                  itemBuilder: (context, index) {
                    return _ProductCard(product: products[index]);
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _ProductCard extends StatefulWidget {
  final Product product;
  const _ProductCard({required this.product});

  @override
  State<_ProductCard> createState() => _ProductCardState();
}

class _ProductCardState extends State<_ProductCard> {
  int _currentImageIndex = 0;
  int _quantity = 1;

  @override
  Widget build(BuildContext context) {
    final hasMultipleImages = widget.product.images.length > 1;
    final images = widget.product.images.isNotEmpty 
        ? widget.product.images 
        : (widget.product.imageUrl != null ? [widget.product.imageUrl!] : []);

    final cart = context.read<CartService>(); // Use read because we might be inside a Consumer or just need it once, but we need updates for limits.
    // Actually, to react to cart changes, we should use context.select or Consumer.
    // Let's wrap the button area in Consumer<CartService> or just use context.watch at build root.
    
    final cartItem = context.select<CartService, double>((service) {
        final item = service.items.where((i) => i.productId == widget.product.id).firstOrNull;
        return item?.quantity ?? 0.0;
    });
    
    final availableToAdd = widget.product.currentStock - cartItem;
    
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(color: Colors.grey.shade100),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Image Scroller
          InkWell(
             onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                     builder: (context) => ProductDetailScreen(product: widget.product),
                  ),
                );
             },
            child: Stack(
              alignment: Alignment.bottomCenter,
              children: [
                SizedBox(
                  height: 220,
                  width: double.infinity,
                  child: images.isNotEmpty
                      ? PageView.builder(
                          itemCount: images.length,
                          onPageChanged: (index) {
                            setState(() {
                              _currentImageIndex = index;
                            });
                          },
                          itemBuilder: (context, index) {
                            return Image.network(
                              images[index],
                              fit: BoxFit.cover,
                              loadingBuilder: (context, child, loadingProgress) {
                                if (loadingProgress == null) return child;
                                return Center(
                                  child: CircularProgressIndicator(
                                    value: loadingProgress.expectedTotalBytes != null
                                        ? loadingProgress.cumulativeBytesLoaded / 
                                          loadingProgress.expectedTotalBytes!
                                        : null,
                                    strokeWidth: 2,
                                  ),
                                );
                              },
                              errorBuilder: (context, error, stackTrace) =>
                                  Container(
                                    color: Colors.grey.shade50,
                                    child: Icon(Icons.broken_image, size: 48, color: Colors.green.shade200)
                                  ),
                            );
                          },
                        )
                      : Container(
                          color: Colors.green.shade50,
                          child: Icon(Icons.eco, size: 64, color: Colors.green.shade200),
                        ),
                ),
                
                // Indicators
                if (hasMultipleImages)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(images.length, (index) {
                        return Container(
                          width: 8,
                          height: 8,
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: _currentImageIndex == index
                                ? Colors.white
                                : Colors.white.withOpacity(0.5),
                          ),
                        );
                      }),
                    ),
                  ),
              ],
            ),
          ),

          // Details & Action
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        widget.product.name,
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      "Rs ${widget.product.currentPrice.toStringAsFixed(0)}",
                      style: TextStyle(
                        fontSize: 18, 
                        fontWeight: FontWeight.bold, 
                        color: Colors.green.shade800
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  "per ${widget.product.priceUnit.displayName}",
                  style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
                ),
                
                const SizedBox(height: 16),
                const Divider(height: 1),
                const SizedBox(height: 16),

                  // Qty & Add to Cart
                if (widget.product.currentStock <= 0)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    decoration: BoxDecoration(
                      color: Colors.red.shade50,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.red.shade100),
                    ),
                    child: const Text(
                      "Out of Stock",
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold),
                    ),
                  )
                else
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                       Text(
                        "Available: ${widget.product.currentStock.toInt()} ${widget.product.unit.name}",
                        style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          // Quantity Control
                          Container(
                            decoration: BoxDecoration(
                              color: Colors.grey.shade50,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.grey.shade200),
                            ),
                            child: Row(
                              children: [
                                _buildQtyButton(
                                  icon: Icons.remove, 
                                  onTap: () {
                                    if (_quantity > 1) setState(() => _quantity--);
                                  }
                                ),
                                SizedBox(
                                  width: 32,
                                  child: Text(
                                    '$_quantity',
                                    textAlign: TextAlign.center,
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                  ),
                                ),
                                _buildQtyButton(
                                  icon: Icons.add, 
                                  onTap: () {
                                    // Check against remaining available logic
                                    if (_quantity < availableToAdd) {
                                       setState(() => _quantity++);
                                    } else {
                                       ScaffoldMessenger.of(context).hideCurrentSnackBar();
                                       ScaffoldMessenger.of(context).showSnackBar(
                                         SnackBar(content: Text("Stock Limit reached ($availableToAdd left)"), duration: const Duration(milliseconds: 1000)),
                                       );
                                    }
                                  }
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                          
                          // Add Button
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () {
                                 // Double check
                                 if (_quantity > availableToAdd) {
                                     ScaffoldMessenger.of(context).showSnackBar(
                                       SnackBar(content: Text("Stock Limit reached. You have $cartItem in cart."), backgroundColor: Colors.red),
                                     );
                                     return;
                                 }

                                 try {
                                   context.read<CartService>().addToCart(widget.product, _quantity.toDouble());
                                   ScaffoldMessenger.of(context).hideCurrentSnackBar();
                                   ScaffoldMessenger.of(context).showSnackBar(
                                     SnackBar(
                                       content: Text("Added $_quantity ${widget.product.name} to cart"),
                                       duration: const Duration(milliseconds: 800), 
                                       behavior: SnackBarBehavior.floating,
                                       backgroundColor: Colors.green.shade800,
                                     ),
                                   );
                                   setState(() {
                                     _quantity = 1; // Reset after adding
                                   });
                                 } catch (e) {
                                   ScaffoldMessenger.of(context).showSnackBar(
                                     SnackBar(content: Text(e.toString().replaceAll("Exception: ", "")), backgroundColor: Colors.red),
                                   );
                                 }
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.green.shade700,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                elevation: 0,
                              ),
                              child: const Text("Add to Cart"),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQtyButton({required IconData icon, required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Icon(icon, size: 20, color: Colors.grey.shade700),
      ),
    );
  }
}



