import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:farm_management_app/features/energy/models/energy_bill.dart';
import 'package:farm_management_app/features/notifications/services/notification_service.dart';
import 'package:farm_management_app/features/notifications/models/notification_model.dart';
import 'package:farm_management_app/features/auth/services/auth_service.dart'; // Added

class EnergyService {
  // Singleton for state persistence across screen reloads
  static final EnergyService _instance = EnergyService._internal();
  factory EnergyService() => _instance;
  EnergyService._internal() {
    _billsController = StreamController<List<EnergyBill>>.broadcast(
      onListen: () {
        _billsController.add(List.from(_localBills));
      },
    );
    _init();
  }

  StreamSubscription? _subscription;
  int _currentLimit = 20;

  final CollectionReference _energyCollection = FirebaseFirestore.instance.collection('energy_bills');
  final NotificationService _notificationService = NotificationService(); 
  final AuthService _authService = AuthService(); // Access Auth Service

  late final StreamController<List<EnergyBill>> _billsController;
  final List<EnergyBill> _localBills = [];
  bool _isFallbackMode = false;

  void _init() {
    _startListening();
  }

  void _startListening() {
    _subscription?.cancel();
    _subscription = _energyCollection
        .orderBy('entryDate', descending: true)
        .limit(_currentLimit)
        .snapshots()
        .listen(
      (snapshot) {
        _localBills.clear(); // Reset local on fresh sync or limit change
        for (var doc in snapshot.docs) {
          try {
            _localBills.add(EnergyBill.fromMap(doc.data() as Map<String, dynamic>, doc.id));
          } catch (e) {
            print("Error parsing bill ${doc.id}: $e");
          }
        }
        _billsController.add(List.from(_localBills));
        _isFallbackMode = false; // We have a connection
      },
      onError: (e) {
        print("EnergyService: Firestore Error (Switching to offline/local mode): $e");
        _isFallbackMode = true;
        // Don't clear local bills, just keep what we have (or started with)
        _billsController.add(List.from(_localBills));
      },
    );
  }

  Future<void> loadMore() async {
    if (_isFallbackMode) return; // Cannot load more in offline mode
    _currentLimit += 20;
    _startListening();
  }

  Future<void> refresh() async {
    _startListening();
  }

  // Stream of energy bills (merges Firestore & Local)
  Stream<List<EnergyBill>> getBillsStream() {
    return _billsController.stream;
  }
  
  // Current bills for synchronous initial data
  List<EnergyBill> get currentBills => List.unmodifiable(_localBills);

  // Add new bill
  Future<void> addBill(EnergyBill bill) async {
    // Add to local immediately for responsiveness
    _localBills.insert(0, bill);
    _billsController.add(List.from(_localBills));

    final currentUser = _authService.currentUser?.name ?? "Unknown User";

    // Optimistic notification
    await _notificationService.createNotification(
      title: 'New Energy Bill Added',
      body: '${bill.type.displayName} Bill for ${bill.month} has been added by $currentUser.',
      type: NotificationType.info,
      relatedEntityId: bill.id,
      route: '/energy',
    );

    try {
      print("EnergyService: Adding bill to Cloud...");
      final docRef = await _energyCollection.add(bill.toMap());
      print("EnergyService: Bill added with ID: ${docRef.id}");
      
    } catch (e) {
      print("Error adding energy bill to Cloud: $e");
      print("Message: Falling back to local storage for this session.");
      _isFallbackMode = true;
    }
  }

  // Update existing bill
  Future<void> updateBill(EnergyBill bill) async {
    // Update local
    final index = _localBills.indexWhere((b) => b.id == bill.id);
    if (index != -1) {
      _localBills[index] = bill;
      _billsController.add(List.from(_localBills));
    }

    final currentUser = _authService.currentUser?.name ?? "Unknown User";
    
    // Determine action description based on status
    String action = "updated";
    if (bill.paymentStatus.isPaid) {
      action = "paid and updated";
    }

    await _notificationService.createNotification(
      title: 'Energy Bill Updated',
      body: '${bill.type.displayName} Bill for ${bill.month} has been $action by $currentUser.',
      type: NotificationType.info,
      relatedEntityId: bill.id,
      route: '/energy',
    );

    try {
      if (!_isFallbackMode) {
        await _energyCollection.doc(bill.id).update(bill.toMap());
      }
    } catch (e) {
      print("Error updating energy bill on Cloud: $e");
      _isFallbackMode = true;
    }
  }

  // Delete bill
  Future<void> deleteBill(String id) async {
     // Remove local
    _localBills.removeWhere((b) => b.id == id);
    _billsController.add(List.from(_localBills));

    final currentUser = _authService.currentUser?.name ?? "Unknown User";

    await _notificationService.createNotification(
      title: 'Energy Bill Deleted',
      body: 'An Energy Bill has been deleted by $currentUser.',
      type: NotificationType.warning,
      relatedEntityId: id,
    );

    try {
      if (!_isFallbackMode) {
        await _energyCollection.doc(id).delete();
      }
    } catch (e) {
      print("Error deleting energy bill on Cloud: $e");
      _isFallbackMode = true;
    }
  }
}
