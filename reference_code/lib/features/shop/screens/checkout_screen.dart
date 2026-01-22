import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:farm_management_app/features/shop/services/cart_service.dart';
import 'package:farm_management_app/features/sales/services/sales_service.dart';
import 'package:farm_management_app/features/auth/services/auth_service.dart';
import 'package:farm_management_app/features/sales/models/sales_record.dart';
import 'package:farm_management_app/features/inventory/models/stock_entry.dart';
import 'package:farm_management_app/core/models/payment_status.dart';
import 'package:farm_management_app/core/utils/nepali_date_helper.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _deliveryTimeController = TextEditingController();
  final _deliveryDateController = TextEditingController();
  
  DateTime? _selectedDeliveryDate;
  TimeOfDay? _selectedTime;
  
  bool _isLoading = false;
  String _paymentMethod = 'COD';

  @override
  void initState() {
    super.initState();
    // Pre-fill if logged in user is available
    final user = context.read<AuthService>().currentUser;
    if (user != null) {
      _nameController.text = user.name;
      if (user.phoneNumber != null) _phoneController.text = user.phoneNumber!;
      if (user.address != null) _addressController.text = user.address!;
    }
    
    // Default Delivery Date: Today
    final now = DateTime.now();
    _selectedDeliveryDate = now;
    _deliveryDateController.text = NepaliDateHelper.formatToNepali(now);
    
    // Default Time: 5:00 PM
    _selectedTime = const TimeOfDay(hour: 17, minute: 0);
    // Be careful with context usage in initState for formatting, so we'll init text lazily or just use a standard format first
    // simpler to just wait or set it in build if empty? 
    // actually, let's just set a raw string or wait for the user to confirm?
    // User asked "By default it will be 5 pm".
    // We can't easily access MaterialLocalizations in initState. 
    // We'll set the variable and then rely on the build method or logic to ensure the text is consistent.
    // For now, hardcode "5:00 PM" as initial text is safe enough for English locale.
    _deliveryTimeController.text = "5:00 PM";
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _deliveryTimeController.dispose();
    _deliveryDateController.dispose();
    super.dispose();
  }

  Future<void> _placeOrder() async {
    if (!_formKey.currentState!.validate()) return;
    
    final cart = context.read<CartService>();
    if (cart.items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Cart is empty")),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final authService = context.read<AuthService>();
      var user = authService.currentUser;
      
      // If no user, redirect to login (Guest checkout not supported yet per requirements)
      if (user == null) {
        final error = await authService.signInWithGoogle();
        if (error != null) {
           throw Exception(error);
        }
        // Refresh user after login
        user = authService.currentUser;
        if (user == null) throw Exception("User not authenticated");
      }
      
      final salesService = context.read<SalesService>();

      // Update User Profile with new Phone/Address if needed
      // This ensures we capture the data for future
      if (user.phoneNumber != _phoneController.text.trim() || user.address != _addressController.text.trim()) {
        await authService.updateUser(user.id, {
          'phoneNumber': _phoneController.text.trim(),
          'address': _addressController.text.trim(),
        });
      }

      // Create Items List
      final salesItems = cart.items.map((item) {
        return SalesItem(
          productId: item.productId,
          productName: item.productName,
          businessType: item.businessType ?? BusinessType.livestocks, // Fallback safe
          quantity: item.quantity,
          unit: StockUnit.values.firstWhere((e) => e.name == item.unit, orElse: () => StockUnit.pcs),
          priceUnit: item.priceUnit,
          pricePerUnit: item.price,
        );
      }).toList();

      // Create Transaction Record
      // For Online orders, default status is OPEN and paymentStatus depends on method
      // Note: Even for 'Online' payment (QR), we treat it as Pending verification until Admin interacts
      final record = TransactionRecord(
        type: TransactionType.Sale,
        items: salesItems,
        customerId: user.id,
        partyName: _nameController.text.trim(),
        date: DateTime.now(),
        soldBy: "Online Order",
        enteredBy: "Online Shop",
        paymentStatus: PaymentStatus.Pending,
        status: OrderStatus.open, // Always starts as Open for online orders
      );
      
      // Better Party Name Format: "Name - Phone"
      // Appending address to soldBy for context, or just rely on User Profile lookups by Admin
      final partyNameWithContact = "${_nameController.text.trim()} (${_phoneController.text.trim()})";
      
      final finalRecord = record.copyWith(
          partyName: partyNameWithContact,
          soldBy: "Online: ${_paymentMethod} | Deliver: ${_deliveryDateController.text} ${_deliveryTimeController.text.trim()} | ${_addressController.text.trim()}",
          status: OrderStatus.open, // EXPLICITLY force Open, just in case copyWith defaults imply otherwise
      );

      await salesService.addSalesRecord(finalRecord);
      
      // Clear Cart
      cart.clearCart();

      if (mounted) {
        // Show Success Dialog
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (context) => AlertDialog(
            title: const Column(
              children: [
                Icon(Icons.check_circle, color: Colors.green, size: 60),
                SizedBox(height: 16),
                Text("Order Placed!"),
              ],
            ),
            content: const Text(
              "Your order has been placed successfully. We will contact you shortly for confirmation.",
              textAlign: TextAlign.center,
            ),
            actions: [
              TextButton(
                onPressed: () {
                   context.go('/shop');
                },
                child: const Text("Back to Shop"),
              ),
            ],
          ),
        );
      }

    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Error placing order: ${e.toString().replaceAll("Exception: ", "")}"), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartService>();
    final totalAmount = cart.totalAmount;

    return Scaffold(
      appBar: AppBar(
        title: const Text("Checkout", style: TextStyle(color: Colors.black)),
        backgroundColor: Colors.white,
        elevation: 0,
        leading: const BackButton(color: Colors.black),
      ),
      body: _isLoading 
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Order Summary
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade50,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey.shade200),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text("Order Summary", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                          const SizedBox(height: 12),
                          ...cart.items.map((item) => Padding(
                            padding: const EdgeInsets.only(bottom: 8.0),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(child: Text("${item.quantity.toInt()}x ${item.productName}", style: TextStyle(color: Colors.grey.shade700))),
                                Text("Rs ${item.total.toStringAsFixed(0)}", style : const TextStyle(fontWeight: FontWeight.w500)),
                              ],
                            ),
                          )),
                          const Divider(height: 24),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text("Total Payable", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                              Text("Rs ${totalAmount.toStringAsFixed(0)}", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.green.shade800)),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 32),
                    
                    const Text("Delivery Details", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                    const SizedBox(height: 16),
                    
                    TextFormField(
                      controller: _nameController,
                      decoration: InputDecoration(
                        labelText: "Full Name",
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                        prefixIcon: const Icon(Icons.person_outline),
                        filled: true,
                        fillColor: Colors.white,
                      ),
                      validator: (value) => value == null || value.isEmpty ? 'Please enter your name' : null,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _phoneController,
                      decoration: InputDecoration(
                        labelText: "Phone Number",
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                        prefixIcon: const Icon(Icons.phone_outlined),
                        filled: true,
                         fillColor: Colors.white,
                      ),
                      keyboardType: TextInputType.phone,
                      validator: (value) => value == null || value.isEmpty ? 'Please enter your phone number' : null,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _addressController,
                      decoration: InputDecoration(
                        labelText: "Address / Delivery Note",
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                        prefixIcon: const Icon(Icons.location_on_outlined),
                        filled: true,
                         fillColor: Colors.white,
                      ),
                      maxLines: 2,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _deliveryDateController,
                      decoration: InputDecoration(
                        labelText: "Preferred Delivery Date",
                        hintText: "Select Date",
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                        prefixIcon: const Icon(Icons.calendar_today),
                        filled: true,
                        fillColor: Colors.white,
                      ),
                      readOnly: true,
                      onTap: () async {
                        final picked = await NepaliDateHelper.pickNepaliDate(
                          context,
                          initialDate: _selectedDeliveryDate ?? DateTime.now(),
                          firstDate: DateTime.now(), // Cannot pick past dates
                        );
                        if (picked != null) {
                          setState(() {
                            _selectedDeliveryDate = picked;
                             _deliveryDateController.text = NepaliDateHelper.formatToNepali(picked);
                          });
                        }
                      },
                      validator: (value) => value == null || value.isEmpty ? 'Please select a delivery date' : null,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _deliveryTimeController,
                      decoration: InputDecoration(
                        labelText: "Preferred Delivery Time",
                        hintText: "Select Time",
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                        prefixIcon: const Icon(Icons.access_time),
                        filled: true,
                         fillColor: Colors.white,
                      ),
                      readOnly: true,
                      onTap: () async {
                        final TimeOfDay? picked = await showTimePicker(
                          context: context,
                          initialTime: _selectedTime ?? const TimeOfDay(hour: 17, minute: 0),
                        );
                        if (picked != null) {
                          setState(() {
                            _selectedTime = picked;
                            // Format to readable string (e.g., 5:00 PM)
                            final localizations = MaterialLocalizations.of(context);
                            _deliveryTimeController.text = localizations.formatTimeOfDay(picked);
                          });
                        }
                      },
                      validator: (value) => value == null || value.isEmpty ? 'Please select a delivery time' : null,
                    ),
                    
                    const SizedBox(height: 32),
                    const Text("Payment Method", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                    const SizedBox(height: 16),
                    
                    // Cash on Delivery Option
                    InkWell(
                      onTap: () => setState(() => _paymentMethod = 'COD'),
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          border: Border.all(color: _paymentMethod == 'COD' ? Colors.green : Colors.grey.shade300, width: 2),
                          borderRadius: BorderRadius.circular(12),
                          color: _paymentMethod == 'COD' ? Colors.green.shade50 : Colors.transparent,
                        ),
                        child: Row(
                          children: [
                             const Icon(Icons.money, color: Colors.green),
                             const SizedBox(width: 12),
                             const Expanded(
                               child: Column(
                                 crossAxisAlignment: CrossAxisAlignment.start,
                                 children: [
                                   Text("Cash on Delivery (COD)", style: TextStyle(fontWeight: FontWeight.bold, color: Colors.black87)),
                                   Text("Pay when you receive items", style: TextStyle(fontSize: 12, color: Colors.grey)),
                                 ],
                               ),
                             ),
                             if (_paymentMethod == 'COD') const Icon(Icons.check_circle, color: Colors.green),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    
                    // Online Payment Option
                    InkWell(
                      onTap: () => setState(() => _paymentMethod = 'Online'),
                       borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          border: Border.all(color: _paymentMethod == 'Online' ? Colors.green : Colors.grey.shade300, width: 2),
                          borderRadius: BorderRadius.circular(12),
                          color: _paymentMethod == 'Online' ? Colors.green.shade50 : Colors.transparent,
                        ),
                        child: Row(
                          children: [
                             const Icon(Icons.qr_code_2, color: Colors.green),
                             const SizedBox(width: 12),
                             const Expanded(
                               child: Column(
                                 crossAxisAlignment: CrossAxisAlignment.start,
                                 children: [
                                   Text("Online Payment (QR)", style: TextStyle(fontWeight: FontWeight.bold, color: Colors.black87)),
                                   Text("Scan QR code to pay instantly", style: TextStyle(fontSize: 12, color: Colors.grey)),
                                 ],
                               ),
                             ),
                             if (_paymentMethod == 'Online') const Icon(Icons.check_circle, color: Colors.green),
                          ],
                        ),
                      ),
                    ),
                    
                    // QR Code Display
                    if (_paymentMethod == 'Online') ...[
                      const SizedBox(height: 24),
                      Center(
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10)],
                            border: Border.all(color: Colors.grey.shade200),
                          ),
                          child: Column(
                            children: [
                              const Text("Scan to Pay", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                              const SizedBox(height: 12),
                              // Placeholder for actual QR Code image asset
                              Container(
                                width: 200,
                                height: 200,
                                color: Colors.grey.shade200,
                                child: const Icon(Icons.qr_code_scanner, size: 100, color: Colors.grey),
                              ),
                              const SizedBox(height: 8),
                              Text("Amount: Rs ${totalAmount.toStringAsFixed(0)}", style: TextStyle(fontWeight: FontWeight.bold, color: Colors.green.shade800, fontSize: 16)),
                            ],
                          ),
                        ),
                      ),
                    ],


                    const SizedBox(height: 32),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: totalAmount > 0 ? _placeOrder : null,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green.shade800,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          disabledBackgroundColor: Colors.grey.shade300,
                        ),
                        child: const Text("Place Order", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}
