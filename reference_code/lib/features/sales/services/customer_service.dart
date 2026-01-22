import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:uuid/uuid.dart';

/// Model for Customer/Vendor
class Customer {
  final String id;
  final String name;
  final String email;
  final String phone;
  final String address;
  final String remarks;
  final String type; // "Customer" or "Vendor"
  final double totalTransactionAmount; // Total volume of sales/purchases
  
  Customer({
    String? id,
    required this.name,
    required this.email,
    required this.phone,
    required this.address,
    required this.remarks,
    required this.type,
    this.totalTransactionAmount = 0.0,
  }) : id = id ?? const Uuid().v4();
  
  Customer copyWith({
    String? name,
    String? email,
    String? phone,
    String? address,
    String? remarks,
    String? type,
    double? totalTransactionAmount,
  }) {
    return Customer(
      id: id,
      name: name ?? this.name,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      address: address ?? this.address,
      remarks: remarks ?? this.remarks,
      type: type ?? this.type,
      totalTransactionAmount: totalTransactionAmount ?? this.totalTransactionAmount,
    );
  }

  // Convert to Firestore map
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'phone': phone,
      'address': address,
      'remarks': remarks,
      'type': type,
      'totalTransactionAmount': totalTransactionAmount,
    };
  }

  // Create from Firestore map
  factory Customer.fromMap(Map<String, dynamic> map, {String? id}) {
    return Customer(
      id: id ?? map['id'],
      name: map['name'] ?? '',
      email: map['email'] ?? '',
      phone: map['phone'] ?? '',
      address: map['address'] ?? '',
      remarks: map['remarks'] ?? '',
      type: map['type'] ?? 'Customer',
      totalTransactionAmount: (map['totalTransactionAmount'] as num?)?.toDouble() ?? 0.0,
    );
  }

  // Override equality operator to compare by ID
  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Customer && other.id == id;
  }

  // Override hashCode to match equality operator
  @override
  int get hashCode => id.hashCode;
}

/// Service to manage customers and vendors with Firestore persistence
class CustomerService {
  static final CustomerService _instance = CustomerService._internal();
  factory CustomerService() => _instance;
  CustomerService._internal();
  
  final CollectionReference _customersCollection = 
      FirebaseFirestore.instance.collection('customers');
  
  // Local cache for synchronous access
  // Ensure _customers list is always initialized, even after hot reload
  final List<Customer> _customers = [];
  
  // Get customers stream (real-time updates)
  Stream<List<Customer>> getCustomersStream() {
    return _customersCollection.snapshots().map((snapshot) {
      final customers = snapshot.docs.map((doc) {
        return Customer.fromMap(doc.data() as Map<String, dynamic>, id: doc.id);
      }).toList();
      _customers.clear(); // Clear existing cache
      _customers.addAll(customers); // Update cache
      return customers;
    });
  }
  
  // Get all customers (from cache)
  List<Customer> getAllCustomers() {
    return List.unmodifiable(_customers.where((c) => c.type == "Customer"));
  }
  
  // Get all vendors (from cache)
  List<Customer> getAllVendors() {
    return List.unmodifiable(_customers.where((c) => c.type == "Vendor"));
  }
  
  // Get customers by type (from cache)
  List<Customer> getCustomersByType(String type) {
    return List.unmodifiable(_customers.where((c) => c.type == type));
  }
  
  // Add customer to Firestore
  Future<void> addCustomer(Customer customer) async {
    try {
      // Validate: Check for duplicate phone number within the same type
      if (customer.phone.isNotEmpty) {
        final duplicatePhone = _customers.any((c) => 
          c.type == customer.type && 
          c.phone == customer.phone
        );
        
        if (duplicatePhone) {
          throw Exception('A ${customer.type.toLowerCase()} with this phone number already exists');
        }
      }
      
      // Add to local cache immediately for synchronous access
      _customers.add(customer);
      
      // Then persist to Firestore
      await _customersCollection.doc(customer.id).set(customer.toMap());
    } catch (e) {
      // If Firestore fails, remove from local cache
      _customers.removeWhere((c) => c.id == customer.id);
      print('Error adding customer: $e');
      rethrow;
    }
  }
  
  // Update customer in Firestore
  Future<void> updateCustomer(String id, Customer updatedCustomer, {bool cascadeUpdate = true}) async {
    try {
      // Validate: Check for duplicate phone number within the same type (excluding current customer)
      if (updatedCustomer.phone.isNotEmpty) {
        final duplicatePhone = _customers.any((c) => 
          c.id != id &&
          c.type == updatedCustomer.type && 
          c.phone == updatedCustomer.phone
        );
        
        if (duplicatePhone) {
          throw Exception('A ${updatedCustomer.type.toLowerCase()} with this phone number already exists');
        }
      }
      
      // Check if name has changed for cascade update
      final oldCustomer = _customers.firstWhere((c) => c.id == id, orElse: () => updatedCustomer);
      final nameChanged = oldCustomer.name != updatedCustomer.name;
      
      // Update local cache
      final index = _customers.indexWhere((c) => c.id == id);
      if (index != -1) {
        _customers[index] = updatedCustomer;
      }
      
      // Then persist to Firestore
      await _customersCollection.doc(id).set(updatedCustomer.toMap());
      
      // Cascade update: Update customer name in all related records
      if (cascadeUpdate && nameChanged && _onCustomerNameChanged != null) {
        try {
          await _onCustomerNameChanged!(id, updatedCustomer.name);
          print('Cascaded customer name update to all related records');
        } catch (e) {
          print('Warning: Could not cascade update customer name: $e');
          // Don't rethrow - customer update succeeded, cascade is best-effort
        }
      }
    } catch (e) {
      print('Error updating customer: $e');
      rethrow;
    }
  }
  
  // Callback for cascade updates (set by SalesService or other services)
  Future<void> Function(String customerId, String newName)? _onCustomerNameChanged;
  
  // Register callback for customer name changes
  void registerCustomerNameChangeCallback(Future<void> Function(String customerId, String newName) callback) {
    _onCustomerNameChanged = callback;
  }
  
  // Update customer total amount (called by SalesService)
  Future<void> updateCustomerTotal(String name, double newTotal) async {
    try {
      final customer = getCustomerByName(name);
      if (customer != null) {
        // Only update if changed
        if ((customer.totalTransactionAmount - newTotal).abs() > 0.01) {
          final updated = customer.copyWith(totalTransactionAmount: newTotal);
          await updateCustomer(customer.id, updated);
        }
      }
    } catch (e) {
       print('Error updating customer total: $e');
       // Don't rethrow, strictly background task
    }
  }

  // Delete customer from Firestore
  Future<void> deleteCustomer(String id) async {
    await _customersCollection.doc(id).delete();
  }
  
  // Get customer by ID (from cache)
  Customer? getCustomerById(String id) {
    try {
      return _customers.firstWhere((c) => c.id == id);
    } catch (e) {
      return null;
    }
  }
  
  // Get customer by name (from cache)
  Customer? getCustomerByName(String name) {
    try {
      return _customers.firstWhere((c) => c.name == name);
    } catch (e) {
      return null;
    }
  }
}
