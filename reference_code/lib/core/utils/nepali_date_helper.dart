import 'package:flutter/material.dart';
import 'package:nepali_utils/nepali_utils.dart';
import 'package:nepali_date_picker/nepali_date_picker.dart' as picker;

class NepaliDateHelper {
  
  /// Formats a Gregorian [date] into a Nepali Date string
  /// format: "d MMMM, yyyy" (e.g., "12 Baisakh, 2081")
  static String formatToNepali(DateTime date) {
    try {
      final nepaliDate = NepaliDateTime.fromDateTime(date);
      return NepaliDateFormat("d MMMM, yyyy").format(nepaliDate);
    } catch (e) {
      return "${date.year}-${date.month}-${date.day}"; // Fallback
    }
  }

  /// Formats a Gregorian [date] into a shorter Nepali Date string
  /// format: "MMM d" (e.g., "Baisakh 12")
  static String formatToNepaliShort(DateTime date) {
    try {
      final nepaliDate = NepaliDateTime.fromDateTime(date);
      return NepaliDateFormat("MMM d").format(nepaliDate);
    } catch (e) {
      return "${date.year}-${date.month}-${date.day}"; // Fallback
    }
  }

  /// Shows a Nepali Date Picker and returns the selected date as a Gregorian [DateTime].
  /// Returns [null] if cancelled.
  static Future<DateTime?> pickNepaliDate(BuildContext context, {DateTime? initialDate, DateTime? firstDate, DateTime? lastDate}) async {
    final now = NepaliDateTime.now();
    final initial = initialDate != null ? NepaliDateTime.fromDateTime(initialDate) : now;
    final first = firstDate != null ? NepaliDateTime.fromDateTime(firstDate) : NepaliDateTime(2070);
    final last = lastDate != null ? NepaliDateTime.fromDateTime(lastDate) : NepaliDateTime(2090);

    final picked = await picker.showNepaliDatePicker(
      context: context,
      initialDate: initial,
      firstDate: first,
      lastDate: last,
    );

    return picked?.toDateTime();
  }
}
