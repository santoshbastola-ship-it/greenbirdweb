import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:farm_management_app/features/sales/services/sales_service.dart';
import 'package:farm_management_app/features/sales/services/customer_service.dart';
import 'package:farm_management_app/features/sales/models/sales_record.dart' as sales;
import 'package:farm_management_app/features/energy/services/energy_service.dart';
import 'package:farm_management_app/features/energy/models/energy_bill.dart' as energy;
import 'package:intl/intl.dart';
import 'package:farm_management_app/core/utils/nepali_date_helper.dart';
import 'package:go_router/go_router.dart';

// Reuse the DTO from the widget section if possible, but for clean separation, 
// we'll redefine a similar structure or just process data locally.
// Repeating the DTO here for isolation as the widget one might be private or tightly coupled.
class PendingPaymentItemDTO {
  final String id;
  final String title;
  final String? billNo;
  final String subtitle;
  final double amount;
  final String statusText;
  final bool isCredit;
  final DateTime date;
  final Color color;
  final IconData icon;
  final PendingPaymentType type;
  final sales.TransactionRecord? transaction;
  final energy.EnergyBill? energyBill;

  PendingPaymentItemDTO({
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

enum PendingPaymentType { transaction, energyBill }

class PendingPaymentsScreen extends StatelessWidget {
  const PendingPaymentsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('All Pending Payments'),
      ),
      body: StreamBuilder<List<energy.EnergyBill>>(
        stream: context.read<EnergyService>().getBillsStream(),
        builder: (context, energySnapshot) {
          return StreamBuilder<List<sales.TransactionRecord>>(
            stream: context.read<SalesService>().getTransactionsStream(),
            builder: (context, salesSnapshot) {
              
              if (energySnapshot.connectionState == ConnectionState.waiting && salesSnapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator());
              }

              final energyBills = energySnapshot.data ?? [];
              final transactions = salesSnapshot.data ?? [];
              final List<PendingPaymentItemDTO> pendingItems = [];

              // --- PROCESS ENERGY BILLS ---
              final pendingEnergy = energyBills.where((b) => !b.paymentStatus.isPaid).map((b) {
                return PendingPaymentItemDTO(
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
              });
              pendingItems.addAll(pendingEnergy);

              // --- PROCESS TRANSACTIONS ---
              for (var t in transactions) {
                if (!t.paymentStatus.isPending && !t.paymentStatus.isPartial) continue;
                
                final isSale = t.type == sales.TransactionType.Sale;

                // Filter Logic: Same as Dashboard
                if (isSale && t.status != sales.OrderStatus.delivered) {
                  continue; 
                }
                
                String displayPartyName = t.partyName;
                if (t.customerId != null) {
                  final customer = context.read<CustomerService>().getCustomerById(t.customerId!);
                  if (customer != null) {
                    displayPartyName = customer.name;
                  }
                }

                pendingItems.add(PendingPaymentItemDTO(
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

              // Sort newest first
              pendingItems.sort((a, b) => b.date.compareTo(a.date));

              if (pendingItems.isEmpty) {
                return const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.check_circle_outline, size: 64, color: Colors.green),
                      SizedBox(height: 16),
                      Text("No pending payments!", style: TextStyle(fontSize: 18, color: Colors.grey)),
                    ],
                  ),
                );
              }

              return ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: pendingItems.length,
                separatorBuilder: (context, index) => const Divider(),
                itemBuilder: (context, index) {
                  return _PaymentListTile(item: pendingItems[index]);
                },
              );
            },
          );
        },
      ),
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

class _PaymentListTile extends StatelessWidget {
  final PendingPaymentItemDTO item;

  const _PaymentListTile({required this.item});

  void _handleTap(BuildContext context) {
    if (item.type == PendingPaymentType.transaction && item.transaction != null) {
      _showTransactionDetails(context, item.transaction!);
    } else if (item.type == PendingPaymentType.energyBill) {
      context.push('/energy');
    }
  }

  void _showTransactionDetails(BuildContext context, sales.TransactionRecord transaction) {
    // Reuse the dialog logic. Ideally this would be a shared widget but copying for speed/isolation 
    // is acceptable here as requested.
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
              _DetailRow(
                label: "Remaining Amount", 
                value: "Rs ${transaction.remainingAmount.toStringAsFixed(2)}",
                isBold: true,
                color: Colors.red,
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: () => _handleTap(context),
      leading: CircleAvatar(
        backgroundColor: item.color.withOpacity(0.1),
        child: Icon(item.icon, color: item.color, size: 20),
      ),
      title: Text(item.title, style: const TextStyle(fontWeight: FontWeight.bold)),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (item.billNo != null)
            Text(item.billNo!, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
          Text(item.subtitle),
        ],
      ),
      trailing: Column(
        mainAxisAlignment: MainAxisAlignment.center,
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
          Text(
            item.statusText,
            style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
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
  final Color? color;

  const _DetailRow({
    required this.label,
    required this.value,
    this.isBold = false,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.grey.shade700)),
          Text(
            value,
            style: TextStyle(
              fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
