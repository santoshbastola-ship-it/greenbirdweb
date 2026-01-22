import 'package:cloud_firestore/cloud_firestore.dart';

enum UserRole {
  admin,
  manager,
  customer;

  String get displayName {
    switch (this) {
      case UserRole.admin: return 'Administrator';
      case UserRole.manager: return 'Farm Manager';
      case UserRole.customer: return 'Customer';
    }
  }
}

class UserModel {
  final String id;
  final String email;
  final String name;
  final UserRole role; // admin or manager
  final DateTime createdAt;
  final bool isActive;
  final String? phoneNumber;
  final String? address;

  UserModel({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    required this.createdAt,
    this.isActive = true,
    this.phoneNumber,
    this.address,
  });

  factory UserModel.fromMap(Map<String, dynamic> data, String documentId) {
    DateTime? created;
    if (data['createdAt'] is String) {
      created = DateTime.tryParse(data['createdAt']);
    } else if (data['createdAt'] is Timestamp) { // Firestore Timestamp
      created = (data['createdAt'] as Timestamp).toDate();
    }

    return UserModel(
      id: documentId,
      email: data['email'] ?? '',
      name: data['name'] ?? '',
      role: UserRole.values.firstWhere(
        (e) => e.name == (data['role'] ?? 'manager'),
        orElse: () => UserRole.manager,
      ),
      createdAt: created ?? DateTime.now(),
      isActive: data['isActive'] ?? true,
      phoneNumber: data['phoneNumber'],
      address: data['address'],
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'email': email,
      'name': name,
      'role': role.name,
      'createdAt': createdAt.toIso8601String(),
      'isActive': isActive,
      'phoneNumber': phoneNumber,
      'address': address,
    };
  }
  
  // CopyWith
  UserModel copyWith({
    String? id,
    String? email,
    String? name,
    UserRole? role,
    DateTime? createdAt,
    bool? isActive,
    String? phoneNumber,
    String? address,
  }) {
    return UserModel(
      id: id ?? this.id,
      email: email ?? this.email,
      name: name ?? this.name,
      role: role ?? this.role,
      createdAt: createdAt ?? this.createdAt,
      isActive: isActive ?? this.isActive,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      address: address ?? this.address,
    );
  }

  // Permissions
  bool get canViewDashboard => role == UserRole.admin;
  bool get canManageUsers => role == UserRole.admin;
  bool get canDeleteRecords => role == UserRole.admin;
  bool get canViewFullHistory => role == UserRole.admin;
}
