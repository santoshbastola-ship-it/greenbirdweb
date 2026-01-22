import 'package:cloud_firestore/cloud_firestore.dart';

enum NotificationType {
  info,
  success,
  warning,
  error,
}

class NotificationModel {
  final String id;
  final String title;
  final String body;
  final DateTime timestamp;
  final bool isRead;
  final NotificationType type;
  final String? relatedEntityId;
  final String? route; // Optional: Navigation route

  NotificationModel({
    required this.id,
    required this.title,
    required this.body,
    required this.timestamp,
    this.isRead = false,
    this.type = NotificationType.info,
    this.relatedEntityId,
    this.route,
  });

  NotificationModel copyWith({
    String? id,
    String? title,
    String? body,
    DateTime? timestamp,
    bool? isRead,
    NotificationType? type,
    String? relatedEntityId,
    String? route,
  }) {
    return NotificationModel(
      id: id ?? this.id,
      title: title ?? this.title,
      body: body ?? this.body,
      timestamp: timestamp ?? this.timestamp,
      isRead: isRead ?? this.isRead,
      type: type ?? this.type,
      relatedEntityId: relatedEntityId ?? this.relatedEntityId,
      route: route ?? this.route,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'title': title,
      'body': body,
      'timestamp': Timestamp.fromDate(timestamp),
      'isRead': isRead,
      'type': type.name,
      'relatedEntityId': relatedEntityId,
      'route': route,
    };
  }

  factory NotificationModel.fromMap(Map<String, dynamic> map, String id) {
    return NotificationModel(
      id: id,
      title: map['title'] ?? '',
      body: map['body'] ?? '',
      timestamp: (map['timestamp'] as Timestamp).toDate(),
      isRead: map['isRead'] ?? false,
      type: NotificationType.values.firstWhere(
        (e) => e.name == map['type'],
        orElse: () => NotificationType.info,
      ),
      relatedEntityId: map['relatedEntityId'],
      route: map['route'],
    );
  }
}
