import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:flutter/foundation.dart'; // For ChangeNotifier
import 'package:farm_management_app/features/auth/models/user_model.dart';
import 'package:farm_management_app/core/services/form_state_service.dart';

class AuthService extends ChangeNotifier {
  // Singleton pattern
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  late FirebaseAuth _auth = FirebaseAuth.instance;
  late GoogleSignIn _googleSignIn = GoogleSignIn();
  late FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // For Testing
  void setDependencies({
    required FirebaseAuth auth,
    required GoogleSignIn googleSignIn,
    required FirebaseFirestore firestore,
  }) {
    _auth = auth;
    _googleSignIn = googleSignIn;
    _firestore = firestore;
  }

  UserModel? _currentUser;
  UserModel? get currentUser => _currentUser;

  // Collection reference
  CollectionReference get _usersCollection => _firestore.collection('users');

  // Sign In with Google
  // 1. Trigger Google Sign In Flow
  // 2. Get Credential
  // 3. Check if email is in 'users' collection (Allowlist)
  // 4. If yes, signInWithCredential to Firebase
  Future<String?> signInWithGoogle() async {
    try {
      // 1. Trigger Google Sign In
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      if (googleUser == null) return "Sign in canceled by user"; 

      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
      final AuthCredential credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      // 2. Sign In to Firebase FIRST to establish "Auth" context
      // This allows us to query Firestore if rules require "auth != null"
      final UserCredential userCredential = await _auth.signInWithCredential(credential);
      final User? firebaseUser = userCredential.user;

      if (firebaseUser == null || firebaseUser.email == null) {
        await signOut();
        return "Authentication failed: No Firebase user or email found.";
      }

      // 3. User Lookup (or Auto-Register)
      final QuerySnapshot result = await _usersCollection
          .where('email', isEqualTo: firebaseUser.email)
          .limit(1)
          .get();

      if (result.docs.isEmpty) {
        // Auto-register as Customer
        final newUser = UserModel(
          id: '', // Firestore generates ID, but we need to wait for .add()
          email: firebaseUser.email!,
          name: firebaseUser.displayName ?? "New User",
          role: UserRole.customer,
          createdAt: DateTime.now(),
        );

        // Add to collection
        final docRef = await _usersCollection.add(newUser.toMap());
        
        // Fetch back to have full object with ID
        final doc = await docRef.get();
        _currentUser = UserModel.fromMap(doc.data() as Map<String, dynamic>, doc.id);
      
      } else {
        // Existing User
        final doc = result.docs.first;
        final userData = doc.data() as Map<String, dynamic>;
        final user = UserModel.fromMap(userData, doc.id);

        if (!user.isActive) {
           await signOut(); 
           return "Access Denied: Your account is inactive.";
        }
        _currentUser = user;
      }
      notifyListeners();
      return null; // Success (no error)

    } catch (e) {
      print("AuthService: Google Sign In Error: $e");
      await signOut();
      return "Login Error: $e";
    }
  }


  // Debug: Switch Role
  void debugSwitchRole(UserRole newRole) {
    if (_currentUser != null) {
      _currentUser = _currentUser!.copyWith(role: newRole);
      print("AuthService: Debug switched role to ${newRole.name}");
      notifyListeners();
    } else {
      // Create valid dummy user if not logged in
      _currentUser = UserModel(
        id: 'debug_switched_guest',
        email: 'debug_guest@greenbird.com',
        name: 'Debug Guest (${newRole.name})',
        role: newRole,
        createdAt: DateTime.now(),
      );
      print("AuthService: Debug switched Guest to ${newRole.name}");
      notifyListeners();
    }
  }

  Future<void> restoreSession() async {
    if (kDebugMode) {
      print("AuthService: Debug mode detected.");
      try {
        if (_auth.currentUser == null) {
          print("AuthService: Signing in anonymously for Emulator access...");
          await _auth.signInAnonymously();
        }
      } catch (e) {
        print("AuthService: Debug login failed: $e");
      }

      _currentUser = UserModel(
        id: _auth.currentUser?.uid ?? 'debug_user_id',
        email: 'debug@greenbird.com',
        name: 'Debug Admin',
        role: UserRole.admin,
        createdAt: DateTime.now(),
      );
      notifyListeners();
      return; 
    }

    final firebaseUser = _auth.currentUser;
    if (firebaseUser != null && firebaseUser.email != null) {
      try {
        // Add timeout to prevent blocking app startup
        await _usersCollection
            .where('email', isEqualTo: firebaseUser.email)
            .limit(1)
            .get()
            .timeout(
              const Duration(seconds: 3),
              onTimeout: () {
                print("AuthService: Session restore timed out");
                return Future.error('Timeout');
              },
            )
            .then((QuerySnapshot result) {
              if (result.docs.isNotEmpty) {
                final doc = result.docs.first;
                _currentUser = UserModel.fromMap(doc.data() as Map<String, dynamic>, doc.id);
                print("AuthService: Session restored for ${_currentUser?.email}");
                notifyListeners();
              } else {
                // User authenticated in Firebase but removed from DB?
                // Auto-register here too?
                // For simplicity, if session exists but no DB, sign them out to trigger re-login flow which handles creation.
                print("AuthService: User found in Auth but not in DB. Signing out to trigger registration.");
                signOut();
              }
            });
      } catch (e) {
        print("AuthService: Failed to restore session: $e");
        // Don't block app startup on error
      }
    }
  }

  Future<void> signOut() async {
    _currentUser = null;
    
    // Clear all saved form drafts on logout
    await FormStateService().clearAllFormStates();
    
    await _googleSignIn.signOut();
    await _auth.signOut();
    notifyListeners();
  }

  // Admin: Invite User (Add to Firestore)
  Future<void> inviteUser(String email, String name, UserRole role) async {
    // Check if exists
    final QuerySnapshot existing = await _usersCollection
        .where('email', isEqualTo: email)
        .limit(1)
        .get();

    if (existing.docs.isEmpty) {
      final newUser = UserModel(
        id: '', // Generated by Firestore
        email: email,
        name: name,
        role: role,
        createdAt: DateTime.now(),
      );
      
      await _usersCollection.add(newUser.toMap());
    } else {
      print("AuthService: User $email already exists.");
    }
  }

  // Stream of users for management screen
  Stream<List<UserModel>> getUsersStream() {
    return _usersCollection.snapshots().map((snapshot) {
      return snapshot.docs.map((doc) {
        return UserModel.fromMap(doc.data() as Map<String, dynamic>, doc.id);
      }).toList();
    });
  }

  // One-off fetch for dropdowns
  Future<List<UserModel>> getUsers() async {
    final snapshot = await _usersCollection.get();
    return snapshot.docs.map((doc) {
      return UserModel.fromMap(doc.data() as Map<String, dynamic>, doc.id);
    }).toList();
  }
  // Update User Details (Name, Role)
  Future<void> updateUser(String uid, Map<String, dynamic> data) async {
    await _usersCollection.doc(uid).update(data);
  }

  // Toggle User Active Status
  Future<void> toggleUserStatus(String uid, bool isActive) async {
    await _usersCollection.doc(uid).update({'isActive': isActive});
  }

  // Development Login Mode
  Future<void> loginAsRole(UserRole role) async {
    // Ensure we have a valid Firebase Auth token (Anonymous) for Firestore rules
    if (_auth.currentUser == null) {
      try {
        await _auth.signInAnonymously();
      } catch (e) {
        print("AuthService: Anonymous login failed: $e");
        // Proceed anyway? If we don't, we can't access DB. 
        // Likely we should return/throw, but generic error handling might catch it or UI will show broken state.
        // For now, let's continue to set local user so app doesn't crash, but data loading will fail.
      }
    }

    _currentUser = UserModel(
      id: _auth.currentUser?.uid ?? 'dev_${role.name}_id',
      email: '${role.name}@dev.com',
      name: 'Dev ${role.displayName}',
      role: role,
      createdAt: DateTime.now(),
    );
    notifyListeners();
  }
}
