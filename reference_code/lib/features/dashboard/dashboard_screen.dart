import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:farm_management_app/core/widgets/custom_card.dart';
import 'package:farm_management_app/core/widgets/notification_list.dart';
import 'package:farm_management_app/features/notifications/widgets/notification_bell.dart';
import 'package:package_info_plus/package_info_plus.dart';

import 'package:flutter/foundation.dart' show kIsWeb, kDebugMode;
import 'package:universal_html/html.dart' as html;
import 'package:farm_management_app/features/dashboard/widgets/sales_graph.dart';
import 'package:farm_management_app/features/dashboard/widgets/livestock_pie_chart.dart';
import 'package:farm_management_app/features/dashboard/widgets/pending_payments_section.dart';
import 'package:farm_management_app/features/dashboard/widgets/pending_orders_section.dart';
import 'package:farm_management_app/features/auth/services/auth_service.dart';
import 'package:farm_management_app/features/tasks/services/task_service.dart';
import 'package:farm_management_app/features/tasks/models/task_item.dart';
import 'package:farm_management_app/features/sales/services/sales_service.dart';
import 'package:farm_management_app/features/sales/models/sales_record.dart';
import 'package:intl/intl.dart';
import 'package:farm_management_app/core/widgets/empty_state_widget.dart';
import 'package:farm_management_app/core/utils/nepali_date_helper.dart';
import 'package:farm_management_app/features/auth/models/user_model.dart';
import 'package:farm_management_app/features/energy/services/energy_service.dart';
import 'package:farm_management_app/features/energy/models/energy_bill.dart';
import 'package:farm_management_app/features/auth/services/admin_service.dart';
import 'package:farm_management_app/features/notifications/services/notification_service.dart';
import 'package:farm_management_app/core/services/version_service.dart';
import 'package:farm_management_app/features/tasks/screens/task_detail_screen.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Greenbird Home'),
        actions: [
          // Dev Role Switcher - visible only in debug
          // Dev Role Switcher - Temporarily enabled for all
          if (true)
            Consumer<AuthService>(
              builder: (context, authService, _) {
                final user = authService.currentUser;
                if (user == null) return const SizedBox.shrink();
                
                return PopupMenuButton<UserRole>(
                  tooltip: 'Dev: Switch Role',
                  icon: const Icon(Icons.developer_mode, color: Colors.purple),
                  onSelected: (UserRole newRole) {
                    authService.debugSwitchRole(newRole);
                    
                     // If Customer, redirect to Shop
                    if (newRole == UserRole.customer) {
                       context.go('/shop');
                    }
                    
                    ScaffoldMessenger.of(context).showSnackBar(
                       SnackBar(content: Text("Switched to ${newRole.displayName} mode")),
                    );
                  },
                  itemBuilder: (BuildContext context) => <PopupMenuEntry<UserRole>>[
                    const PopupMenuItem<UserRole>(
                      value: UserRole.admin,
                      child: Text('Switch to Admin'),
                    ),
                    const PopupMenuItem<UserRole>(
                      value: UserRole.manager,
                      child: Text('Switch to Manager'),
                    ),
                    const PopupMenuItem<UserRole>(
                      value: UserRole.customer,
                      child: Text('Switch to Customer'),
                    ),
                  ],
                );
              },
            ),
          const NotificationBell(),
        ],
      ),
      drawer: const _FarmDrawer(),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [

            const SizedBox(height: 12),
            
            // Today's Analytics (Sales/Purchase)
            const _FinancialOverview(),
            const SizedBox(height: 24),

            // Pending Payments (Admin Only)
            if (context.watch<AuthService>().currentUser?.role == UserRole.admin)
              const PendingPaymentsSection(),
            const SizedBox(height: 24),

            // Pending Orders (Admin/Manager)
            Builder(
              builder: (context) {
                final role = context.watch<AuthService>().currentUser?.role;
                print("DEBUG: Dashboard PendingOrders Check - Role: $role");
                if (role == UserRole.admin || role == UserRole.manager) {
                  return const Column(
                    children: [
                      PendingOrdersSection(),
                      SizedBox(height: 24),
                    ],
                  );
                }
                return const SizedBox.shrink();
              },
            ),

            // Sales Graph
            const SalesGraph(),
            const SizedBox(height: 24),

            // Livestock Pie Chart
            const LivestockPieChart(),
            const SizedBox(height: 24),

          // Pending Task Section
            const _TaskAssignmentsSection(),
            const SizedBox(height: 24),

            // Quick Access Heading
            const Text(
              "Quick Access",
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 16),

            // Quick Navigation Grid
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              mainAxisSpacing: 16,
              crossAxisSpacing: 16,
              childAspectRatio: 1.5,
              children: [
                 _QuickLink(icon: Icons.task_alt, label: "Tasks", onTap: () => context.push('/tasks')),
                 _QuickLink(icon: Icons.inventory_2, label: "Stock", onTap: () => context.push('/harvest-log')),
                 
                 // Admin/Manager Orders
                 if (Provider.of<AuthService>(context).currentUser?.role == UserRole.admin || 
                     Provider.of<AuthService>(context).currentUser?.role == UserRole.manager)
                    _QuickLink(icon: Icons.list_alt, label: "Orders", onTap: () => context.push('/orders')),

                 // Products & Prices
                 _QuickLink(icon: Icons.shopping_bag, label: "Products", onTap: () => context.push('/products')),
                 
                 _QuickLink(icon: Icons.attach_money, label: "Sales", onTap: () => context.push('/sales')),
                 _QuickLink(icon: Icons.bolt, label: "Energy", onTap: () => context.push('/energy')),
                 _QuickLink(icon: Icons.contacts, label: "Partners", onTap: () => context.push('/customers')),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _FarmDrawer extends StatelessWidget {
  const _FarmDrawer();

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthService>(
      builder: (context, authService, _) {
        final user = authService.currentUser;
        final isAdmin = user?.role == UserRole.admin;
        final userRole = user?.role.displayName ?? 'Guest';

        return Drawer(
          child: Column(
            children: [
              Expanded(
                child: ListView(
                  padding: EdgeInsets.zero,
                  children: [
                    DrawerHeader(
                      decoration: BoxDecoration(color: Theme.of(context).primaryColor),
                      child: Column(
                         crossAxisAlignment: CrossAxisAlignment.start,
                         mainAxisAlignment: MainAxisAlignment.end,
                         children: [
                           // Logo
                           Container(
                             height: 60,
                             width: 60,
                             decoration: BoxDecoration(
                               color: Colors.white,
                               borderRadius: BorderRadius.circular(8),
                               image: const DecorationImage(
                                 image: AssetImage('assets/images/logo.jpg'),
                                 fit: BoxFit.contain, 
                               ),
                             ),
                           ),
                           const SizedBox(height: 12),
                           const Text("Greenbird", style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
                           const SizedBox(height: 8),
                           // User Info
                           if (user != null) ...[
                             Row(
                               children: [
                                 Icon(Icons.person, color: Colors.white70, size: 16),
                                 const SizedBox(width: 6),
                                 Expanded(
                                   child: Text(
                                     user.name,
                                     style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600),
                                     overflow: TextOverflow.ellipsis,
                                   ),
                                 ),
                               ],
                             ),
                             const SizedBox(height: 4),
                             Row(
                               children: [
                                 Container(
                                   padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                   decoration: BoxDecoration(
                                     color: Colors.white.withOpacity(0.2),
                                     borderRadius: BorderRadius.circular(12),
                                     border: Border.all(color: Colors.white.withOpacity(0.3)),
                                   ),
                                   child: Text(
                                     userRole,
                                     style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w500),
                                   ),
                                 ),
                               ],
                             ),
                           ] else
                             Text(userRole, style: const TextStyle(color: Colors.white70)),
                         ],
                      ),
                    ),
                    ListTile(leading: const Icon(Icons.dashboard), title: const Text('Greenbird Home'), onTap: () => context.go('/')),
                    ListTile(leading: const Icon(Icons.task), title: const Text('Tasks'), onTap: () => context.push('/tasks')),
                    ListTile(leading: const Icon(Icons.bolt, color: Colors.amber), title: const Text('Energy'), onTap: () => context.push('/energy')),
                    const Divider(),
                    ListTile(leading: const Icon(Icons.inventory), title: const Text('Stock'), onTap: () => context.push('/harvest-log')),
                    
                    // Admin/Manager Orders
                    if (isAdmin || userRole == 'Farm Manager')
                       ListTile(leading: const Icon(Icons.list_alt), title: const Text('Orders'), onTap: () => context.push('/orders')),
                    
                    // Admin Only
                    if (isAdmin)
                      ListTile(leading: const Icon(Icons.shopping_bag), title: const Text('Product & Price'), onTap: () => context.push('/products')),
                    
                    const Divider(),
                    ListTile(leading: const Icon(Icons.attach_money), title: const Text('Sales & Purchase'), onTap: () => context.push('/sales')),
                    ListTile(leading: const Icon(Icons.contacts), title: const Text('Partners'), onTap: () => context.push('/customers')),
                    
                    // Admin Only
                    if (isAdmin) ...[
                      const Divider(),
                      ListTile(leading: const Icon(Icons.bar_chart), title: const Text('Reports'), onTap: () => context.push('/reports')),
                      ListTile(leading: const Icon(Icons.person), title: const Text('Users'), onTap: () => context.push('/admin-users')),
                    ],
                  ],
                ),
              ),

              const Divider(),
              ListTile(
                leading: const Icon(Icons.logout, color: Colors.red),
                title: const Text('Logout', style: TextStyle(color: Colors.red)),
                onTap: () {
                  // Close drawer first
                  Navigator.pop(context); 
                  
                  // Perform sign out
                  authService.signOut();
                  
                  // Navigate to Login Screen
                  context.go('/login');
                },
              ),
              const SizedBox(height: 8),
              FutureBuilder<PackageInfo>(
                future: PackageInfo.fromPlatform(),
                builder: (context, snapshot) {
                  return Column(
                    children: [
                       if (snapshot.hasData)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 4.0),
                          child: Text(
                            "v${snapshot.data!.version} (${snapshot.data!.buildNumber})",
                            style: const TextStyle(
                              color: Colors.grey,
                              fontSize: 12,
                              fontWeight: FontWeight.w400,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        )
                      else if (snapshot.hasError) 
                        Padding(
                          padding: const EdgeInsets.only(bottom: 4.0),
                          child: Text(
                            "v${VersionService.currentAppVersion}",
                            style: const TextStyle(
                              color: Colors.grey,
                              fontSize: 12,
                            ),
                          ),
                        ),
                        
                      // PWA Update Button
                      if (kIsWeb)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 16.0),
                          child: TextButton.icon(
                            onPressed: () {
                              // Force reload to update PWA service worker/cache
                              html.window.location.reload();
                            },
                            icon: const Icon(Icons.refresh, size: 14, color: Colors.blue),
                            label: const Text(
                              "Check for Updates", 
                              style: TextStyle(fontSize: 12, color: Colors.blue),
                            ),
                            style: TextButton.styleFrom(
                              visualDensity: VisualDensity.compact,
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 0),
                            ),
                          ),
                        )
                      else 
                        const SizedBox(height: 16),
                    ],
                  );
                },
              ),
            ],
          ),
        );
      },
    );
  }
}

class _FinancialOverview extends StatelessWidget {
  const _FinancialOverview();

  @override
  Widget build(BuildContext context) {
    // Get current user role
    final currentUser = context.watch<AuthService>().currentUser;
    final isAdmin = currentUser?.role == UserRole.admin;

    return StreamBuilder<List<TransactionRecord>>(
      stream: context.read<SalesService>().getTransactionsStream(),
      builder: (context, salesSnapshot) {
        return StreamBuilder<List<EnergyBill>>(
          stream: context.read<EnergyService>().getBillsStream(),
          builder: (context, energySnapshot) {
            double todaySales = 0;
            double todayPurchases = 0;
            double pendingReceivable = 0;
            double pendingPayable = 0;

            // 1. Process Sales/Purchase Transactions
            if (salesSnapshot.hasData) {
              final now = DateTime.now();
              final today = DateTime(now.year, now.month, now.day);
              
              for (final t in salesSnapshot.data!) {
                final tDate = DateTime(t.date.year, t.date.month, t.date.day);
                
                // Today's stats
                if (tDate.isAtSameMomentAs(today)) {
                  if (t.type == TransactionType.Sale) {
                    todaySales += t.totalPayable;
                  } else {
                    todayPurchases += t.totalPayable;
                  }
                }

                // Global Pending stats (Sales/Purchase) - Only calculate for Admin
                if (isAdmin && !t.paymentStatus.isPaid) { // Unpaid or Partial
                   if (t.type == TransactionType.Sale) {
                     pendingReceivable += t.remainingAmount;
                   } else {
                     pendingPayable += t.remainingAmount;
                   }
                }
              }
            }

            // 2. Process Energy Bills (Add to Pending Payable) - Only for Admin
            if (isAdmin && energySnapshot.hasData) {
              for (final b in energySnapshot.data!) {
                if (!b.paymentStatus.isPaid) {
                  pendingPayable += b.remainingAmount;
                }
              }
            }

            return Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Theme.of(context).primaryColor, Theme.of(context).primaryColor.withOpacity(0.7)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10, offset: const Offset(0, 4))],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    "Financial Overview",
                    style: TextStyle(color: Colors.white70, fontSize: 14, fontWeight: FontWeight.w500),
                  ),
                  const SizedBox(height: 16),
                  // Row 1: Today's Stats
                  Row(
                    children: [
                      Expanded(
                        child: _FinanceItem(
                          label: "Today's Sales",
                          value: "Rs ${todaySales.toStringAsFixed(0)}",
                          icon: Icons.arrow_upward,
                          color: Colors.greenAccent,
                          onTap: () => context.push('/sales', extra: 0),
                        ),
                      ),
                      Container(width: 1, height: 40, color: Colors.white24),
                      Expanded(
                        child: _FinanceItem(
                          label: "Today's Purchase",
                          value: "Rs ${todayPurchases.toStringAsFixed(0)}",
                          icon: Icons.arrow_downward,
                          color: Colors.redAccent.shade100,
                          onTap: () => context.push('/sales', extra: 1),
                        ),
                      ),
                    ],
                  ),
                  // Row 2: Pending Stats (Admin Only)
                  if (isAdmin) ...[ 
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 16),
                      child: Divider(color: Colors.white24, height: 1),
                    ),
                    Row(
                      children: [
                        Expanded(
                          child: _FinanceItem(
                            label: "Pending Receivable",
                            value: "Rs ${pendingReceivable.toStringAsFixed(0)}",
                            icon: Icons.pending_actions,
                            color: Colors.orangeAccent,
                            onTap: () => context.push('/sales', extra: 0),
                          ),
                        ),
                        Container(width: 1, height: 40, color: Colors.white24),
                        Expanded(
                          child: _FinanceItem(
                            label: "Pending Payable",
                            value: "Rs ${pendingPayable.toStringAsFixed(0)}",
                            icon: Icons.money_off,
                            color: Colors.amber.shade200,
                            onTap: () => context.push('/sales', extra: 1),
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            );
          },
        );
      },
    );
  }
}

class _FinanceItem extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final VoidCallback? onTap;
  
  const _FinanceItem({
    required this.label, 
    required this.value, 
    required this.icon, 
    required this.color,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(icon, color: color, size: 20),
                  const SizedBox(width: 8),
                  Text(value, style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                ],
              ),
              const SizedBox(height: 4),
              Text(label, style: const TextStyle(color: Colors.white70, fontSize: 12)),
            ],
          ),
        ),
      ),
    );
  }
}

class _QuickLink extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _QuickLink({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return CustomCard(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 40, color: Theme.of(context).primaryColor),
              const SizedBox(height: 12),
              Text(
                label,
                textAlign: TextAlign.center,
                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
              ),
            ],
          ),
        ),
      ),
    );
  }
}





class _TaskAssignmentsSection extends StatefulWidget {
  const _TaskAssignmentsSection();
  
  @override
  State<_TaskAssignmentsSection> createState() => _TaskAssignmentsSectionState();
}

class _TaskAssignmentsSectionState extends State<_TaskAssignmentsSection> {
  List<String> _adminNames = [];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadAdminUsers();
    });
  }

  Future<void> _loadAdminUsers() async {
    final authService = context.read<AuthService>();
    final users = await authService.getUsers();
    if (mounted) {
      setState(() {
        _adminNames = users
            .where((u) => u.role == UserRole.admin)
            .map((u) => u.name)
            .toList();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    // Get current user info
    final currentUser = context.watch<AuthService>().currentUser;
    final currentUserRole = currentUser?.role ?? UserRole.manager;
    final currentUserName = currentUser?.name ?? 'Unknown';

    return StreamBuilder<List<TaskItem>>(
      stream: context.read<TaskService>().getTasksStream(),
      builder: (context, snapshot) {
        // Handle loading/error or empty states
        if (snapshot.hasError) return const SizedBox.shrink();
        if (!snapshot.hasData) {
          return Container(
            height: 100,
            alignment: Alignment.center,
            child: const CircularProgressIndicator(),
          );
        }

        final allTasks = snapshot.data!;

        // Filter tasks based on role
        List<TaskItem> filteredTasks = allTasks;
        if (currentUserRole == UserRole.manager) {
          // Manager logic: Show tasks assigned to me OR created by me (including those assigned to admins)
          filteredTasks = allTasks.where((t) {
            final isAssignedToMe = t.assignedTo == currentUserName;
            final isCreatedByMe = t.createdBy == currentUserName;

            return isAssignedToMe || isCreatedByMe;
          }).toList();
        }

        // Filter only pending tasks (exclude done tasks)
        final pendingTasks = filteredTasks.where((t) => t.status != TaskStatus.done).toList();
        
        // Sort pending tasks by due date (nulls last)
        pendingTasks.sort((a, b) {
          if (a.dueDate == null) return 1;
          if (b.dueDate == null) return -1;
          return a.dueDate!.compareTo(b.dueDate!);
        });

        // Display up to 5 pending tasks
        final displayTasks = pendingTasks.take(5).toList();

        return Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Icon(Icons.assignment_ind, color: Theme.of(context).primaryColor, size: 24),
                      const SizedBox(width: 12),
                      const Text(
                        "Pending Task",
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.black87,
                        ),
                      ),
                    ],
                  ),
                  TextButton(
                    onPressed: () => context.push('/tasks'),
                    child: const Text("View All"),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              if (displayTasks.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 20),
                  child: EmptyStateWidget(
                    message: "No tasks to display",
                    icon: Icons.check_circle_outline,
                  ),
                )
              else
                ...displayTasks.map((task) => _TaskItemWidget(task: task)).toList(),
            ],
          ),
        );
      },
    );
  }
}

class _TaskItemWidget extends StatelessWidget {
  final TaskItem task;

  const _TaskItemWidget({required this.task});

  @override
  Widget build(BuildContext context) {
    final assigneeName = task.assignedTo ?? "Unassigned";
    final assigneeInitial = assigneeName.isNotEmpty ? assigneeName[0].toUpperCase() : "?";
    
    // Format date similar to "Today", "Tomorrow" or "Dec 15"
    String dateStr = "";
    if (task.dueDate != null) {
      final now = DateTime.now();
      final today = DateTime(now.year, now.month, now.day);
      final due = DateTime(task.dueDate!.year, task.dueDate!.month, task.dueDate!.day);
      
      final diff = due.difference(today).inDays;
      if (diff == 0) dateStr = "Today";
      else if (diff == 1) dateStr = "Tomorrow";
      else dateStr = NepaliDateHelper.formatToNepaliShort(task.dueDate!);
    } else {
      dateStr = "No Date";
    }

    Color priorityBg;
    Color priorityText;
    
    switch (task.priority) {
      case TaskPriority.urgent:
      case TaskPriority.high:
        priorityBg = Colors.red.shade50;
        priorityText = Colors.red.shade700;
        break;
      case TaskPriority.medium:
        priorityBg = Colors.orange.shade50;
        priorityText = Colors.orange.shade700;
        break;
      case TaskPriority.low:
        priorityBg = Colors.blue.shade50;
        priorityText = Colors.blue.shade700;
        break;
    }

    Color statusBg;
    Color statusText;
    String statusLabel;

    switch (task.status) {
      case TaskStatus.open:
        statusBg = Colors.blueGrey.shade50;
        statusText = Colors.blueGrey.shade700;
        statusLabel = "Open";
        break;
      case TaskStatus.inProgress:
        statusBg = Colors.purple.shade50;
        statusText = Colors.purple.shade700;
        statusLabel = "In Progress";
        break;
      case TaskStatus.done:
        statusBg = Colors.green.shade50;
        statusText = Colors.green.shade700;
        statusLabel = "Done";
        break;
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => TaskDetailScreen(task: task),
            ),
          );
        },
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.grey.shade50,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: Row(
            children: [
              CircleAvatar(
                radius: 20,
                backgroundColor: Theme.of(context).primaryColor.withOpacity(0.1),
                child: Text(
                  assigneeInitial,
                  style: TextStyle(
                    color: Theme.of(context).primaryColor,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      task.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Icon(Icons.access_time, size: 11, color: Colors.grey.shade600),
                        const SizedBox(width: 4),
                        Text(
                          'Created: ${NepaliDateHelper.formatToNepaliShort(task.createdDate)}',
                          style: TextStyle(
                            fontSize: 10,
                            color: Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ),
                    if (task.dueDate != null) ...[
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          Icon(Icons.calendar_today, size: 11, color: Colors.grey.shade600),
                          const SizedBox(width: 4),
                          Text(
                            'Due: $dateStr',
                            style: TextStyle(
                              fontSize: 10,
                              color: Colors.grey.shade600,
                            ),
                          ),
                          // Overdue Check
                          if (task.dueDate!.isBefore(DateTime.now()) && task.status != TaskStatus.done) ...[
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                              decoration: BoxDecoration(
                                color: Colors.red.shade50,
                                borderRadius: BorderRadius.circular(4),
                                border: Border.all(color: Colors.red.shade200, width: 0.5),
                              ),
                              child: Text(
                                "Overdue",
                                style: TextStyle(
                                  fontSize: 9,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.red.shade700,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],
                    if (task.assignedTo != null) ...[
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          Icon(Icons.person_outline, size: 11, color: Colors.grey.shade600),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              assigneeName,
                              style: TextStyle(
                                fontSize: 10,
                                color: Colors.grey.shade600,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Status Badge
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                        decoration: BoxDecoration(
                          color: statusBg,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          statusLabel, 
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: statusText,
                          ),
                        ),
                      ),
                      const SizedBox(width: 4),
                      // Priority Badge
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                        decoration: BoxDecoration(
                          color: priorityBg,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          task.priority.name.toUpperCase(), 
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: priorityText,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
