import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'dart:io';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:image_picker/image_picker.dart';
import 'package:farm_management_app/core/services/image_service.dart';
import 'package:farm_management_app/core/widgets/custom_card.dart';
import 'package:farm_management_app/features/notifications/widgets/notification_bell.dart';
import 'package:farm_management_app/core/widgets/custom_button.dart';
import 'package:farm_management_app/features/inventory/models/product.dart';
import 'package:farm_management_app/features/inventory/services/stock_service.dart';
import 'package:farm_management_app/features/inventory/models/stock_entry.dart';
import 'package:farm_management_app/features/inventory/services/product_service.dart';
import 'package:farm_management_app/features/auth/services/auth_service.dart';
import 'package:farm_management_app/features/auth/models/user_model.dart';
import 'package:farm_management_app/core/utils/nepali_date_helper.dart';

class ProductsManagementScreen extends StatefulWidget {
  const ProductsManagementScreen({super.key});

  @override
  State<ProductsManagementScreen> createState() => _ProductsManagementScreenState();
}

class _ProductsManagementScreenState extends State<ProductsManagementScreen> {
  final _productService = ProductService();
  String _searchQuery = "";
  BusinessType? _filterBusinessType;

  void _showProductDialog({Product? product}) {
    final isEditing = product != null;
    final nameController = TextEditingController(text: product?.name ?? '');
    BusinessType selectedBusinessType = product?.businessType ?? BusinessType.livestocks;
    StockUnit selectedUnit = product?.unit ?? StockUnit.pcs;
    StockUnit selectedPriceUnit = product?.priceUnit ?? product?.unit ?? StockUnit.pcs;
    final priceController = TextEditingController(text: product?.currentPrice.toString() ?? '');
    final descriptionController = TextEditingController(text: product?.description ?? '');
    
    // Image Handling
    List<String> existingImages = product?.images != null ? List.from(product!.images) : [];
    if (product?.imageUrl != null && product!.imageUrl!.isNotEmpty && !existingImages.contains(product.imageUrl)) {
       existingImages.add(product.imageUrl!);
    }
    if (product?.imageUrl != null && product!.imageUrl!.isNotEmpty && !existingImages.contains(product.imageUrl)) {
       existingImages.add(product.imageUrl!);
    }

    bool isAvailableForSale = product?.isAvailableForSale ?? false;
    List<XFile> newImages = [];
    bool isUploading = false;
    final ImageService _imageService = ImageService();

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: Text(isEditing ? "Edit Product" : "Add New Product"),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextField(
                  controller: nameController,
                  decoration: const InputDecoration(labelText: "Product Name"),
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<BusinessType>(
                  initialValue: selectedBusinessType,
                  decoration: const InputDecoration(labelText: "Business Type"),
                  items: BusinessType.values.map((bt) => DropdownMenuItem(
                    value: bt,
                    child: Text(bt.displayName),
                  )).toList(),
                  onChanged: (v) => setState(() => selectedBusinessType = v!),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      flex: 2,
                      child: TextField(
                        controller: priceController,
                        decoration: const InputDecoration(labelText: "Rate (Rs)", prefixText: "Rs "),
                        keyboardType: TextInputType.number,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      flex: 1,
                      child: DropdownButtonFormField<StockUnit>(
                        initialValue: selectedPriceUnit,
                        decoration: const InputDecoration(labelText: "Per"),
                        items: StockUnit.values.map((u) => DropdownMenuItem(
                          value: u,
                          child: Text(u.displayName),
                        )).toList(),
                        onChanged: (v) => setState(() => selectedPriceUnit = v!),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                 DropdownButtonFormField<StockUnit>(
                  initialValue: selectedUnit,
                  decoration: const InputDecoration(labelText: "Stock Unit"),
                  items: StockUnit.values.map((u) => DropdownMenuItem(
                    value: u,
                    child: Text(u.displayName),
                  )).toList(),
                  onChanged: (v) => setState(() => selectedUnit = v!),
                ),
                const SizedBox(height: 16),
                
                // Available for Sale Toggle
                SwitchListTile(
                  title: const Text("Available for Sale"),
                  subtitle: const Text("Show in Customer Shop"),
                  value: isAvailableForSale,
                  onChanged: (val) => setState(() => isAvailableForSale = val),
                  contentPadding: EdgeInsets.zero,
                ),
                const SizedBox(height: 8),

                TextField(
                  controller: descriptionController,
                  decoration: const InputDecoration(labelText: "Description", alignLabelWithHint: true),
                  maxLines: 3,
                ),
                const SizedBox(height: 16),
                
                // Image Section
                const Text("Product Images (Max 2)", style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    // Existing Images
                    ...existingImages.map((url) => Stack(
                      children: [
                        Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.grey.shade300),
                            borderRadius: BorderRadius.circular(8),
                            color: Colors.grey.shade100, // Background for transparent images
                          ),
                          clipBehavior: Clip.antiAlias,
                          child: Image.network(
                            url,
                            fit: BoxFit.cover,
                            loadingBuilder: (context, child, loadingProgress) {
                              if (loadingProgress == null) return child;
                              return const Center(
                                child: SizedBox(
                                  width: 20, 
                                  height: 20, 
                                  child: CircularProgressIndicator(strokeWidth: 2)
                                )
                              );
                            },
                            errorBuilder: (context, error, stackTrace) {
                              print("Image Error for $url: $error");
                              return Tooltip(
                                message: "Error: $error",
                                child: const Icon(Icons.broken_image, color: Colors.red),
                              );
                            },
                          ),
                        ),
                        Positioned(
                          top: 0,
                          right: 0,
                          child: InkWell(
                            onTap: () => setState(() => existingImages.remove(url)),
                            child: const CircleAvatar(
                              radius: 10,
                              backgroundColor: Colors.red,
                              child: Icon(Icons.close, size: 12, color: Colors.white),
                            ),
                          ),
                        ),
                      ],
                    )),
                    // New Images
                    ...newImages.map((file) => Stack(
                      children: [
                         Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.green.shade300),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: ClipRRect(
                             borderRadius: BorderRadius.circular(8),
                             child: kIsWeb 
                               ? Image.network(file.path, fit: BoxFit.cover) // XFile path on web is blob URL
                               : Image.file(File(file.path), fit: BoxFit.cover),
                          ),
                        ),
                        Positioned(
                          top: 0,
                          right: 0,
                          child: InkWell(
                            onTap: () => setState(() => newImages.remove(file)),
                            child: const CircleAvatar(
                              radius: 10,
                              backgroundColor: Colors.red,
                              child: Icon(Icons.close, size: 12, color: Colors.white),
                            ),
                          ),
                        ),
                      ],
                    )),
                    // Add Button (if total < 2)
                    if (existingImages.length + newImages.length < 2)
                      GestureDetector(
                        behavior: HitTestBehavior.opaque,
                        onTap: () async {
                           try {
                             final picked = await _imageService.pickImages(maxImages: 2 - (existingImages.length + newImages.length));
                             if (picked.isNotEmpty) {
                               setState(() => newImages.addAll(picked));
                             }
                           } catch (e) {
                             if (context.mounted) {
                               ScaffoldMessenger.of(context).showSnackBar(
                                 SnackBar(content: Text('Failed to pick image: $e')),
                               );
                             }
                           }
                        },
                        child: Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            color: Colors.grey.shade100,
                            border: Border.all(color: Colors.grey.shade300),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Icon(Icons.add_a_photo, color: Colors.grey),
                        ),
                      ),
                  ],
                ),
                if (isUploading)
                  const Padding(
                    padding: EdgeInsets.only(top: 16.0),
                    child: LinearProgressIndicator(), 
                  ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: isUploading ? null : () => Navigator.pop(context),
              child: const Text("Cancel"),
            ),
            ElevatedButton(
              onPressed: isUploading ? null : () async {
                if (nameController.text.isNotEmpty && priceController.text.isNotEmpty) {
                   setState(() => isUploading = true);
                   
                   try {
                     // Upload new images
                     List<String> uploadedUrls = [];
                     if (newImages.isNotEmpty) {
                        uploadedUrls = await _imageService.uploadImages(newImages, 'product_images');
                     }
                     
                     final finalImages = [...existingImages, ...uploadedUrls];
                     final price = double.tryParse(priceController.text) ?? 0.0;

                     print("Product: Saving to Firestore...");
                     if (isEditing) {
                        await _productService.updateProduct(product.id, product.copyWith(
                          name: nameController.text,
                          businessType: selectedBusinessType,
                          unit: selectedUnit,
                          priceUnit: selectedPriceUnit,
                          currentPrice: price,
                          description: descriptionController.text,
                          images: finalImages,
                          isAvailableForSale: isAvailableForSale,
                        ));
                     } else {
                        await _productService.addProduct(Product(
                          name: nameController.text,
                          businessType: selectedBusinessType,
                          unit: selectedUnit,
                          priceUnit: selectedPriceUnit,
                          currentPrice: price,
                          description: descriptionController.text,
                          images: finalImages,
                          isAvailableForSale: isAvailableForSale,
                          createdBy: AuthService().currentUser?.name ?? 'Admin',
                          priceHistory: [
                             PriceHistoryEntry(
                               price: price,
                               effectiveDate: DateTime.now(),
                               changedBy: AuthService().currentUser?.name ?? 'Admin',
                             ),
                          ],
                        ));
                     }
                     if (context.mounted) {
                       Navigator.pop(context);
                       ScaffoldMessenger.of(context).showSnackBar(
                         SnackBar(content: Text(isEditing ? 'Product updated!' : 'Product added!')),
                       );
                     }
                   } catch (e) {
                      setState(() => isUploading = false);
                      if (context.mounted) {
                         ScaffoldMessenger.of(context).showSnackBar(
                           SnackBar(content: Text("Error saving product: $e")),
                         );
                      }
                   }
                }
              },
              child: Text(isUploading ? "Saving..." : "Save"),
            ),
          ],
        ),
      ),
    );
  }

  void _showPriceUpdateDialog(Product product) {
    // Permission check: Only Admin can update prices
    final currentUser = AuthService().currentUser;
    if (currentUser?.role != UserRole.admin) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Only Administrators can update product prices')),
      );
      return;
    }

    final priceController = TextEditingController(text: product.currentPrice.toString());
    DateTime effectiveDate = DateTime.now();

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: Text("Update Price - ${product.name}"),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text("Current Price: Rs ${product.currentPrice.toStringAsFixed(2)} per ${product.unit.displayName}",
                  style: const TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                TextField(
                  controller: priceController,
                  decoration: const InputDecoration(labelText: "New Price (Rs)", prefixText: "Rs "),
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 16),
                InkWell(
                  onTap: () async {
                    final picked = await NepaliDateHelper.pickNepaliDate(
                      context,
                      initialDate: effectiveDate,
                      firstDate: DateTime.now(),
                      lastDate: DateTime(2030),
                    );
                    if (picked != null) {
                      setState(() => effectiveDate = picked);
                    }
                  },
                  child: InputDecorator(
                    decoration: const InputDecoration(
                      labelText: 'Effective Date',
                      suffixIcon: Icon(Icons.calendar_today),
                    ),
                    child: Text(NepaliDateHelper.formatToNepali(effectiveDate)),
                  ),
                ),
                const SizedBox(height: 16),
                if (product.priceHistory.isNotEmpty) ...[
                  const Text("Price History:", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                  const SizedBox(height: 8),
                  ...product.priceHistory.reversed.take(3).map((entry) => Padding(
                    padding: const EdgeInsets.only(bottom: 4),
                    child: Text(
                      "Rs ${entry.price.toStringAsFixed(2)} - ${NepaliDateHelper.formatToNepali(entry.effectiveDate)} by ${entry.changedBy}",
                      style: const TextStyle(fontSize: 11, color: Colors.grey),
                    ),
                  )),
                ],
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text("Cancel"),
            ),
            ElevatedButton(
              onPressed: () {
                if (priceController.text.isNotEmpty) {
                  final newPrice = double.tryParse(priceController.text) ?? 0.0;
                  _productService.updateProductPrice(
                    product.id,
                    newPrice,
                    effectiveDate,
                    AuthService().currentUser?.name ?? 'Admin',
                  );
                  this.setState(() {});
                  Navigator.pop(context);
                  ScaffoldMessenger.of(this.context).showSnackBar(
                    const SnackBar(content: Text('Price updated successfully!')),
                  );
                }
              },
              child: const Text("Update Price"),
            ),
          ],
        ),
      ),
    );
  }

  void _deleteProduct(Product product) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Delete Product"),
        content: Text("Are you sure you want to delete '${product.name}'?"),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("Cancel"),
          ),
          ElevatedButton(
            onPressed: () {
              _productService.deleteProduct(product.id);
              setState(() {});
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Product deleted!')),
              );
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text("Delete"),
          ),
        ],
      ),
    );
  }

  List<Product> get _filteredProducts {
    final allProducts = _productService.getAllProducts();
    return allProducts.where((p) {
      final matchesSearch = p.name.toLowerCase().contains(_searchQuery.toLowerCase());
      final matchesFilter = _filterBusinessType == null || p.businessType == _filterBusinessType;
      return matchesSearch && matchesFilter;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final groupedProducts = <BusinessType, List<Product>>{};
    for (var product in _filteredProducts) {
      groupedProducts.putIfAbsent(product.businessType, () => []).add(product);
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text("Product & Price Management"),
        actions: [
          // IconButton(
          //   icon: const Icon(Icons.delete_sweep, color: Colors.red),
          //   tooltip: "Reset All Stock to Zero",
          //   onPressed: () => _showResetConfirmation(context),
          // ),
          const NotificationBell(),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showProductDialog(),
        icon: const Icon(Icons.add),
        label: const Text("Add Product"),
      ),
      body: Column(
        children: [
          // Search and Filter
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.white,
            child: Column(
              children: [
                TextField(
                  decoration: const InputDecoration(
                    labelText: "Search products",
                    prefixIcon: Icon(Icons.search),
                    border: OutlineInputBorder(),
                  ),
                  onChanged: (value) => setState(() => _searchQuery = value),
                ),
                const SizedBox(height: 12),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      FilterChip(
                        label: const Text("All"),
                        selected: _filterBusinessType == null,
                        onSelected: (selected) => setState(() => _filterBusinessType = null),
                      ),
                      const SizedBox(width: 8),
                      ...BusinessType.values.map((bt) => Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: FilterChip(
                          label: Text(bt.displayName),
                          selected: _filterBusinessType == bt,
                          onSelected: (selected) => setState(() => _filterBusinessType = selected ? bt : null),
                        ),
                      )),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          
          // Product List
          Expanded(
            child: StreamBuilder<List<Product>>(
              stream: _productService.getProductsStream(),
              builder: (context, snapshot) {
                if (snapshot.hasError) {
                  return Center(child: Text("Error: ${snapshot.error}"));
                }
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }

                // Force update UI when data arrives (Stream updates cache too)
                // We re-calculate _filteredProducts inside build or here?
                // Actually _filteredProducts uses getAllProducts() which reads cache.
                // Since Stream updates cache, calling getAllProducts() here is safe.
                
                // Better: Use snapshot.data as source of truth
                final allProducts = snapshot.data ?? [];
                
                final filtered = allProducts.where((p) {
                  final matchesSearch = p.name.toLowerCase().contains(_searchQuery.toLowerCase());
                  final matchesFilter = _filterBusinessType == null || p.businessType == _filterBusinessType;
                  return matchesSearch && matchesFilter;
                }).toList();

                if (filtered.isEmpty) {
                  return const Center(child: Text("No products found"));
                }

                final groupedProducts = <BusinessType, List<Product>>{};
                for (var product in filtered) {
                  groupedProducts.putIfAbsent(product.businessType, () => []).add(product);
                }

                return ListView(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
                  children: groupedProducts.entries.map((entry) {
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          child: Text(
                            entry.key.displayName,
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: Theme.of(context).primaryColor,
                            ),
                          ),
                        ),
                        ...entry.value.map((product) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: CustomCard(
                            child: ListTile(
                              leading: CircleAvatar(
                                backgroundColor: Theme.of(context).primaryColor.withOpacity(0.1),
                                child: Icon(Icons.inventory_2, color: Theme.of(context).primaryColor),
                              ),
                              title: Text(product.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                              subtitle: Text("Rs ${product.currentPrice.toStringAsFixed(2)} per ${product.priceUnit.displayName} (Stock Unit: ${product.unit.displayName})"),
                                trailing: PopupMenuButton(
                                  itemBuilder: (context) {
                                    final currentUser = AuthService().currentUser;
                                    return [
                                      const PopupMenuItem(value: 'edit', child: Text('Edit')),
                                      const PopupMenuItem(value: 'price', child: Text('Update Price')),
                                      if (currentUser != null && currentUser.canDeleteRecords)
                                        const PopupMenuItem(value: 'delete', child: Text('Delete', style: TextStyle(color: Colors.red))),
                                    ];
                                  },
                                  onSelected: (value) {
                                  switch (value) {
                                    case 'edit':
                                      _showProductDialog(product: product);
                                      break;
                                    case 'price':
                                      _showPriceUpdateDialog(product);
                                      break;
                                    case 'delete':
                                      _deleteProduct(product);
                                      break;
                                  }
                                },
                              ),
                            ),
                          ),
                        )),
                      ],
                    );
                  }).toList(),
                );
              }
            ),
          ),
        ],
      ),
    );
  } // This is the missing closing brace for the build method.

  Future<void> _showResetConfirmation(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Reset All Stock?"),
        content: const Text("This will DELETE ALL stock history and set all product counts to ZERO. This cannot be undone."),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text("Cancel")),
          TextButton(
            onPressed: () => Navigator.pop(context, true), 
            child: const Text("Continue", style: TextStyle(color: Colors.red))
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      final secondConfirm = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text("Are you absolutely sure?"),
          content: const Text("Type 'RESET' to confirm final deletion."),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context, false), child: const Text("Cancel")),
            TextButton(
              onPressed: () => Navigator.pop(context, true), 
              child: const Text("RESET EVERYTHING", style: TextStyle(color: Colors.red))
            ),
          ],
        ),
      );

      if (secondConfirm == true && mounted) {
        try {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Resetting stock...")));
          await StockService().resetAllStock();
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Stock has been reset to zero.")));
            setState(() {});
          }
        } catch (e) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Reset failed: $e")));
          }
        }
      }
    }
  }
}
