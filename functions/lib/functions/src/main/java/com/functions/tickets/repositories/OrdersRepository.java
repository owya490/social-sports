package com.functions.tickets.repositories;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.firebase.services.FirebaseService;
import com.functions.tickets.models.Order;
import com.functions.utils.JavaUtils;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Transaction;

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
        return getOrderById(orderId, Optional.empty());
    }

    public static Optional<Order> getOrderById(String orderId, Optional<Transaction> transaction) {
        try {
            Firestore db = FirebaseService.getFirestore();
            DocumentReference docRef = db.collection(ORDERS_COLLECTION).document(orderId);
            DocumentSnapshot snapshot = transaction.isPresent() ? transaction.get().get(docRef).get()
                    : docRef.get().get();

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
        return getOrdersByIds(orderIds, Optional.empty());
    }

    public static List<Order> getOrdersByIds(List<String> orderIds, Optional<Transaction> transaction) {
        List<Order> orders = new ArrayList<>();
        for (String orderId : orderIds) {
            getOrderById(orderId, transaction).ifPresent(orders::add);
        }
        return orders;
    }

    public static void updateOrder(String orderId, Order order) {
        updateOrder(orderId, order, Optional.empty());
    }

    public static void updateOrder(String orderId, Order order, Optional<Transaction> transaction) {
        try {
            Firestore db = FirebaseService.getFirestore();
            DocumentReference docRef = db.collection(ORDERS_COLLECTION).document(orderId);
            if (transaction.isPresent()) {
                transaction.get().update(docRef, JavaUtils.toMap(order));
            } else {
                docRef.update(JavaUtils.toMap(order)).get();
            }
        } catch (Exception e) {
            logger.error("Failed to update order: {}", orderId, e);
            throw new RuntimeException("Failed to update order", e);
        }
    }
}
