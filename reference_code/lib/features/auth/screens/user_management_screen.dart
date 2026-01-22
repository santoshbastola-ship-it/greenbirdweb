import 'package:flutter/material.dart';
import 'package:farm_management_app/features/auth/models/user_model.dart';
import 'package:farm_management_app/features/auth/services/auth_service.dart';
import 'package:farm_management_app/core/widgets/custom_card.dart';
import 'package:farm_management_app/features/notifications/widgets/notification_bell.dart';
import 'package:url_launcher/url_launcher.dart';

class UserManagementScreen extends StatefulWidget {
  const UserManagementScreen({super.key});

  @override
  State<UserManagementScreen> createState() => _UserManagementScreenState();
}

class _UserManagementScreenState extends State<UserManagementScreen> {
  // Mock Users
  final List<UserModel> _users = [
    UserModel(id: '1', email: 'admin@farm.com', name: 'Greenbird Admin', role: UserRole.admin, createdAt: DateTime.now()),
    UserModel(id: '2', email: 'manager@farm.com', name: 'Farm Manager', role: UserRole.manager, createdAt: DateTime.now().subtract(const Duration(days: 5))),
  ];

  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  UserRole _selectedRole = UserRole.manager;
  final AuthService _authService = AuthService();

  @override
  void initState() {
    super.initState();
    _searchController.addListener(() {
      setState(() {
        _searchQuery = _searchController.text.toLowerCase();
      });
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _inviteUser() async {
    if (_nameController.text.isNotEmpty && _emailController.text.isNotEmpty) {
      final email = _emailController.text;
      final name = _nameController.text;
      
      try {
        await _authService.inviteUser(email, name, _selectedRole);
        
        if (!mounted) return;
        
        _nameController.clear();
        _emailController.clear();
        _selectedRole = UserRole.manager;
        Navigator.pop(context);
        
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('User Invited successfully.')),
        );

        // Launch Email App
        final Uri emailLaunchUri = Uri(
          scheme: 'mailto',
          path: email,
          query: 'subject=Invitation to Greenbird&body=Hello $name,\n\nYou have been invited to join the Greenbird Farm Management App as a ${_selectedRole.displayName}.\n\nPlease login using this email address.',
        );
        launchUrl(emailLaunchUri);
        
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error inviting user: $e')),
        );
      }
    }
  }

  void _showCreateDialog() {
    showDialog(context: context, builder: (c) => StatefulBuilder(
      builder: (context, setState) {
        return AlertDialog(
          title: const Text("Invite New User"),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(controller: _nameController, decoration: const InputDecoration(labelText: "Full Name", prefixIcon: Icon(Icons.person))),
                const SizedBox(height: 12),
                TextField(controller: _emailController, decoration: const InputDecoration(labelText: "Email Address (Gmail)", prefixIcon: Icon(Icons.email))),
                const SizedBox(height: 12),
                DropdownButtonFormField<UserRole>(
                  initialValue: _selectedRole,
                  decoration: const InputDecoration(labelText: "Assign Role"),
                  items: UserRole.values.map((role) => DropdownMenuItem(
                    value: role, 
                    child: Text(role.displayName),
                  )).toList(),
                  onChanged: (v) => setState(() => _selectedRole = v!),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(c), child: const Text("Cancel")),
            ElevatedButton(onPressed: _inviteUser, child: const Text("Invite User")),
          ],
        );
      }
    ));
  }
  void _showEditDialog(UserModel user) {
    _nameController.text = user.name; // Keep name editable if needed
    _selectedRole = user.role;
    
    showDialog(context: context, builder: (c) => StatefulBuilder(
      builder: (context, setState) {
        return AlertDialog(
          title: const Text("Edit User"),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(controller: _nameController, decoration: const InputDecoration(labelText: "Full Name", prefixIcon: Icon(Icons.person))),
                const SizedBox(height: 12),
                DropdownButtonFormField<UserRole>(
                  value: _selectedRole,
                  decoration: const InputDecoration(labelText: "Assign Role"),
                  items: UserRole.values.map((role) => DropdownMenuItem(
                    value: role, 
                    child: Text(role.displayName),
                  )).toList(),
                  onChanged: (v) => setState(() => _selectedRole = v!),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(c), child: const Text("Cancel")),
            ElevatedButton(onPressed: () async {
              try {
                // Update Name and Role
                await _authService.updateUser(user.id, {
                  'name': _nameController.text,
                  'role': _selectedRole.name, // Use .name for enum string
                });
                if (mounted) {
                  Navigator.pop(c);
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('User updated successfully')));
                }
              } catch (e) {
                 if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
              }
            }, child: const Text("Save Changes")),
          ],
        );
      }
    ));
  }
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("User Management"),
        actions: [
          const NotificationBell(),
        ],
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search by name, email, role...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                        },
                      )
                    : null,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
            ),
          ),
          Expanded(
            child: StreamBuilder<List<UserModel>>(
              stream: _authService.getUsersStream(),
              builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          
          if (snapshot.hasError) {
             return Center(child: Text("Error: ${snapshot.error}"));
          }

          final users = snapshot.data ?? [];

          // Apply search filter
          List<UserModel> filteredUsers = users;
          if (_searchQuery.isNotEmpty) {
            filteredUsers = users.where((u) {
              // Search in name
              if (u.name.toLowerCase().contains(_searchQuery)) return true;
              
              // Search in email
              if (u.email.toLowerCase().contains(_searchQuery)) return true;
              
              // Search in role
              if (u.role.displayName.toLowerCase().contains(_searchQuery)) return true;
              
              return false;
            }).toList();
          }

          if (filteredUsers.isEmpty && _searchQuery.isNotEmpty) {
            return const Center(child: Text("No results found"));
          }

          if (filteredUsers.isEmpty) {
            return const Center(child: Text("No users found."));
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: filteredUsers.length,
            itemBuilder: (context, index) {
              final user = filteredUsers[index];
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: CustomCard(
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: _getRoleColor(user.role).withOpacity(0.2),
                      child: Icon(Icons.person, color: _getRoleColor(user.role)),
                    ),
                    title: Text(user.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text("${user.email}\n${user.role.displayName}"),
                    isThreeLine: true,
                      trailing: PopupMenuButton(
                        itemBuilder: (context) => [
                          const PopupMenuItem(value: 'edit', child: Text('Edit Role')),
                          PopupMenuItem(
                            value: 'delete', 
                            textStyle: TextStyle(color: user.isActive ? Colors.red : Colors.green), 
                            child: Text(user.isActive ? 'Deactivate' : 'Activate')
                          ),
                        ],
                        onSelected: (value) async {
                          if (value == 'edit') {
                            _showEditDialog(user);
                          } else if (value == 'delete') {
                            await _authService.toggleUserStatus(user.id, !user.isActive);
                          }
                        },
                      ),
                  ),
                ),
              );
            },
          );
        },
      ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showCreateDialog,
        icon: const Icon(Icons.person_add),
        label: const Text("Add User"),
      ),
    );
  }

  Color _getRoleColor(UserRole role) {
    switch (role) {
      case UserRole.admin: return Colors.purple;
      case UserRole.manager: return Colors.orange;
      case UserRole.customer: return Colors.blue;
    }
  }
}
