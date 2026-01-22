import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:farm_management_app/features/sales/models/sales_record.dart';
import 'package:farm_management_app/features/sales/services/sales_service.dart';
import 'package:farm_management_app/features/auth/services/auth_service.dart';
import 'package:intl/intl.dart';

class MyOrdersScreen extends StatelessWidget {
  const MyOrdersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.read<AuthService>().currentUser;
    final salesService = Provider.of<SalesService>(context, listen: false);

    if (user == null) {
      return Scaffold(
        appBar: AppBar(title: const Text("My Orders")),
        body: const Center(child: Text("Please login to view your orders")),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text("My Orders", style: TextStyle(color: Colors.black)),
        backgroundColor: Colors.white,
        elevation: 0,
        leading: const BackButton(color: Colors.black),
      ),
      body: FutureBuilder<List<TransactionRecord>>(
        future: salesService.getTransactionsByPartner(
          customerId: user.id,
          partyName: user.name, 
          type: TransactionType.Sale,
          limit: 50, 
        ),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text("Error: ${snapshot.error}"));
          }

          final orders = snapshot.data ?? [];
          if (orders.isEmpty) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.shopping_bag_outlined, size: 64, color: Colors.grey),
                  SizedBox(height: 16),
                  Text("No orders found", style: TextStyle(color: Colors.grey, fontSize: 16)),
                ],
              ),
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: orders.length,
            separatorBuilder: (context, index) => const SizedBox(height: 16),
            itemBuilder: (context, index) {
              final order = orders[index];
              return _OrderCard(order: order);
            },
          );
        },
      ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  final TransactionRecord order;

  const _OrderCard({required this.order});

  Color _getStatusColor(OrderStatus status) {
    switch (status) {
      case OrderStatus.open:
        return Colors.blue;
      case OrderStatus.accepted:
        return Colors.orange;
      case OrderStatus.delivered:
        return Colors.green;
      case OrderStatus.cancelled:
        return Colors.red;
    }
  }

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('MMM dd, yyyy');
    
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          )
        ],
      ),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          title: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                dateFormat.format(order.date),
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: _getStatusColor(order.status).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: _getStatusColor(order.status).withOpacity(0.5)),
                ),
                child: Text(
                  order.status.displayName,
                  style: TextStyle(
                    color: _getStatusColor(order.status),
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          subtitle: Padding(
            padding: const EdgeInsets.only(top: 8.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  order.billNo,
                  style: TextStyle(color: Colors.grey.shade600, fontSize: 14),
                ),
                Text(
                  "Rs ${order.totalPayable.toStringAsFixed(0)}",
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.green.shade800,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
          ),
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Divider(),
                  const SizedBox(height: 8),
                  const Text("Items:", style: TextStyle(fontWeight: FontWeight.w600, color: Colors.grey)),
                  const SizedBox(height: 8),
                  ...order.items.map((item) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            "${item.quantity.toStringAsFixed(0)} x ${item.productName} (${item.unit.displayName})",
                            style: const TextStyle(fontSize: 14),
                          ),
                        ),
                        Text(
                          "Rs ${item.totalPrice.toStringAsFixed(0)}",
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),
                  )),
                  const SizedBox(height: 12),
                  if (order.soldBy.contains("Deliver:"))
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade50,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.local_shipping_outlined, size: 16, color: Colors.grey),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              order.soldBy.split("|").skip(1).join(" | ").trim(),
                               style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
                            ),
                          ),
                        ],
                      ),
                    ),
                  if (order.status == OrderStatus.cancelled && order.cancellationReason != null)
                     Padding(
                       padding: const EdgeInsets.only(top: 12.0),
                       child: Container(
                         width: double.infinity,
                         padding: const EdgeInsets.all(8),
                         decoration: BoxDecoration(
                           color: Colors.red.shade50,
                           borderRadius: BorderRadius.circular(8),
                           border: Border.all(color: Colors.red.shade200),
                         ),
                         child: Column(
                           crossAxisAlignment: CrossAxisAlignment.start,
                           children: [
                             const Text("Cancellation Reason:", style: TextStyle(fontWeight: FontWeight.bold, color: Colors.red, fontSize: 12)),
                             const SizedBox(height: 4),
                             Text(order.cancellationReason!, style: TextStyle(color: Colors.red.shade800, fontSize: 13)),
                           ],
                         ),
                       ),
                     ),
                ],
              ),
            ),
             // Cancel Button for Customer
            if (order.status == OrderStatus.open || order.status == OrderStatus.accepted)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                child: SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: () {
                      final salesService = Provider.of<SalesService>(context, listen: false);
                      final user = context.read<AuthService>().currentUser;
                      _showCancelDialog(context, salesService, user?.name);
                    },
                    icon: const Icon(Icons.cancel_outlined, color: Colors.red),
                    label: const Text("Cancel Order", style: TextStyle(color: Colors.red)),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Colors.red),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  void _showCancelDialog(BuildContext context, SalesService service, String? userName) {
    final reasonController = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Cancel Order"),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text("Are you sure you want to cancel this order?"),
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
              _cancelOrder(context, service, userName, reasonController.text.trim());
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text("Confirm Cancel"),
          ),
        ],
      ),
    );
  }

  Future<void> _cancelOrder(BuildContext context, SalesService service, String? userName, String reason) async {
      try {
        await service.updateOrderStatus(order.id, OrderStatus.cancelled, reason: reason, updatedBy: userName);
        if (context.mounted) {
           ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Order cancelled successfully"), backgroundColor: Colors.green));
        }
      } catch (e) {
        if (context.mounted) {
           ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Error: $e"), backgroundColor: Colors.red));
        }
      }
  }
}
