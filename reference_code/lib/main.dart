import 'package:flutter/foundation.dart'; // Added for kDebugMode
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:farm_management_app/core/theme.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart'; // Added
import 'package:firebase_storage/firebase_storage.dart';
import 'package:farm_management_app/firebase_options.dart';
import 'package:farm_management_app/features/dashboard/dashboard_screen.dart';
import 'package:farm_management_app/features/inventory/screens/treatment_log_screen.dart';
import 'package:farm_management_app/features/auth/services/auth_service.dart';
import 'package:farm_management_app/features/auth/models/user_model.dart';
import 'package:farm_management_app/features/sales/screens/sales_screen.dart';
import 'package:farm_management_app/features/inventory/screens/stock_screen.dart';
import 'package:farm_management_app/features/operations/screens/worker_screen.dart';
import 'package:farm_management_app/features/operations/screens/booking_screen.dart';
import 'package:farm_management_app/features/reports/screens/reports_screen.dart';
import 'package:farm_management_app/features/sales/screens/customers_screen.dart';
import 'package:farm_management_app/features/tasks/screens/tasks_screen.dart';
import 'package:farm_management_app/features/auth/screens/user_management_screen.dart';
import 'package:farm_management_app/features/crops/screens/crop_calendar_screen.dart';
import 'package:farm_management_app/features/auth/screens/login_screen.dart';
import 'package:farm_management_app/features/inventory/screens/products_management_screen.dart';
import 'package:farm_management_app/features/inventory/services/product_service.dart';
import 'package:farm_management_app/features/energy/screens/energy_screen.dart';
import 'package:farm_management_app/features/inventory/services/stock_service.dart';
import 'package:farm_management_app/features/sales/services/sales_service.dart';
import 'package:farm_management_app/features/tasks/services/task_service.dart';
import 'package:farm_management_app/features/energy/services/energy_service.dart';
import 'package:farm_management_app/features/notifications/services/notification_service.dart';
import 'package:farm_management_app/features/sales/services/customer_service.dart';

import 'package:farm_management_app/core/services/version_service.dart';
import 'package:farm_management_app/core/services/migration_service.dart';
import 'package:farm_management_app/core/services/seeder.dart'; // Temporary import


import 'package:farm_management_app/features/shop/screens/shop_screen.dart'; // Added
import 'package:farm_management_app/features/shop/screens/cart_screen.dart'; // Added
import 'package:farm_management_app/features/shop/screens/checkout_screen.dart';
import 'package:farm_management_app/features/orders/screens/orders_screen.dart'; // Added
import 'package:farm_management_app/features/shop/services/cart_service.dart'; // Added
import 'package:farm_management_app/features/dashboard/screens/pending_payments_screen.dart'; // Added


// Placeholder for screens yet to be created, to allow compilation
class PlaceholderScreen extends StatelessWidget {
  final String title;
  const PlaceholderScreen({super.key, required this.title});
  @override
  Widget build(BuildContext context) => Scaffold(appBar: AppBar(title: Text(title)), body: Center(child: Text(title)));
}

void main() async {
  print("Main: Starting app initialization...");
  WidgetsFlutterBinding.ensureInitialized();
  
  // Lock orientation to portrait
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  
  try {
    print("Main: Initializing Firebase...");
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    ).timeout(const Duration(seconds: 10));
    
    // Emulator Setup
    if (kDebugMode) {
      try {
        print("Main: Configuring Firebase Emulators...");
        // Use '10.0.2.2' for Android emulator, 'localhost' for iOS/Web
        // For simplicity in this specific "flutter run -d chrome" scenario, we use localhost.
        // A more robust app might detect the platform.
        const emulatorHost = 'localhost'; 
        
        await FirebaseAuth.instance.useAuthEmulator(emulatorHost, 9099);
        FirebaseFirestore.instance.useFirestoreEmulator(emulatorHost, 8080);
        await FirebaseStorage.instance.useStorageEmulator(emulatorHost, 9199);
        
        print("------------------------------------------------------------------");
        print("   Running in DEBUG MODE - Connected to Firebase Emulators        ");
        print("   Auth: $emulatorHost:9099 | Firestore: $emulatorHost:8080       ");
        print("   Storage: $emulatorHost:9199                                    ");
        print("------------------------------------------------------------------");
      } catch (e) {
        print("Main: Failed to connect to emulators: $e");
      }
    }
    
    // Enable offline persistence
    FirebaseFirestore.instance.settings = const Settings(
      persistenceEnabled: true, 
      cacheSizeBytes: Settings.CACHE_SIZE_UNLIMITED
    );
    
    print("Main: Firebase initialized.");
  } catch (e) {
    print("Main: Firebase initialization failed or timed out: $e");
  }
  
  // Run remaining initialization in background or with short timeouts
  // We want to get to runApp() as quickly as possible
  
  print("Main: Restoring session...");
  try {
    // DO NOT await session restoration in main() to prevent white screen hang.
    // The router and individual widgets will handle the auth state reactively.
    AuthService().restoreSession();
    print("Main: Session restoration initiated.");
  } catch (e) {
    print("Main: Session restoration error: $e");
  }

  print("Main: Seeding data (background)...");
  // Don't await seeding, let it happen in background
  ProductService().seedInitialProducts().catchError((e) {
    print("Main: Seeding failed: $e");
  });

  print("Main: Running one-time migrations (background)...");
  MigrationService().runStockMigration();
  MigrationService().correctEggsStock();
  MigrationService().runCustomerMigration();
  
  print("Main: Checking version (background)...");
  // Version check is already non-blocking
  VersionService.checkAndRefreshIfNeeded();
  
  print("Main: Calling runApp...");
  runApp(const FarmApp());
  print("Main: runApp called.");
}

final _router = GoRouter(
  initialLocation: '/shop', // Default to shop
  refreshListenable: AuthService(), // Listen to auth changes
  redirect: (context, state) {
    final authService = AuthService();
    final isLoggedIn = authService.currentUser != null;
    final isLoggingIn = state.matchedLocation == '/login';
    final isShop = state.matchedLocation == '/shop';

    // If user is logged in and trying to access login, redirect based on role
    if (isLoggedIn && isLoggingIn) {
      if (authService.currentUser?.role == UserRole.customer) {
        return '/shop';
      }
      return '/';
    }

    final isCart = state.matchedLocation == '/cart';

    // If user is NOT logged in:
    if (!isLoggedIn) {
      // Allow access to Shop, Login, Cart, and Checkout
      if (isShop || isLoggingIn || isCart || state.matchedLocation == '/checkout') {
        return null; 
      }
      // Redirect everything else to Shop
      return '/shop';
    }

    // Role-based Access Control
    if (isLoggedIn && authService.currentUser?.role == UserRole.customer) {
      // Customers cannot access the main dashboard ('/')
      // We should probably check if the path is restricted.
      // For now, if they try to hit '/', send them to '/shop'.
      // Allowed paths for customers: /shop, /cart, /checkout, /orders, /customers (profile?), /sales (maybe not)?
      // For simplicity, explicitly block '/'
      if (state.matchedLocation == '/') {
        return '/shop';
      }
    }

    // No redirect needed for other cases
    return null;
  },
  routes: [
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/shop', // Public Shop Route
      builder: (context, state) => const ShopScreen(),
    ),
    GoRoute(
      path: '/',
      builder: (context, state) => const DashboardScreen(),
    ),
    GoRoute(
      path: '/treatment-log',
      builder: (context, state) => const TreatmentLogScreen(), 
    ),
    GoRoute(
      path: '/harvest-log',
      builder: (context, state) => const StockScreen(), 
    ),
    GoRoute(
      path: '/workers',
      builder: (context, state) => const WorkerScreen(),
    ),
    GoRoute(
      path: '/bookings',
      builder: (context, state) => const BookingScreen(),
    ),
    GoRoute(
      path: '/sales',
      builder: (context, state) {
        final index = state.extra as int? ?? 0;
        return SalesScreen(initialIndex: index);
      },
    ),
    GoRoute(
      path: '/reports',
      builder: (context, state) => const ReportsScreen(),
    ),
    GoRoute(
      path: '/customers',
      builder: (context, state) => const CustomersScreen(),
    ),
    GoRoute(
      path: '/crop-calendar',
      builder: (context, state) => const CropCalendarScreen(),
    ),

    GoRoute(
      path: '/tasks',
      builder: (context, state) => const TasksScreen(),
    ),
    GoRoute(
      path: '/products',
      builder: (context, state) => const ProductsManagementScreen(),
    ),
    GoRoute(
      path: '/admin-users',
      builder: (context, state) => const UserManagementScreen(),
    ),
    GoRoute(
      path: '/energy',
      builder: (context, state) => const EnergyScreen(),
    ),
    // Shop Routes
    GoRoute(
      path: '/cart',
      builder: (context, state) => const CartScreen(),
    ),
    GoRoute(
      path: '/checkout',
      builder: (context, state) => const CheckoutScreen(),
    ),
    GoRoute(
      path: '/orders',
      builder: (context, state) => const OrdersScreen(),
    ),
    GoRoute(
      path: '/pending-payments',
      builder: (context, state) => const PendingPaymentsScreen(),
    ),
  ],
  errorBuilder: (context, state) => Scaffold(
    appBar: AppBar(title: const Text('Navigation Error')),
    body: Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, color: Colors.red, size: 64),
          const SizedBox(height: 16),
          Text('Error: ${state.error}'),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => context.go('/'),
            child: const Text('Go Home'),
          ),
        ],
      ),
    ),
  ),
);

class FarmApp extends StatelessWidget {
  const FarmApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthService()),
        ChangeNotifierProvider(create: (_) => CartService()), // Added CartService
        Provider(create: (_) => ProductService()),
        Provider(create: (_) => StockService()), 
        Provider(create: (_) => CustomerService()),
        
        // SalesService depends on StockService and AuthService
        ProxyProvider2<StockService, AuthService, SalesService>(
          update: (_, stockService, authService, __) => SalesService(
            stockService: stockService, 
            authService: authService,
          ),
        ),
        
        // TaskService depends on AuthService
        ProxyProvider<AuthService, TaskService>(
          update: (_, authService, __) => TaskService(authService: authService),
        ),
        
        Provider(create: (_) => EnergyService()),
        Provider(create: (_) => NotificationService()..initialize()),
      ],
      child: MaterialApp.router(
        title: 'Greenbird',
        theme: FarmTheme.lightTheme,
        routerConfig: _router,
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}
