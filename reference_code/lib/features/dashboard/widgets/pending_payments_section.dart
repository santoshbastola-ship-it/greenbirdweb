import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:farm_management_app/features/auth/services/auth_service.dart';
import 'package:farm_management_app/features/auth/models/user_model.dart';
import 'package:farm_management_app/features/sales/services/sales_service.dart';
import 'package:farm_management_app/features/sales/services/customer_service.dart';
import 'package:farm_management_app/features/sales/models/sales_record.dart' as sales;
import 'package:farm_management_app/features/energy/services/energy_service.dart';
import 'package:farm_management_app/features/energy/models/energy_bill.dart' as energy;
import 'package:intl/intl.dart';
import 'package:farm_management_app/core/utils/nepali_date_helper.dart';
import 'package:go_router/go_router.dart';

// Unified DTO for display
class PendingPaymentItem {
  final String id;
  final String title;
  final String? billNo; // Added Bill No
  final String subtitle;
  final double amount;
  final String statusText;
  final bool isCredit; // True = Money coming in (Sale), False = Money going out (Expense)
  final DateTime date;
  final Color color;
  final IconData icon;
  final PendingPaymentType type; // New field to identify type
  final sales.TransactionRecord? transaction; // For sales/purchase
  final energy.EnergyBill? energyBill; // For energy bills

  PendingPaymentItem({
    required this.id,
    required this.title,
    this.billNo,
    required this.subtitle,
    required this.amount,
    required this.statusText,
    required this.isCredit,
    required this.date,
    required this.color,
    required this.icon,
    required this.type,
    this.transaction,
    this.energyBill,
  });
}

enum PendingPaymentType {
  transaction, // Sale or Purchase
  energyBill,
}

class PendingPaymentsSection extends StatefulWidget {
  const PendingPaymentsSection({super.key});

  @override
  State<PendingPaymentsSection> createState() => _PendingPaymentsSectionState();
}

class _PendingPaymentsSectionState extends State<PendingPaymentsSection> {
  bool _showAll = false;

  @override
  Widget build(BuildContext context) {
    // 1. Admin Check
    final currentUser = context.watch<AuthService>().currentUser;
    if (currentUser == null || currentUser.role != UserRole.admin) {
      return const SizedBox.shrink();
    }

    // Combine Streams: Energy + Sales
    return StreamBuilder<List<energy.EnergyBill>>(
      stream: context.read<EnergyService>().getBillsStream(),
      builder: (context, energySnapshot) {
        return StreamBuilder<List<sales.TransactionRecord>>(
          stream: context.read<SalesService>().getTransactionsStream(),
          builder: (context, salesSnapshot) {
            
            // Check for connection/errors (basic)
            if (energySnapshot.hasError || salesSnapshot.hasError) {
               return const SizedBox.shrink();
            }

            // Loading state if both are waiting (and no data yet)
            if (!energySnapshot.hasData && !salesSnapshot.hasData) {
              return Container(
                height: 100,
                alignment: Alignment.center,
                child: const CircularProgressIndicator(),
              );
            }

            final energyBills = energySnapshot.data ?? [];
            final transactions = salesSnapshot.data ?? [];
            final List<PendingPaymentItem> pendingTransactions = [];

            // --- PROCESS ENERGY BILLS ---
            final pendingEnergy = energyBills.where((b) => !b.paymentStatus.isPaid).map((b) {
              return PendingPaymentItem(
                id: b.id,
                title: "${b.type.displayName} Bill",
                billNo: null,
                subtitle: "${b.month} ${b.year}",
                amount: b.remainingAmount, 
                statusText: b.paymentStatus.displayName,
                isCredit: false, // Expense
                date: b.dueDate ?? b.entryDate,
                color: _getEnergyColor(b.type),
                icon: _getEnergyIcon(b.type),
                type: PendingPaymentType.energyBill,
                energyBill: b,
              );
            }).toList();

            // --- PROCESS TRANSACTIONS (Sales/Purchase) ---
              for (var t in transactions) {
                if (!t.paymentStatus.isPending && !t.paymentStatus.isPartial) continue;
                
                final isSale = t.type == sales.TransactionType.Sale;

                // Filter Logic:
                // If Sale: Only show if Delivered. (Open/Accepted are "Pending Orders", not "Pending Payments" yet in this view context)
                // If Purchase: All pending payments shown (concept of delivery not tracked as strictly/same flow)
                if (isSale && t.status != sales.OrderStatus.delivered) {
                  continue; 
                }
                
                // Try to get latest name from customer record if ID exists
                String displayPartyName = t.partyName;
                if (t.customerId != null) {
                  final customer = context.read<CustomerService>().getCustomerById(t.customerId!);
                  if (customer != null) {
                    displayPartyName = customer.name;
                  }
                }

                pendingTransactions.add(PendingPaymentItem(
                  id: t.id, 
                  title: displayPartyName,
                  billNo: t.billNo,
                  subtitle: NepaliDateHelper.formatToNepaliShort(t.date),
                  amount: t.remainingAmount,
                  statusText: t.paymentStatus.displayName,
                  isCredit: isSale, 
                  date: t.date,
                  color: isSale ? Colors.green : Colors.red,
                  icon: isSale ? Icons.arrow_upward : Icons.arrow_downward,
                  type: PendingPaymentType.transaction,
                  transaction: t,
                ));
              }

            // --- COMBINE & SORT ---
            final allPending = [...pendingEnergy, ...pendingTransactions];
            // Sort by date descending (newest first)
            allPending.sort((a, b) => b.date.compareTo(a.date));

            if (allPending.isEmpty) {
              return Container(
                padding: const EdgeInsets.all(20),
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                ),
                 child: const Text(
                   "No pending payments",
                   style: TextStyle(color: Colors.grey, fontSize: 16),
                 ),
               );
            }

            // Determine how many items to show
            final itemsToShow = _showAll ? allPending.length : (allPending.length > 5 ? 5 : allPending.length);

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
                    children: [
                      Icon(Icons.pending_actions, color: Colors.orange.shade700, size: 24),
                      const SizedBox(width: 12),
                      const Text(
                        "Pending Payments",
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.black87,
                        ),
                      ),
                      const Spacer(),
                      // View All Button
                      if (allPending.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(right: 8.0),
                          child: TextButton(
                            onPressed: () => context.push('/pending-payments'),
                            style: TextButton.styleFrom(
                              visualDensity: VisualDensity.compact,
                              padding: const EdgeInsets.symmetric(horizontal: 8),
                            ),
                            child: const Text("View All", style: TextStyle(fontSize: 14)),
                          ),
                        ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                         decoration: BoxDecoration(
                          color: Colors.orange.shade50,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          "${allPending.length} Pending",
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: Colors.orange.shade700,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: itemsToShow,
                    separatorBuilder: (c, i) => const Divider(height: 20),
                    itemBuilder: (context, index) {
                      return _PendingPaymentRow(item: allPending[index]);
                    },
                  ),
                  if (allPending.length > 5)
                    Padding(
                      padding: const EdgeInsets.only(top: 12),
                      child: Center(
                        child: TextButton.icon(
                          onPressed: () {
                            setState(() {
                              _showAll = !_showAll;
                            });
                          },
                          icon: Icon(
                            _showAll ? Icons.expand_less : Icons.expand_more,
                            size: 18,
                          ),
                          label: Text(
                            _showAll ? "View Less" : "View All (${allPending.length - 5} more)",
                            style: const TextStyle(fontSize: 13),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Color _getEnergyColor(energy.EnergyType type) {
    switch (type) {
      case energy.EnergyType.electricity: return Colors.orange;
      case energy.EnergyType.water: return Colors.blue;
      case energy.EnergyType.gas: return Colors.red;
      case energy.EnergyType.food: return Colors.green;
    }
  }

  IconData _getEnergyIcon(energy.EnergyType type) {
    switch (type) {
      case energy.EnergyType.electricity: return Icons.bolt;
      case energy.EnergyType.water: return Icons.water_drop;
      case energy.EnergyType.gas: return Icons.local_fire_department;
      case energy.EnergyType.food: return Icons.restaurant;
    }
  }
}

class _PendingPaymentRow extends StatelessWidget {
  final PendingPaymentItem item;

  const _PendingPaymentRow({required this.item});

  void _handleTap(BuildContext context) {
    if (item.type == PendingPaymentType.transaction && item.transaction != null) {
      // Show transaction details dialog
      _showTransactionDetails(context, item.transaction!);
    } else if (item.type == PendingPaymentType.energyBill) {
      // Navigate to energy screen
      context.push('/energy');
    }
  }

  void _showTransactionDetails(BuildContext context, sales.TransactionRecord transaction) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        insetPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 24),
        child: Container(
          constraints: const BoxConstraints(maxWidth: 600),
          width: double.infinity,
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      transaction.type == sales.TransactionType.Sale ? "Sale Details" : "Purchase Details",
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
              const Divider(height: 24),
              _DetailRow(label: "Date", value: NepaliDateHelper.formatToNepali(transaction.date)),
              _DetailRow(label: transaction.type == sales.TransactionType.Sale ? "Customer" : "Vendor", value: transaction.partyName),
              _DetailRow(label: "Payment Status", value: transaction.paymentStatus.displayName),
              _DetailRow(label: transaction.type == sales.TransactionType.Sale ? "Sold By" : "Purchased By", value: transaction.soldBy),
              _DetailRow(label: "Entered By", value: transaction.enteredBy),
              const SizedBox(height: 16),
              Text(
                "Items",
                style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              ...transaction.items.map((item) => Padding(
                padding: const EdgeInsets.only(bottom: 8.0),
                child: Row(
                  children: [
                    Expanded(
                      child: Text("${item.productName} (${item.quantity} ${item.unit.displayName})"),
                    ),
                    Text(
                      "Rs ${item.totalPrice.toStringAsFixed(2)}",
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              )),
              const Divider(height: 24),
              _DetailRow(label: "Total Price", value: "Rs ${transaction.totalPrice.toStringAsFixed(2)}"),
              if (transaction.discount > 0)
                _DetailRow(label: "Discount", value: "Rs ${transaction.discount.toStringAsFixed(2)}"),
              _DetailRow(
                label: "Total Payable",
                value: "Rs ${transaction.totalPayable.toStringAsFixed(2)}",
                isBold: true,
              ),
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
                const Divider(),
                _DetailRow(
                  label: "Total Paid",
                  value: "Rs ${transaction.paidAmount.toStringAsFixed(2)}",
                  isBold: true,
                ),
                _DetailRow(
                  label: "Remaining", 
                  value: "Rs ${transaction.remainingAmount.toStringAsFixed(2)}",
                  isBold: true,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => _handleTap(context),
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: item.color.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(item.icon, color: item.color, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.title,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                      color: Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                       if (item.billNo != null) ...[
                         Container(
                           padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                           decoration: BoxDecoration(
                             color: Colors.grey.shade200,
                             borderRadius: BorderRadius.circular(4),
                           ),
                           child: Text(
                             item.billNo!,
                             style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black87),
                           ),
                         ),
                         const SizedBox(width: 6),
                       ],
                       Expanded(
                         child: Text(
                           item.subtitle,
                           maxLines: 1,
                           overflow: TextOverflow.ellipsis,
                           style: TextStyle(
                             fontSize: 12,
                             color: Colors.grey.shade600,
                           ),
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
                  "Rs ${item.amount.toStringAsFixed(0)}",
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                    color: item.isCredit ? Colors.green : Colors.red,
                  ),
                ),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: Colors.grey.shade300),
                  ),
                  child: Text(
                    item.statusText,
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w500,
                      color: Colors.grey.shade700,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isBold;

  const _DetailRow({
    required this.label,
    required this.value,
    this.isBold = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              color: Colors.grey.shade700,
              fontSize: 14,
            ),
          ),
          const SizedBox(width: 16),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: TextStyle(
                fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
                fontSize: 14,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
