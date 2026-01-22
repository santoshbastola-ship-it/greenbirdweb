import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:farm_management_app/features/notifications/services/notification_service.dart';
import 'package:farm_management_app/core/widgets/notification_list.dart';

class NotificationBell extends StatelessWidget {
  const NotificationBell({super.key});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<int>(
      stream: context.read<NotificationService>().getUnreadCountStream(),
      builder: (context, snapshot) {
        final count = snapshot.data ?? 0;
        return IconButton(
          icon: Badge(
            isLabelVisible: count > 0,
            label: Text('$count'),
            child: const Icon(Icons.notifications),
          ),
          onPressed: () {
            showModalBottomSheet(
              context: context,
              builder: (c) => const NotificationList(),
            );
          },
        );
      },
    );
  }
}
