# Orders API

The demo uses automatic non-geographic dispatch. Checkout reserves the
available rider who has been waiting longest (`updated_at` ascending). Location
tracking and closest-rider calculations are intentionally deferred.

## Checkout

```http
POST /orders
Authorization: Bearer <customer-access-token>
Content-Type: application/json

{
  "deliveryAddress": {
    "recipientName": "Test Customer",
    "phoneNumber": "+923001234567",
    "addressLine1": "123 Test Street",
    "city": "Karachi",
    "postalCode": "75500",
    "instructions": "Call at the gate"
  }
}
```

Checkout requires a non-empty cart, sufficient stock, active products/stores,
and an available rider. It atomically creates the order and item snapshots,
decrements stock, reserves the rider, and clears the cart. Prices come from the
server; the demo delivery fee is `5.00`.

## Customer endpoints

```http
GET /orders
GET /orders/:orderId
PATCH /orders/:orderId/cancel
```

Customers can cancel only while the order is `assigned`. Cancellation releases
the rider and restores inventory for products that still exist.

## Rider endpoints

```http
GET /orders/rider/current

PATCH /orders/rider/:orderId/status
Content-Type: application/json

{ "status": "picked_up" }
```

Valid transitions are `assigned → picked_up → delivered`. Delivery releases
the rider and makes them available again.
