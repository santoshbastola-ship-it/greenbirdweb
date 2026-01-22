import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

/// Service to manage form state persistence across app sessions
/// Saves form drafts locally to prevent data loss when navigating away
class FormStateService {
  static const String _keyPrefix = 'form_draft_';
  
  /// Save form state with a unique key
  /// [formKey] - Unique identifier for the form (e.g., 'sales_form_userId')
  /// [data] - Map of form field values to save
  Future<void> saveFormState(String formKey, Map<String, dynamic> data) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonString = jsonEncode(data);
      await prefs.setString('$_keyPrefix$formKey', jsonString);
    } catch (e) {
      print('Error saving form state: $e');
    }
  }
  
  /// Load saved form state
  /// Returns null if no saved state exists
  Future<Map<String, dynamic>?> loadFormState(String formKey) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonString = prefs.getString('$_keyPrefix$formKey');
      
      if (jsonString == null) return null;
      
      return jsonDecode(jsonString) as Map<String, dynamic>;
    } catch (e) {
      print('Error loading form state: $e');
      return null;
    }
  }
  
  /// Clear specific form state (called after successful form submission)
  Future<void> clearFormState(String formKey) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('$_keyPrefix$formKey');
    } catch (e) {
      print('Error clearing form state: $e');
    }
  }
  
  /// Clear all form states (called on logout)
  Future<void> clearAllFormStates() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final keys = prefs.getKeys();
      
      // Remove all keys that start with our prefix
      for (final key in keys) {
        if (key.startsWith(_keyPrefix)) {
          await prefs.remove(key);
        }
      }
    } catch (e) {
      print('Error clearing all form states: $e');
    }
  }
  
  /// Check if a form has saved state
  Future<bool> hasFormState(String formKey) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.containsKey('$_keyPrefix$formKey');
    } catch (e) {
      print('Error checking form state: $e');
      return false;
    }
  }
}
