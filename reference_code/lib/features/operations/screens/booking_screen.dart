import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:farm_management_app/core/widgets/custom_card.dart';
import 'package:farm_management_app/features/notifications/widgets/notification_bell.dart';
import 'package:farm_management_app/features/operations/models/booking.dart';
import 'package:farm_management_app/core/utils/nepali_date_helper.dart';

class BookingScreen extends StatefulWidget {
  const BookingScreen({super.key});

  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  final List<Booking> _bookings = [];
  
  final _nameController = TextEditingController();
  final _venueController = TextEditingController();
  final _typeController = TextEditingController();
  final _amountController = TextEditingController();
  DateTime _selectedDate = DateTime.now().add(const Duration(days: 1));

  void _addBooking() {
    if (_nameController.text.isNotEmpty) {
      setState(() {
        _bookings.add(Booking(
          customerName: _nameController.text,
          venueName: _venueController.text,
          type: _typeController.text,
          amount: double.tryParse(_amountController.text) ?? 0.0,
          eventDate: _selectedDate,
        ));
      });
      _nameController.clear();
      Navigator.pop(context);
    }
  }

  Future<void> _pickDate() async {
    final d = await NepaliDateHelper.pickNepaliDate(
      context,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      initialDate: _selectedDate,
    );
    if (d != null) {
      setState(() => _selectedDate = d);
    }
  }

  void _showAddDialog() {
    showDialog(context: context, builder: (c) => StatefulBuilder(
      builder: (context, setState) {
        return AlertDialog(
          title: const Text("New Booking"),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                 TextField(controller: _nameController, decoration: const InputDecoration(labelText: "Customer Name")),
                 const SizedBox(height: 8),
                 TextField(controller: _venueController, decoration: const InputDecoration(labelText: "App Venue")),
                 const SizedBox(height: 8),
                 TextField(controller: _typeController, decoration: const InputDecoration(labelText: "Event Type")),
                 const SizedBox(height: 8),
                 TextField(controller: _amountController, decoration: const InputDecoration(labelText: "Amount"), keyboardType: TextInputType.number),
                 const SizedBox(height: 16),
                 Row(
                   children: [
                     Text("Date: ${NepaliDateHelper.formatToNepaliShort(_selectedDate)}"),
                     const Spacer(),
                     TextButton(onPressed: () async {
                       final d = await NepaliDateHelper.pickNepaliDate(
                          context,
                          firstDate: DateTime.now(),
                          lastDate: DateTime.now().add(const Duration(days: 365)),
                          initialDate: _selectedDate,
                        );
                        if (d != null) setState(() => _selectedDate = d);
                     }, child: const Text("Change"))
                   ],
                 )
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(c), child: const Text("Cancel")),
            ElevatedButton(onPressed: _addBooking, child: const Text("Book")),
          ],
        );
      }
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Venue Bookings"),
        actions: [
          const NotificationBell(),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showAddDialog,
        child: const Icon(Icons.add),
      ),
      body: _bookings.isEmpty
          ? const Center(child: Text("No upcoming bookings"))
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _bookings.length,
              itemBuilder: (context, index) {
                final b = _bookings[index];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: CustomCard(
                    child: ListTile(
                      title: Text(b.venueName),
                      subtitle: Text("${b.customerName} • ${b.type}\n${NepaliDateHelper.formatToNepali(b.eventDate)}"),
                      isThreeLine: true,
                      trailing: Text(
                        "Rs ${b.amount.toStringAsFixed(0)}",
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.green),
                      ),
                    ),
                  ),
                );
              },
            ),
    );
  }
}
