# MoveMate – REST API Specification

**Base URL:** `http://localhost:5000/api/v1`  
**Protocol:** RESTful JSON over HTTP/HTTPS  
**Auth Scheme:** `Authorization: Bearer <jwt_token>`  

---

## 1. Standard Response Schemas

### 1.1 Success Format
```json
{
  "success": true,
  "message": "Human-readable summary of the result",
  "data": { ... }
}
```

### 1.2 Error Format
```json
{
  "success": false,
  "message": "Descriptive error message",
  "errors": [
    {
      "field": "fieldName",
      "message": "Specific validation failure explanation"
    }
  ]
}
```

### 1.3 Common HTTP Status Codes
- `200 OK`: Request succeeded and response contains data.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Validation failure or malformed payload.
- `401 Unauthorized`: Missing or invalid JWT token.
- `403 Forbidden`: User does not have ownership or member rights for this moving plan.
- `404 Not Found`: Target resource does not exist.
- `409 Conflict`: Unique constraint violation (e.g., duplicate email or duplicate box label).
- `429 Too Many Requests`: Rate limit exceeded.
- `500 Internal Server Error`: Unexpected server exception (sanitized in production).

---

## 2. Authentication Endpoints

### `POST /auth/register`
Creates a new user account.
- **Access:** Public
- **Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Password123!",
  "phone": "+1234567890"
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "6729c123...",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "phone": "+1234567890",
      "createdAt": "2026-11-05T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### `POST /auth/login`
Authenticates existing user and generates JWT.
- **Access:** Public (Rate limited)
- **Request Body:**
```json
{
  "email": "jane@example.com",
  "password": "Password123!"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "6729c123...",
      "name": "Jane Doe",
      "email": "jane@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### `GET /auth/me`
Retrieves current authenticated profile.
- **Access:** Protected (`Bearer <token>`)
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile fetched successfully",
  "data": {
    "_id": "6729c123...",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+1234567890"
  }
}
```

---

## 3. Move Management Endpoints

### `GET /moves`
Lists all moving plans owned by or shared with the authenticated user.
- **Access:** Protected
- **Query Params:** `page` (default: 1), `limit` (default: 10), `status`
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Moves retrieved successfully",
  "data": {
    "moves": [
      {
        "_id": "6729d456...",
        "title": "Apartment to Suburban House",
        "currentAddress": "100 Main St, Apt 4B, City",
        "destinationAddress": "45 Oak Lane, Suburb",
        "moveDate": "2026-12-01T08:00:00.000Z",
        "status": "In Progress",
        "role": "Owner"
      }
    ],
    "pagination": { "total": 1, "page": 1, "pages": 1 }
  }
}
```

### `POST /moves`
Creates a new moving plan. The creator is automatically registered as Owner.
- **Access:** Protected
- **Request Body:**
```json
{
  "title": "Apartment to Suburban House",
  "currentAddress": "100 Main St, Apt 4B, City",
  "destinationAddress": "45 Oak Lane, Suburb",
  "moveDate": "2026-12-01T08:00:00.000Z",
  "notes": "Need parking permit for moving truck"
}
```
- **Response (201 Created):** Contains created move document.

### `GET /moves/:moveId`
Returns complete details of a single moving plan.
- **Access:** Protected (Owner or Member)

### `PATCH /moves/:moveId`
Updates moving plan attributes (title, addresses, moveDate, status, notes).
- **Access:** Protected (Owner or Editor)

### `DELETE /moves/:moveId`
Deletes a moving plan and cascades safe removal of all child records.
- **Access:** Protected (Owner only)

---

## 4. Task Management Endpoints

### `GET /moves/:moveId/tasks`
Lists tasks for a specific move with filtering and sorting.
- **Query Params:**
  - `status`: `Pending` | `In Progress` | `Completed`
  - `priority`: `Low` | `Medium` | `High` | `Urgent`
  - `isEssential`: `true` | `false`
  - `assignedTo`: UserId
  - `overdue`: `true`
- **Response (200 OK):** Array of tasks with populated `assignedTo` (name, email) and `roomId` (name).

### `POST /moves/:moveId/tasks`
Creates a new moving task.
- **Request Body:**
```json
{
  "title": "Return keys to landlord",
  "description": "Drop off at leasing office before 5 PM",
  "priority": "Urgent",
  "dueDate": "2026-11-30T17:00:00.000Z",
  "isEssential": true,
  "roomId": "6729e789...",
  "assignedTo": "6729c123..."
}
```
- **Response (201 Created)**

### `PATCH /tasks/:taskId`
Updates a task (status, assignedTo, priority, title, etc.).
- **Response (200 OK)**

### `DELETE /tasks/:taskId`
Deletes a task.
- **Response (200 OK)**

---

## 5. Room Management Endpoints

### `GET /moves/:moveId/rooms`
Lists all rooms configured for a moving plan with counts of boxes and items.
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Rooms retrieved",
  "data": [
    {
      "_id": "6729e789...",
      "name": "Kitchen",
      "floor": "Ground Floor",
      "colorCode": "#3B82F6",
      "boxCount": 5,
      "itemCount": 24,
      "packedItemCount": 18
    }
  ]
}
```

### `POST /moves/:moveId/rooms`
Creates a new room.
- **Request Body:** `{ "name": "Master Bedroom", "floor": "2nd Floor", "colorCode": "#10B981" }`
- **Response (201 Created)**

### `PATCH /rooms/:roomId`
Updates room details.

### `DELETE /rooms/:roomId`
Deletes a room safely. Fails or warns if boxes or inventory items are still assigned.

---

## 6. Box Management Endpoints

### `GET /moves/:moveId/boxes`
Lists boxes with room filter and status filter.
- **Query Params:** `roomId`, `status`, `isFragile`, `isPriority`, `search`
- **Response (200 OK)**

### `POST /moves/:moveId/boxes`
Creates a box, auto-increments the box number, generates unique label (e.g. `BOX-KIT-001`), and generates QR code data payload.
- **Request Body:**
```json
{
  "roomId": "6729e789...",
  "description": "Everyday porcelain dishes and glassware",
  "isFragile": true,
  "isPriority": true
}
```
- **Response (201 Created):** Contains box details and `qrCodeData` (Base64 DataURL or payload string).

### `GET /boxes/:boxId`
Returns full box details, including list of contained inventory items.

### `PATCH /boxes/:boxId`
Updates box status (`Packing`, `Packed`, `Loaded`, `In Transit`, `Delivered`, `Missing`), description, or room.

### `DELETE /boxes/:boxId`
Deletes a box; disassociates items from the deleted box.

---

## 7. Inventory Management Endpoints

### `GET /rooms/:roomId/items`
Lists inventory items belonging to a room.
- **Query Params:** `boxId` (or `unpacked=true`), `search`
- **Response (200 OK)**

### `POST /rooms/:roomId/items`
Adds an item to a room's inventory.
- **Request Body:**
```json
{
  "name": "Blender",
  "quantity": 1,
  "isFragile": true,
  "isPacked": false,
  "boxId": "6729f123...",
  "estimatedValue": 80
}
```
- **Response (201 Created)**

### `PATCH /items/:itemId`
Updates item packing status, quantity, or box assignment.

### `DELETE /items/:itemId`
Removes an inventory item.

---

## 8. Member & Responsibility Endpoints

### `GET /moves/:moveId/members`
Lists all members associated with a move, their assigned role, and task completion metrics.

### `POST /moves/:moveId/members`
Invites a user to a move by registered email with a specified role (`Editor` | `Viewer`).
- **Request Body:** `{ "email": "collaborator@example.com", "role": "Editor" }`

### `DELETE /moves/:moveId/members/:memberId`
Removes a member from the moving plan.

---

## 9. Dashboard & Moving Day Tracking Endpoints

### `GET /moves/:moveId/dashboard`
Returns calculated metrics for the Readiness Dashboard:
- `readinessScore`: Weighted percentage (0 - 100)
- `pillarBreakdown`: Detailed scores for Essential Tasks, Box Packing, Inventory, Services
- `tasksSummary`: Total, Completed, Pending, Overdue, Incomplete Essential
- `boxesSummary`: Total, Packed, Loaded, In Transit, Delivered, Missing
- `inventorySummary`: Total items, Packed items, Unpacked items
- `budgetSummary`: Total estimated, Total actual, Difference

### `GET /moves/:moveId/tracking`
Returns real-time moving day tracker:
- Total boxes by status (`Packed`, `Loaded`, `In Transit`, `Delivered`, `Missing`)
- Room-by-room delivery progress
- List of high-priority & fragile boxes awaiting delivery

---

## 10. Budget & Service Bookings Endpoints

### `GET /moves/:moveId/expenses`
Lists all expense line items with category totals and budget variance.

### `POST /moves/:moveId/expenses`
Records an estimated or actual expense.

### `PATCH /expenses/:expenseId`
Updates cost, category, or payment status.

### `DELETE /expenses/:expenseId`
Removes an expense line item.

### `GET /moves/:moveId/bookings`
Lists utility and mover service bookings.

### `POST /moves/:moveId/bookings`
Records a booking (e.g., Internet Transfer, Electricity, Truck).

### `PATCH /bookings/:bookingId`
Updates booking status (`Booked`, `Confirmed`, `Completed`, `Cancelled`).

### `DELETE /bookings/:bookingId`
Deletes a booking record.

---

## 11. Activity History Endpoints

### `GET /moves/:moveId/activity`
Returns the recent audit timeline (who did what, and when) with pagination.
