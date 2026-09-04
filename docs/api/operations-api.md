# AquaNexus — Operations Backend API Contracts (Krishna)

> **For Frontend Developers:**
> - **NIRANJAN**: Employee, Attendance, Leave, Overtime, Production (`/employees`, `/attendance`, `/leave`, `/overtime`, `/production`)
> - **RAM**: Store, Inventory, Goods Received, Stock Movements (`/store/inventory`, `/store/goods-received`, `/store/stock-in`, `/store/stock-out`)

---

## Common API Conventions

### Headers
All protected requests MUST include the JWT Authorization header:
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Standard Response Envelope
All responses strictly follow Abhay's standard envelope:

#### Success Response (200 / 201)
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation description"
}
```

#### Error Response (400 / 401 / 403 / 404 / 500)
```json
{
  "success": false,
  "data": null,
  "message": "Human readable error message"
}
```

---

## 1. Employee Management APIs

### `GET /api/employees/departments`
- **Permission**: `employee.view`
- **Description**: List all active organizational departments.
- **Response Data**: Array of Department objects `[{ id, name, code, description, status }]`.

### `GET /api/employees`
- **Permission**: `employee.view`
- **Query Params**:
  - `page` (default: 1)
  - `limit` (default: 10)
  - `search` (optional: searches firstName, lastName, employeeCode, email, designation)
  - `departmentId` (optional UUID filter)
  - `status` (`ACTIVE` | `INACTIVE` | `ON_LEAVE` | `TERMINATED`)
  - `employmentType` (`PERMANENT` | `CONTRACT` | `TEMPORARY` | `INTERN`)
- **Response Data**:
  ```json
  {
    "employees": [
      {
        "id": "uuid",
        "employeeCode": "EMP001",
        "firstName": "Ramesh",
        "lastName": "Kumar",
        "email": "ramesh@aquanexus.com",
        "phone": "9876543210",
        "departmentId": "uuid",
        "designation": "Production Supervisor",
        "joiningDate": "2024-01-15T00:00:00.000Z",
        "employmentType": "PERMANENT",
        "status": "ACTIVE",
        "department": { "id": "uuid", "name": "Production", "code": "PROD" }
      }
    ],
    "pagination": { "total": 25, "page": 1, "limit": 10, "totalPages": 3 }
  }
  ```

### `GET /api/employees/:id`
- **Permission**: `employee.view`
- **Description**: Fetch detailed employee profile with recent attendance, leaves, and overtimes.

### `POST /api/employees`
- **Permission**: `employee.create`
- **Request Body**:
  ```json
  {
    "employeeCode": "EMP006", // Optional (auto-generated if omitted)
    "firstName": "Rahul",
    "lastName": "Sharma",
    "email": "rahul@aquanexus.com",
    "phone": "9876543299",
    "departmentId": "uuid-of-department",
    "designation": "Machine Operator",
    "joiningDate": "2024-06-01",
    "employmentType": "PERMANENT", // Default: PERMANENT
    "status": "ACTIVE" // Default: ACTIVE
  }
  ```

### `PATCH /api/employees/:id`
- **Permission**: `employee.update`
- **Request Body**: Accepts partial updates for any employee fields (`firstName`, `lastName`, `email`, `phone`, `departmentId`, `designation`, `status`, etc.).

---

## 2. Attendance APIs

### `GET /api/attendance`
- **Permission**: `attendance.view`
- **Query Params**:
  - `page` (default: 1), `limit` (default: 20)
  - `employeeId` (optional UUID)
  - `departmentId` (optional UUID)
  - `startDate`, `endDate` (ISO date filter: `YYYY-MM-DD`)
  - `status` (`PRESENT` | `ABSENT` | `HALF_DAY` | `LEAVE` | `HOLIDAY`)

### `POST /api/attendance`
- **Permission**: `attendance.create`
- **Request Body** (Single or Bulk Array):
  ```json
  {
    "records": [
      {
        "employeeId": "uuid",
        "attendanceDate": "2024-06-03",
        "status": "PRESENT",
        "checkIn": "2024-06-03T09:00:00Z",
        "checkOut": "2024-06-03T18:00:00Z",
        "remarks": "On time"
      }
    ]
  }
  ```

---

## 3. Leave Management APIs

### `GET /api/leave`
- **Permission**: `attendance.view`
- **Query Params**: `page`, `limit`, `employeeId`, `status` (`PENDING` | `APPROVED` | `REJECTED` | `CANCELLED`), `leaveType` (`CASUAL` | `SICK` | `ANNUAL` | `EMERGENCY` | `OTHER`), `startDate`, `endDate`.

### `POST /api/leave`
- **Permission**: `attendance.create`
- **Request Body**:
  ```json
  {
    "employeeId": "uuid",
    "leaveType": "CASUAL",
    "startDate": "2024-07-10",
    "endDate": "2024-07-12",
    "reason": "Personal work"
  }
  ```

### `PATCH /api/leave/:id`
- **Permission**: `attendance.update`
- **Request Body**: `{ "status": "APPROVED" }` (or `REJECTED` / `CANCELLED`). Attaches authenticated user as `approvedBy`.

---

## 4. Overtime APIs

### `GET /api/overtime`
- **Permission**: `attendance.view`
- **Query Params**: `page`, `limit`, `employeeId`, `status` (`PENDING` | `APPROVED` | `REJECTED`), `startDate`, `endDate`.

### `POST /api/overtime`
- **Permission**: `attendance.create`
- **Request Body**:
  ```json
  {
    "employeeId": "uuid",
    "overtimeDate": "2024-06-15",
    "hours": 3.5,
    "reason": "Extra packaging shift"
  }
  ```

### `PATCH /api/overtime/:id`
- **Permission**: `attendance.update`
- **Request Body**: `{ "status": "APPROVED" }` (or `REJECTED`). Attaches authenticated user as `approvedBy`.

---

## 5. Product Catalog APIs

### `GET /api/products`
- **Permission**: `production.view`
- **Query Params**: `page`, `limit`, `search`, `category`, `status` (`ACTIVE` | `INACTIVE` | `DISCONTINUED`).
- **Response Data**: Includes nested `inventory` level (`quantity`, `reservedQuantity`, `reorderLevel`).

### `GET /api/products/:id`
- **Permission**: `production.view`
- **Response Data**: Complete product record + inventory breakdown + recent production batches.

### `POST /api/products`
- **Permission**: `inventory.manage`
- **Request Body**:
  ```json
  {
    "sku": "WB-20L",
    "name": "20 Litre Water Bottle",
    "description": "Standard 20L packaged drinking water bottle",
    "category": "Bottled Water",
    "unit": "Bottle",
    "sellingPrice": 40.00,
    "costPrice": 25.00,
    "minimumStock": 100,
    "status": "ACTIVE"
  }
  ```
- **Note**: Automatically initializes a central `Inventory` record for the product with stock = 0.

### `PATCH /api/products/:id`
- **Permission**: `inventory.manage`
- **Request Body**: Partial update for product fields (`name`, `sellingPrice`, `costPrice`, `minimumStock`, etc.).

---

## 6. Production Management APIs

### `GET /api/production`
- **Permission**: `production.view`
- **Query Params**: `page`, `limit`, `search`, `productId`, `status` (`PLANNED` | `IN_PROGRESS` | `COMPLETED` | `CANCELLED`), `startDate`, `endDate`.
- **Calculated Fields Included**: `totalReceived` (sum of Goods Received) and `remainingQuantity` (`quantity - totalReceived`).

### `GET /api/production/:id`
- **Permission**: `production.view`
- **Response Data**: Detailed production batch info + full `goodsReceived` receiving history log.

### `POST /api/production`
- **Permission**: `production.create`
- **Request Body**:
  ```json
  {
    "productionNumber": "PRD-2024-003", // Optional (auto-generated if omitted)
    "productId": "uuid-of-product",
    "quantity": 500,
    "productionDate": "2024-06-25",
    "batchNumber": "BATCH-003", // Optional
    "remarks": "Scheduled morning batch",
    "status": "PLANNED" // PLANNED | IN_PROGRESS
  }
  ```

### `PATCH /api/production/:id`
- **Permission**: `production.update`
- **Request Body**: `{ "status": "IN_PROGRESS" }` (or `COMPLETED` / `CANCELLED`).

---

## 7. Inventory & Stock Operations APIs

### `GET /api/inventory`
- **Permission**: `inventory.view`
- **Query Params**: `page`, `limit`, `search`, `category`, `lowStockOnly` (`true` | `false`).
- **Response Data**:
  ```json
  {
    "inventory": [
      {
        "id": "uuid",
        "productId": "uuid",
        "quantity": 500,
        "reservedQuantity": 50,
        "reorderLevel": 100,
        "availableQuantity": 450,
        "isLowStock": false,
        "product": { "sku": "WB-20L", "name": "20 Litre Water Bottle", "unit": "Bottle" }
      }
    ],
    "pagination": { "total": 3, "page": 1, "limit": 20, "totalPages": 1 }
  }
  ```

### `GET /api/inventory/low-stock`
- **Permission**: `inventory.view`
- **Description**: Returns only items where `quantity <= reorderLevel` or `quantity <= minimumStock`.

### `GET /api/stock-transactions`
- **Permission**: `inventory.view`
- **Query Params**: `page`, `limit`, `productId`, `transactionType` (`PRODUCTION_RECEIPT` | `STOCK_IN` | `STOCK_OUT` | `DISPATCH` | `RETURN` | `DAMAGED` | `ADJUSTMENT`), `startDate`, `endDate`.
- **Description**: Returns historical audit trail of stock movements.

### `POST /api/goods-received`
- **Permission**: `inventory.manage`
- **Description**: Store Manager accepts finished goods from a Production batch into Central Inventory.
- **Request Body**:
  ```json
  {
    "productionId": "uuid-of-production-batch",
    "productId": "uuid-of-product",
    "quantity": 200,
    "receivedDate": "2024-06-26",
    "grnNumber": "GRN-2024-002", // Optional
    "remarks": "Batch inspected and received into store"
  }
  ```
- **Business Behavior (Atomic Prisma Transaction)**:
  1. Validates `productionId` exists, matches `productId`, and `quantity` does not exceed remaining batch allowance.
  2. Creates `GoodsReceived` entry.
  3. Creates `StockTransaction` (`type: PRODUCTION_RECEIPT`).
  4. Atomically increments `Inventory.quantity` by `quantity`.
  5. Automatically marks `Production.status = COMPLETED` if batch is fully received.

### `POST /api/stock-transactions`
- **Permission**: `inventory.manage`
- **Description**: Manual stock movement adjustments (e.g., Stock In, Stock Out, Damaged Bottles, Returns).
- **Request Body**:
  ```json
  {
    "productId": "uuid-of-product",
    "transactionType": "DAMAGED", // STOCK_IN | STOCK_OUT | DAMAGED | RETURN | ADJUSTMENT
    "quantity": 10,
    "remarks": "10 bottles cracked in store loading"
  }
  ```
- **Business Behavior (Atomic Prisma Transaction)**:
  1. Validates stock availability for stock-decreasing operations (`STOCK_OUT`, `DAMAGED`). Returns `400 Insufficient stock` if balance is too low.
  2. Logs audit record in `stock_transactions`.
  3. Atomically updates `Inventory.quantity` balance.
