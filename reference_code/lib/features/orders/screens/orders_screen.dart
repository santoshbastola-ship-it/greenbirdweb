import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:farm_management_app/features/sales/services/sales_service.dart';
import 'package:farm_management_app/features/sales/models/sales_record.dart';
import 'package:farm_management_app/features/auth/services/auth_service.dart';
import 'package:intl/intl.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Order Management"),
        bottom: TabBar(
          controller: _tabController,
          labelColor: Colors.black87,
          unselectedLabelColor: Colors.grey,
          indicatorColor: Colors.green,
          tabs: const [
            Tab(text: "Open"),
            Tab(text: "Accepted"),
            Tab(text: "Delivered"),
            Tab(text: "Cancelled"),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _OrdersList(status: OrderStatus.open),
          _OrdersList(status: OrderStatus.accepted),
          _OrdersList(status: OrderStatus.delivered),
          _OrdersList(status: OrderStatus.cancelled),
        ],
      ),
    );
  }
}

class _OrdersList extends StatelessWidget {
  final OrderStatus status;

  const _OrdersList({required this.status});

  @override
  Widget build(BuildContext context) {
    final salesService = context.watch<SalesService>();
    // final currentUser = context.read<AuthService>().currentUser; // Moved inside _OrderActionWidget

    return StreamBuilder<List<TransactionRecord>>(
      stream: salesService.getTransactionsStream(),
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return Center(child: Text("Error: ${snapshot.error}", style: const TextStyle(color: Colors.red)));
        }

        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        final allOrders = snapshot.data ?? [];
        
        // Filter by Status and Type (Sales)
        final orders = allOrders.where((t) => t.type == TransactionType.Sale && t.status == status).toList();

        if (orders.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.inbox_outlined, size: 64, color: Colors.grey.shade300),
                const SizedBox(height: 16),
                Text("No ${status.displayName} orders", style: TextStyle(color: Colors.grey.shade500, fontSize: 16)),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: orders.length,
          itemBuilder: (context, index) {
            final order = orders[index];
            return Card(
              margin: const EdgeInsets.only(bottom: 16),
              elevation: 2,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(order.billNo, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        Text(DateFormat('MMM dd, hh:mm a').format(order.date), style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
                      ],
                    ),
                    const Divider(height: 24),
                    
                    // Customer Info
                    Row(
                      children: [
                        const Icon(Icons.person, size: 16, color: Colors.grey),
                        const SizedBox(width: 8),
                         Expanded(child: Text(order.partyName, style: const TextStyle(fontWeight: FontWeight.w500))),
                      ],
                    ),
                    const SizedBox(height: 4),
                     // Items Summary
                    Row(
                      children: [
                        const Icon(Icons.shopping_bag, size: 16, color: Colors.grey),
                         const SizedBox(width: 8),
                         Expanded(child: Text(order.itemsSummary, style: TextStyle(color: Colors.grey.shade700))),
                      ],
                    ),
                    
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text("Total: Rs ${order.totalPayable.toStringAsFixed(0)}", style: TextStyle(fontWeight: FontWeight.bold, color: Colors.green.shade800, fontSize: 16)),
                        
                        // Status Action Widget (Dropdown)
                        _OrderActionWidget(order: order),
                      ],
                    ),
                    
                    if(status == OrderStatus.cancelled && order.cancellationReason != null) ...[
                       const SizedBox(height: 8),
                       Text("Reason: ${order.cancellationReason}", style: const TextStyle(color: Colors.red, fontStyle: FontStyle.italic)),
                    ]
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }
}

class _OrderActionWidget extends StatelessWidget {
  final TransactionRecord order;

  const _OrderActionWidget({required this.order});

  Color _getStatusColor(OrderStatus status) {
    switch (status) {
      case OrderStatus.open: return Colors.blue;
      case OrderStatus.accepted: return Colors.orange;
      case OrderStatus.delivered: return Colors.green;
      case OrderStatus.cancelled: return Colors.red;
    }
  }

  Future<void> _updateStatus(BuildContext context, OrderStatus newStatus, {String? reason}) async {
    final salesService = Provider.of<SalesService>(context, listen: false);
    final user = Provider.of<AuthService>(context, listen: false).currentUser;

    try {
      await salesService.updateOrderStatus(order.id, newStatus, reason: reason, updatedBy: user?.name);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Order marked as ${newStatus.displayName}"), backgroundColor: Colors.green));
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Error: $e"), backgroundColor: Colors.red));
      }
    }
  }

  void _showCancelDialog(BuildContext context) {
    final reasonController = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Cancel Order"),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text("Are you sure you want to cancel this order? Stock will be restored."),
            const SizedBox(height: 16),
            TextField(
              controller: reasonController,
              decoration: const InputDecoration(labelText: "Reason (Mandatory)", border: OutlineInputBorder()),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text("Back")),
          TextButton(
            onPressed: () {
              if (reasonController.text.trim().isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Reason is mandatory for cancellation"), backgroundColor: Colors.red));
                return;
              }
              Navigator.pop(context);
              _updateStatus(context, OrderStatus.cancelled, reason: reasonController.text.trim());
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text("Confirm Cancel"),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final color = _getStatusColor(order.status);
    
    return PopupMenuButton<OrderStatus>(
      initialValue: order.status,
      onSelected: (OrderStatus newStatus) {
        if (newStatus == order.status) return;

        if (newStatus == OrderStatus.cancelled) {
          _showCancelDialog(context);
        } else {
          _updateStatus(context, newStatus);
        }
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: color.withOpacity(0.5)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              order.status.displayName,
              style: TextStyle(
                color: color,
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
            const SizedBox(width: 4),
            Icon(Icons.arrow_drop_down, color: color, size: 20),
          ],
        ),
      ),
      itemBuilder: (context) => OrderStatus.values.map((status) {
        return PopupMenuItem(
          value: status,
          child: Row(
            children: [
              Icon(
                Icons.circle, 
                size: 12, 
                color: _getStatusColor(status)
              ),
              const SizedBox(width: 8),
              Text(status.displayName),
            ],
          ),
        );
      }).toList(),
    );
  }
}
