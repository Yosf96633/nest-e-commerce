# Rider API

Rider routes require an access token and the `rider` role. A customer obtains
that role by submitting a rider application and receiving admin approval.

## Create a rider profile

```http
POST /rider/profile
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "vehicleType": "motorcycle",
  "vehicleMake": "Honda",
  "vehicleModel": "CG 125",
  "vehicleColor": "Black",
  "plateNumber": "ABC-123",
  "licenseNumber": "LIC-123"
}
```

`vehicleType` accepts `bicycle`, `motorcycle`, `car`, or `van`. Plate and
license numbers are required for every motor vehicle and are normalized to
uppercase. Each user, plate number, and license number can belong to only one
rider profile.

## Get the current rider profile

```http
GET /rider/profile
Authorization: Bearer <access-token>
```

## Update the current rider profile

```http
PATCH /rider/profile
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "vehicleColor": "Red"
}
```

At least one field must be provided. Changing from a bicycle to a motor vehicle
requires valid plate and license numbers in the resulting profile.

## Change availability

```http
PATCH /rider/availability
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "isAvailable": true
}
```

A rider profile must exist before availability can be changed. Delivery and
order assignment are intentionally not part of this module yet because the
project does not currently have an order domain.
