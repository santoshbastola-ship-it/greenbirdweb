import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:farm_management_app/core/widgets/custom_button.dart';
import 'package:farm_management_app/core/widgets/custom_card.dart';
import 'package:farm_management_app/features/inventory/models/stock_entry.dart';
import 'package:farm_management_app/features/inventory/models/product.dart';
import 'package:farm_management_app/features/inventory/services/product_service.dart';
import 'package:farm_management_app/features/inventory/services/stock_service.dart';
import 'package:farm_management_app/features/auth/services/auth_service.dart';
import 'package:farm_management_app/core/widgets/notification_list.dart';
import 'package:farm_management_app/features/notifications/widgets/notification_bell.dart';
import 'package:farm_management_app/core/utils/nepali_date_helper.dart';
import 'package:farm_management_app/core/widgets/empty_state_widget.dart';

class StockScreen extends StatefulWidget {
  const StockScreen({super.key});

  @override
  State<StockScreen> createState() => _StockScreenState();
}

class _StockScreenState extends State<StockScreen> {
  final _stockService = StockService();
  DateTime _viewDate = DateTime.now();
  final _productService = ProductService();
  String _searchQuery = "";
  BusinessType? _filterBusinessType;

  StockEntry? _getEffectiveStockEntry(String productName, DateTime date) {
    final productEntries = _stockService.getProductStockEntries(productName);
    if (productEntries.isEmpty) return null;
    
    productEntries.sort((a, b) => b.date.compareTo(a.date));
    
    final targetDate = DateTime(date.year, date.month, date.day, 23, 59, 59);
    for (final entry in productEntries) {
      if (entry.date.isBefore(targetDate) || entry.date.isAtSameMomentAs(targetDate)) {
        return entry;
      }
    }
    return null;
  }

  void _decrementDate() {
    setState(() {
      _viewDate = _viewDate.subtract(const Duration(days: 1));
    });
  }

  void _incrementDate() {
    final today = DateTime.now();
    final todayDate = DateTime(today.year, today.month, today.day);
    final nextDate = _viewDate.add(const Duration(days: 1));
    final nextDateOnly = DateTime(nextDate.year, nextDate.month, nextDate.day);
    
    // Only allow increment if next date is not in the future
    if (!nextDateOnly.isAfter(todayDate)) {
      setState(() {
        _viewDate = nextDate;
      });
    }
  }

  Future<void> _pickViewDate() async {
    final today = DateTime.now();
    final picked = await NepaliDateHelper.pickNepaliDate(
      context,
      initialDate: _viewDate.isAfter(today) ? today : _viewDate,
      firstDate: DateTime(2020),
      lastDate: today, // Restrict to today
    );
    if (picked != null) {
      setState(() => _viewDate = picked);
    }
  }

  void _openStockEntryDialog({Product? preselectedProduct}) {
    // Prevent stock entry for future dates
    final today = DateTime.now();
    final todayDate = DateTime(today.year, today.month, today.day);
    final viewingDate = DateTime(_viewDate.year, _viewDate.month, _viewDate.day);
    
    if (viewingDate.isAfter(todayDate)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Cannot add stock for future dates')),
      );
      return;
    }
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _StockEntryModal(
        initialDate: _viewDate,
        initialProductObject: preselectedProduct,
        onSubmit: (productName, delta, unit) async {
          try {
            await _stockService.updateStock(
              productName, 
              delta, 
              unit: unit,
              updatedBy: AuthService().currentUser?.name ?? 'Admin'
            );
            if (mounted) {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Stock Updated!')));
            }
          } catch (e) {
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
            }
          }
        },
        stockHistory: _stockService.getAllStockEntries(), // Pass history to calculate previous day
        availableProducts: _productService.getAllProducts(),
      ),
    );
  }

  // Get Latest Count for a specific date
  StockEntry? _getLatestEntry(String product, DateTime date) {
    try {
      // Filter entries for this product and date
      final entries = _stockService.getProductStockEntries(product).where((e) => 
        e.date.year == date.year &&
        e.date.month == date.month &&
        e.date.day == date.day
      ).toList();
      
      if (entries.isEmpty) return null;
      
      // Return the most recently added entry
      // (Assuming _stockList is sorted new->old, first is latest)
      return entries.first; 
    } catch (e) {
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final today = _viewDate;
    final yesterday = today.subtract(const Duration(days: 1));

    return Scaffold(
      appBar: AppBar(
        title: const Text("Stock"),
        actions: [
          const NotificationBell(),
        ],
      ),
      // floatingActionButton removed as per request to only allow updates via list item click
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
                    labelText: "Search Products",
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
          // Date Navigation Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: Colors.white,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                IconButton(
                  onPressed: _decrementDate,
                  icon: const Icon(Icons.chevron_left),
                ),
                InkWell(
                  onTap: _pickViewDate,
                  child: Row(
                    children: [
                      const Icon(Icons.calendar_month, size: 20),
                      const SizedBox(width: 8),
                      Text(
                        NepaliDateHelper.formatToNepaliShort(_viewDate),
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () {
                    final today = DateTime.now();
                    final todayDate = DateTime(today.year, today.month, today.day);
                    final nextDate = _viewDate.add(const Duration(days: 1));
                    final nextDateOnly = DateTime(nextDate.year, nextDate.month, nextDate.day);
                    
                    if (!nextDateOnly.isAfter(todayDate)) {
                      _incrementDate();
                    }
                  },
                  icon: Icon(
                    Icons.chevron_right,
                    color: () {
                      final today = DateTime.now();
                      final todayDate = DateTime(today.year, today.month, today.day);
                      final nextDate = _viewDate.add(const Duration(days: 1));
                      final nextDateOnly = DateTime(nextDate.year, nextDate.month, nextDate.day);
                      return nextDateOnly.isAfter(todayDate) ? Colors.grey.shade300 : null;
                    }(),
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: StreamBuilder<List<StockEntry>>(
              stream: _stockService.getStockEntriesStream(),
              builder: (context, snapshot) {
                if (snapshot.hasError) {
                  return Center(child: Text("Error: ${snapshot.error}"));
                }
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }
                
                return StreamBuilder<List<Product>>(
                  stream: _productService.getProductsStream(),
                  builder: (context, productSnapshot) {
                    // Note: getProductsStream updates the cache in ProductService, 
                    // so subsequent calls to getAllProducts() will be fresh.
                    // We use productSnapshot.data to ensure UI rebuilds when products change.
                    
                    if (productSnapshot.hasError) {
                       return Center(child: Text("Product Error: ${productSnapshot.error}"));
                    }
                    
                    // Proceed even if loading, potentially using filtered list
                    
                    // Get all products from snapshot if available, or fallback to cache
                    var allProducts = productSnapshot.data ?? _productService.getAllProducts();
                
                // Apply search and filter
                allProducts = allProducts.where((p) {
                  final matchesSearch = p.name.toLowerCase().contains(_searchQuery.toLowerCase());
                  final matchesFilter = _filterBusinessType == null || p.businessType == _filterBusinessType;
                  return matchesSearch && matchesFilter;
                }).toList();
                
                // Sort by Name (A-Z)
                allProducts.sort((a, b) => a.name.compareTo(b.name));

                return allProducts.isEmpty
                    ? const EmptyStateWidget(
                        message: 'No products defined. Add products in Settings.',
                        icon: Icons.inventory_2_outlined,
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
                        itemCount: allProducts.length,
                        itemBuilder: (context, index) {
                          final product = allProducts[index];
                          
                          // Use Product.currentStock as the single source of truth
                          final totalStock = product.currentStock;
                          
                          // Get stock entries for trend calculation
                          final productEntries = _stockService.getProductStockEntries(product.name);
                          productEntries.sort((a, b) => b.date.compareTo(a.date));
                          
                          // Find the most recent entry for this product
                          final latestEntry = productEntries.isNotEmpty ? productEntries.first : null;
                          
                          // Check if there was an update today
                          final today = DateTime.now();
                          final isTodayUpdate = latestEntry != null && 
                              latestEntry.date.year == today.year &&
                              latestEntry.date.month == today.month &&
                              latestEntry.date.day == today.day;
                          
                          // Calculate trend (compare with previous entry)
                          IconData? trendIcon;
                          Color? trendColor;
                          double? countChange;
                          
                          if (productEntries.isNotEmpty && isTodayUpdate) {
                            // Get today's entries
                            final todayEntries = productEntries.where((e) =>
                              e.date.year == today.year &&
                              e.date.month == today.month &&
                              e.date.day == today.day
                            ).toList();
                            
                            if (todayEntries.isNotEmpty) {
                              // Get the most recent entry from today
                              final todayEntry = todayEntries.first;
                              
                              // Find previous entry (before today)
                              final previousEntries = productEntries.where((e) =>
                                e.date.isBefore(DateTime(today.year, today.month, today.day))
                              ).toList();
                              
                              if (previousEntries.isNotEmpty) {
                                final previousEntry = previousEntries.first;
                                countChange = todayEntry.count - previousEntry.count;
                              } else {
                                // First entry ever
                                countChange = todayEntry.count;
                              }
                              
                              if (countChange != null) {
                                if (countChange > 0) {
                                  trendIcon = Icons.arrow_upward;
                                  trendColor = Colors.green;
                                } else if (countChange < 0) {
                                  trendIcon = Icons.arrow_downward;
                                  trendColor = Colors.red;
                                } else {
                                  trendIcon = Icons.trending_flat;
                                  trendColor = Colors.blue;
                                }
                              }
                            }
                          }

                          return Padding(
                             padding: const EdgeInsets.only(bottom: 12),
                             child: CustomCard(
                               child: ListTile(
                                 onTap: () => _openStockEntryDialog(preselectedProduct: product),
                                 leading: CircleAvatar(
                                   backgroundColor: Theme.of(context).primaryColor.withOpacity(0.1),
                                   child: Icon(Icons.inventory_2, color: Theme.of(context).primaryColor),
                                 ),
                                 title: Text(product.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                                 subtitle: Column(
                                   crossAxisAlignment: CrossAxisAlignment.start,
                                   children: [
                                      Text(product.businessType.displayName),
                                     if (latestEntry != null && !isTodayUpdate)
                                       Text(
                                         "Last updated: ${NepaliDateHelper.formatToNepali(latestEntry.date)}",
                                         style: TextStyle(color: Colors.orange.shade700, fontSize: 12, fontWeight: FontWeight.w500),
                                       ),
                                     if (latestEntry == null)
                                        const Text("No stock entries", style: TextStyle(color: Colors.grey, fontSize: 12)),
                                   ],
                                 ),
                                 trailing: Row(
                                   mainAxisSize: MainAxisSize.min,
                                   children: [
                                     Column(
                                       mainAxisAlignment: MainAxisAlignment.center,
                                       crossAxisAlignment: CrossAxisAlignment.end,
                                       children: [
                                          Text(
                                            "${totalStock.toStringAsFixed(totalStock.truncateToDouble() == totalStock ? 0 : 1)}", 
                                            style: TextStyle(
                                              fontWeight: FontWeight.bold, 
                                              fontSize: 16,
                                              color: totalStock <= 0 ? Colors.red : (isTodayUpdate ? Colors.black : Colors.orange.shade800)
                                            )
                                          ),
                                          Text(
                                            product.unit.displayName, 
                                            style: const TextStyle(fontSize: 12, color: Colors.grey)
                                          ),
                                       ],
                                     ),
                                     if (trendIcon != null) ...[ 
                                       const SizedBox(width: 8),
                                       Column(
                                         mainAxisAlignment: MainAxisAlignment.center,
                                         children: [
                                           Icon(trendIcon, color: trendColor, size: 20),
                                           if (countChange != null)
                                             Text(
                                               countChange > 0 ? "+${countChange.toStringAsFixed(0)}" : "${countChange.toStringAsFixed(0)}",
                                               style: TextStyle(color: trendColor, fontSize: 11, fontWeight: FontWeight.bold),
                                             ),
                                         ],
                                       ),
                                     ],
                                   ],
                                 ),
                               ),
                             ),
                          );
                        },
                      );
                  } // StreamBuilder builder
                ); // StreamBuilder
              },
            ),
          ),
        ],
        ),
      );
  }
}

class _StockEntryModal extends StatefulWidget {
  final Product? initialProductObject;
  final DateTime? initialDate;
  final Function(String productName, double delta, String unit) onSubmit;
  final List<StockEntry> stockHistory;
  final List<Product> availableProducts;

  const _StockEntryModal({
    this.initialProductObject, 
    this.initialDate, 
    required this.onSubmit, 
    required this.stockHistory,
    required this.availableProducts,
  });

  @override
  State<_StockEntryModal> createState() => _StockEntryModalState();
}

class _StockEntryModalState extends State<_StockEntryModal> {
  final _formKey = GlobalKey<FormState>();
  final _countController = TextEditingController();
  final _productService = ProductService();
  
  BusinessType _selectedBusinessType = BusinessType.livestocks;
  StockUnit _selectedUnit = StockUnit.pcs;
  DateTime _selectedDate = DateTime.now();
  String? _selectedProduct;

  @override
  void initState() {
    super.initState();
    
    // Robust Fix: Use passed product object directly
    if (widget.initialProductObject != null) {
        _selectedBusinessType = widget.initialProductObject!.businessType;
        _selectedUnit = widget.initialProductObject!.unit;
    }
    
    _updateProductList();
    if (widget.initialDate != null) {
      _selectedDate = widget.initialDate!;
    }
  }

  void _updateProductList() {
    final products = _getProductNames();
    if (products.isNotEmpty) {
      if (widget.initialProductObject != null && products.contains(widget.initialProductObject!.name)) {
        _selectedProduct = widget.initialProductObject!.name;
      } else if (_selectedProduct == null || !products.contains(_selectedProduct!)) {
        _selectedProduct = products.first;
      }
    } else {
      _selectedProduct = null;
    }
    _checkExistingEntry();
  }

  List<String> _getProductNames() {
    final products = widget.availableProducts.where((p) => p.businessType == _selectedBusinessType && p.name != 'Others').toList();
    return products.map((p) => p.name).toList();
  }

  void _checkExistingEntry() {
    if (_selectedProduct == null) {
       _countController.clear();
       return;
    }
    
    // User requested to not show negative value/pre-fill. 
    // Since operation is additive, it's safer to always start empty to avoid confusion.
    _countController.clear();
    
    // logic to set unit/business type based on history is fine to keep, 
    // but not strictly necessary if defaults are good.
    // Keeping it simple as requested.
  }

  @override
  void dispose() {
    _countController.dispose();
    super.dispose();
  }

  // Pick Date
  Future<void> _pickDate() async {
    final today = DateTime.now();
    final picked = await NepaliDateHelper.pickNepaliDate(
      context,
      initialDate: _selectedDate.isAfter(today) ? today : _selectedDate,
      firstDate: DateTime(2020),
      lastDate: today, // Restrict to today - no future dates
    );
    if (picked != null) {
      setState(() => _selectedDate = picked);
      _checkExistingEntry();
    }
  }

  // Get Previous Day Count
  String _getPreviousDayCount(String product) {
    final prevDate = _selectedDate.subtract(const Duration(days: 1));
    final entries = widget.stockHistory.where((e) => 
             e.productName == product && 
             e.date.year == prevDate.year && 
             e.date.month == prevDate.month && 
             e.date.day == prevDate.day
    ).toList();
    
    if (entries.isEmpty) return "0";
    final entry = entries.first; // Latest entry
    
    return "${entry.count} ${entry.unit.displayName}";
  }

  void _submit() {
    if (_formKey.currentState!.validate()) {
      if (_selectedProduct == null) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a product')));
        return;
      }

      widget.onSubmit(
        _selectedProduct!,
        double.tryParse(_countController.text) ?? 0,
        _selectedUnit.name
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final productNames = _getProductNames();
    
    return Container(
      padding: EdgeInsets.only(
        left: 16, right: 16, top: 16, 
        bottom: MediaQuery.of(context).viewInsets.bottom + 16
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2)))),
              const SizedBox(height: 16),
              
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                   Text("Update Stock", style: Theme.of(context).textTheme.titleLarge),
                ],
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.blue.shade200),
                ),
                child: Row(
                  children: [
                    Icon(Icons.info_outline, color: Colors.blue.shade700, size: 20),
                    const SizedBox(width: 8),
                    const Expanded(
                      child: Text(
                        "Enter the quantity to ADD to current stock. For example, enter '10' if you collected 10 eggs today.",
                        style: TextStyle(fontSize: 12),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              
              // Business Type
              DropdownButtonFormField<BusinessType>(
                value: _selectedBusinessType,
                decoration: const InputDecoration(labelText: 'Business Type'),
                items: BusinessType.values.map((b) => DropdownMenuItem(
                  value: b,
                  child: Text(b.displayName),
                )).toList(),
                onChanged: (v) => setState(() {
                  _selectedBusinessType = v!;
                  _updateProductList();
                }),
              ),
              const SizedBox(height: 16),

              // Stock Update Of (Date)
              InkWell(
                onTap: _pickDate,
                child: InputDecorator(
                  decoration: const InputDecoration(
                    labelText: 'Stock Update of',
                    suffixIcon: Icon(Icons.calendar_today),
                  ),
                  child: Text(NepaliDateHelper.formatToNepali(_selectedDate)),
                ),
              ),
              const SizedBox(height: 16),

              // Product
              if (productNames.isEmpty)
                 const Padding(
                   padding: EdgeInsets.symmetric(vertical: 12),
                   child: Text("No products found for this business type.", style: TextStyle(color: Colors.red)),
                 )
              else
                DropdownButtonFormField<String>(
                  value: _selectedProduct,
                  decoration: const InputDecoration(labelText: 'Product'),
                  items: productNames.map((p) => DropdownMenuItem(
                    value: p,
                    child: Text(p),
                  )).toList(),
                  onChanged: (v) {
                     setState(() => _selectedProduct = v!);
                     _checkExistingEntry();
                  },
                ),
              const SizedBox(height: 16),

              // Count and Unit
              Row(
                children: [
                  Expanded(
                    flex: 2,
                    child: TextFormField(
                      controller: _countController,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: InputDecoration(
                        labelText: 'Count',
                        prefixIcon: const Icon(Icons.numbers),
                        errorText: _countController.text.isNotEmpty && 
                                   (double.tryParse(_countController.text) ?? -1) <= 0
                            ? 'Must be greater than 0'
                            : null,
                      ),
                      validator: (v) {
                        if (v == null || v.isEmpty) return 'Required';
                        final value = double.tryParse(v);
                        if (value == null) return 'Invalid number';
                        if (value <= 0) return 'Must be positive';
                        return null;
                      },
                      onChanged: (value) {
                        setState(() {}); // Trigger validation display
                      },
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    flex: 1,
                    child: DropdownButtonFormField<StockUnit>(
                      value: _selectedUnit,
                      decoration: const InputDecoration(labelText: 'Unit'),
                      items: StockUnit.values.map((u) => DropdownMenuItem(
                        value: u,
                        child: Text(u.displayName),
                      )).toList(),
                      onChanged: (v) => setState(() => _selectedUnit = v!),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              
              CustomButton(
                label: "Update Stock",
                icon: Icons.save,
                onPressed: _submit,
              ),
              const SizedBox(height: 16),
              
              // Last Updated By
              // Last Updated By removed as requested
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}
