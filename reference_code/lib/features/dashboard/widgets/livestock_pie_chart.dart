import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:farm_management_app/features/inventory/services/product_service.dart';
import 'package:farm_management_app/features/inventory/models/product.dart';
import 'package:farm_management_app/features/inventory/models/stock_entry.dart';

class LivestockPieChart extends StatefulWidget {
  const LivestockPieChart({super.key});

  @override
  State<LivestockPieChart> createState() => _LivestockPieChartState();
}

class _LivestockPieChartState extends State<LivestockPieChart> {
  int touchedIndex = -1;

  @override
  Widget build(BuildContext context) {
    final productService = context.read<ProductService>();

    return StreamBuilder<List<Product>>(
      stream: productService.getProductsStream(),
      builder: (context, productSnapshot) {
        if (productSnapshot.connectionState == ConnectionState.waiting) {
          return const Card(
            child: SizedBox(
              height: 200,
              child: Center(child: CircularProgressIndicator()),
            ),
          );
        }

        final products = productSnapshot.data ?? [];
        final livestockProducts = products.where((p) => p.businessType == BusinessType.livestocks).toList();
        
        final Map<String, double> data = {};
        for (var product in livestockProducts) {
          if (product.currentStock > 0) {
            data[product.name] = product.currentStock;
          }
        }

        return Container(
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
              const Text(
                "Livestock Distribution",
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
              const SizedBox(height: 24),
              if (data.isEmpty)
                const SizedBox(
                  height: 150,
                  child: Center(
                    child: Text(
                      "No livestock data available",
                      style: TextStyle(color: Colors.grey),
                    ),
                  ),
                )
              else
                _buildChart(data),
            ],
          ),
        );
      },
    );
  }

  Widget _buildChart(Map<String, double> data) {
    final List<Color> colors = [
      Colors.blue,
      Colors.red,
      Colors.green,
      Colors.orange,
      Colors.purple,
      Colors.teal,
      Colors.pink,
    ];

    final total = data.values.fold(0.0, (sum, val) => sum + val);

    return Row(
      children: [
        // Pie Chart
        Expanded(
          flex: 1,
          child: SizedBox(
            height: 200,
            child: PieChart(
              PieChartData(
                pieTouchData: PieTouchData(
                  touchCallback: (FlTouchEvent event, pieTouchResponse) {
                    setState(() {
                      if (!event.isInterestedForInteractions ||
                          pieTouchResponse == null ||
                          pieTouchResponse.touchedSection == null) {
                        touchedIndex = -1;
                        return;
                      }
                      touchedIndex = pieTouchResponse
                          .touchedSection!.touchedSectionIndex;
                    });
                  },
                ),
                borderData: FlBorderData(show: false),
                sectionsSpace: 2,
                centerSpaceRadius: 40,
                sections: List.generate(data.length, (i) {
                  final isTouched = i == touchedIndex;
                  final fontSize = isTouched ? 16.0 : 0.0;
                  final radius = isTouched ? 60.0 : 50.0;
                  final entry = data.entries.elementAt(i);
                  
                  return PieChartSectionData(
                    color: colors[i % colors.length],
                    value: entry.value,
                    title: '${(entry.value).toInt()}',
                    radius: radius,
                    titleStyle: TextStyle(
                      fontSize: fontSize,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  );
                }),
              ),
            ),
          ),
        ),
        const SizedBox(width: 24),
        // Legend
        Expanded(
          flex: 1,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: List.generate(data.length, (i) {
              final entry = data.entries.elementAt(i);
              final percentage = (entry.value / total * 100).toStringAsFixed(1);
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  children: [
                    Container(
                      width: 12,
                      height: 12,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: colors[i % colors.length],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        entry.key,
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey.shade700,
                          fontWeight: FontWeight.w500,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Text(
                      "$percentage%",
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade500,
                      ),
                    ),
                  ],
                ),
              );
            }),
          ),
        ),
      ],
    );
  }
}
