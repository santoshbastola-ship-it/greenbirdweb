import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:farm_management_app/features/energy/screens/add_energy_bill_screen.dart';
import 'package:go_router/go_router.dart';
import 'package:farm_management_app/core/widgets/custom_card.dart';
import 'package:farm_management_app/features/notifications/widgets/notification_bell.dart';
import 'package:farm_management_app/features/energy/models/energy_bill.dart';
import 'package:farm_management_app/features/energy/services/energy_service.dart';
import 'package:farm_management_app/features/auth/services/auth_service.dart';
import 'package:farm_management_app/core/utils/nepali_date_helper.dart';
import 'package:farm_management_app/core/widgets/empty_state_widget.dart';
import 'package:farm_management_app/core/models/payment_status.dart';

class EnergyScreen extends StatefulWidget {
  final EnergyService? energyService;
  final AuthService? authService;
  
  const EnergyScreen({super.key, this.energyService, this.authService});

  @override
  State<EnergyScreen> createState() => _EnergyScreenState();
}

class _EnergyScreenState extends State<EnergyScreen> {
  late final EnergyService _energyService;
  late final AuthService _authService;
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _energyService = widget.energyService ?? EnergyService();
    _authService = widget.authService ?? AuthService();
    _searchController.addListener(() {
      setState(() {
        _searchQuery = _searchController.text.toLowerCase();
      });
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _navigateToAddEditBill({EnergyBill? bill}) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => AddEnergyBillScreen(
          existingBill: bill,
          energyService: _energyService,
          currentUserName: _authService.currentUser?.name ?? 'Unknown User',
        ),
      ),
    );
  }

  void _deleteBill(String id) async {
    try {
      await _energyService.deleteBill(id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Bill deleted successfully")),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Error deleting bill: $e"), backgroundColor: Colors.red),
        );
      }
    }
  }

  void _showDeleteConfirmation(String id) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Delete Bill"),
        content: const Text("Are you sure you want to delete this bill?"),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("Cancel"),
          ),
          ElevatedButton(
            onPressed: () {
              _deleteBill(id);
              Navigator.pop(context);
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text("Delete"),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Energy"),
        actions: [
          const NotificationBell(),
        ],
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search by type, amount, status...',
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
          Expanded(
            child: StreamBuilder<List<EnergyBill>>(
              stream: _energyService.getBillsStream(),
              initialData: _energyService.currentBills,
              builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting && !snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text("Error: ${snapshot.error}"));
          }

          final bills = snapshot.data ?? [];

          // Apply search filter
          List<EnergyBill> filteredBills = bills;
          if (_searchQuery.isNotEmpty) {
            filteredBills = bills.where((b) {
              // Search in type
              if (b.type.displayName.toLowerCase().contains(_searchQuery)) return true;
              
              // Search in amount
              if (b.amount.toString().contains(_searchQuery)) return true;
              
              // Search in payment status
              if (b.paymentStatus.displayName.toLowerCase().contains(_searchQuery)) return true;
              
              // Search in remarks
              if (b.remarks != null && b.remarks!.toLowerCase().contains(_searchQuery)) return true;
              
              return false;
            }).toList();
          }

          if (filteredBills.isEmpty && _searchQuery.isNotEmpty) {
            return EmptyStateWidget(
              message: "No results found for '$_searchQuery'",
              icon: Icons.search_off,
            );
          }

          if (filteredBills.isEmpty) {
            return EmptyStateWidget(
              message: "No energy bills recorded",
              icon: Icons.bolt,
              onRetry: () => _energyService.refresh(),
              retryLabel: "Refresh",
            );
          }

          // Separate pending and paid bills
          final pendingBills = filteredBills.where((b) => !b.paymentStatus.isPaid).toList();
          final paidBills = filteredBills.where((b) => b.paymentStatus.isPaid).toList();

          // Sort pending by date descending
          pendingBills.sort((a, b) => b.entryDate.compareTo(a.entryDate));
          
          // Sort paid by date descending
          paidBills.sort((a, b) => b.entryDate.compareTo(a.entryDate));

          return SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // PENDING SECTION
                if (pendingBills.isNotEmpty) ...[
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
                            "${pendingBills.length}",
                            style: TextStyle(color: Colors.orange.shade900, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                  ),
                  ...pendingBills.map((bill) => _buildBillCard(bill)).toList(),
                  const SizedBox(height: 24),
                ],

                // PAID SECTION (Collapsible)
                if (paidBills.isNotEmpty)
                  Card(
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: BorderSide(color: Colors.grey.shade300),
                    ),
                    child: ExpansionTile(
                      initiallyExpanded: false,
                      shape: const Border(),
                      leading: Icon(Icons.check_circle_outline, color: Colors.green.shade700),
                      title: Text(
                        "Paid Bills",
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
                              "${paidBills.length}",
                              style: TextStyle(color: Colors.green.shade700, fontWeight: FontWeight.bold),
                            ),
                          ),
                          const SizedBox(width: 8),
                          const Icon(Icons.expand_more),
                        ],
                      ),
                      children: paidBills.map((bill) => Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 4.0),
                        child: _buildBillCard(bill),
                      )).toList(),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _navigateToAddEditBill(),
        icon: const Icon(Icons.add),
        label: const Text("Add Bill"),
      ),
    );
  }

  Widget _buildBillCard(EnergyBill bill) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: CustomCard(
        child: ListTile(
          contentPadding: const EdgeInsets.all(16),
          leading: CircleAvatar(
            backgroundColor: _getTypeColor(bill.type).withOpacity(0.1),
            child: Icon(_getTypeIcon(bill.type), color: _getTypeColor(bill.type)),
          ),
          title: Text(
            "${bill.type.displayName} - ${bill.month} ${bill.year}",
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          subtitle: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 4),
              Text("Amount: Rs ${bill.amount.toStringAsFixed(2)}"),
              if (bill.paymentStatus.isPartial) ...[
                const SizedBox(height: 2),
                Text(
                  "Paid: Rs ${bill.paidAmount.toStringAsFixed(2)}",
                  style: TextStyle(fontSize: 11, color: Colors.green.shade700, fontWeight: FontWeight.w600),
                ),
                Text(
                  "Pending: Rs ${bill.remainingAmount.toStringAsFixed(2)}",
                  style: TextStyle(fontSize: 11, color: Colors.orange.shade700, fontWeight: FontWeight.w600),
                ),
              ],
              const SizedBox(height: 4),
              if (bill.remarks != null && bill.remarks!.isNotEmpty) ...[
                Text(
                  "Note: ${bill.remarks!}",
                  style: TextStyle(fontSize: 11, color: Colors.grey.shade700, fontStyle: FontStyle.italic),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
              ],
              Row(
                children: [
                  Container(
                    child: _buildStatusDropdown(bill),
                  ),
                  const SizedBox(width: 8),
                  if (bill.type == EnergyType.gas && bill.purchaseDate != null)
                    Text(
                      "Purchased: ${NepaliDateHelper.formatToNepali(bill.purchaseDate!)}",
                      style: TextStyle(fontSize: 10, color: Colors.grey.shade600),
                    )
                  else if (bill.dueDate != null)
                    Text(
                      "Due: ${NepaliDateHelper.formatToNepali(bill.dueDate!)}",
                      style: TextStyle(fontSize: 10, color: Colors.grey.shade600),
                    ),
                ],
              ),
            ],
          ),
          trailing: PopupMenuButton(
            itemBuilder: (context) {
              final canDelete = _authService.currentUser?.canDeleteRecords ?? false;
              return [
                const PopupMenuItem(value: 'edit', child: Text("Edit")),
                if (canDelete)
                  const PopupMenuItem(value: 'delete', child: Text("Delete", style: TextStyle(color: Colors.red))),
              ];
            },
            onSelected: (value) {
              if (value == 'edit') {
                _navigateToAddEditBill(bill: bill);
              } else if (value == 'delete') {
                _showDeleteConfirmation(bill.id);
              }
            },
          ),
        ),
      ),
    );
  }

  Widget _buildStatusDropdown(EnergyBill bill) {
    Color color = bill.paymentStatus.isPaid ? Colors.green : (bill.paymentStatus.isPending ? Colors.red : Colors.orange);
    
    return PopupMenuButton<PaymentStatus>(
      initialValue: bill.paymentStatus,
      onSelected: (PaymentStatus newStatus) async {
        if (newStatus != bill.paymentStatus) {
           if (newStatus.isPartial) {
             _showPartialPaymentDialog(bill, newStatus);
           } else {
             // Auto-update
            try {
               EnergyBill updated;
               
               if (newStatus.isPending) {
                 updated = bill.copyWith(
                   paymentStatus: newStatus,
                   paidAmount: 0.0,
                 );
               } else {
                 // Paid completely
                 updated = bill.copyWith(
                   paymentStatus: newStatus,
                   paidAmount: bill.amount,
                 );
               }
               
               await _energyService.updateBill(updated);
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
         padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
         decoration: BoxDecoration(
           color: color.withOpacity(0.1),
           borderRadius: BorderRadius.circular(4),
           border: Border.all(color: color.withOpacity(0.5)),
         ),
         child: Row(
           mainAxisSize: MainAxisSize.min,
           children: [
             Text(
               bill.paymentStatus.displayName,
               style: TextStyle(
                 fontSize: 10,
                 fontWeight: FontWeight.bold,
                 color: color,
               ),
             ),
             const SizedBox(width: 4),
             Icon(Icons.arrow_drop_down, size: 12, color: color),
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

  void _showPartialPaymentDialog(EnergyBill bill, PaymentStatus newStatus) {
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
              Text("Total Amount: Rs ${bill.amount.toStringAsFixed(2)}"),
              Text("Already Paid: Rs ${bill.paidAmount.toStringAsFixed(2)}"),
              Text("Remaining: Rs ${bill.remainingAmount.toStringAsFixed(2)}", style: const TextStyle(fontWeight: FontWeight.bold)),
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
                if (amount <= 0 || amount > bill.remainingAmount + 1.0) { 
                   ScaffoldMessenger.of(context).showSnackBar(
                     const SnackBar(content: Text("Invalid amount")),
                   );
                   return;
                }
                
                try {
                   final newTotalPaid = bill.paidAmount + amount;
                   PaymentStatus finalStatus = newStatus;
                   if (newTotalPaid >= bill.amount - 0.1) {
                     finalStatus = (newStatus == PaymentStatus.PartialCash) ? PaymentStatus.PaidCash : PaymentStatus.PaidOnline;
                   }
                   
                   final updated = bill.copyWith(
                     paymentStatus: finalStatus,
                     paidAmount: newTotalPaid,
                   );
                   
                   await _energyService.updateBill(updated);
                   if (context.mounted) {
                      Navigator.pop(context);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text("Payment updated. New Status: ${finalStatus.displayName}")),
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
              child: const Text("Update Payment"),
            ),
          ],
        );
      },
    );
  }

  Color _getTypeColor(EnergyType type) {
    switch (type) {
      case EnergyType.electricity: return Colors.orange;
      case EnergyType.water: return Colors.blue;
      case EnergyType.gas: return Colors.red;
      case EnergyType.food: return Colors.green;
    }
  }

  IconData _getTypeIcon(EnergyType type) {
    switch (type) {
      case EnergyType.electricity: return Icons.bolt;
      case EnergyType.water: return Icons.water_drop;
      case EnergyType.gas: return Icons.local_fire_department;
      case EnergyType.food: return Icons.restaurant;
    }
  }
}


