
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:farm_management_app/features/sales/services/sales_service.dart';
import 'package:farm_management_app/features/sales/models/sales_record.dart';
import 'package:farm_management_app/core/models/payment_status.dart';
import 'package:farm_management_app/features/inventory/models/stock_entry.dart';
import 'package:farm_management_app/core/widgets/custom_card.dart';

import 'package:farm_management_app/features/inventory/services/stock_service.dart';
import 'package:farm_management_app/features/sales/services/customer_service.dart';

import 'package:farm_management_app/core/widgets/notification_list.dart';
import 'package:farm_management_app/features/notifications/widgets/notification_bell.dart';
import 'package:farm_management_app/core/utils/nepali_date_helper.dart';
import 'package:farm_management_app/features/inventory/models/product.dart'; // Added
import 'package:farm_management_app/features/inventory/services/product_service.dart';
import 'package:csv/csv.dart';
import 'package:universal_html/html.dart' as html;
import 'dart:convert';
import 'package:farm_management_app/features/auth/services/auth_service.dart';
import 'package:farm_management_app/features/auth/models/user_model.dart';

enum ReportType {
  Sales,
  Purchases,
  Stock,
  Customer,
  Vendor;
  
  String get displayName {
    switch (this) {
      case ReportType.Sales: return 'Sales Report';
      case ReportType.Purchases: return 'Purchase Report';
      case ReportType.Stock: return 'Stock Report';
      case ReportType.Customer: return 'Customer Report';
      case ReportType.Vendor: return 'Vendor Report';
    }
  }
}

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({Key? key}) : super(key: key);

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  // Static variables to persist report data "until app is closed"
  static List<TransactionRecord>? _generatedTransactions;
  static List<StockEntry>? _generatedStockEntries;
  static ReportType? _generatedReportType;
  static String? _generatedTotalValue;
  static String? _generatedTotalLabel;
  static int? _generatedTotalCount;
  static String? _generatedStockSoldQty;
  
  ReportType _selectedReportType = ReportType.Sales;
  DateTime _startDate = DateTime.now().subtract(const Duration(days: 30));
  DateTime _endDate = DateTime.now();
  BusinessType? _selectedBusinessType;
  PaymentStatus? _selectedPaymentStatus;
  Product? _selectedProduct;
  Customer? _selectedCustomer;
  Customer? _selectedVendor;

  final _productService = ProductService();
  final _salesService = SalesService();
  final _customerService = CustomerService();
  final _authService = AuthService(); // Auth Service
  
  bool _isLoading = false;

  Future<void> _exportReport() async {
    // 1. Check Permission (Admin Only)
    final currentUser = _authService.currentUser;
    if (currentUser?.role != UserRole.admin) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Permission Denied: Only Admins can export reports.'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    try {
      List<List<dynamic>> rows = [];
      String fileName = "report.csv";

      // 2. Generate Data based on Report Type
      if (_selectedReportType == ReportType.Sales || _selectedReportType == ReportType.Purchases) {
        fileName = "${_selectedReportType.name}_${DateTime.now().millisecondsSinceEpoch}.csv";
        rows.add(["Date", "Bill No", "Party", "Items", "Qty", "Amount", "Payment Status"]); // Header

        final allTransactions = await _salesService.getTransactionsStream().first;
        final type = _selectedReportType == ReportType.Sales ? TransactionType.Sale : TransactionType.Purchase;
        
        // Apply Filters
        final filtered = allTransactions.where((t) {
            if (t.type != type) return false;
            final start = DateTime(_startDate.year, _startDate.month, _startDate.day);
            final end = DateTime(_endDate.year, _endDate.month, _endDate.day, 23, 59, 59);
            if (t.date.isBefore(start) || t.date.isAfter(end)) return false;
            if (_selectedBusinessType != null && !t.items.any((i) => i.businessType == _selectedBusinessType)) return false;
            if (_selectedPaymentStatus != null && t.paymentStatus != _selectedPaymentStatus) return false;
            if (_selectedProduct != null && !t.items.any((i) => i.productName == _selectedProduct!.name)) return false;
            return true;
        }).toList();

        for (var t in filtered) {
          rows.add([
            NepaliDateHelper.formatToNepali(t.date),
            t.billNo,
            t.partyName,
            t.itemsSummary,
            t.qtySummary,
            t.totalPayable,
            t.paymentStatus.displayName
          ]);
        }
      } else if (_selectedReportType == ReportType.Stock) {
        fileName = "Stock_Report_${DateTime.now().millisecondsSinceEpoch}.csv";
        rows.add(["Date", "Product", "Type", "Qty", "Unit"]); // Header
        
        final allEntries = await StockService().getStockEntriesStream().first;
        final start = DateTime(_startDate.year, _startDate.month, _startDate.day);
        final end = DateTime(_endDate.year, _endDate.month, _endDate.day, 23, 59, 59);

        final filtered = allEntries.where((e) {
           if (e.date.isBefore(start) || e.date.isAfter(end)) return false;
           if (_selectedBusinessType != null && e.businessType != _selectedBusinessType) return false;
           if (_selectedProduct != null && e.productName != _selectedProduct!.name) return false;
           return true;
        }).toList();

        for (var e in filtered) {
          rows.add([
            NepaliDateHelper.formatToNepali(e.date),
            e.productName,
            e.businessType.displayName,
            e.count,
            e.unit.displayName
          ]);
        }
      } else {
         // Customer/Vendor logic similar to Sales/Purchase
         fileName = "${_selectedReportType.name}_${DateTime.now().millisecondsSinceEpoch}.csv";
         rows.add(["Date", "Bill No", "Party", "Items", "Qty", "Amount", "Status"]);

         final allTransactions = await _salesService.getTransactionsStream().first;
         final isCustomer = _selectedReportType == ReportType.Customer;
         final type = isCustomer ? TransactionType.Sale : TransactionType.Purchase;
         
         final filtered = allTransactions.where((t) {
            if (t.type != type) return false;
            final start = DateTime(_startDate.year, _startDate.month, _startDate.day);
            final end = DateTime(_endDate.year, _endDate.month, _endDate.day, 23, 59, 59);
            if (t.date.isBefore(start) || t.date.isAfter(end)) return false;
            if (isCustomer && _selectedCustomer != null && t.partyName != _selectedCustomer!.name) return false;
            if (!isCustomer && _selectedVendor != null && t.partyName != _selectedVendor!.name) return false;
            return true;
         }).toList();

         for (var t in filtered) {
           rows.add([
             NepaliDateHelper.formatToNepali(t.date),
             t.billNo,
             t.partyName,
             t.itemsSummary,
             t.qtySummary,
             t.totalPayable,
             t.paymentStatus.displayName
           ]);
         }
      }

      // 3. Generate CSV
      String csv = const ListToCsvConverter().convert(rows);

      // 4. Download (Web)
      final bytes = utf8.encode(csv);
      final blob = html.Blob([bytes]);
      final url = html.Url.createObjectUrlFromBlob(blob);
      final anchor = html.AnchorElement(href: url)
        ..setAttribute("download", fileName)
        ..click();
      html.Url.revokeObjectUrl(url);

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Exported to $fileName')),
      );

    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Export failed: $e')),
      );
    }
  }

  Future<void> _pickDateRange() async {
    final start = await NepaliDateHelper.pickNepaliDate(context, initialDate: _startDate, firstDate: DateTime(2020), lastDate: DateTime.now());
    if (start != null) {
      final end = await NepaliDateHelper.pickNepaliDate(context, initialDate: _endDate, firstDate: start, lastDate: DateTime.now());
      if (end != null) {
        setState(() {
          _startDate = start;
          _endDate = end;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Reports'),
        actions: [
          const NotificationBell(),
          if (_authService.currentUser?.role == UserRole.admin)
            IconButton(
              icon: const Icon(Icons.download),
              onPressed: _exportReport,
              tooltip: 'Export Report',
            ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              setState(() {});
            },
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Filter Panel
            CustomCard(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.filter_list, color: Theme.of(context).primaryColor),
                        const SizedBox(width: 8),
                        const Text(
                          'Filters',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    
                    // Report Type Selector
                    DropdownButtonFormField<ReportType>(
                      initialValue: _selectedReportType,
                      decoration: const InputDecoration(
                        labelText: 'Report Type',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.assessment),
                      ),
                      items: ReportType.values.map((type) => DropdownMenuItem(
                        value: type,
                        child: Text(type.displayName),
                      )).toList(),
                      onChanged: (value) {
                        setState(() {
                          _selectedReportType = value!;
                        });
                      },
                    ),
                    const SizedBox(height: 16),
                    
                    // Date Range Picker
                    InkWell(
                      onTap: _pickDateRange,
                      child: InputDecorator(
                        decoration: const InputDecoration(
                          labelText: 'Date Range',
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Icons.date_range),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              '${NepaliDateHelper.formatToNepali(_startDate)} - ${NepaliDateHelper.formatToNepali(_endDate)}',
                            ),
                            const Icon(Icons.arrow_drop_down),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    
                    // Business Type & Product Filters (Hidden for Customer/Vendor Reports)
                    if (_selectedReportType != ReportType.Customer && _selectedReportType != ReportType.Vendor) ...[
                      DropdownButtonFormField<BusinessType?>(
                        initialValue: _selectedBusinessType,
                        decoration: const InputDecoration(
                          labelText: 'Business Type (All)',
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Icons.category),
                        ),
                        items: [
                          const DropdownMenuItem(value: null, child: Text('All')),
                          ...BusinessType.values.map((type) => DropdownMenuItem(
                            value: type,
                            child: Text(type.displayName),
                          )),
                        ],
                        onChanged: (value) {
                          setState(() {
                            _selectedBusinessType = value;
                            _selectedProduct = null;
                          });
                        },
                      ),
                      const SizedBox(height: 16),

                      // Product Filter
                      StreamBuilder<List<Product>>(
                        stream: _productService.getProductsStream(),
                        builder: (context, snapshot) {
                          if (!snapshot.hasData) return const SizedBox.shrink();
                          
                          var products = snapshot.data!;
                          if (_selectedBusinessType != null) {
                            products = products.where((p) => p.businessType == _selectedBusinessType).toList();
                          }
                          
                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              DropdownButtonFormField<Product?>(
                                value: _selectedProduct,
                                isExpanded: true,
                                decoration: const InputDecoration(
                                  labelText: 'Product (All)',
                                  border: OutlineInputBorder(),
                                  prefixIcon: Icon(Icons.inventory_2),
                                ),
                                items: [
                                  const DropdownMenuItem(value: null, child: Text('All')),
                                  ...products.map((product) => DropdownMenuItem(
                                    value: product,
                                    child: Text(product.name),
                                  )),
                                ],
                                onChanged: (value) {
                                  setState(() => _selectedProduct = value);
                                },
                              ),
                              const SizedBox(height: 16),
                            ],
                          );
                        }
                      ),
                    ],

                    // Customer Filter
                    if (_selectedReportType == ReportType.Customer) ...[
                      StreamBuilder<List<Customer>>(
                        stream: _customerService.getCustomersStream(),
                        builder: (context, snapshot) {
                          if (!snapshot.hasData) return const SizedBox.shrink();
                          
                          final customers = snapshot.data!.where((c) => c.type == 'Customer').toList();
                          
                          return Column(
                            children: [
                              DropdownButtonFormField<Customer?>(
                                value: _selectedCustomer,
                                isExpanded: true,
                                decoration: const InputDecoration(
                                  labelText: 'Select Customer',
                                  border: OutlineInputBorder(),
                                  prefixIcon: Icon(Icons.person),
                                ),
                                items: [
                                  const DropdownMenuItem(value: null, child: Text('All Customers')),
                                  ...customers.map((c) => DropdownMenuItem(
                                    value: c,
                                    child: Text(c.name),
                                  )),
                                ],
                                onChanged: (value) {
                                  setState(() => _selectedCustomer = value);
                                },
                              ),
                              const SizedBox(height: 16),
                            ],
                          );
                        }
                      ),
                    ],

                    // Vendor Filter
                    if (_selectedReportType == ReportType.Vendor) ...[
                      StreamBuilder<List<Customer>>(
                        stream: _customerService.getCustomersStream(),
                        builder: (context, snapshot) {
                          if (!snapshot.hasData) return const SizedBox.shrink();
                          
                          final vendors = snapshot.data!.where((c) => c.type == 'Vendor').toList();
                          
                          return Column(
                            children: [
                              DropdownButtonFormField<Customer?>(
                                value: _selectedVendor,
                                isExpanded: true,
                                decoration: const InputDecoration(
                                  labelText: 'Select Vendor',
                                  border: OutlineInputBorder(),
                                  prefixIcon: Icon(Icons.store),
                                ),
                                items: [
                                  const DropdownMenuItem(value: null, child: Text('All Vendors')),
                                  ...vendors.map((v) => DropdownMenuItem(
                                    value: v,
                                    child: Text(v.name),
                                  )),
                                ],
                                onChanged: (value) {
                                  setState(() => _selectedVendor = value);
                                },
                              ),
                              const SizedBox(height: 16),
                            ],
                          );
                        }
                      ),
                    ],
                    
                    // Payment Status Filter (for Sales and Purchases only)
                    if (_selectedReportType == ReportType.Sales || _selectedReportType == ReportType.Purchases) ...[
                      DropdownButtonFormField<PaymentStatus?>(
                        initialValue: _selectedPaymentStatus,
                        decoration: const InputDecoration(
                          labelText: 'Payment Status (All)',
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Icons.payment),
                        ),
                        items: [
                          const DropdownMenuItem(value: null, child: Text('All')),
                          ...PaymentStatus.values.map((status) => DropdownMenuItem(
                            value: status,
                            child: Text(status.displayName),
                          )),
                        ],
                        onChanged: (value) {
                          setState(() => _selectedPaymentStatus = value);
                        },
                      ),
                      const SizedBox(height: 16),
                    ],
                    
                    // Generate Report Button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: _isLoading ? null : _generateReport,
                        icon: _isLoading 
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Icon(Icons.play_arrow),
                        label: Text(_isLoading ? 'Generating...' : 'Generate Report'),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.all(16),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Dynamic Report Content (Summary + Data)
            _buildReportContent(),
          ],
        ),
      ),
    );
  }

  Future<void> _generateReport() async {
    setState(() => _isLoading = true);
    
    try {
      if (_selectedReportType == ReportType.Sales || _selectedReportType == ReportType.Purchases) {
        final allTransactions = await _salesService.getTransactionsStream().first;
        final type = _selectedReportType == ReportType.Sales ? TransactionType.Sale : TransactionType.Purchase;
        
        final filtered = allTransactions.where((t) {
            if (t.type != type) return false;
            final start = DateTime(_startDate.year, _startDate.month, _startDate.day);
            final end = DateTime(_endDate.year, _endDate.month, _endDate.day, 23, 59, 59);
            if (t.date.isBefore(start) || t.date.isAfter(end)) return false;
            if (_selectedBusinessType != null && !t.items.any((i) => i.businessType == _selectedBusinessType)) return false;
            if (_selectedPaymentStatus != null && t.paymentStatus != _selectedPaymentStatus) return false;
            if (_selectedProduct != null && !t.items.any((i) => i.productName == _selectedProduct!.name)) return false;
            return true;
        }).toList();

        final totalAmount = filtered.fold(0.0, (sum, t) => sum + t.totalPayable);
        final label = type == TransactionType.Sale ? 'Total Revenue' : 'Total Expenses';

        setState(() {
          _generatedTransactions = filtered;
          _generatedStockEntries = null;
          _generatedReportType = _selectedReportType;
          _generatedTotalCount = filtered.length;
          _generatedTotalValue = "Rs ${totalAmount.toStringAsFixed(2)}";
          _generatedTotalLabel = label;
        });

      } else if (_selectedReportType == ReportType.Stock) {
        final allEntries = await StockService().getStockEntriesStream().first;
        final salesSnapshot = await _salesService.getTransactionsStream().first; // For sold calc
        
        final start = DateTime(_startDate.year, _startDate.month, _startDate.day);
        final end = DateTime(_endDate.year, _endDate.month, _endDate.day, 23, 59, 59);

        final filteredEntries = allEntries.where((e) {
           if (e.date.isBefore(start) || e.date.isAfter(end)) return false;
           if (_selectedBusinessType != null && e.businessType != _selectedBusinessType) return false;
           if (_selectedProduct != null && e.productName != _selectedProduct!.name) return false;
           return true;
        }).toList();
        
        double totalSoldQty = 0;
        for (var t in salesSnapshot) {
          if (t.type != TransactionType.Sale) continue;
          if (t.date.isBefore(start) || t.date.isAfter(end)) continue;
          for (var item in t.items) {
             if (_selectedBusinessType != null && item.businessType != _selectedBusinessType) continue;
             if (_selectedProduct != null && item.productName != _selectedProduct!.name) continue;
             totalSoldQty += item.quantity;
          }
        }

        setState(() {
          _generatedStockEntries = filteredEntries;
          _generatedTransactions = null;
          _generatedReportType = ReportType.Stock;
          _generatedTotalCount = filteredEntries.length;
          _generatedStockSoldQty = totalSoldQty.toStringAsFixed(0);
        });

      } else {
         // Customer/Vendor
         final allTransactions = await _salesService.getTransactionsStream().first;
         final isCustomer = _selectedReportType == ReportType.Customer;
         final type = isCustomer ? TransactionType.Sale : TransactionType.Purchase;
         
         final filtered = allTransactions.where((t) {
            if (t.type != type) return false;
            final start = DateTime(_startDate.year, _startDate.month, _startDate.day);
            final end = DateTime(_endDate.year, _endDate.month, _endDate.day, 23, 59, 59);
            if (t.date.isBefore(start) || t.date.isAfter(end)) return false;
            if (isCustomer && _selectedCustomer != null && t.partyName != _selectedCustomer!.name) return false;
            if (!isCustomer && _selectedVendor != null && t.partyName != _selectedVendor!.name) return false;
            return true;
         }).toList();

         final totalAmount = filtered.fold(0.0, (sum, t) => sum + t.totalPayable);
         final label = isCustomer ? 'Total Received' : 'Total Paid';
         
         setState(() {
          _generatedTransactions = filtered;
          _generatedStockEntries = null;
          _generatedReportType = _selectedReportType;
          _generatedTotalCount = filtered.length;
          _generatedTotalValue = "Rs ${totalAmount.toStringAsFixed(2)}";
          _generatedTotalLabel = label;
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error generating report: $e')));
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Widget _buildReportContent() {
    if (_isLoading) {
      return const Center(child: Padding(
        padding: EdgeInsets.all(32.0),
        child: CircularProgressIndicator(),
      ));
    }

    if (_generatedReportType == null) {
      return Center(
        child: Column(
          children: [
            const Icon(Icons.analytics, size: 64, color: Colors.grey),
            const SizedBox(height: 16),
            const Text(
              "Select filters and click 'Generate Report'",
              style: TextStyle(fontSize: 16, color: Colors.grey),
            ),
          ],
        ),
      );
    }

    // Render based on cached data
    if (_generatedReportType == ReportType.Sales || _generatedReportType == ReportType.Purchases || _generatedReportType == ReportType.Customer || _generatedReportType == ReportType.Vendor) {
       return _buildReportResult(
         _generatedTransactions ?? [], 
         _generatedTotalCount ?? 0, 
         _generatedTotalValue ?? "0", 
         _generatedTotalLabel ?? "Amount"
       );
    } else if (_generatedReportType == ReportType.Stock) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSummaryRow(
              (_generatedTotalCount ?? 0).toString(), 
              _generatedStockSoldQty ?? "0", 
              "Total Sold Qty"
            ),
            const SizedBox(height: 24),
            if ((_generatedStockEntries ?? []).isEmpty)
                const Center(child: Padding(
                padding: EdgeInsets.all(32.0),
                child: Text("No stock records found for filter"),
              ))
            else
              Card(
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: DataTable(
                    columns: const [
                      DataColumn(label: Text('Date')),
                      DataColumn(label: Text('Product')),
                      DataColumn(label: Text('Type')),
                      DataColumn(label: Text('Qty')), // Balance
                      DataColumn(label: Text('Unit')),
                    ],
                    rows: (_generatedStockEntries!).map((e) {
                      return DataRow(cells: [
                        DataCell(Text(NepaliDateHelper.formatToNepali(e.date))),
                        DataCell(Text(e.productName)),
                        DataCell(Text(e.businessType.displayName)),
                        DataCell(Text(e.count.toString())),
                        DataCell(Text(e.unit.displayName)),
                      ]);
                    }).toList(),
                  ),
                ),
              ),
          ],
        );
    }
    
    return const SizedBox.shrink();
  }

  Widget _buildReportResult(List<TransactionRecord> filtered, int count, String value, String label) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSummaryRow(count.toString(), value, label),
        const SizedBox(height: 24),
        if (filtered.isEmpty)
          const Center(child: Padding(
            padding: EdgeInsets.all(32.0),
            child: Text("No filtered records found"),
          ))
        else
          Card(
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: DataTable(
                columns: const [
                  DataColumn(label: Text('Date')),
                  DataColumn(label: Text('Bill No')),
                  DataColumn(label: Text('Party')),
                  DataColumn(label: Text('Items')),
                  DataColumn(label: Text('Qty')),
                  DataColumn(label: Text('Amount')),
                  DataColumn(label: Text('Status')),
                ],
                rows: filtered.map((t) {
                   return DataRow(cells: [
                     DataCell(Text(NepaliDateHelper.formatToNepali(t.date))),
                     DataCell(Text(t.billNo)),
                     DataCell(Text(t.partyName)),
                     DataCell(Text(t.itemsSummary)),
                     DataCell(Text(t.qtySummary)),
                     DataCell(Text("Rs ${t.totalPayable.toStringAsFixed(2)}")),
                     DataCell(
                       Container(
                         padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                         decoration: BoxDecoration(
                           color: t.paymentStatus == PaymentStatus.Pending ? Colors.red.shade100 : Colors.green.shade100,
                           borderRadius: BorderRadius.circular(12),
                         ),
                         child: Text(
                           t.paymentStatus.displayName,
                           style: TextStyle(
                             color: t.paymentStatus == PaymentStatus.Pending ? Colors.red.shade800 : Colors.green.shade800,
                             fontSize: 12,
                           ),
                         ),
                       )
                     ),
                   ]);
                }).toList(),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildSummaryRow(String count, String value, String valueLabel) {
    return Center(
      child: Container(
        constraints: const BoxConstraints(maxWidth: 800),
        child: Wrap(
          spacing: 16,
          runSpacing: 16,
          children: [
            // Total Records Card
            SizedBox(
              width: MediaQuery.of(context).size.width > 600 ? 392 : double.infinity,
              child: CustomCard(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.receipt_long, color: Theme.of(context).primaryColor, size: 28),
                          const SizedBox(width: 12),
                          const Expanded(
                            child: Text(
                              'Total Records',
                              style: TextStyle(fontSize: 14, color: Colors.grey),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      FittedBox(
                        fit: BoxFit.scaleDown,
                        alignment: Alignment.centerLeft,
                        child: Text(
                          count,
                          style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'for selected period',
                        style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            
            // Value Card (Revenue/Expenses/etc)
            SizedBox(
              width: MediaQuery.of(context).size.width > 600 ? 392 : double.infinity,
              child: CustomCard(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Theme.of(context).primaryColor.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              "Rs.",
                              style: TextStyle(
                                color: Theme.of(context).primaryColor,
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              valueLabel,
                              style: const TextStyle(fontSize: 14, color: Colors.grey),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      FittedBox(
                        fit: BoxFit.scaleDown,
                        alignment: Alignment.centerLeft,
                        child: Text(
                          value,
                          style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'for selected period',
                        style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
