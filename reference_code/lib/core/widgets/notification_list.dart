import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:farm_management_app/features/notifications/services/notification_service.dart';
import 'package:farm_management_app/features/notifications/models/notification_model.dart';
import 'package:intl/intl.dart';

class NotificationList extends StatelessWidget {
  const NotificationList({super.key});

  @override
  Widget build(BuildContext context) {
    final notificationService = NotificationService();

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "Notifications",
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
              ),
              TextButton(
                onPressed: () async {
                  await notificationService.markAllAsRead();
                },
                child: const Text("Mark all as read"),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Flexible(
            child: StreamBuilder<List<NotificationModel>>(
              stream: notificationService.getNotificationsStream(),
              builder: (context, snapshot) {
                if (snapshot.hasError) {
                  return const Center(child: Text('Error loading notifications'));
                }

                if (!snapshot.hasData) {
                  return const Center(child: CircularProgressIndicator());
                }

                final notifications = snapshot.data!;

                if (notifications.isEmpty) {
                  return const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                         Icon(Icons.notifications_off_outlined, size: 48, color: Colors.grey),
                         SizedBox(height: 16),
                         Text("No notifications", style: TextStyle(color: Colors.grey)),
                      ],
                    ),
                  );
                }

                return ListView.separated(
                  shrinkWrap: true,
                  itemCount: notifications.length,
                  separatorBuilder: (c, i) => const Divider(height: 1),
                  itemBuilder: (context, index) {
                    final n = notifications[index];
                    return NotificationItem(notification: n);
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class NotificationItem extends StatelessWidget {
  final NotificationModel notification;

  const NotificationItem({super.key, required this.notification});

  @override
  Widget build(BuildContext context) {
    IconData icon;
    Color color;

    switch (notification.type) {
      case NotificationType.success:
        icon = Icons.check_circle;
        color = Colors.green;
        break;
      case NotificationType.warning:
        icon = Icons.warning;
        color = Colors.orange;
        break;
      case NotificationType.error:
        icon = Icons.error;
        color = Colors.red;
        break;
      case NotificationType.info:
      default:
        icon = Icons.info;
        color = Theme.of(context).primaryColor;
        break;
    }

    return ListTile(
      onTap: () async {
        // Mark as read
        if (!notification.isRead) {
          await NotificationService().markAsRead(notification.id);
        }
        
        // Navigate if route exists
        if (notification.route != null) {
          Navigator.pop(context); // Close bottom sheet
          context.push(notification.route!);
        }
      },
      contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      tileColor: notification.isRead ? null : color.withOpacity(0.05),
      leading: CircleAvatar(
        backgroundColor: color.withOpacity(0.1),
        child: Icon(icon, color: color, size: 20),
      ),
      title: Text(
        notification.title, 
        style: TextStyle(
          fontWeight: notification.isRead ? FontWeight.normal : FontWeight.bold,
          fontSize: 14
        )
      ),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(notification.body, style: const TextStyle(fontSize: 12)),
          const SizedBox(height: 4),
          Text(
            _formatTime(notification.timestamp), 
            style: const TextStyle(color: Colors.grey, fontSize: 10),
          ),
        ],
      ),
      trailing: notification.isRead 
          ? null 
          : Container(
              width: 8, 
              height: 8, 
              decoration: BoxDecoration(color: color, shape: BoxShape.circle)
            ),
    );
  }

  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final diff = now.difference(time);

    if (diff.inMinutes < 60) {
      return '${diff.inMinutes} mins ago';
    } else if (diff.inHours < 24) {
      return '${diff.inHours} hours ago';
    } else {
      return DateFormat('MMM d, h:mm a').format(time);
    }
  }
}
