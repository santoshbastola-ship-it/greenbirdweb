
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:farm_management_app/features/sales/models/sales_record.dart';
import 'package:farm_management_app/core/utils/nepali_date_helper.dart';

class BillReceiptWidget extends StatelessWidget {
  final TransactionRecord transaction;

  const BillReceiptWidget({super.key, required this.transaction});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 380, // Reduced from 500 for a more compact receipt
      padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 32.0),
      color: Colors.white,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Logo
          Image.asset(
            'assets/images/logo.jpg',
            height: 80, 
            fit: BoxFit.contain,
            errorBuilder: (context, error, stackTrace) {
               return const SizedBox(
                 height: 80,
                 child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                     Icon(Icons.store, size: 40, color: Colors.green),
                  ],
                 ),
               );
            },
          ),
          const SizedBox(height: 12),
          
          // Company Name and Title
          const Text(
            'Greenbird Homestead',
            style: TextStyle(
              fontSize: 22, // Reduced from 26
              fontWeight: FontWeight.bold,
              color: Colors.green, // Brand color
              decoration: TextDecoration.none,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'INVOICE',
            style: TextStyle(
              fontSize: 16, // Reduced from 18
              letterSpacing: 3,
              color: Colors.black87,
              fontWeight: FontWeight.w500,
              decoration: TextDecoration.none,
            ),
          ),
          const SizedBox(height: 20),

          // Header Details
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                flex: 3,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Customer: ${transaction.partyName}',
                      style: const TextStyle(fontSize: 12, color: Colors.black, decoration: TextDecoration.none, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Bill No: ${transaction.billNo}',
                      style: const TextStyle(fontSize: 11, color: Colors.black, decoration: TextDecoration.none),
                    ),
                  ],
                ),
              ),
              Expanded(
                flex: 2,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      'Date: ${NepaliDateHelper.formatToNepali(transaction.date)}',
                      textAlign: TextAlign.right,
                      style: const TextStyle(fontSize: 11, color: Colors.black, decoration: TextDecoration.none),
                    ),
                    const SizedBox(height: 4),
                     Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.black54),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        transaction.paymentStatus.displayName,
                        style: const TextStyle(
                          fontSize: 10, 
                          color: Colors.black, 
                          fontWeight: FontWeight.bold,
                          decoration: TextDecoration.none
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Items Table Header
          const Divider(thickness: 1, color: Colors.black),
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 4.0),
            child: Row(
              children: [
                const Expanded(flex: 4, child: Text('Item', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Colors.black, decoration: TextDecoration.none))),
                Expanded(flex: 2, child: Text('Qty', textAlign: TextAlign.right, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Colors.black, decoration: TextDecoration.none))),
                Expanded(flex: 2, child: Text('Rate', textAlign: TextAlign.right, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Colors.black, decoration: TextDecoration.none))),
                Expanded(flex: 2, child: Text('Amt', textAlign: TextAlign.right, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Colors.black, decoration: TextDecoration.none))),
              ],
            ),
          ),
          const Divider(thickness: 1, color: Colors.black),
          
          // Items List
          ...transaction.items.asMap().entries.map((entry) {
            final item = entry.value;
            String qtyDisplay;
            if (item.weight != null && item.weight! > 0) {
              qtyDisplay = '${item.weight} kg';
            } else {
              qtyDisplay = '${item.quantity}'; // Shortened for space
            }

            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 4.0),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(flex: 4, child: Text(item.productName, style: const TextStyle(fontSize: 11, color: Colors.black, decoration: TextDecoration.none))),
                  Expanded(flex: 2, child: Text(qtyDisplay, textAlign: TextAlign.right, style: const TextStyle(fontSize: 11, color: Colors.black, decoration: TextDecoration.none))),
                  Expanded(flex: 2, child: Text(item.pricePerUnit.toStringAsFixed(0), textAlign: TextAlign.right, style: const TextStyle(fontSize: 11, color: Colors.black, decoration: TextDecoration.none))),
                  Expanded(flex: 2, child: Text(item.totalPrice.toStringAsFixed(0), textAlign: TextAlign.right, style: const TextStyle(fontSize: 11, color: Colors.black, decoration: TextDecoration.none))),
                ],
              ),
            );
          }).toList(),
          
          const Divider(thickness: 1, color: Colors.black),
          const SizedBox(height: 4),

          // Totals
          _buildTotalRow('Total:', 'Rs ${transaction.totalPrice.toStringAsFixed(0)}'),
          if (transaction.discount > 0)
            _buildTotalRow('Discount:', '-Rs ${transaction.discount.toStringAsFixed(0)}'),
          if (transaction.paymentStatus.isPartial || transaction.paidAmount > 0) ...[
             const SizedBox(height: 2),
            _buildTotalRow('Paid:', 'Rs ${transaction.paidAmount.toStringAsFixed(0)}'),
            _buildTotalRow('Due:', 'Rs ${transaction.remainingAmount.toStringAsFixed(0)}', color: Colors.red.shade900),
          ],
            
          const SizedBox(height: 4),
          const Divider(thickness: 1, color: Colors.black54),
          _buildTotalRow('Net Total:', 'Rs ${transaction.totalPayable.toStringAsFixed(0)}', isBold: true),
          
          const SizedBox(height: 30),
          
          // Footer
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
            decoration: BoxDecoration(
              color: Colors.green.shade50,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.green.shade200),
            ),
            child: Column(
              children: [
                Text(
                  'Thank you for your business!',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Colors.green.shade800,
                    decoration: TextDecoration.none,
                    fontStyle: FontStyle.italic,
                  ),
                ),
                const SizedBox(height: 4),
                 const Text(
                  'We appreciate your trust in us and look forward to serving you again.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 10,
                    color: Colors.black87,
                    decoration: TextDecoration.none,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTotalRow(String label, String value, {bool isBold = false, Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          Text(
            label, 
            style: TextStyle(
              fontSize: 11, 
              fontWeight: isBold ? FontWeight.bold : FontWeight.w500,
              color: Colors.black,
              decoration: TextDecoration.none,
            )
          ),
          const SizedBox(width: 16),
          SizedBox(
            width: 70,
            child: Text(
              value, 
              textAlign: TextAlign.right,
              style: TextStyle(
                fontSize: 11, 
                fontWeight: isBold ? FontWeight.bold : FontWeight.w400,
                color: color ?? Colors.black,
                decoration: TextDecoration.none,
              )
            ),
          ),
        ],
      ),
    );
  }
}
