import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:farm_management_app/features/energy/models/energy_bill.dart';
import 'package:farm_management_app/features/energy/services/energy_service.dart';
import 'package:farm_management_app/core/utils/nepali_date_helper.dart';
import 'package:farm_management_app/core/models/payment_status.dart';

class AddEnergyBillScreen extends StatefulWidget {
  final EnergyBill? existingBill;
  final EnergyService energyService;
  final String currentUserName;

  const AddEnergyBillScreen({
    super.key,
    this.existingBill,
    required this.energyService,
    required this.currentUserName,
  });

  @override
  State<AddEnergyBillScreen> createState() => _AddEnergyBillScreenState();
}

class _AddEnergyBillScreenState extends State<AddEnergyBillScreen> {
  final _formKey = GlobalKey<FormState>();
  late EnergyType _selectedType;
  late String _selectedMonth;
  late int _selectedYear;
  DateTime? _meterReadingDate;
  DateTime? _dueDate;
  DateTime? _purchaseDate; // For gas bills
  late PaymentStatus _paymentStatus;
  final _amountController = TextEditingController();
  final _paidAmountController = TextEditingController(); // Added
  final _remarksController = TextEditingController(); // For food bills and notes
  final _enteredByController = TextEditingController();
  bool _isLoading = false;

  final List<String> _nepaliMonths = [
    'Baisakh', 'Jestha', 'Asar', 'Shrawan', 'Bhadra', 'Ashwin',
    'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'
  ];

  @override
  void initState() {
    super.initState();
    if (widget.existingBill != null) {
      final bill = widget.existingBill!;
      _selectedType = bill.type;
      _selectedMonth = bill.month;
      _selectedYear = bill.year;
      _meterReadingDate = bill.meterReadingDate;
      _dueDate = bill.dueDate;
      _purchaseDate = bill.purchaseDate;
      _paymentStatus = bill.paymentStatus;
      _amountController.text = bill.amount.toString();
      _paidAmountController.text = bill.paidAmount.toString();
      _remarksController.text = bill.remarks ?? '';
      _enteredByController.text = bill.enteredBy;
    } else {
      _selectedType = EnergyType.electricity;
      _selectedMonth = _nepaliMonths[0];
      _selectedYear = DateTime.now().year + 57; // BS Estimate (roughly AD+57)
      _paymentStatus = PaymentStatus.Pending;
      _enteredByController.text = widget.currentUserName;
      _paidAmountController.text = "0.0";
    }
  }

  @override
  void dispose() {
    _amountController.dispose();
    _paidAmountController.dispose();
    _remarksController.dispose();
    _enteredByController.dispose();
    super.dispose();
  }

  Future<void> _selectDate(BuildContext context, bool isMeterReading, {bool isPurchase = false}) async {
    final picked = await NepaliDateHelper.pickNepaliDate(
      context,
      initialDate: DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
    );
    if (picked != null) {
      setState(() {
        if (isPurchase) {
          _purchaseDate = picked;
        } else if (isMeterReading) {
          _meterReadingDate = picked;
        } else {
          _dueDate = picked;
        }
      });
    }
  }

  void _save() async {
    if (_formKey.currentState!.validate()) {
      setState(() => _isLoading = true);
      try {
        final amount = double.tryParse(_amountController.text) ?? 0.0;
        final paidAmount = double.tryParse(_paidAmountController.text) ?? 0.0;
        
        final bill = EnergyBill(
          id: widget.existingBill?.id ?? '',
          type: _selectedType,
          month: _selectedMonth,
          year: _selectedYear,
          meterReadingDate: _meterReadingDate,
          dueDate: _dueDate,
          purchaseDate: _purchaseDate,
          remarks: _remarksController.text.trim().isEmpty ? null : _remarksController.text.trim(),
          paymentStatus: _paymentStatus,
          paidAmount: paidAmount, // Save paid amount
          enteredBy: _enteredByController.text,
          amount: amount,
          entryDate: widget.existingBill?.entryDate ?? DateTime.now(),
        );

        if (widget.existingBill != null) {
          await widget.energyService.updateBill(bill);
        } else {
          await widget.energyService.addBill(bill);
        }

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text("Saved successfully")),
          );
          Navigator.pop(context);
        }
      } catch (e) {
        if (mounted) {
          setState(() => _isLoading = false);
          showDialog(
            context: context,
            builder: (context) => AlertDialog(
              title: const Text("Error Saving Bill"),
              content: Text("Failed to save.\n\nDetails: $e"),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text("OK"),
                ),
              ],
            ),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.existingBill != null ? "Edit Energy Bill" : "Add Energy Bill"),
        actions: [
          IconButton(
            onPressed: _isLoading ? null : _save,
            icon: const Icon(Icons.check),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Type Dropdown
              DropdownButtonFormField<EnergyType>(
                value: _selectedType,
                decoration: const InputDecoration(
                  labelText: "Type",
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.category),
                ),
                items: EnergyType.values.map((type) {
                  return DropdownMenuItem(value: type, child: Text(type.displayName));
                }).toList(),
                onChanged: (val) => setState(() => _selectedType = val!),
              ),
              const SizedBox(height: 16),

              // Month Dropdown
              Row(
                children: [
                  Expanded(
                    flex: 2,
                    child: DropdownButtonFormField<String>(
                      value: _selectedMonth,
                      decoration: const InputDecoration(
                        labelText: "Bill Month (BS)",
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.calendar_month),
                      ),
                      items: _nepaliMonths.map((m) {
                        return DropdownMenuItem(value: m, child: Text(m));
                      }).toList(),
                      onChanged: (val) => setState(() => _selectedMonth = val!),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    flex: 1,
                    child: TextFormField(
                      initialValue: _selectedYear.toString(),
                      decoration: const InputDecoration(
                        labelText: "Year (BS)",
                        border: OutlineInputBorder(),
                      ),
                      keyboardType: TextInputType.number,
                      onChanged: (val) => _selectedYear = int.tryParse(val) ?? _selectedYear,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Amount
              TextFormField(
                controller: _amountController,
                decoration: const InputDecoration(
                  labelText: "Amount (Rs)",
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.attach_money),
                ),
                keyboardType: TextInputType.number,
                validator: (val) {
                  if (val == null || val.isEmpty) return "Required";
                  if (double.tryParse(val) == null) return "Invalid number";
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Dates - Conditional based on energy type
              if (_selectedType == EnergyType.gas) ...[
                // For Gas: Show only Purchase Date
                InkWell(
                  onTap: () => _selectDate(context, false, isPurchase: true),
                  child: InputDecorator(
                    decoration: const InputDecoration(
                      labelText: "Date of Purchase",
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.shopping_cart),
                    ),
                    child: Text(
                      _purchaseDate != null ? NepaliDateHelper.formatToNepali(_purchaseDate!) : "Select Date",
                    ),
                  ),
                ),
              ] else if (_selectedType != EnergyType.food) ...[
                // For Electricity/Water: Show Meter Reading Date and Due Date
                // Food bills have NO date fields
                Row(
                  children: [
                    Expanded(
                      child: InkWell(
                        onTap: () => _selectDate(context, true),
                        child: InputDecorator(
                          decoration: const InputDecoration(
                            labelText: "Meter Reading Date",
                            border: OutlineInputBorder(),
                            prefixIcon: Icon(Icons.speed),
                          ),
                          child: Text(
                            _meterReadingDate != null ? NepaliDateHelper.formatToNepali(_meterReadingDate!) : "Select Date",
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: InkWell(
                        onTap: () => _selectDate(context, false),
                        child: InputDecorator(
                          decoration: const InputDecoration(
                            labelText: "Due Date",
                            border: OutlineInputBorder(),
                            prefixIcon: Icon(Icons.event),
                          ),
                          child: Text(
                            _dueDate != null ? NepaliDateHelper.formatToNepali(_dueDate!) : "Select Date",
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 16),

              // Payment Status
              DropdownButtonFormField<PaymentStatus>(
                value: _paymentStatus,
                decoration: const InputDecoration(
                  labelText: "Payment Status / Mode",
                  border: OutlineInputBorder(),
                ),
                items: PaymentStatus.values.map((s) {
                  return DropdownMenuItem(value: s, child: Text(s.displayName));
                }).toList(),
                onChanged: (val) => setState(() => _paymentStatus = val!),
              ),
              const SizedBox(height: 16),

              // Paid Amount (For Partial)
              if (_paymentStatus.isPartial) ...[
                TextFormField(
                  controller: _paidAmountController,
                  decoration: const InputDecoration(
                    labelText: "Paid Amount (Rs)",
                    border: OutlineInputBorder(),
                    helperText: "Remaining will be calculated automatically",
                  ),
                  keyboardType: TextInputType.number,
                  validator: (val) {
                    if (val == null || val.isEmpty) return "Required";
                    return null;
                  },
                ),
                const SizedBox(height: 16),
              ],
              const SizedBox(height: 16),

              // Remarks (Optional for all types, but especially for food bills)
              TextFormField(
                controller: _remarksController,
                decoration: const InputDecoration(
                  labelText: "Remarks (Optional)",
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.note),
                  hintText: "Add any notes or comments",
                ),
                maxLines: 3,
                keyboardType: TextInputType.multiline,
              ),
              const SizedBox(height: 16),

              // Entered By
              TextFormField(
                controller: _enteredByController,
                decoration: const InputDecoration(
                  labelText: "Entered By",
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.person),
                ),
                readOnly: true, // Auto-filled
              ),
              const SizedBox(height: 24),

              // Full Width Save Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _save,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    backgroundColor: Theme.of(context).primaryColor,
                    foregroundColor: Colors.white,
                  ),
                  child: _isLoading 
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) 
                    : const Text("SAVE BILL", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
