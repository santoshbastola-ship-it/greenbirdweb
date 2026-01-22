import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:farm_management_app/features/auth/services/auth_service.dart';
import 'package:farm_management_app/features/auth/models/user_model.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  bool _isLoading = false;

  Future<void> _handleLogin() async {
    setState(() => _isLoading = true);
    
    final errorMsg = await context.read<AuthService>().signInWithGoogle();
    
    setState(() => _isLoading = false);

    if (errorMsg == null) {
      // Success
      if (mounted) context.go('/'); // Go to Dashboard
    } else {
      // Failure
      if (mounted) {
        if (errorMsg != "Sign in canceled by user") {
           ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(errorMsg),
              backgroundColor: Colors.red,
              duration: const Duration(seconds: 5),
            ),
          );
        }
      }
    }
  }

  Future<void> _handleDevLogin(UserRole role) async {
    setState(() => _isLoading = true);
    await context.read<AuthService>().loginAsRole(role);
    setState(() => _isLoading = false);
    
    if (mounted) {
      final user = context.read<AuthService>().currentUser;
      if (user?.role == UserRole.customer) {
        context.go('/shop');
      } else {
        context.go('/');
      }
    }
  }


  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Logo
              Container(
                height: 120,
                width: 120,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  image: DecorationImage(
                    image: AssetImage('assets/images/logo.jpg'),
                    fit: BoxFit.cover,
                  ),
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                "Greenbird",
                style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.green),
              ),
              const Text(
                "Farm Management",
                style: TextStyle(fontSize: 16, color: Colors.grey),
              ),
              const SizedBox(height: 48),
              
              // if (_isLoading)
              //   const CircularProgressIndicator()
              // else
              //   SizedBox(
              //     width: double.infinity,
              //     height: 50,
              //     child: ElevatedButton.icon(
              //       onPressed: _handleLogin,
              //       icon: const Icon(Icons.login),
              //       label: const Text("Sign in with Google"),
              //       style: ElevatedButton.styleFrom(
              //         backgroundColor: Colors.white,
              //         foregroundColor: Colors.black,
              //         elevation: 2,
              //         side: const BorderSide(color: Colors.grey),
              //       ),
              //     ),
              //   ),
                
              // const SizedBox(height: 24),
              
              // Development Mode Login
              const Text(
                "Development Login",
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => _handleDevLogin(UserRole.admin),
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                  child: const Text("Login as Admin", style: TextStyle(color: Colors.white)),
                ),
              ),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => _handleDevLogin(UserRole.manager),
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.blue),
                  child: const Text("Login as Manager", style: TextStyle(color: Colors.white)),
                ),
              ),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => _handleDevLogin(UserRole.customer),
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                  child: const Text("Login as Customer", style: TextStyle(color: Colors.white)),
                ),
              ),
              const Text(
                "Note: You must be invited by an Administrator to access this app.",
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
