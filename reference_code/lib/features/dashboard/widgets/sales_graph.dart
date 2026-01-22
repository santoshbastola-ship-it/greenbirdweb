import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:farm_management_app/features/sales/services/sales_service.dart';
import 'package:farm_management_app/features/inventory/models/stock_entry.dart';
import 'package:intl/intl.dart';
import 'package:farm_management_app/core/utils/nepali_date_helper.dart';

class SalesGraph extends StatefulWidget {
  const SalesGraph({super.key});

  @override
  State<SalesGraph> createState() => _SalesGraphState();
}

class _SalesGraphState extends State<SalesGraph> {
  Future<Map<DateTime, double>>? _salesDataFuture;
  
  // Filter States
  int _selectedDurationDays = 7;
  BusinessType? _selectedType;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _salesDataFuture ??= context.read<SalesService>().getSalesTrend(
      days: _selectedDurationDays,
      type: _selectedType,
    );
  }

  void _fetchData() {
    setState(() {
      _salesDataFuture = context.read<SalesService>().getSalesTrend(
        days: _selectedDurationDays,
        type: _selectedType,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_salesDataFuture == null) {
       return const SizedBox(
            height: 320, 
            child: Center(child: CircularProgressIndicator())
       );
    }

    return FutureBuilder<Map<DateTime, double>>(
      future: _salesDataFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const SizedBox(
            height: 320, 
            child: Center(child: CircularProgressIndicator())
          );
        }

        if (snapshot.hasError) {
          return const SizedBox(
            height: 320, 
            child: Center(child: Text("Error loading sales data"))
          );
        }

        final data = snapshot.data!;
        final sortedDates = data.keys.toList()..sort();
        
        // Find min and max for Y-axis scaling
        double maxY = 0;
        for (var amount in data.values) {
          if (amount > maxY) maxY = amount;
        }
        // Add some buffer to top
        maxY = (maxY * 1.2).roundToDouble();
        if (maxY == 0) maxY = 10;

        if (sortedDates.isEmpty) {
          return Container(
            height: 340,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
               color: Colors.white,
               borderRadius: BorderRadius.circular(20),
            ),
            child: const Center(child: Text("No sales data available for selected period")),
          );
        }

        List<FlSpot> spots = [];
        for (int i = 0; i < sortedDates.length; i++) {
          spots.add(FlSpot(i.toDouble(), data[sortedDates[i]]!));
        }

        return Container(
          height: 340, // Height increased for filters
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
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
               // Header and Filters
               Row(
                 mainAxisAlignment: MainAxisAlignment.spaceBetween,
                 children: [
                   Column(
                     crossAxisAlignment: CrossAxisAlignment.start,
                     children: [
                       Text(
                         "Sales Trend",
                         style: TextStyle(
                           fontSize: 14,
                           fontWeight: FontWeight.w500,
                           color: Colors.grey.shade600,
                         ),
                       ),
                       const SizedBox(height: 4),
                       // Filter for Duration
                       DropdownButton<int>(
                         value: _selectedDurationDays,
                         isDense: true,
                         underline: Container(),
                         style: const TextStyle(
                           fontSize: 18,
                           fontWeight: FontWeight.bold,
                           color: Colors.black87,
                         ),
                         items: const [
                           DropdownMenuItem(value: 7, child: Text('Last 7 Days')),
                           DropdownMenuItem(value: 30, child: Text('Last 30 Days')),
                         ],
                         onChanged: (value) {
                           if (value != null) {
                             setState(() => _selectedDurationDays = value);
                             _fetchData();
                           }
                         },
                       ),
                     ],
                   ),
                   // Filter for Business Type
                   Container(
                     padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                     decoration: BoxDecoration(
                       color: Theme.of(context).primaryColor.withOpacity(0.1),
                       borderRadius: BorderRadius.circular(20),
                     ),
                     child: DropdownButton<BusinessType?>(
                       value: _selectedType,
                       isDense: true,
                       underline: Container(),
                       icon: Icon(Icons.filter_list, size: 18, color: Theme.of(context).primaryColor),
                       style: TextStyle(
                         fontSize: 12,
                         fontWeight: FontWeight.w600,
                         color: Theme.of(context).primaryColor,
                       ),
                       items: [
                         const DropdownMenuItem(value: null, child: Text("All Products")),
                         ...BusinessType.values.map((type) => DropdownMenuItem(
                           value: type,
                           child: Text(type.displayName ?? type.name),
                         )),
                       ],
                       onChanged: (value) {
                         setState(() => _selectedType = value);
                         _fetchData();
                       },
                     ),
                   ),
                 ],
               ),
              const SizedBox(height: 24),
              Expanded(
                child: LineChart(
                  LineChartData(
                    lineTouchData: LineTouchData(
                      touchTooltipData: LineTouchTooltipData(
                        getTooltipColor: (touchedSpot) => Colors.blueGrey.shade800,
                        getTooltipItems: (List<LineBarSpot> touchedBarSpots) {
                          return touchedBarSpots.map((barSpot) {
                            final index = barSpot.x.toInt();
                            if (index < 0 || index >= sortedDates.length) return null;
                            
                            final date = sortedDates[index];
                            final dateStr = NepaliDateHelper.formatToNepaliShort(date);
                            
                            return LineTooltipItem(
                              "$dateStr\n",
                              const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                              children: [
                                TextSpan(
                                  text: "Rs ${barSpot.y.toStringAsFixed(0)}",
                                  style: const TextStyle(
                                    color: Colors.yellowAccent,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            );
                          }).toList();
                        },
                      ),
                    ),
                    gridData: FlGridData(
                      show: true,
                      drawVerticalLine: false,
                      horizontalInterval: maxY / 4,
                      getDrawingHorizontalLine: (value) {
                        return FlLine(
                          color: Colors.grey.shade100,
                          strokeWidth: 1,
                        );
                      },
                    ),
                    titlesData: FlTitlesData(
                      show: true,
                      rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                      topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                      bottomTitles: AxisTitles(
                        sideTitles: SideTitles(
                          showTitles: true,
                          reservedSize: 30,
                          // Adjust interval based on duration
                          interval: _selectedDurationDays > 7 ? 5.0 : 1.0, 
                          getTitlesWidget: (value, meta) {
                            final index = value.toInt();
                            if (index >= 0 && index < sortedDates.length) {
                              // Only show logic to prevent overlapping text if many points
                              return Padding(
                                padding: const EdgeInsets.only(top: 8),
                                child: Text(
                                  // Show Day (e.g., "12") for longer ranges, Day Name (e.g., "Mon") for short
                                  _selectedDurationDays > 7 
                                      ? NepaliDateHelper.formatToNepaliShort(sortedDates[index])
                                      : NepaliDateHelper.formatToNepaliShort(sortedDates[index]),
                                  style: TextStyle(
                                    color: Colors.grey.shade500,
                                    fontSize: 10,
                                  ),
                                ),
                              );
                            }
                            return const Text('');
                          },
                        ),
                      ),
                      leftTitles: AxisTitles(
                        sideTitles: SideTitles(
                          showTitles: false, 
                        ),
                      ),
                    ),
                    borderData: FlBorderData(show: false),
                    minX: 0,
                    maxX: (sortedDates.length <= 1) ? 1.0 : (sortedDates.length.toDouble() - 1),
                    minY: 0,
                    maxY: maxY,
                    lineBarsData: [
                      LineChartBarData(
                        spots: spots,
                        isCurved: true,
                        color: Theme.of(context).primaryColor,
                        barWidth: 3,
                        isStrokeCapRound: true,
                        dotData: FlDotData(
                          show: _selectedDurationDays <= 7, // Hide dots on long ranges for cleaner look
                          getDotPainter: (spot, percent, barData, index) {
                            return FlDotCirclePainter(
                              radius: 4,
                              color: Colors.white,
                              strokeWidth: 2,
                              strokeColor: Theme.of(context).primaryColor,
                            );
                          },
                        ),
                        belowBarData: BarAreaData(
                          show: true,
                          gradient: LinearGradient(
                            colors: [
                              Theme.of(context).primaryColor.withOpacity(0.2),
                              Theme.of(context).primaryColor.withOpacity(0.0),
                            ],
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
