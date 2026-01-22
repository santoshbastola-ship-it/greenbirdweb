import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/rendering.dart';
import 'package:share_plus/share_plus.dart';
import 'package:farm_management_app/features/sales/widgets/bill_receipt_widget.dart';
import 'package:farm_management_app/core/services/form_state_service.dart';

import 'package:farm_management_app/core/widgets/custom_card.dart';
import 'package:farm_management_app/features/sales/models/sales_record.dart';
import 'package:farm_management_app/features/sales/services/customer_service.dart';
import 'package:farm_management_app/features/inventory/models/product.dart';
import 'package:farm_management_app/features/inventory/models/stock_entry.dart';
import 'package:farm_management_app/core/models/payment_status.dart'; // Added
import 'package:farm_management_app/features/inventory/services/product_service.dart';
import 'package:farm_management_app/features/sales/services/sales_service.dart';
import 'package:farm_management_app/features/auth/models/user_model.dart';
import 'package:farm_management_app/features/auth/services/auth_service.dart';
import 'package:farm_management_app/core/widgets/notification_list.dart';
import 'package:farm_management_app/features/notifications/widgets/notification_bell.dart';
import 'package:farm_management_app/core/utils/nepali_date_helper.dart';
import 'package:farm_management_app/core/widgets/empty_state_widget.dart';

class SalesScreen extends StatefulWidget {
  final int initialIndex;
  const SalesScreen({super.key, this.initialIndex = 0});

  @override
  State<SalesScreen> createState() => _SalesScreenState();
}

class _SalesScreenState extends State<SalesScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _productService = ProductService();
  final _customerService = CustomerService();
  final _salesService = SalesService();
  final _authService = AuthService();
  final _searchController = TextEditingController();
  String _searchQuery = '';

  // Get current user role from AuthService
  UserRole get _currentUserRole => _authService.currentUser?.role ?? UserRole.manager;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this, initialIndex: widget.initialIndex);
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

  void _showAddDialog(TransactionType type) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => _AddSalesDialog(
          type: type,
          onSave: (transaction) async {
            // Save to Firestore
            try {
              await _salesService.addSalesRecord(transaction);
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text("Transaction saved successfully")),
                );
              }
            } catch (e) {
               if (context.mounted) {
                 ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text("Error saving: $e"), backgroundColor: Colors.red),
                );
               }
            }
          },
          currentUserName: _authService.currentUser?.name ?? 'Unknown User',
          productService: _productService,
          customerService: _customerService,
        ),
      ),
    );
  }

  void _showEditDialog(TransactionRecord transaction) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => _AddSalesDialog(
          type: transaction.type,
          existingTransaction: transaction,
          onSave: (updatedTransaction) async {
            try {
              // Use updateSalesRecord to handle stock diffing
              await _salesService.updateSalesRecord(updatedTransaction, transaction);
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text("Transaction updated")),
                );
              }
            } catch (e) {
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text("Error updating: $e"), backgroundColor: Colors.red),
                );
              }
            }
          },
          currentUserName: _authService.currentUser?.name ?? 'Unknown User',
          productService: _productService,
          customerService: _customerService,
        ),
      ),
    );
  }

  void _deleteTransaction(String id) async {
    try {
      await _salesService.deleteSalesRecord(id);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Transaction deleted")),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Error deleting: $e"), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Sales & Purchase'),
        actions: [
          const NotificationBell(),
        ],
        // Only show tabs for Admin users
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
                      icon: Icon(Icons.sell, size: 24),
                      text: "SALES",
                      height: 70,
                    ),
                    Tab(
                      icon: Icon(Icons.shopping_cart, size: 24),
                      text: "PURCHASE",
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
                      hintText: 'Search by bill no, customer, items...',
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
      body: StreamBuilder<List<TransactionRecord>>(
        stream: _salesService.getTransactionsStream(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          
          if (snapshot.hasError) {
             return Center(child: Text("Error: ${snapshot.error}"));
          }

          final allTransactions = snapshot.data ?? [];



          // Admin users see both tabs
          return TabBarView(
            controller: _tabController,
            children: [
              Scaffold(
                body: _buildList(TransactionType.Sale, allTransactions),
                floatingActionButton: FloatingActionButton.extended(
                  onPressed: () => _showAddDialog(TransactionType.Sale),
                  icon: const Icon(Icons.add),
                  label: const Text("New Sale"),
                  backgroundColor: Colors.green,
                ),
              ),
              Scaffold(
                body: _buildList(TransactionType.Purchase, allTransactions),
                 floatingActionButton: FloatingActionButton.extended(
                  onPressed: () => _showAddDialog(TransactionType.Purchase),
                  icon: const Icon(Icons.remove),
                  label: const Text("New Purchase"),
                  backgroundColor: Colors.red,
                ),
              ),
            ],
          );
        }
      ),
    );
  }

  Widget _buildList(TransactionType type, List<TransactionRecord> allTransactions) {
    List<TransactionRecord> filtered = allTransactions.where((t) => t.type == type).toList();
    
    // Apply search filter
    if (_searchQuery.isNotEmpty) {
      filtered = filtered.where((t) {
        // Search in bill number
        if (t.billNo.toLowerCase().contains(_searchQuery)) return true;
        
        // Search in party name
        if (t.partyName.toLowerCase().contains(_searchQuery)) return true;
        
        // Search in item names
        if (t.items.any((item) => item.productName.toLowerCase().contains(_searchQuery))) return true;
        
        // Search in payment status
        if (t.paymentStatus.displayName.toLowerCase().contains(_searchQuery)) return true;
        
        return false;
      }).toList();
    }
    
    // RBAC: If Manager, allow Pending/Partial (Any Date) OR Paid (Today Only)
    if (_currentUserRole == UserRole.manager) {
      final now = DateTime.now();
      filtered = filtered.where((t) {
        if (!t.paymentStatus.isPaid) return true; // Show all Pending/Partial
        
        // For Paid, show only if Today
        return t.date.year == now.year && 
               t.date.month == now.month && 
               t.date.day == now.day;
      }).toList();
    }
    
    if (filtered.isEmpty) {
      return EmptyStateWidget(
        message: _searchQuery.isNotEmpty 
            ? "No results found for '$_searchQuery'"
            : "No ${type.name.toLowerCase()}s recorded",
        icon: type == TransactionType.Sale ? Icons.shopping_cart_outlined : Icons.shopping_bag_outlined,
      );
    }
    
    // Split into Pending and Completed
    // "Pending" now means anything NOT fully paid (i.e., Pending or Partial)
    final pending = filtered.where((t) => !t.paymentStatus.isPaid).toList();
    final completed = filtered.where((t) => t.paymentStatus.isPaid).toList();

    // Sort Pending: Strictly by date desc
    pending.sort((a, b) => b.date.compareTo(a.date));

    // Sort Completed by date desc
    completed.sort((a, b) => b.date.compareTo(a.date));

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // PENDING SECTION
          if (pending.isNotEmpty) ...[
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 12.0),
              child: Row(
                children: [
                  Icon(Icons.pending_actions, color: Colors.orange.shade700, size: 24),
                  const SizedBox(width: 8),
                  Text(
                    "Pending / Partial",
                    style: TextStyle(
                      fontSize: 18, 
                      fontWeight: FontWeight.bold,
                      color: Colors.orange.shade800
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.orange.shade100,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      "${pending.length}",
                      style: TextStyle(color: Colors.orange.shade900, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            ),
            ...pending.map((t) => _buildTransactionCard(t, type)).toList(),
            const SizedBox(height: 24),
          ],

          // COMPLETED SECTION (Collapsible)
          if (completed.isNotEmpty)
            Card(
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: BorderSide(color: Colors.grey.shade300),
              ),
              child: ExpansionTile(
                initiallyExpanded: false, // Collapsed by default
                shape: const Border(), // Remove borders when expanded
                leading: Icon(Icons.check_circle_outline, color: Colors.green.shade700),
                title: Text(
                  "Completed / Paid",
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.green.shade800,
                    fontSize: 16,
                  ),
                ),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.green.shade50,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        "${completed.length}",
                        style: TextStyle(color: Colors.green.shade700, fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Icon(Icons.expand_more),
                  ],
                ),
                children: completed.map((t) => Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 4.0),
                  child: _buildTransactionCard(t, type),
                )).toList(),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildTransactionCard(TransactionRecord t, TransactionType type) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: CustomCard(
        child: InkWell(
          onTap: () => _showTransactionDetails(t),
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header: Customer and Total Amount
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              CircleAvatar(
                                radius: 16,
                                backgroundColor: type == TransactionType.Sale ? Colors.green.shade100 : Colors.red.shade100,
                                child: Icon(
                                  type == TransactionType.Sale ? Icons.arrow_upward : Icons.arrow_downward,
                                  color: type == TransactionType.Sale ? Colors.green : Colors.red,
                                  size: 16,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      t.partyName,
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    const SizedBox(height: 2),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: Colors.blue.shade50,
                                        borderRadius: BorderRadius.circular(4),
                                        border: Border.all(color: Colors.blue.shade200, width: 0.5),
                                      ),
                                      child: Text(
                                        t.billNo,
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w600,
                                          color: Colors.blue.shade700,
                                          letterSpacing: 0.5,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          "Rs ${t.totalPayable.toStringAsFixed(2)}",
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 18,
                            color: type == TransactionType.Sale ? Colors.green : Colors.red,
                          ),
                        ),
                        if (t.discount > 0)
                          Text(
                            "Disc: Rs ${t.discount.toStringAsFixed(2)}",
                            style: TextStyle(color: Colors.grey.shade600, fontSize: 11),
                          ),
                        // Show paid and pending amounts for partial payments
                        if (t.paymentStatus.isPartial || t.paidAmount > 0) ...[
                          const SizedBox(height: 4),
                          Text(
                            "Paid: Rs ${t.paidAmount.toStringAsFixed(2)}",
                            style: TextStyle(color: Colors.green.shade700, fontSize: 11, fontWeight: FontWeight.w600),
                          ),
                          Text(
                            "Pending: Rs ${t.remainingAmount.toStringAsFixed(2)}",
                            style: TextStyle(color: Colors.orange.shade700, fontSize: 11, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                
                // Items Section (Bill Format)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header
                      Row(
                        children: [
                          Expanded(flex: 3, child: Text("Item Name", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey.shade700))),
                          Expanded(flex: 1, child: Text("Qty", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey.shade700), textAlign: TextAlign.right)),
                           Expanded(flex: 2, child: Text("Total", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey.shade700), textAlign: TextAlign.right)),
                        ],
                      ),
                      const Divider(),
                      // Items
                      ...t.items.map((item) {
                          final hasWeight = item.weight != null && item.weight! > 0;
                          return Padding(
                            padding: const EdgeInsets.symmetric(vertical: 4),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(flex: 3, child: Text(item.productName, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500))),
                                    Expanded(flex: 1, child: Text(item.quantity.toStringAsFixed(0), style: const TextStyle(fontSize: 12), textAlign: TextAlign.right)),
                                    Expanded(flex: 2, child: Text(item.totalPrice.toStringAsFixed(1), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600), textAlign: TextAlign.right)),
                                  ],
                                ),
                                if (hasWeight)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 2),
                                    child: Text(
                                      "Weight: ${item.weight!.toStringAsFixed(2)} Kg",
                                      style: TextStyle(fontSize: 11, color: Colors.grey.shade600, fontStyle: FontStyle.italic),
                                    ),
                                  ),
                              ],
                            ),
                          );
                      }),
                      const Divider(),
                      // Total
                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          const Text("Total:  ", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                          Text(
                            "Rs ${t.totalPayable.toStringAsFixed(2)}",
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.black87),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                
                // Status display removed (duplicate)

                
                // Payment History Section
                if (t.payments.isNotEmpty) ...[
                  const Text("Payment History:", style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey)),
                  const SizedBox(height: 4),
                  ...t.payments.map((p) => Padding(
                    padding: const EdgeInsets.only(bottom: 2),
                    child: Row(
                      children: [
                        Icon(Icons.payment, size: 12, color: Colors.green.shade700),
                        const SizedBox(width: 4),
                        Text(
                          "Rs ${p.amount.toStringAsFixed(2)}",
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.green.shade800),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          "on ${NepaliDateHelper.formatToNepali(p.date)}",
                          style: const TextStyle(fontSize: 11, color: Colors.grey),
                        ),
                      ],
                    ),
                  )),
                  const SizedBox(height: 12),
                ],


                // Footer: Date, Payment, Actions - Responsive Layout
                LayoutBuilder(
                  builder: (context, constraints) {
                    // Use vertical layout for very small screens
                    final bool useVerticalLayout = constraints.maxWidth < 400;
                    
                    if (useVerticalLayout) {
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Row 1: Status and Date
                          Row(
                            children: [
                              // Inline Status Update (Admin Only) or Static Badge
                              if (_currentUserRole == UserRole.admin)
                                _buildStatusDropdown(t)
                              else 
                                _buildStatusBadge(t),
                              
                              const Spacer(),
                              
                              // Date
                              Icon(Icons.calendar_today, size: 14, color: Colors.grey.shade600),
                              const SizedBox(width: 4),
                              Flexible(
                                child: Text(
                                  NepaliDateHelper.formatToNepali(t.date),
                                  style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                          
                          // Row 2: Edit/Delete Actions
                          if (_currentUserRole == UserRole.admin || _currentUserRole == UserRole.manager) ...[
                            const SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                if (_currentUserRole == UserRole.admin || 
                                    !t.paymentStatus.isPaid || 
                                    (t.date.year == DateTime.now().year && t.date.month == DateTime.now().month && t.date.day == DateTime.now().day)) 
                                  IconButton(
                                    icon: const Icon(Icons.edit, size: 20),
                                    onPressed: () => _showEditDialog(t),
                                    padding: EdgeInsets.zero,
                                    constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
                                  ),
                                if (_currentUserRole == UserRole.admin) ...[
                                  const SizedBox(width: 8),
                                  IconButton(
                                    icon: const Icon(Icons.delete, color: Colors.red, size: 20),
                                    onPressed: () => _showDeleteConfirmation(t.id),
                                    padding: EdgeInsets.zero,
                                    constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
                                  ),
                                ],
                              ],
                            ),
                          ],
                        ],
                      );
                    } else {
                      // Horizontal layout for larger screens
                      return Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          // Inline Status Update (Admin Only) or Static Badge
                          if (_currentUserRole == UserRole.admin)
                            Flexible(child: _buildStatusDropdown(t))
                          else 
                            _buildStatusBadge(t),

                          const Spacer(),
                          
                          // Date
                          Icon(Icons.calendar_today, size: 14, color: Colors.grey.shade600),
                          const SizedBox(width: 4),
                          Text(
                            NepaliDateHelper.formatToNepali(t.date),
                            style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                          ),
                          const SizedBox(width: 12),
                          
                          // Edit/Delete Actions
                          if (_currentUserRole == UserRole.admin || _currentUserRole == UserRole.manager)
                            if (_currentUserRole == UserRole.admin || 
                                !t.paymentStatus.isPaid || 
                                (t.date.year == DateTime.now().year && t.date.month == DateTime.now().month && t.date.day == DateTime.now().day)) 
                            IconButton(
                              icon: const Icon(Icons.edit, size: 20),
                              onPressed: () => _showEditDialog(t),
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
                            ),
                          if (_currentUserRole == UserRole.admin) ...[ 
                            const SizedBox(width: 8),
                            IconButton(
                              icon: const Icon(Icons.delete, color: Colors.red, size: 20),
                              onPressed: () => _showDeleteConfirmation(t.id),
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
                            ),
                          ],
                        ],
                      );
                    }
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStatusBadge(TransactionRecord t) {
     return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: t.paymentStatus.isPaid ? Colors.green.shade50 : (t.paymentStatus.isPending ? Colors.red.shade50 : Colors.orange.shade50),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(
          color: t.paymentStatus.isPaid ? Colors.green.shade200 : (t.paymentStatus.isPending ? Colors.red.shade200 : Colors.orange.shade200),
        ),
      ),
      child: Text(
        t.paymentStatus.displayName,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: t.paymentStatus.isPaid ? Colors.green.shade700 : (t.paymentStatus.isPending ? Colors.red.shade700 : Colors.orange.shade700),
        ),
      ),
    );
  }

  Widget _buildStatusDropdown(TransactionRecord t) {
    Color color = t.paymentStatus.isPaid ? Colors.green : (t.paymentStatus.isPending ? Colors.red : Colors.orange);
    
    return PopupMenuButton<PaymentStatus>(
      initialValue: t.paymentStatus,
      onSelected: (PaymentStatus newStatus) async {
        if (newStatus != t.paymentStatus) {
           if (newStatus.isPartial) {
             // Show Dialog for Partial Payment
             _showPartialPaymentDialog(t, newStatus);
           } else {
             // Auto-update (Fully Paid or Pending)
            try {
               TransactionRecord updated;
               
               if (newStatus.isPending) {
                 // Reset: Clear history
                 updated = t.copyWith(
                   paymentStatus: newStatus,
                   payments: [],
                   paidAmount: 0.0,
                 );
               } else {
                 // Paid completely: Add remaining amount as final payment
                 double remaining = t.remainingAmount;
                 final newPayments = List<PaymentRecord>.from(t.payments);
                 if (remaining > 0) {
                    newPayments.add(PaymentRecord(
                      amount: remaining,
                      date: DateTime.now(),
                      note: "Settlement",
                    ));
                 }
                 
                 updated = t.copyWith(
                   paymentStatus: newStatus,
                   payments: newPayments,
                 );
               }
               
               await _salesService.updatePaymentInfo(updated);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text("Status updated to ${newStatus.displayName}")),
                );
             } catch(e) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text("Error updating status: $e"), backgroundColor: Colors.red),
                );
             }
           }
        }
      },
      child: Container(
         padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
         decoration: BoxDecoration(
           color: color.withOpacity(0.1),
           borderRadius: BorderRadius.circular(6),
           border: Border.all(color: color.withOpacity(0.5)),
         ),
         child: Row(
           mainAxisSize: MainAxisSize.min,
           children: [
             Text(
               t.paymentStatus.displayName,
               style: TextStyle(
                 fontSize: 12,
                 fontWeight: FontWeight.bold,
                 color: color,
               ),
             ),
             const SizedBox(width: 4),
             Icon(Icons.arrow_drop_down, size: 16, color: color),
           ],
         ),
      ),
      itemBuilder: (BuildContext context) => <PopupMenuEntry<PaymentStatus>>[
        const PopupMenuItem<PaymentStatus>(
          value: PaymentStatus.Pending,
          child: Text('Pending'),
        ),
        const PopupMenuItem<PaymentStatus>(
          value: PaymentStatus.PartialCash,
          child: Text('Partially Paid - Cash'),
        ),
        const PopupMenuItem<PaymentStatus>(
           value: PaymentStatus.PartialOnline,
           child: Text('Partially Paid - Online'),
        ),
        const PopupMenuDivider(),
        const PopupMenuItem<PaymentStatus>(
          value: PaymentStatus.PaidCash,
          child: Text('Paid - Cash'),
        ),
        const PopupMenuItem<PaymentStatus>(
          value: PaymentStatus.PaidOnline,
          child: Text('Paid - Online'),
        ),
      ],
    );
  }

  void _showPartialPaymentDialog(TransactionRecord t, PaymentStatus newStatus) {
    // Default to remaining amount? Or empty?
    // User probably wants to enter a new partial amount, not the total paid so far.
    final TextEditingController amountController = TextEditingController(); 
    
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text("Add Partial Payment (${newStatus == PaymentStatus.PartialCash ? 'Cash' : 'Online'})"),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text("Total Payable: Rs ${t.totalPayable.toStringAsFixed(2)}"),
              Text("Already Paid: Rs ${t.paidAmount.toStringAsFixed(2)}"),
              Text("Remaining: Rs ${t.remainingAmount.toStringAsFixed(2)}", style: const TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              TextField(
                controller: amountController,
                keyboardType: TextInputType.number,
                autofocus: true,
                decoration: const InputDecoration(
                  labelText: "Amount Paying Now",
                  prefixText: "Rs ",
                  border: OutlineInputBorder(),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text("Cancel"),
            ),
            ElevatedButton(
              onPressed: () async {
                final amount = double.tryParse(amountController.text) ?? 0.0;
                if (amount <= 0 || amount > t.remainingAmount + 1.0) { // Allow small epsilon overflow? Strict for now.
                   ScaffoldMessenger.of(context).showSnackBar(
                     const SnackBar(content: Text("Invalid amount (must be > 0 and <= remaining)")),
                   );
                   return;
                }
                
                try {
                   final newPayment = PaymentRecord(
                    amount: amount,
                    date: DateTime.now(),
                    note: "Partial Payment",
                   );
                   
                   // Add to existing payments
                   final updatedPayments = List<PaymentRecord>.from(t.payments)..add(newPayment);
                   
                   // Check if fully paid now
                   final newTotalPaid = t.paidAmount + amount;
                   PaymentStatus finalStatus = newStatus;
                   if (newTotalPaid >= t.totalPayable - 0.1) {
                     finalStatus = (newStatus == PaymentStatus.PartialCash) ? PaymentStatus.PaidCash : PaymentStatus.PaidOnline;
                   }
                   
                   final updated = t.copyWith(
                     paymentStatus: finalStatus,
                     payments: updatedPayments,
                   );
                   
                   await _salesService.updatePaymentInfo(updated);
                   if (context.mounted) {
                      Navigator.pop(context);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text("Payment added. New Status: ${finalStatus.displayName}")),
                      );
                   }
                } catch (e) {
                   if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text("Error: $e"), backgroundColor: Colors.red),
                      );
                   }
                }
              },
              child: const Text("Add Payment"),
            ),
          ],
        );
      },
    );
  }

  void _showDeleteConfirmation(String id) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Delete Transaction"),
        content: const Text("Are you sure you want to delete this transaction?"),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("Cancel"),
          ),
          ElevatedButton(
            onPressed: () {
              _deleteTransaction(id);
              Navigator.pop(context);
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text("Delete"),
          ),
        ],
      ),
    );
  }

  void _showTransactionDetails(TransactionRecord transaction) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        child: Container(
          width: 600,
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    transaction.type == TransactionType.Sale ? "Sale Details" : "Purchase Details",
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
              if (transaction.type == TransactionType.Sale)
                Padding(
                  padding: const EdgeInsets.only(bottom: 16.0),
                  child: SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () => _showSharePreview(transaction),
                      icon: const Icon(Icons.share, color: Colors.white),
                      label: const Text("Share Bill / Invoice", style: TextStyle(color: Colors.white)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                ),
              const Divider(height: 24),
              _DetailRow(label: "Bill No", value: transaction.billNo, isBold: true),
              _DetailRow(label: "Date", value: NepaliDateHelper.formatToNepali(transaction.date)),
              _DetailRow(label: transaction.type == TransactionType.Sale ? "Customer" : "Vendor", value: transaction.partyName),
              _DetailRow(label: "Payment Status", value: transaction.paymentStatus.displayName),
              _DetailRow(label: transaction.type == TransactionType.Sale ? "Sold By" : "Purchased By", value: transaction.soldBy),
              _DetailRow(label: "Entered By", value: transaction.enteredBy),
              const SizedBox(height: 16),
              Text(
                "Items",
                style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              ...transaction.items.map((item) {
                final hasWeight = item.weight != null && item.weight! > 0;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8.0),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text("${item.productName} (${item.quantity.toStringAsFixed(0)} ${item.unit.displayName})"),
                            if (hasWeight)
                              Text(
                                "Weight: ${item.weight!.toStringAsFixed(2)} Kg",
                                style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                              ),
                          ],
                        ),
                      ),
                      Text(
                        "Rs ${item.totalPrice.toStringAsFixed(2)}",
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                );
              }),
              const Divider(height: 24),
              _DetailRow(label: "Total Price", value: "Rs ${transaction.totalPrice.toStringAsFixed(2)}"),
              if (transaction.discount > 0)
                _DetailRow(label: "Discount", value: "Rs ${transaction.discount.toStringAsFixed(2)}"),
              _DetailRow(
                label: "Total Payable",
                value: "Rs ${transaction.totalPayable.toStringAsFixed(2)}",
                isBold: true,
              ),
              // Show paid and pending amounts for all transactions
              if (transaction.paidAmount > 0 || transaction.paymentStatus.isPartial) ...[
                const SizedBox(height: 8),
                _DetailRow(
                  label: "Paid Amount",
                  value: "Rs ${transaction.paidAmount.toStringAsFixed(2)}",
                  isBold: true,
                  valueColor: Colors.green.shade700,
                ),
                _DetailRow(
                  label: "Pending Amount", 
                  value: "Rs ${transaction.remainingAmount.toStringAsFixed(2)}",
                  isBold: true,
                  valueColor: Colors.orange.shade700,
                ),
              ],
              if (transaction.payments.isNotEmpty) ...[
                const Divider(height: 24),
                Text(
                  "Payment History",
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                ...transaction.payments.map((p) => Padding(
                  padding: const EdgeInsets.only(bottom: 8.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        NepaliDateHelper.formatToNepali(p.date),
                        style: TextStyle(color: Colors.grey.shade700),
                      ),
                      Text(
                        "Rs ${p.amount.toStringAsFixed(2)}",
                        style: const TextStyle(fontWeight: FontWeight.w500),
                      ),
                    ],
                  ),
                )),
              ],
            ],
          ),
        ),
      ),
    );
  }


  void _showSharePreview(TransactionRecord transaction) {
    showDialog(
      context: context,
      builder: (context) => _BillSharePreviewDialog(transaction: transaction),
    );
  }
}

class _BillSharePreviewDialog extends StatefulWidget {
  final TransactionRecord transaction;
  const _BillSharePreviewDialog({required this.transaction});

  @override
  State<_BillSharePreviewDialog> createState() => _BillSharePreviewDialogState();
}

class _BillSharePreviewDialogState extends State<_BillSharePreviewDialog> {
  final GlobalKey _globalKey = GlobalKey();
  bool _isSharing = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    precacheImage(const AssetImage('assets/images/logo.jpg'), context);
  }

  Future<void> _share() async {
    setState(() => _isSharing = true);
    try {
      // 1. Capture the image
      final boundary = _globalKey.currentContext?.findRenderObject() as RenderRepaintBoundary?;
      if (boundary == null) {
        throw Exception("Could not find boundary to repaint");
      }

      // High pixel ratio for quality
      final image = await boundary.toImage(pixelRatio: 3.0);
      final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
      final pngBytes = byteData!.buffer.asUint8List();

      final fileName = 'Invoice_${widget.transaction.billNo}.png';

      // 2. Create XFile directly from data (Works on Web & Mobile)
      final xFile = XFile.fromData(
        pngBytes,
        mimeType: 'image/png',
        name: fileName,
      );

      // 3. Share
      await Share.shareXFiles([xFile], text: 'Invoice for ${widget.transaction.partyName}');
      
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Error sharing: $e"), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isSharing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.all(16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.close, color: Colors.white, size: 30),
              )
            ],
          ),
          Flexible(
            child: SingleChildScrollView(
              child: RepaintBoundary(
                key: _globalKey,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: BillReceiptWidget(transaction: widget.transaction),
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: _isSharing ? null : _share,
            icon: _isSharing 
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) 
                : const Icon(Icons.share, color: Colors.white),
            label: Text(_isSharing ? "Preparing..." : "Share via WhatsApp", style: const TextStyle(color: Colors.white, fontSize: 16)),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green.shade700,
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
            ),
          ),
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isBold;
  final Color? valueColor;

  const _DetailRow({
    required this.label,
    required this.value,
    this.isBold = false,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              color: Colors.grey.shade700,
              fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontWeight: isBold ? FontWeight.bold : FontWeight.w500,
              fontSize: isBold ? 16 : 14,
              color: valueColor,
            ),
          ),
        ],
      ),
    );
  }
}

// Separate dialog screen for adding/editing sales
class _AddSalesDialog extends StatefulWidget {
  final TransactionType type;
  final TransactionRecord? existingTransaction;
  final Function(TransactionRecord) onSave;
  final String currentUserName;
  final ProductService productService;
  final CustomerService customerService;

  const _AddSalesDialog({
    required this.type,
    this.existingTransaction,
    required this.onSave,
    required this.currentUserName,
    required this.productService,
    required this.customerService,
  });

  @override
  State<_AddSalesDialog> createState() => _AddSalesDialogState();
}

class _AddSalesDialogState extends State<_AddSalesDialog> {
  late DateTime _selectedDate;
  late BusinessType _selectedBusinessType;
  Product? _selectedProduct;
  final _quantityController = TextEditingController();
  final _weightController = TextEditingController();
  final _priceController = TextEditingController();
  final _unitController = TextEditingController(); // Added
  final _displayPriceController = TextEditingController(); // Added for read-only display
  final _itemNameController = TextEditingController();
  final _itemDescriptionController = TextEditingController();
  final _discountController = TextEditingController(); // ... existing
  final _paidAmountController = TextEditingController();
  Customer? _selectedCustomer;
  late PaymentStatus _selectedPaymentStatus;
  UserModel? _selectedSoldBy; // Selected user who sold/purchased
  List<UserModel> _availableUserList = []; // Cache for dropdown
  OrderStatus _selectedOrderStatus = OrderStatus.delivered; // Default to Delivered for new sales
  
  final List<SalesItem> _items = [];
  final _authService = AuthService();
  final _formStateService = FormStateService();
  
  String get _formKey => widget.type == TransactionType.Sale 
      ? 'sales_form_${widget.currentUserName}'
      : 'purchase_form_${widget.currentUserName}';
  
  @override
  void initState() {
    super.initState();
    _selectedDate = DateTime.now();
    _selectedBusinessType = BusinessType.livestocks;
    _selectedPaymentStatus = PaymentStatus.Pending;
    
    // Default to current user
    
    // Default to current user
    _selectedSoldBy = _authService.currentUser;
    _loadUsers();

    if (widget.existingTransaction != null) {
      _selectedDate = widget.existingTransaction!.date;
      _selectedPaymentStatus = widget.existingTransaction!.paymentStatus;
      _discountController.text = widget.existingTransaction!.discount.toString();
      _paidAmountController.text = widget.existingTransaction!.paidAmount.toString();
      _items.addAll(widget.existingTransaction!.items);
      
      // Set business type from first item if available
      if (widget.existingTransaction!.items.isNotEmpty) {
        _selectedBusinessType = widget.existingTransaction!.items.first.businessType;
      }
      
      // Load customer/vendor by name from the service
      final partyName = widget.existingTransaction!.partyName;
      _selectedCustomer = widget.customerService.getCustomerByName(partyName);

      // Restore Order Status
      _selectedOrderStatus = widget.existingTransaction!.status;
    } else {
      // Load saved state if not editing
      _loadSavedState();
    }
  }

  Future<void> _loadSavedState() async {
    final savedState = await _formStateService.loadFormState(_formKey);
    if (savedState != null && mounted) {
      setState(() {
        // Restore date - REMOVED to ensure default is always Today
        // if (savedState['selectedDate'] != null) {
        //   _selectedDate = DateTime.parse(savedState['selectedDate']);
        // }
        
        // Restore business type
        if (savedState['businessType'] != null) {
          _selectedBusinessType = BusinessType.values[savedState['businessType']];
        }
        
        // Restore payment status
        if (savedState['paymentStatus'] != null) {
          _selectedPaymentStatus = PaymentStatus.values[savedState['paymentStatus']];
        }
        
        // Restore discount
        if (savedState['discount'] != null) {
          _discountController.text = savedState['discount'];
        }
        
        // Restore paid amount
        if (savedState['paidAmount'] != null) {
          _paidAmountController.text = savedState['paidAmount'];
        }
        
        // Restore customer ID and load customer
        if (savedState['customerId'] != null) {
          try {
            _selectedCustomer = widget.customerService.getCustomerById(savedState['customerId']);
          } catch (e) {
            print('Could not restore customer: $e');
          }
        }
        
        // Restore items
        if (savedState['items'] != null) {
          _items.clear();
          final itemsList = savedState['items'] as List;
          for (var itemData in itemsList) {
            try {
              _items.add(SalesItem.fromMap(itemData));
            } catch (e) {
              print('Could not restore item: $e');
            }
          }
        }
      });
    }
  }

  Future<void> _saveState() async {
    final stateData = {
      'selectedDate': _selectedDate.toIso8601String(),
      'businessType': _selectedBusinessType.index,
      'paymentStatus': _selectedPaymentStatus.index,
      'discount': _discountController.text,
      'paidAmount': _paidAmountController.text,
      'customerId': _selectedCustomer?.id,
      'items': _items.map((item) => item.toMap()).toList(),
    };
    await _formStateService.saveFormState(_formKey, stateData);
  }

  Future<void> _loadUsers() async {
    final users = await _authService.getUsers();
    if (mounted) {
      setState(() {
        _availableUserList = users;
        // If editing, try to match the soldBy user
        if (widget.existingTransaction != null) {
          final soldByName = widget.existingTransaction!.soldBy;
          try {
             _selectedSoldBy = users.firstWhere((u) => u.name == soldByName);
          } catch (e) {
             // If not found in list, keep default or null
          }
        }
      });
    }
  }

  @override
  void dispose() {
    _quantityController.dispose();
    _weightController.dispose();
    _priceController.dispose();
    _unitController.dispose();
    _displayPriceController.dispose();
    _itemNameController.dispose();
    _itemDescriptionController.dispose();
    _discountController.dispose();
    _paidAmountController.dispose();
    super.dispose();
  }



  // Helper to determine if fields are mandatory
  bool get _isQtyRequired {
    // Quality is now mandatory for ALL items as per user request
    return true; 
  }

  bool get _isWeightRequired {
    if (_selectedProduct == null) return false;
    // Weight is required if Stock OR Price IS Kg
    return _selectedProduct!.unit == StockUnit.kg || _selectedProduct!.priceUnit == StockUnit.kg;
  }

  void _updateCalculatedPrice() {
     if (widget.type != TransactionType.Sale) return;
     if (_selectedProduct == null) {
       _displayPriceController.text = "Auto-calculated";
       return;
     }
     
     final qty = double.tryParse(_quantityController.text) ?? 0;
     final weight = double.tryParse(_weightController.text) ?? 0;
     final pricePerUnit = _selectedProduct!.currentPrice;
     
     double total = 0;
     
     // Calculate based on Price Unit
     if (_selectedProduct!.priceUnit == StockUnit.kg) {
       // Price is per Kg, so use Weight
       total = weight * pricePerUnit;
     } else {
       // Price is per Count (Pcs, Plate, Carat), so use Quantity
       total = qty * pricePerUnit;
     }
     _displayPriceController.text = "Rs ${total.toStringAsFixed(2)}";
  }

  // Helper to parse quantity string (e.g. "50 kg" -> 50.0, StockUnit.kg)
  (double, StockUnit) _parseQuantity(String input) {
    if (input.isEmpty) return (0.0, StockUnit.pcs);
    
    // Extract number
    final numberRegExp = RegExp(r"([0-9]+(\.[0-9]+)?)");
    final match = numberRegExp.firstMatch(input);
    final quantity = match != null ? double.tryParse(match.group(0)!) ?? 0.0 : 0.0;
    
    // Extract unit text (default to pcs if not found)
    String textState = input.toLowerCase();
    StockUnit unit = StockUnit.pcs;
    
    if (textState.contains('kg')) unit = StockUnit.kg;
    else if (textState.contains('carat')) unit = StockUnit.carat;
    else if (textState.contains('plate')) unit = StockUnit.plate;
    else if (textState.contains('pc') || textState.contains('piece')) unit = StockUnit.pcs;
    
    return (quantity, unit);
  }

  void _addItem() {
    if (widget.type == TransactionType.Sale) {
      if (_selectedProduct != null) {
        final quantity = double.tryParse(_quantityController.text) ?? 0;
        final weight = double.tryParse(_weightController.text) ?? 0;
        
        // Validation
        if (_isQtyRequired && quantity <= 0) {
           ScaffoldMessenger.of(context).showSnackBar(
             const SnackBar(content: Text("Quantity is required for this item")),
           );
           return;
        }
        
        if (_isWeightRequired && weight <= 0) {
           ScaffoldMessenger.of(context).showSnackBar(
             const SnackBar(content: Text("Weight (Kg) is required for this item")),
           );
           return;
        }

        setState(() {
            _items.add(SalesItem(
              productId: _selectedProduct!.id,
              productName: _selectedProduct!.name,
              businessType: _selectedBusinessType,
              quantity: quantity,
              weight: weight,
              unit: _selectedProduct!.unit,
              priceUnit: _selectedProduct!.priceUnit,
              pricePerUnit: _selectedProduct!.currentPrice,
            ));
            
            // Reset fields
            _selectedProduct = null;
            _quantityController.clear();
            _weightController.clear();
            _unitController.clear();
            _displayPriceController.text = "Auto-calculated";
            _weightController.clear();
          
          // Save state after adding item
          _saveState();
        });
      }
    } else {
      // Purchase logic
      // Price is Total Price. Quantity can be "50 kg"
      if (_itemNameController.text.isNotEmpty && 
          _quantityController.text.isNotEmpty && 
          _priceController.text.isNotEmpty) {
        
        final (quantity, unit) = _parseQuantity(_quantityController.text);
        final totalPrice = double.tryParse(_priceController.text) ?? 0;
        
        setState(() {
          _items.add(SalesItem(
            productId: DateTime.now().millisecondsSinceEpoch.toString(), // Temp ID
            productName: _itemNameController.text,
            businessType: _selectedBusinessType,
            quantity: quantity,
            weight: 0, // Not tracking detailed weight for generic purchase yet
            unit: unit,
            priceUnit: unit,
            pricePerUnit: (quantity > 0) ? (totalPrice / quantity) : 0, // Infer rate
            description: _itemDescriptionController.text,
          ));
          
          _itemNameController.clear();
        _quantityController.clear();
        _priceController.clear();
        _itemDescriptionController.clear();
        
        // Save state after adding item
        _saveState();
      });
      }
    }
  }

  void _editItem(int index, SalesItem item) {
    // Pre-populate controllers with existing item data
    if (widget.type == TransactionType.Sale) {
      _selectedProduct = widget.productService.getProductById(item.productId);
      _quantityController.text = item.quantity.toString();
      _weightController.text = (item.weight ?? 0).toString();
      _selectedBusinessType = item.businessType;
      _updateCalculatedPrice();
    } else {
      _itemNameController.text = item.productName;
      _quantityController.text = "${item.quantity} ${item.unit.displayName}";
      _priceController.text = item.totalPrice.toString();
      _itemDescriptionController.text = item.description ?? "";
      _selectedBusinessType = item.businessType;
    }

    // Show dialog to confirm edit
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Edit Item"),
        content: const Text("Item loaded into form. Make your changes and click 'Update Item' to save."),
        actions: [
          TextButton(
            onPressed: () {
              // Remove the old item from the list
              setState(() => _items.removeAt(index));
              Navigator.pop(context);
            },
            child: const Text("Update Item"),
          ),
          TextButton(
            onPressed: () {
              // Cancel - clear the form
              if (widget.type == TransactionType.Sale) {
                _selectedProduct = null;
                _quantityController.clear();
                _weightController.clear();
                _displayPriceController.text = "Auto-calculated";
              } else {
                _itemNameController.clear();
                _quantityController.clear();
                _priceController.clear();
                _itemDescriptionController.clear();
              }
              Navigator.pop(context);
            },
            child: const Text("Cancel"),
          ),
        ],
      ),
    );
  }

  Future<void> _save() async {
    if (_items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please add at least one item")),
      );
      return;
    }
    
    if (_selectedCustomer == null) {
       ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Please select a ${widget.type == TransactionType.Sale ? 'customer' : 'vendor'}")),
      );
      return;
    }

    final discount = double.tryParse(_discountController.text) ?? 0;
    
    final t = TransactionRecord(
      id: widget.existingTransaction?.id ?? DateTime.now().millisecondsSinceEpoch.toString(),
      type: widget.type,
      items: _items,
      customerId: _selectedCustomer?.id, // Store customer ID for reference
      partyName: _selectedCustomer?.name ?? "Unknown", // Handle null for Purchase if we allow manual entry later
      date: _selectedDate,
      discount: discount,
      soldBy: _selectedSoldBy?.name ?? widget.currentUserName,
      enteredBy: widget.currentUserName,
      entryTimestamp: DateTime.now(),
      paymentStatus: _selectedPaymentStatus,
      paidAmount: double.tryParse(_paidAmountController.text) ?? 0.0,
      status: widget.type == TransactionType.Sale ? _selectedOrderStatus : OrderStatus.delivered, // Default to delivered for Purchases for now
    );

    widget.onSave(t);
  
  // Clear saved state after successful save
  await _formStateService.clearFormState(_formKey);
  
  if (mounted) {
    Navigator.pop(context);
  }
}
  
  // Calculate total payable
  double get _totalPayable {
    double total = _items.fold(0, (sum, item) => sum + item.totalPrice);
    double discount = double.tryParse(_discountController.text) ?? 0;
    return total - discount;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.type == TransactionType.Sale ? "New Sale" : "New Purchase"),
        actions: [
          TextButton(
            onPressed: _save,
            child: const Text("SAVE", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          )
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Date Picker
            InkWell(
              onTap: () async {
                final d = await NepaliDateHelper.pickNepaliDate(
                  context,
                  initialDate: _selectedDate,
                  firstDate: DateTime(2020),
                  lastDate: DateTime.now(),
                );
                if (d != null) setState(() => _selectedDate = d);
              },
              child: InputDecorator(
                decoration: const InputDecoration(
                  labelText: "Date",
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.calendar_today),
                ),
                child: Text(NepaliDateHelper.formatToNepali(_selectedDate)),
              ),
            ),
            const SizedBox(height: 16),

            // Business Type (Only for Sales - to filter product list)
            if (widget.type == TransactionType.Sale)
              DropdownButtonFormField<BusinessType>(
                value: _selectedBusinessType,
                decoration: const InputDecoration(labelText: "Business Type", border: OutlineInputBorder()),
                items: BusinessType.values.map((e) => DropdownMenuItem(value: e, child: Text(e.name))).toList(),
                onChanged: (v) {
                  setState(() {
                    _selectedBusinessType = v!;
                    // Filter products logic will happen in the Product dropdown builder
                    _selectedProduct = null; 
                  });
                },
              ),
              if (widget.type == TransactionType.Sale)
                const SizedBox(height: 16),

              // Order Status Dropdown (Only for Sales)
              if (widget.type == TransactionType.Sale)
                DropdownButtonFormField<OrderStatus>(
                  value: _selectedOrderStatus,
                  decoration: const InputDecoration(labelText: "Order Status", border: OutlineInputBorder()),
                  items: OrderStatus.values.map((e) => DropdownMenuItem(value: e, child: Text(e.displayName))).toList(),
                  onChanged: (v) {
                     if (v != null) setState(() => _selectedOrderStatus = v);
                  },
                ),
            if (widget.type == TransactionType.Sale)
              const SizedBox(height: 24),
            
            const Divider(),
            Text("Items", style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 16),
            
            // Add Item Form
            Card(
              color: Colors.grey.shade50,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    if (widget.type == TransactionType.Sale) ...[
                      // Product Dropdown - Listen to both stock and product streams
                      // Product Dropdown - Listen to product stream (stock is now in product)
                      StreamBuilder<List<Product>>(
                        stream: widget.productService.getProductsStream(),
                        builder: (context, productSnapshot) {
                          if (!productSnapshot.hasData) {
                            return const Padding(
                              padding: EdgeInsets.all(20.0),
                              child: Center(
                                child: SizedBox(
                                  width: 24,
                                  height: 24,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                ),
                              ),
                            );
                          }
                          
                          // DEBUG LOGGING
                          print("DEBUG: SalesScreen Stream received data. Total products: ${productSnapshot.data!.length}");
                          
                          final products = productSnapshot.data!
                              .where((p) => p.businessType == _selectedBusinessType)
                              .toList();

                          print("DEBUG: Filtered products for ${_selectedBusinessType.name}: ${products.length}");
                          if (products.isNotEmpty) {
                             print("DEBUG: First product: ${products.first.name}, Stock: ${products.first.currentStock}");
                          }

                          // Ensure selected product is in the list, otherwise reset
                          Product? dropdownValue = _selectedProduct;
                          // If selected product exists in new list (by ID), update referencing object
                          // This handles real-time updates to the selected product's stock/price
                          if (dropdownValue != null) {
                             try {
                               dropdownValue = products.firstWhere((p) => p.id == dropdownValue!.id);
                               // Update local state references if needed, but setState handles via onChanged usually.
                               // However, here we just want the dropdown to show the current object state.
                             } catch (e) {
                               // Product might have been deleted or changed type?
                               dropdownValue = null;
                             }
                          }

                          return DropdownButtonFormField<Product>(
                            value: dropdownValue,
                            isExpanded: true, 
                            decoration: const InputDecoration(
                              labelText: "Product Name",
                              border: OutlineInputBorder(),
                            ),
                            items: products.map((p) {
                              final currentStock = p.currentStock;
                              
                              // Calculate quantity already added to this transaction
                              final alreadyAdded = _items
                                  .where((item) => item.productName == p.name)
                                  .fold<double>(0, (sum, item) => sum + item.quantity);
                              
                              // Available stock = current stock - already added
                              final availableStock = currentStock - alreadyAdded;
                              
                              final stockValue = availableStock.truncateToDouble() == availableStock 
                                  ? availableStock.toInt() 
                                  : availableStock;
                              
                              final stockText = availableStock > 0 
                                  ? " (Stock: $stockValue ${p.unit.displayName})"
                                  : " (Out of Stock)";
                              
                              return DropdownMenuItem(
                                value: p,
                                child: RichText(
                                  text: TextSpan(
                                    style: const TextStyle(color: Colors.black87, fontSize: 16),
                                    children: [
                                      TextSpan(text: "${p.name}$stockText - Rs ${p.currentPrice}/${p.priceUnit.displayName}"),
                                      TextSpan(
                                        text: availableStock <= 0 ? " !" : "",
                                        style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            }).toList(),
                            onChanged: (product) {
                              setState(() {
                                _selectedProduct = product;
                                if (product != null) {
                                   _unitController.text = product.unit.displayName;
                                   _updateCalculatedPrice();
                                } else {
                                   _unitController.clear();
                                   _displayPriceController.text = "Auto-calculated";
                                }
                              });
                            },
                          );
                        }
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _quantityController,
                              decoration: InputDecoration(
                                labelText: _isQtyRequired ? "Quantity *" : "Quantity (Optional)",
                                border: const OutlineInputBorder(),
                                // Visual cue if optional
                                filled: !_isQtyRequired,
                                fillColor: !_isQtyRequired ? Colors.grey.shade50 : null,
                              ),
                              keyboardType: TextInputType.number,
                              onChanged: (_) => _updateCalculatedPrice(),
                            ),
                          ),
                          if (_isWeightRequired) ...[
                            const SizedBox(width: 8),
                            Expanded(
                              child: TextField(
                                controller: _weightController,
                                decoration: const InputDecoration(
                                  labelText: "Weight (Kg) *", 
                                  border: OutlineInputBorder(),
                                ),
                                keyboardType: TextInputType.number,
                                onChanged: (_) => _updateCalculatedPrice(),
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _displayPriceController,
                        decoration: const InputDecoration(labelText: "Total Item Price", border: OutlineInputBorder(), filled: true, fillColor: Colors.white),
                        readOnly: true,
                      ),
                    ] else ...[
                      // Purchase Input
                      TextField(
                        controller: _itemNameController,
                        decoration: const InputDecoration(labelText: "Item Name / Description", border: OutlineInputBorder()),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _quantityController,
                              decoration: const InputDecoration(labelText: "Quantity (e.g. 50 kg)", border: OutlineInputBorder()),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: TextField(
                              controller: _priceController,
                              decoration: const InputDecoration(labelText: "Total Cost (Rs)", border: OutlineInputBorder()),
                              keyboardType: TextInputType.number,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _itemDescriptionController,
                        decoration: const InputDecoration(labelText: "Remarks / Details", border: OutlineInputBorder()),
                        maxLines: 2,
                      ),
                    ],
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: _addItem,
                      icon: const Icon(Icons.add),
                      label: const Text("Add Item"),
                    ),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Item List
            if (_items.isNotEmpty) ...[
              Container(
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey.shade300),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  children: [
                    ..._items.asMap().entries.map((entry) {
                      final i = entry.key;
                      final item = entry.value;
                      return ListTile(
                        title: Text(item.productName),
                        subtitle: Text(
                          item.weight != null && item.weight! > 0
                              ? "Qty: ${item.quantity.toStringAsFixed(0)} ${item.unit.displayName} • Weight: ${item.weight!.toStringAsFixed(2)} Kg • Rs ${item.totalPrice.toStringAsFixed(2)}"
                              : "${item.quantity.toStringAsFixed(0)} ${item.unit.displayName} • Rs ${item.totalPrice.toStringAsFixed(2)}"
                        ),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: const Icon(Icons.edit, color: Colors.blue),
                              onPressed: () => _editItem(i, item),
                              tooltip: "Edit Item",
                            ),
                            IconButton(
                              icon: const Icon(Icons.delete, color: Colors.red),
                              onPressed: () => setState(() => _items.removeAt(i)),
                              tooltip: "Delete Item",
                            ),
                          ],
                        ),
                      );
                    }),
                    const Divider(),
                    Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text("Subtotal:", style: TextStyle(fontWeight: FontWeight.bold)),
                          Text("Rs ${_items.fold<double>(0, (sum, item) => sum + item.totalPrice).toStringAsFixed(2)}", style: const TextStyle(fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 24),
            const Divider(),
            
            // Customer / Vendor Selection
            StreamBuilder<List<Customer>>(
              stream: widget.customerService.getCustomersStream(),
              builder: (context, snapshot) {
                // Filter customers/vendors based on transaction type
                final allCustomers = snapshot.data ?? [];
                final filteredList = widget.type == TransactionType.Sale
                    ? allCustomers.where((c) => c.type == "Customer").toList()
                    : allCustomers.where((c) => c.type == "Vendor").toList();
                
                return Row(
                  children: [
                    Expanded(
                      child: LayoutBuilder(
                        builder: (context, constraints) {
                          return Autocomplete<Customer>(
                            initialValue: TextEditingValue(text: _selectedCustomer?.name ?? ''),
                            optionsBuilder: (TextEditingValue textEditingValue) {
                              if (textEditingValue.text == '') {
                                return const Iterable<Customer>.empty();
                              }
                              return filteredList.where((Customer option) {
                                return option.name.toLowerCase().contains(textEditingValue.text.toLowerCase());
                              });
                            },
                            displayStringForOption: (Customer option) => option.name,
                            onSelected: (Customer selection) {
                              setState(() {
                                _selectedCustomer = selection;
                              });
                            },
                            fieldViewBuilder: (context, textEditingController, focusNode, onFieldSubmitted) {
                              // If there is a selected customer but the text is empty (e.g. initial load), set the text
                              if (_selectedCustomer != null && textEditingController.text.isEmpty) {
                                 textEditingController.text = _selectedCustomer!.name;
                              }
                              // Clear selection if text is cleared
                              if (textEditingController.text.isEmpty && _selectedCustomer != null) {
                                // Defer state update to avoid build conflicts or handle logically
                                // For now, we rely on onSelected. 
                              }
                              
                              return TextField(
                                controller: textEditingController,
                                focusNode: focusNode,
                                decoration: InputDecoration(
                                  labelText: widget.type == TransactionType.Sale ? "Customer Name" : "Vendor Name",
                                  border: const OutlineInputBorder(),
                                  prefixIcon: const Icon(Icons.person),
                                  suffixIcon: snapshot.connectionState == ConnectionState.waiting
                                      ? const Padding(
                                          padding: EdgeInsets.all(12.0),
                                          child: SizedBox(
                                            width: 16,
                                            height: 16,
                                            child: CircularProgressIndicator(strokeWidth: 2),
                                          ),
                                        )
                                      : null,
                                  hintText: "Type to search...",
                                ),
                              );
                            },
                            optionsViewBuilder: (context, onSelected, options) {
                              return Align(
                                alignment: Alignment.topLeft,
                                child: Material(
                                  elevation: 4.0,
                                  child: ConstrainedBox(
                                    constraints: BoxConstraints(maxHeight: 200, maxWidth: constraints.maxWidth),
                                    child: ListView.builder(
                                      padding: EdgeInsets.zero,
                                      shrinkWrap: true,
                                      itemCount: options.length,
                                      itemBuilder: (BuildContext context, int index) {
                                        final Customer option = options.elementAt(index);
                                        return InkWell(
                                          onTap: () {
                                            onSelected(option);
                                          },
                                          child: Container(
                                            padding: const EdgeInsets.all(16.0),
                                            child: Text(option.name),
                                          ),
                                        );
                                      },
                                    ),
                                  ),
                                ),
                              );
                            },
                          );
                        }
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton(
                      onPressed: _showAddCustomerDialog,
                      icon: const Icon(Icons.add_circle),
                      tooltip: "Add New",
                      iconSize: 32,
                      color: Theme.of(context).primaryColor,
                    ),
                  ],
                );
              },
            ),

            const SizedBox(height: 16),
            
            // Sold By / Purchased By User Selection
            DropdownButtonFormField<String>(
              value: _selectedSoldBy?.id,
              decoration: InputDecoration(
                labelText: widget.type == TransactionType.Sale ? "Sold By" : "Purchased By",
                border: const OutlineInputBorder(),
                prefixIcon: const Icon(Icons.person_outline),
              ),
              items: _availableUserList
                  .map((user) => DropdownMenuItem(
                        value: user.id,
                        child: Text("${user.name} (${user.role.displayName})"),
                      ))
                  .toList(),
              onChanged: (userId) {
                if (userId != null) {
                  final user = _availableUserList.firstWhere((u) => u.id == userId);
                  setState(() => _selectedSoldBy = user);
                }
              },
              hint: Text("Select ${widget.type == TransactionType.Sale ? 'seller' : 'purchaser'}"),
            ),

            const SizedBox(height: 16),
            
            // Payment Details
            DropdownButtonFormField<PaymentStatus>(
              value: _selectedPaymentStatus,
              decoration: const InputDecoration(labelText: "Payment Status", border: OutlineInputBorder()),
              items: PaymentStatus.values.map((e) => DropdownMenuItem(value: e, child: Text(e.displayName))).toList(),
              onChanged: (v) => setState(() => _selectedPaymentStatus = v!),
            ),
            const SizedBox(height: 16),
            
            if (_selectedPaymentStatus.isPartial) ...[
              TextField(
                controller: _paidAmountController,
                decoration: InputDecoration(
                  labelText: "Paid Amount (Rs)",
                  border: const OutlineInputBorder(),
                  helperText: "Remaining: Rs ${(_totalPayable - (double.tryParse(_paidAmountController.text) ?? 0)).toStringAsFixed(2)}",
                ),
                keyboardType: TextInputType.number,
                onChanged: (_) => setState(() {}),
              ),
              const SizedBox(height: 16),
            ],
            
            // Discount
            TextField(
              controller: _discountController,
              decoration: InputDecoration(
                labelText: widget.type == TransactionType.Sale ? "Discount (Rs)" : "Discount Received (Rs)",
                border: const OutlineInputBorder(),
              ),
              keyboardType: TextInputType.number,
              onChanged: (_) => setState(() {}),
            ),
            
            const SizedBox(height: 32),
            
            // Final Total
            Container(
              padding: const EdgeInsets.all(16),
              color: Colors.green.shade50,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text("Grand Total:", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                       Text("Rs ${_totalPayable.toStringAsFixed(2)}", style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.green)),
                       if ((double.tryParse(_discountController.text) ?? 0) > 0) ...[
                           Text(
                            "- Rs ${_discountController.text}",
                            style: const TextStyle(color: Colors.red, fontSize: 12),
                          ),
                       ],
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            
            // Save Button at Bottom
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _save,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: Colors.green,
                ),
                child: const Text(
                  "SAVE TRANSACTION",
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                ),
              ),
            ),
            const SizedBox(height: 48), // Bottom padding
          ],
        ),
      ),
    );
  }

  void _showAddCustomerDialog() {
    final nameController = TextEditingController();
    final emailController = TextEditingController();
    final phoneController = TextEditingController();
    final addressController = TextEditingController();
    final remarksController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text("Add New ${widget.type == TransactionType.Sale ? 'Customer' : 'Vendor'}"),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameController,
                decoration: const InputDecoration(labelText: "Name *"),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: emailController,
                decoration: const InputDecoration(labelText: "Email"),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: phoneController,
                decoration: const InputDecoration(labelText: "Phone No."),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: addressController,
                decoration: const InputDecoration(labelText: "Address"),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: remarksController,
                decoration: const InputDecoration(labelText: "Remarks"),
                maxLines: 2,
              ),
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
              if (nameController.text.isNotEmpty) {
                final newCustomer = Customer(
                  name: nameController.text,
                  type: widget.type == TransactionType.Sale ? "Customer" : "Vendor",
                  email: emailController.text,
                  phone: phoneController.text,
                  address: addressController.text,
                  remarks: remarksController.text,
                );
                widget.customerService.addCustomer(newCustomer);
                setState(() {
                  _selectedCustomer = newCustomer;
                });
                Navigator.pop(context);
              }
            },
            child: const Text("Add"),
          ),
        ],
      ),
    );
  }
}
