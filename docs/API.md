# AquaNexus Backend API Documentation

## Base URL

`/api`

## Standard Response Format

**Success**

```json
{
  "success": true,
  "data": { ... },
  "message": "Success message"
}
```

**Error**

```json
{
  "success": false,
  "data": null,
  "message": "Error message"
}
```

---

## Authentication

### 1. Login

- **Endpoint**: `/auth/login`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "admin@aquanexus.com",
    "password": "password"
  }
  ```
- **Response**: JWT Token + User object

### 2. Get Current User

- **Endpoint**: `/auth/me`
- **Method**: `GET`
- **Auth Required**: Yes (Bearer Token)
- **Response**: User object with roles and permissions

### 3. Logout

- **Endpoint**: `/auth/logout`
- **Method**: `POST`
- **Auth Required**: Yes
- **Response**: Success message

---

## Admin APIs

_All admin APIs require authentication and the `ADMIN` role._

### 1. Get All Users

- **Endpoint**: `/users`
- **Method**: `GET`
- **Response**: Array of users

### 2. Create User

- **Endpoint**: `/users`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password",
    "firstName": "John",
    "lastName": "Doe",
    "roleId": 2
  }
  ```

### 3. Update User

- **Endpoint**: `/users/:id`
- **Method**: `PATCH`
- **Path Parameters**: `id` (User ID)
- **Request Body**: Any fields from Create User.

### 4. Get All Roles

- **Endpoint**: `/roles`
- **Method**: `GET`

### 5. Get All Permissions

- **Endpoint**: `/permissions`
- **Method**: `GET`

---

## Manager Assignments

### 1. Assign Area to Manager

- **Endpoint**: `/manager-assignments`
- **Method**: `POST`
- **Auth Required**: Yes (ADMIN only)
- **Request Body**:
  ```json
  {
    "userId": 2,
    "area": "PRODUCTION"
  }
  ```

### 2. Get Manager Assignments

- **Endpoint**: `/manager-assignments/:userId`
- **Method**: `GET`
- **Auth Required**: Yes
- **Path Parameters**: `userId`

---

## Distribution and Finance APIs

All endpoints below require a Bearer token and use the standard response format.
Distributor users can only access records linked through `UserDistributor`; the backend does not trust a frontend-provided distributor ID for ownership.

### Sales Areas

- `GET /sales-areas`
- `POST /sales-areas` (`ADMIN`, `MANAGER`)

Create body:

```json
{
  "name": "North Zone",
  "code": "NZ",
  "description": "Northern sales territory"
}
```

### Distributors

- `GET /distributors`
- `POST /distributors` (`ADMIN`, `MANAGER`)
- `GET /distributor-stock`

### Orders

- `GET /orders`
- `POST /orders`
- `GET /orders/:id`

Order body:

```json
{
  "orderDate": "2026-09-04",
  "items": [{ "productId": "PRODUCT_UUID", "quantity": 10 }],
  "discount": 0,
  "tax": 0,
  "notes": "Regular order"
}
```

The backend obtains item prices from `Product.sellingPrice` and calculates subtotal and total amount.

### Dispatch

- `GET /dispatch`
- `POST /dispatch` (`ADMIN`, `MANAGER`, `STORE_MANAGER`)

Dispatch creation is transactional: central inventory is decremented, distributor stock is incremented, and a stock transaction is recorded together with the dispatch.

### Invoices and Payments

- `GET /invoices`
- `POST /invoices` (`ADMIN`, `MANAGER`, `ACCOUNTANT`)
- `GET /payments`
- `POST /payments` (`ADMIN`, `ACCOUNTANT`)

Invoice responses include calculated `paidAmount` and `outstandingAmount`. Payments are recorded as completed only after verifying that the amount does not exceed the invoice outstanding balance.
