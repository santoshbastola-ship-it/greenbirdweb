import 'package:package_info_plus/package_info_plus.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:universal_html/html.dart' as html;

class VersionService {
  static const String _versionKey = 'app_version';
  static const String currentAppVersion = '1.1.16'; // Single source of truth

  /// Check if app version has changed and trigger refresh if needed
  /// Only runs once on app startup to avoid continuous refresh loops
  static Future<void> checkAndRefreshIfNeeded() async {
    if (!kIsWeb) return; // Only for web platform

    try {
      // Try to get version from package_info_plus
      // Note: This may fail on web, so we have a fallback
      String currentVersion;
      try {
        final packageInfo = await PackageInfo.fromPlatform();
        currentVersion = packageInfo.version;
      } catch (e) {
        // Fallback: Use hardcoded version if package_info fails on web
        currentVersion = currentAppVersion;
        print('Using fallback version: $currentVersion');
      }
      
      // Get stored version from localStorage
      final storedVersion = html.window.localStorage[_versionKey];

      if (storedVersion != null && storedVersion != currentVersion) {
        print('Version changed from $storedVersion to $currentVersion.');
        
        // Update stored version BEFORE clearing cache
        // This prevents infinite reload loops
        html.window.localStorage[_versionKey] = currentVersion;
        
        // Clear cache in background without immediate reload
        await _clearCacheOnly();
        
        print('Cache cleared for new version. Will use fresh content on next navigation.');
      } else if (storedVersion == null) {
        // First time - just store the version
        html.window.localStorage[_versionKey] = currentVersion;
        print('Current app version: $currentVersion');
      } else {
        print('Current app version: $currentVersion (up to date)');
      }
    } catch (e) {
      print('Error checking version: $e');
    }
  }


  /// Clear all caches without reloading (background operation)
  /// This runs asynchronously and doesn't block the app
  static Future<void> _clearCacheOnly() async {
    try {
      // Run cache clearing in background without blocking
      // Don't await these operations to keep them truly async
      html.window.navigator.serviceWorker?.getRegistrations().then((registrations) {
        if (registrations != null) {
          for (var registration in registrations) {
            registration.unregister();
          }
        }
      });

      html.window.caches?.keys().then((cacheNames) {
        if (cacheNames != null) {
          for (var cacheName in cacheNames) {
            html.window.caches?.delete(cacheName);
          }
        }
      });
      
      print('Cache clearing initiated in background.');
    } catch (e) {
      print('Error clearing cache: $e');
    }
  }

  /// Clear all caches and reload the page (only for manual refresh)
  static Future<void> _clearCacheAndReload() async {
    try {
      await _clearCacheOnly();
      
      // Force reload from server
      html.window.location.reload();
    } catch (e) {
      print('Error clearing cache: $e');
      // Fallback to simple reload
      html.window.location.reload();
    }
  }

  /// Get current app version
  static Future<String> getCurrentVersion() async {
    final packageInfo = await PackageInfo.fromPlatform();
    return packageInfo.version;
  }

  /// Force a hard refresh (clear cache and reload)
  static Future<void> forceRefresh() async {
    await _clearCacheAndReload();
  }
}
