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

*All admin APIs require authentication and the `ADMIN` role.*

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
