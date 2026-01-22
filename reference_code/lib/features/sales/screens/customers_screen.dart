import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:intl/intl.dart';
import 'package:farm_management_app/core/widgets/custom_card.dart';
import 'package:farm_management_app/features/sales/models/sales_record.dart';
import 'package:farm_management_app/features/sales/services/customer_service.dart';
import 'package:farm_management_app/features/sales/services/sales_service.dart';
import 'package:farm_management_app/core/widgets/notification_list.dart';
import 'package:farm_management_app/features/notifications/widgets/notification_bell.dart';
import 'package:farm_management_app/core/utils/nepali_date_helper.dart';
import 'package:farm_management_app/core/models/payment_status.dart';
import 'package:farm_management_app/features/auth/services/auth_service.dart';
import 'package:farm_management_app/features/auth/models/user_model.dart';
import 'package:farm_management_app/features/inventory/models/stock_entry.dart';
import 'package:farm_management_app/core/widgets/empty_state_widget.dart';

class CustomersScreen extends StatefulWidget {
  const CustomersScreen({super.key});

  @override
  State<CustomersScreen> createState() => _CustomersScreenState();
}

class _CustomersScreenState extends State<CustomersScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _customerService = CustomerService();
  final _authService = AuthService();
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  UserRole get _currentUserRole => _authService.currentUser?.role ?? UserRole.manager;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _searchController.addListener(() {
      setState(() {
        _searchQuery = _searchController.text.toLowerCase();
      });
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _tabController.dispose();
    super.dispose();
  }
  
  void _viewTransactions(String partnerId, String partnerName, String partnerType) {
    showDialog(
      context: context,
      builder: (context) => _TransactionHistoryDialog(
        partnerId: partnerId,
        partnerName: partnerName,
        partnerType: partnerType,
        customerService: _customerService,
      ),
    );
  }

  void _showPartnerDialog(String type, {Customer? existingPartner}) {
    final isEditing = existingPartner != null;
    final nameController = TextEditingController(text: existingPartner?.name ?? '');
    final emailController = TextEditingController(text: existingPartner?.email ?? '');
    final phoneController = TextEditingController(text: existingPartner?.phone ?? '');
    final addressController = TextEditingController(text: existingPartner?.address ?? '');
    final remarksController = TextEditingController(text: existingPartner?.remarks ?? '');

    showDialog(context: context, builder: (c) => AlertDialog(
      title: Text(isEditing ? "Edit $type" : "Add New $type"),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: nameController, decoration: const InputDecoration(labelText: "Name")),
            const SizedBox(height: 8),
            TextField(controller: emailController, decoration: const InputDecoration(labelText: "Email")),
            const SizedBox(height: 8),
            TextField(controller: phoneController, decoration: const InputDecoration(labelText: "Phone No.")),
            const SizedBox(height: 8),
            TextField(controller: addressController, decoration: const InputDecoration(labelText: "Address")),
            const SizedBox(height: 8),
            TextField(controller: remarksController, decoration: const InputDecoration(labelText: "Remarks"), maxLines: 2),
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(c), child: const Text("Cancel")),
        ElevatedButton(onPressed: () async {
          if (nameController.text.isNotEmpty) {
            try {
              if (isEditing) {
                // Update existing partner
                await _customerService.updateCustomer(
                  existingPartner.id,
                  Customer(
                    id: existingPartner.id,
                    name: nameController.text,
                    type: type,
                    email: emailController.text,
                    phone: phoneController.text,
                    address: addressController.text,
                    remarks: remarksController.text,
                  ),
                );
              } else {
                // Add new partner
                await _customerService.addCustomer(Customer(
                  name: nameController.text,
                  type: type,
                  email: emailController.text,
                  phone: phoneController.text,
                  address: addressController.text,
                  remarks: remarksController.text,
                ));
              }
              if (c.mounted) Navigator.pop(c);
              if (mounted) setState(() {});
            } catch (e) {
              // Show error message
              if (c.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(e.toString().replaceAll('Exception: ', '')),
                    backgroundColor: Colors.red,
                  ),
                );
              }
            }
          }
        }, child: const Text("Save")),
      ],
    ));
  }

  Widget _buildList(String type) {
    return StreamBuilder<List<Customer>>(
      stream: _customerService.getCustomersStream(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        if (snapshot.hasError) {
          return Center(child: Text("Error: ${snapshot.error}"));
        }

        final allCustomers = snapshot.data ?? [];
        
        // Apply search filter
        List<Customer> searchFiltered = allCustomers;
        if (_searchQuery.isNotEmpty) {
          searchFiltered = allCustomers.where((c) {
            // Search in name
            if (c.name.toLowerCase().contains(_searchQuery)) return true;
            
            // Search in email
            if (c.email.toLowerCase().contains(_searchQuery)) return true;
            
            // Search in phone
            if (c.phone.toLowerCase().contains(_searchQuery)) return true;
            
            // Search in address
            if (c.address.toLowerCase().contains(_searchQuery)) return true;
            
            return false;
          }).toList();
        }
        
        final filtered = searchFiltered.where((c) => c.type == type).toList();
        
        // Sort by Total Transaction Amount (Highest First)
        filtered.sort((a, b) => b.totalTransactionAmount.compareTo(a.totalTransactionAmount));
        
        if (filtered.isEmpty && _searchQuery.isNotEmpty) {
          return EmptyStateWidget(
            message: "No results found for '$_searchQuery'",
            icon: Icons.search_off,
          );
        }
        
        if (filtered.isEmpty) {
          return EmptyStateWidget(
            message: "No ${type.toLowerCase()}s found",
            icon: type == "Customer" ? Icons.people_outline : Icons.store_outlined,
          );
        }
        
        return ListView.builder(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
          itemCount: filtered.length,
          itemBuilder: (context, index) {
            final p = filtered[index];
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: CustomCard(
                child: ExpansionTile(
                  leading: CircleAvatar(child: Text(p.name.isNotEmpty ? p.name[0] : "?")),
                  title: Text(p.name),
                  subtitle: Text("${p.phone} • ${p.email}"),
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(Icons.location_on, size: 16, color: Colors.grey),
                              const SizedBox(width: 8),
                              Flexible(child: Text("Address: ${p.address}")),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(Icons.note, size: 16, color: Colors.grey),
                              const SizedBox(width: 8),
                              Flexible(child: Text("Remarks: ${p.remarks}")),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Wrap(
                            alignment: WrapAlignment.end,
                            spacing: 8,
                            runSpacing: 8,
                            children: [
                               // RBAC: Hide Sales History for Managers (Customer type only)
                               if (!(_currentUserRole == UserRole.manager && type == "Customer"))
                                 OutlinedButton.icon(
                                  onPressed: () => _viewTransactions(p.id, p.name, type),
                                  icon: const Icon(Icons.receipt_long, size: 16),
                                  label: const Text("Transactions", style: TextStyle(fontSize: 12)),
                                  style: OutlinedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                  ),
                                ),
                              ElevatedButton.icon(
                                onPressed: () => _showPartnerDialog(type, existingPartner: p),
                                icon: const Icon(Icons.edit, size: 16),
                                label: const Text("Edit", style: TextStyle(fontSize: 12)),
                                style: ElevatedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    )
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Partners"),
        actions: [
          const NotificationBell(),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(130),
          child: Container(
            color: Colors.white,
            child: Column(
              children: [
                TabBar(
                  controller: _tabController,
                  indicatorColor: Theme.of(context).primaryColor,
                  indicatorWeight: 3,
                  labelColor: Theme.of(context).primaryColor,
                  unselectedLabelColor: Colors.grey,
                  labelStyle: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.5,
                  ),
                  unselectedLabelStyle: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                  ),
                  tabs: const [
                    Tab(
                      icon: Icon(Icons.person, size: 24),
                      text: "CUSTOMERS",
                      height: 70,
                    ),
                    Tab(
                      icon: Icon(Icons.store, size: 24),
                      text: "VENDORS",
                      height: 70,
                    ),
                  ],
                ),
                // Search Bar
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                  child: TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      hintText: 'Search by name, email, phone...',
                      prefixIcon: const Icon(Icons.search),
                      suffixIcon: _searchQuery.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear),
                              onPressed: () {
                                _searchController.clear();
                              },
                            )
                          : null,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          Scaffold(
            body: _buildList("Customer"),
            floatingActionButton: FloatingActionButton.extended(
              onPressed: () => _showPartnerDialog("Customer"),
              icon: const Icon(Icons.add),
              label: const Text("Add Customer"),
            ),
          ),
          Scaffold(
            body: _buildList("Vendor"),
            floatingActionButton: FloatingActionButton.extended(
              onPressed: () => _showPartnerDialog("Vendor"),
              icon: const Icon(Icons.add),
              label: const Text("Add Vendor"),
            ),
          ),
        ],
      ),
    );
  }
}

class _TransactionHistoryDialog extends StatefulWidget {
  final String partnerId;
  final String partnerName;
  final String partnerType;
  final CustomerService customerService;

  const _TransactionHistoryDialog({
    required this.partnerId,
    required this.partnerName,
    required this.partnerType,
    required this.customerService,
  });

  @override
  State<_TransactionHistoryDialog> createState() => _TransactionHistoryDialogState();
}

class _TransactionHistoryDialogState extends State<_TransactionHistoryDialog> {
  final _salesService = SalesService();
  final List<TransactionRecord> _transactions = [];
  bool _isLoading = true;
  bool _hasMore = true;
  static const _pageSize = 10;
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _loadTransactions();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent * 0.9) {
      if (!_isLoading && _hasMore) {
        _loadTransactions();
      }
    }
  }

  Future<void> _loadTransactions() async {
    if (!_hasMore) return;
    setState(() => _isLoading = true);
    
    // Vendors: show only Purchases, Customers: show only Sales
    final expectedTransactionType = widget.partnerType == "Vendor" 
        ? TransactionType.Purchase 
        : TransactionType.Sale;

    try {
      // The service now returns List<TransactionRecord> directly
      final newTransactions = await _salesService.getTransactionsByPartner(
        customerId: widget.partnerId,
        partyName: widget.partnerName,
        type: expectedTransactionType,
        limit: _pageSize,
      );

      if (newTransactions.isNotEmpty) {
        _transactions.addAll(newTransactions);
        
        // Sort by date descending (newest first)
        _transactions.sort((a, b) => b.date.compareTo(a.date));
        
        // If we got fewer records than asked, we are done
        if (newTransactions.length < _pageSize) {
          _hasMore = false;
        }
      } else {
        _hasMore = false;
      }
    } catch (e, stackTrace) {
      print("Error loading transactions: $e");
      print("Stack trace: $stackTrace");
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("Failed to load transactions: ${e.toString()}"),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      insetPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 24),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 600),
        width: double.infinity, 
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.partnerType == "Vendor" ? "Purchase History" : "Sales History",
                        style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        widget.partnerName,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(color: Colors.grey),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
            const Divider(height: 24),
            if (_transactions.isEmpty && !_isLoading)
              const Flexible(
                child: EmptyStateWidget(
                  message: "No transactions found for this partner",
                  icon: Icons.receipt_long_outlined,
                ),
              )
            else
              Flexible(
                child: ListView.builder(
                  controller: _scrollController,
                  shrinkWrap: true,
                  itemCount: _transactions.length + (_isLoading ? 1 : 0),
                  itemBuilder: (context, index) {
                    if (index == _transactions.length) {
                      return const Center(child: Padding(
                        padding: EdgeInsets.all(8.0),
                        child: CircularProgressIndicator(),
                      ));
                    }
                    final t = _transactions[index];
                    final isSale = t.type == TransactionType.Sale;
                    
                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.grey.shade200),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Header row with amount and icon
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            decoration: BoxDecoration(
                              color: (isSale ? Colors.green : Colors.red).withOpacity(0.05),
                              borderRadius: const BorderRadius.only(
                                topLeft: Radius.circular(8),
                                topRight: Radius.circular(8),
                              ),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    Icon(
                                      isSale ? Icons.arrow_upward : Icons.arrow_downward,
                                      color: isSale ? Colors.green : Colors.red,
                                      size: 16,
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      NepaliDateHelper.formatToNepaliShort(t.date),
                                      style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w500,
                                        color: Colors.grey[700],
                                      ),
                                    ),
                                  ],
                                ),
                                Text(
                                  "Rs ${t.totalPayable.toStringAsFixed(0)}",
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                    color: isSale ? Colors.green : Colors.red,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          // Content
                          Padding(
                            padding: const EdgeInsets.all(12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  t.itemsSummary,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w500,
                                    fontSize: 14,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: t.paymentStatus.isPaid 
                                            ? Colors.green.shade50 
                                            : Colors.orange.shade50,
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        t.paymentStatus.displayName,
                                        style: TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w600,
                                          color: t.paymentStatus.isPaid 
                                              ? Colors.green.shade700 
                                              : Colors.orange.shade700,
                                        ),
                                      ),
                                    ),
                                    if (t.discount > 0) ...[
                                      const SizedBox(width: 6),
                                      Text(
                                        "Disc: Rs ${t.discount.toStringAsFixed(0)}",
                                        style: TextStyle(
                                          fontSize: 11,
                                          color: Colors.grey[600],
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            const SizedBox(height: 16),
            if (_transactions.isNotEmpty)
              const Divider(),
            if (_transactions.isNotEmpty)
              const SizedBox(height: 8),
            if (_transactions.isNotEmpty)
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                   const Text("Current Total:", style: TextStyle(fontWeight: FontWeight.bold)),
                   Text(
                     "Rs ${_transactions.fold<double>(0, (sum, t) => sum + t.totalPayable).toStringAsFixed(2)}",
                     style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.green),
                   ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}
