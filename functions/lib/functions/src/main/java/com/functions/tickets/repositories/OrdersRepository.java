package com.functions.tickets.repositories;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.firebase.services.FirebaseService;
import com.functions.tickets.models.Order;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;

/**
 * Repository for accessing order data from Firestore.
 */
public class OrdersRepository {
    private static final Logger logger = LoggerFactory.getLogger(OrdersRepository.class);
    private static final String ORDERS_COLLECTION = "Orders";

    /**
     * Gets an order by its ID.
     *
     * @param orderId The order ID
     * @return Optional containing the order if found
     */
    public static Optional<Order> getOrderById(String orderId) {
        try {
            Firestore db = FirebaseService.getFirestore();
            DocumentReference docRef = db.collection(ORDERS_COLLECTION).document(orderId);
            DocumentSnapshot snapshot = docRef.get().get();

            if (snapshot.exists()) {
                Order order = snapshot.toObject(Order.class);
                if (order != null) {
                    order.setOrderId(orderId);
                }
                return Optional.ofNullable(order);
            }
            return Optional.empty();
        } catch (Exception e) {
            logger.error("Failed to get order by ID: {}", orderId, e);
            return Optional.empty();
        }
    }

    /**
     * Gets multiple orders by their IDs.
     *
     * @param orderIds List of order IDs
     * @return List of orders found
     */
    public static List<Order> getOrdersByIds(List<String> orderIds) {
        List<Order> orders = new ArrayList<>();
        for (String orderId : orderIds) {
            getOrderById(orderId).ifPresent(orders::add);
        }
        return orders;
    }
}

