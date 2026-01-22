import 'dart:io';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:farm_management_app/features/notifications/models/notification_model.dart';

// Top-level function for background handling
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // If you need to access other Firebase services in the background, such as Firestore,
  // make sure you call `Firebase.initializeApp` before using other Firebase services.
  print('Handling a background message: ${message.messageId}');
}

class NotificationService {
  final FirebaseFirestore _firestore;
  final FirebaseMessaging _messaging;
  late final CollectionReference _notificationsCollection;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();

  NotificationService({FirebaseFirestore? firestore, FirebaseMessaging? messaging})
      : _firestore = firestore ?? FirebaseFirestore.instance,
        _messaging = messaging ?? FirebaseMessaging.instance {
    _notificationsCollection = _firestore.collection('notifications');
  }

  Future<void> initialize() async {
    // 1. Request Permission
    NotificationSettings settings = await _messaging.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
      sound: true,
    );

    print('User granted permission: ${settings.authorizationStatus}');

    // 2. Setup Foreground Android Channel
    const AndroidNotificationChannel channel = AndroidNotificationChannel(
      'high_importance_channel', // id
      'High Importance Notifications', // title
      description: 'This channel is used for important notifications.', // description
      importance: Importance.max,
    );

    if (Platform.isAndroid) {
       await _localNotifications
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);
    }
    
    // 3. Foreground Messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      RemoteNotification? notification = message.notification;
      AndroidNotification? android = message.notification?.android;

      // If `onMessage` is triggered with a notification, construct our own
      // local notification to show to users using the created channel.
      if (notification != null && android != null) {
        _localNotifications.show(
            notification.hashCode,
            notification.title,
            notification.body,
            NotificationDetails(
              android: AndroidNotificationDetails(
                channel.id,
                channel.name,
                channelDescription: channel.description,
                icon: 'launch_background', // Ensure this icon exists in android/app/src/main/res/drawable
                // other properties...
              ),
            ));
      }
      
      // Also save to Firestore so it appears in the in-app list
      if (notification != null) {
         createNotification(
           title: notification.title ?? 'New Notification',
           body: notification.body ?? '',
           // You can parse data payload for more info if needed
           type: NotificationType.info, 
         );
      }
    });

    // 4. Background Handler Setup is done in main.dart usually, 
    // but we can register it via a static method if we want, 
    // though `onBackgroundMessage` must be set early.
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // 5. Get Token (Optional - for debugging or sending to backend)
    String? token = await _messaging.getToken(
      vapidKey: "BC5NFvNJTzdn0UHq-AyvKzQVrizxQCJX01V_7OQmU33j-mTofln2FWp_gEW9Omzid1F1qYEwha8e1n7-dhfyUgE",
    );
    print("FCM Token: $token");
    
    // Cleanup old notifications on init
    cleanupOldNotifications();
  }

  // Create a new notification (Firestore)
  Future<void> createNotification({
    required String title,
    required String body,
    NotificationType type = NotificationType.info,
    String? relatedEntityId,
    String? route,
  }) async {
    try {
      final docRef = _notificationsCollection.doc();
      final notification = NotificationModel(
        id: docRef.id,
        title: title,
        body: body,
        timestamp: DateTime.now(),
        type: type,
        relatedEntityId: relatedEntityId,
        route: route,
      );

      await docRef.set(notification.toMap());
    } catch (e) {
      print('Error creating notification: $e');
    }
  }

  Stream<int> getUnreadCountStream() {
    return _notificationsCollection
        .where('isRead', isEqualTo: false)
        .snapshots()
        .map((snapshot) => snapshot.docs.length);
  }

  Stream<List<NotificationModel>> getNotificationsStream({int limit = 50}) {
    final cutoffDate = DateTime.now().subtract(const Duration(days: 15));
    
    return _notificationsCollection
        .where('timestamp', isGreaterThanOrEqualTo: Timestamp.fromDate(cutoffDate))
        .orderBy('timestamp', descending: true)
        .limit(limit)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs.map((doc) {
        return NotificationModel.fromMap(
          doc.data() as Map<String, dynamic>,
          doc.id,
        );
      }).toList();
    });
  }

  Future<void> cleanupOldNotifications() async {
    try {
      final cutoffDate = DateTime.now().subtract(const Duration(days: 15));
      
      final oldDocs = await _notificationsCollection
          .where('timestamp', isLessThan: Timestamp.fromDate(cutoffDate))
          .get();

      if (oldDocs.docs.isEmpty) return;

      final batch = _firestore.batch();
      for (var doc in oldDocs.docs) {
        batch.delete(doc.reference);
      }
      
      await batch.commit();
      print("Cleaned up ${oldDocs.docs.length} old notifications.");
    } catch (e) {
      print('Error cleaning up old notifications: $e');
    }
  }

  Future<void> markAsRead(String id) async {
    try {
      await _notificationsCollection.doc(id).update({'isRead': true});
    } catch (e) {
      print('Error marking notification as read: $e');
    }
  }

  Future<void> markAllAsRead() async {
    try {
      final batch = _firestore.batch();
      final unreadDocs = await _notificationsCollection
          .where('isRead', isEqualTo: false)
          .get();

      for (var doc in unreadDocs.docs) {
        batch.update(doc.reference, {'isRead': true});
      }

      await batch.commit();
    } catch (e) {
      print('Error marking all notifications as read: $e');
    }
  }
}
