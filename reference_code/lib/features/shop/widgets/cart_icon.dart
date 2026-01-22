import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart'; // Add this import
import 'package:farm_management_app/features/shop/services/cart_service.dart';

class CartIcon extends StatelessWidget {
  const CartIcon({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<CartService>(
      builder: (context, cart, child) {
        return Stack(
          alignment: Alignment.topRight,
          children: [
            IconButton(
              icon: const Icon(Icons.shopping_cart_outlined, color: Colors.green),
              onPressed: () => context.push('/cart'),
            ),
            if (cart.itemCount > 0)
              Container(
                margin: const EdgeInsets.only(top: 4, right: 4),
                padding: const EdgeInsets.all(4),
                decoration: const BoxDecoration(
                  color: Colors.red,
                  shape: BoxShape.circle,
                ),
                child: Text(
                  '${cart.itemCount}',
                  style: const TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.bold),
                ),
              ),
          ],
        );
      },
    );
  }
}
