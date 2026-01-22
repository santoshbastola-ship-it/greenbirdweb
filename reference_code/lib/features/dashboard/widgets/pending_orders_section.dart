import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:farm_management_app/features/sales/services/sales_service.dart';
import 'package:farm_management_app/features/sales/models/sales_record.dart';
import 'package:farm_management_app/core/utils/nepali_date_helper.dart';
import 'package:farm_management_app/core/widgets/empty_state_widget.dart';

class PendingOrdersSection extends StatelessWidget {
  const PendingOrdersSection({super.key});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<TransactionRecord>>(
      stream: context.read<SalesService>().getTransactionsStream(),
      builder: (context, snapshot) {
        if (snapshot.hasError) {
           return Container(
             padding: const EdgeInsets.all(20),
             decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(20)),
             child: Text("Error loading orders: ${snapshot.error}"),
           );
        }

        // Default to empty list if no data yet (or loading)
        final List<TransactionRecord> allTransactions = snapshot.data ?? [];
        final bool isLoading = snapshot.connectionState == ConnectionState.waiting;
        
        List<TransactionRecord> pendingOrders = [];
        try {
          // Filter: Sale AND (Open OR Accepted)
          pendingOrders = allTransactions.where((t) {
            if (t.type != TransactionType.Sale) return false;
            return t.status == OrderStatus.open || t.status == OrderStatus.accepted;
          }).toList();

          // Sort by Date (Newest first)
          pendingOrders.sort((a, b) => b.date.compareTo(a.date));
        } catch (e) {
          debugPrint("Error processing pending orders: $e");
          // If sorting fails, we might still have a list, but safer to show what we have or empty
        }

        final displayOrders = pendingOrders.take(5).toList();

        return Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Icon(Icons.shopping_cart_checkout, color: Colors.blue.shade700, size: 24),
                      const SizedBox(width: 12),
                      const Text(
                        "Pending Orders",
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.black87,
                        ),
                      ),
                    ],
                  ),
                  if (pendingOrders.isNotEmpty)
                    TextButton(
                      onPressed: () => context.push('/orders'),
                      child: const Text("View All"),
                    ),
                ],
              ),
              const SizedBox(height: 16),
              if (isLoading && allTransactions.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 20),
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (displayOrders.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 20),
                  child: EmptyStateWidget(
                    message: "No pending orders",
                    icon: Icons.check_circle_outline,
                  ),
                )
              else
                ...displayOrders.map((order) => _PendingOrderRow(order: order)).toList(),
            ],
          ),
        );
      },
    );
  }
}

class _PendingOrderRow extends StatelessWidget {
  final TransactionRecord order;

  const _PendingOrderRow({required this.order});

  @override
  Widget build(BuildContext context) {
    
    // Status color
    Color statusColor;
    Color statusBg;
    if (order.status == OrderStatus.open) {
      statusColor = Colors.orange.shade700;
      statusBg = Colors.orange.shade50;
    } else {
      statusColor = Colors.blue.shade700;
      statusBg = Colors.blue.shade50;
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () {
          // Navigate to Orders screen
          context.push('/orders');
        },
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.grey.shade50,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: Row(
            children: [
              // Icon Box
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: Center(
                  child: Text(
                    order.partyName.isNotEmpty ? order.partyName[0].toUpperCase() : "?",
                    style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.black54),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              
              // Details
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          order.billNo,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                            color: Colors.black87,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: statusBg,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            order.status.displayName,
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: statusColor,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      "${order.partyName} • ${NepaliDateHelper.formatToNepaliShort(order.date)}",
                      style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),

              // Amount
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    "Rs ${order.totalPayable.toStringAsFixed(0)}",
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                      color: Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 4),
                   Text(
                    "${order.items.length} Items",
                    style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
