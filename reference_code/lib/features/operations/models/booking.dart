import 'package:uuid/uuid.dart';

class Booking {
  final String id;
  final String customerName;
  final String venueName; // e.g., "Main Barn", "Field A"
  final DateTime eventDate;
  final String type; // Wedding, Visit, etc.
  final double amount;
  
  Booking({
    String? id,
    required this.customerName,
    required this.venueName,
    required this.eventDate,
    required this.type,
    required this.amount,
  }) : id = id ?? const Uuid().v4();
}
