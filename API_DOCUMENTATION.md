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
Lists all rooms configured for a moving plan with live packing progress metrics.
- **Access:** Viewer, Editor, or Owner
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Rooms retrieved successfully",
  "data": [
    {
      "_id": "6729e789...",
      "name": "Kitchen",
      "floor": "Ground Floor",
      "colorCode": "#F59E0B",
      "stats": {
        "totalBoxes": 3,
        "packedBoxes": 2,
        "totalItems": 15,
        "packedItems": 12,
        "packingProgress": 80
      }
    }
  ]
}
```

### `POST /moves/:moveId/rooms`
Creates a new room inside a moving plan. Names are strictly unique per move.
- **Access:** Editor or Owner
- **Request Body:**
```json
{
  "name": "Master Bedroom",
  "floor": "2nd Floor",
  "colorCode": "#10B981"
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "message": "Room created successfully",
  "data": {
    "_id": "6729e789...",
    "moveId": "6729c123...",
    "name": "Master Bedroom",
    "floor": "2nd Floor",
    "colorCode": "#10B981",
    "createdAt": "2026-11-05T08:00:00.000Z"
  }
}
```

### `GET /rooms/:roomId`
Returns a single room with its live packing statistics.
- **Access:** Viewer, Editor, or Owner
- **Response (200 OK):** Contains room fields and `{ totalBoxes, packedBoxes, totalItems, packedItems, packingProgress }`.

### `PATCH /rooms/:roomId`
Updates room name, floor, or color code.
- **Access:** Editor or Owner
- **Request Body (all optional):** `{ "name": "Primary Suite", "colorCode": "#6366F1" }`
- **Response (200 OK)**

### `DELETE /rooms/:roomId`
Safely deletes a room.
- **Access:** Editor or Owner
- **Safety Rule:** Returns `409 Conflict` if boxes are still assigned to this room to prevent orphaned belongings. When no boxes remain, deletes the room and cleans up any unassigned inventory items.
- **Response (200 OK):** `{ "success": true, "message": "Room deleted successfully", "data": { "deleted": true, "roomId": "..." } }`

---

## 6. Box Management Endpoints

### `GET /moves/:moveId/boxes`
Lists boxes with filtering, label search, and pagination.
- **Access:** Viewer, Editor, or Owner
- **Query Params:** `roomId`, `status`, `isFragile`, `isPriority`, `search`, `page`, `limit`
- **Response (200 OK):** `{ "boxes": [...], "pagination": { "total": 12, "page": 1, "limit": 50, "pages": 1 } }`

### `POST /moves/:moveId/boxes`
Creates a box, auto-increments the move's box counter, generates a deterministic label (e.g. `BOX-KIT-001`), and generates a Base64 PNG DataURL QR code.
- **Access:** Editor or Owner
- **Request Body:**
```json
{
  "roomId": "6729e789...",
  "description": "Everyday porcelain dishes and glassware",
  "isFragile": true,
  "isPriority": true
}
```
- **QR Code Security:** Encodes `{ app: "MoveMate", boxLabel, moveId, boxId }` — zero sensitive credentials, auth tokens, or passwords are ever exposed.
- **Response (201 Created):**
```json
{
  "success": true,
  "message": "Box created successfully",
  "data": {
    "_id": "6729f100...",
    "moveId": "6729c123...",
    "roomId": { "_id": "6729e789...", "name": "Kitchen", "colorCode": "#F59E0B" },
    "boxNumber": 1,
    "boxLabel": "BOX-KIT-001",
    "description": "Everyday porcelain dishes and glassware",
    "isFragile": true,
    "isPriority": true,
    "status": "Not Started",
    "qrCodeData": "data:image/png;base64,iVBORw0KGgoAAAANSUh..."
  }
}
```

### `GET /boxes/:boxId`
Returns complete box details with populated array of inventory items inside it.
- **Access:** Viewer, Editor, or Owner
- **Response (200 OK):** Box details plus `items: [...]`.

### `PATCH /boxes/:boxId`
Updates box status, description, or assigned room.
- **Access:** Editor or Owner
- **State Machine Enforcement:** Status transitions are validated:
  - `Not Started` → `Packing` or `Missing`
  - `Packing` → `Packed` or `Missing`
  - `Packed` → `Loaded` or `Missing`
  - `Loaded` → `In Transit` or `Missing`
  - `In Transit` → `Delivered` or `Missing`
  - `Missing` → `Delivered` (recovered)
  - Invalid transitions reject with `400 Bad Request`.
- **Response (200 OK)**

### `DELETE /boxes/:boxId`
Safely removes a box.
- **Access:** Editor or Owner
- **Data Integrity:** Disassociates contained inventory items (`boxId = null`, `isPacked = false`) without deleting the items themselves.
- **Response (200 OK)**

---

## 7. Inventory Management Endpoints

### `GET /rooms/:roomId/items`
Lists inventory items belonging to a room with search and packing filters.
- **Access:** Viewer, Editor, or Owner
- **Query Params:** `search`, `boxId` (or `"none"`), `isPacked` (`true`/`false`), `page`, `limit`
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Items retrieved successfully",
  "data": {
    "room": { "_id": "6729e789...", "name": "Kitchen" },
    "items": [...],
    "metrics": { "total": 12, "unpacked": 3 },
    "pagination": { "total": 12, "page": 1, "limit": 50, "pages": 1 }
  }
}
```

### `POST /rooms/:roomId/items`
Adds a new item to a room's inventory.
- **Access:** Editor or Owner
- **Request Body:**
```json
{
  "name": "Blender",
  "quantity": 1,
  "isFragile": true,
  "isPacked": false,
  "boxId": "6729f100...",
  "estimatedValue": 80
}
```
- **Response (201 Created)**

### `GET /items/:itemId`
Returns a single inventory item with populated room and box metadata.
- **Access:** Viewer, Editor, or Owner
- **Response (200 OK)**

### `PATCH /items/:itemId`
Updates an item's details.
- **Access:** Editor or Owner
- **Auto-Packing Behavior:**
  - Assigning `boxId` automatically sets `isPacked = true`.
  - Setting `boxId = null` automatically resets `isPacked = false`.
- **Response (200 OK)**

### `DELETE /items/:itemId`
Removes an inventory item with audit logging.
- **Access:** Editor or Owner
- **Response (200 OK)**

---

## 8. Member & Responsibility Endpoints

### `GET /moves/:moveId/members`
Lists all members associated with a moving plan, their assigned role, and member-wise task completion metrics.
- **Access:** Viewer, Editor, or Owner
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Move members retrieved successfully",
  "data": [
    {
      "_id": "6729m100...",
      "moveId": "6729c123...",
      "user": {
        "_id": "6729u001...",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "phone": "+1234567890"
      },
      "role": "Owner",
      "invitedBy": null,
      "createdAt": "2026-11-05T08:00:00.000Z",
      "taskStats": {
        "totalTasks": 4,
        "completedTasks": 3,
        "pendingTasks": 1,
        "overdueTasks": 0,
        "completionRate": 75
      }
    },
    {
      "_id": "6729m101...",
      "moveId": "6729c123...",
      "user": {
        "_id": "6729u002...",
        "name": "John Helper",
        "email": "john@example.com",
        "phone": "+1987654321"
      },
      "role": "Editor",
      "invitedBy": {
        "_id": "6729u001...",
        "name": "Jane Doe",
        "email": "jane@example.com"
      },
      "createdAt": "2026-11-05T09:30:00.000Z",
      "taskStats": {
        "totalTasks": 2,
        "completedTasks": 1,
        "pendingTasks": 1,
        "overdueTasks": 0,
        "completionRate": 50
      }
    }
  ]
}
```

### `POST /moves/:moveId/members`
Invites an existing registered user to a move by email with an assigned role (`Editor` | `Viewer`).
- **Access:** Owner only
- **Validation Rules:**
  - `email`: Required valid email address. Target user must already have a registered account (`404 Not Found` if missing).
  - Owner self-invitation prohibited (`400 Bad Request`).
  - Duplicate membership prohibited (`409 Conflict`).
- **Request Body:**
```json
{
  "email": "collaborator@example.com",
  "role": "Editor"
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "message": "Member invited successfully",
  "data": {
    "_id": "6729m101...",
    "moveId": "6729c123...",
    "userId": {
      "_id": "6729u002...",
      "name": "John Helper",
      "email": "collaborator@example.com",
      "phone": ""
    },
    "role": "Editor",
    "invitedBy": {
      "_id": "6729u001...",
      "name": "Jane Doe",
      "email": "jane@example.com"
    },
    "createdAt": "2026-11-05T09:30:00.000Z"
  }
}
```

### `PATCH /moves/:moveId/members/:memberId`
Updates a collaborator's role between `Editor` and `Viewer`.
- **Access:** Owner only
- **Owner Protection:** Attempting to alter the Owner's role returns `400 Bad Request` ("Cannot change the role of the moving plan owner").
- **Request Body:**
```json
{
  "role": "Viewer"
}
```
- **Response (200 OK)**

### `DELETE /moves/:moveId/members/:memberId`
Removes a collaborator from the moving plan.
- **Access:** Owner only
- **Owner Protection:** Attempting to remove the Owner returns `400 Bad Request` ("Cannot remove the owner of the moving plan").
- **Safe Task Reassignment:** Automatically unassigns all tasks previously assigned to the removed collaborator (`assignedTo: null`) to prevent orphaned assignments.
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Member removed from moving plan",
  "data": {
    "removed": true,
    "memberId": "6729m101...",
    "userName": "John Helper"
  }
}
```

---

## 9. Dashboard & Moving Day Tracking Endpoints

### `GET /moves/:moveId/dashboard`
Returns calculated metrics for the Smart Moving Readiness Dashboard, computing a 0–100 score based on 4 weighted pillars.
- **Access:** Viewer, Editor, or Owner
- **4-Pillar Calculation Formulas:**
  - **Essential Tasks ($35\%$)**: `(completedEssential / totalEssential) * 35` (falls back to regular tasks if no essential tasks are designated).
  - **Box Packing ($30\%$)**: `(packedBoxes / totalBoxes) * 30` (includes `Packed`, `Loaded`, `In Transit`, `Delivered`).
  - **Room Inventory ($20\%$)**: `(packedItems / totalItems) * 20`.
  - **Utility & Services ($15\%$)**: `(confirmedOrCompleted / totalServices) * 15`.
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Move readiness dashboard retrieved successfully",
  "data": {
    "move": {
      "_id": "6729c123...",
      "title": "Downtown to Sunny Suburbs",
      "status": "In Progress"
    },
    "readinessScore": 58,
    "readinessStatus": "In Progress",
    "pillarBreakdown": {
      "essentialTasks": {
        "weightPercentage": 35,
        "scoreContribution": 17.5,
        "progressPercentage": 50,
        "total": 2,
        "completed": 1
      },
      "boxPacking": {
        "weightPercentage": 30,
        "scoreContribution": 15,
        "progressPercentage": 50,
        "total": 2,
        "packed": 1
      },
      "inventoryPacking": {
        "weightPercentage": 20,
        "scoreContribution": 10,
        "progressPercentage": 50,
        "total": 2,
        "packed": 1
      },
      "utilityServices": {
        "weightPercentage": 15,
        "scoreContribution": 15,
        "progressPercentage": 100,
        "total": 2,
        "confirmedOrCompleted": 2
      }
    },
    "taskStats": {
      "total": 2,
      "completed": 1,
      "pending": 1,
      "overdue": 0,
      "essentialTotal": 2,
      "essentialCompleted": 1
    },
    "boxStats": {
      "total": 2,
      "byStatus": {
        "Not Started": 1,
        "Packed": 1
      },
      "fragileCount": 1,
      "priorityCount": 1
    },
    "inventoryStats": {
      "total": 2,
      "packed": 1,
      "unpacked": 1,
      "fragileCount": 1,
      "totalEstimatedValue": 150
    },
    "budgetStats": {
      "totalEstimatedCost": 1200,
      "totalActualCost": 1350,
      "variance": 150,
      "isOverBudget": true
    },
    "serviceStats": {
      "total": 2,
      "byStatus": {
        "Confirmed": 1,
        "Completed": 1
      }
    },
    "alerts": [
      { "type": "info", "message": "Current moving expenses exceed estimate by $150." }
    ]
  }
}
```

### `GET /moves/:moveId/tracking`
Returns real-time moving day logistics data tracking boxes through origin, transit, and destination stages.
- **Access:** Viewer, Editor, or Owner
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Moving day tracking data retrieved successfully",
  "data": {
    "totalBoxes": 4,
    "deliveredBoxes": 2,
    "deliveryPercentage": 50,
    "statusCounts": {
      "Packed": 1,
      "Loaded": 0,
      "In Transit": 1,
      "Delivered": 2,
      "Missing": 0
    },
    "transitStages": {
      "atOriginCount": 1,
      "inTransitCount": 1,
      "deliveredCount": 2,
      "missingCount": 0
    },
    "fragileBoxes": [
      {
        "_id": "6729b101...",
        "boxLabel": "BOX-KIT-002",
        "description": "Fine crystal glassware",
        "status": "In Transit",
        "isFragile": true
      }
    ],
    "priorityBoxes": [...],
    "missingBoxes": [],
    "roomDeliveryProgress": [
      {
        "_id": "6729r100...",
        "name": "Kitchen",
        "totalBoxes": 2,
        "deliveredBoxes": 1,
        "progressPercentage": 50
      }
    ]
  }
}
```

---

## 10. Budget & Service Bookings Endpoints

### `GET /moves/:moveId/expenses`
Lists all expenses with complete financial variance analysis.
- **Access:** Viewer, Editor, or Owner
- **Query Params:** `category`, `isPaid`, `search`, `page`, `limit`
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Expenses retrieved successfully",
  "data": {
    "expenses": [...],
    "summary": {
      "totalEstimatedCost": 1350,
      "totalActualCost": 1450,
      "variance": 100,
      "isOverBudget": true,
      "totalPaid": 1350,
      "totalUnpaid": 100,
      "categoryBreakdown": {
        "Movers": { "estimated": 1200, "actual": 1350, "count": 1 },
        "Packing Supplies": { "estimated": 150, "actual": 100, "count": 1 }
      }
    },
    "pagination": { "total": 2, "page": 1, "limit": 100, "pages": 1 }
  }
}
```

### `POST /moves/:moveId/expenses`
Records an estimated or actual expense line item.
- **Access:** Editor or Owner
- **Request Body:**
```json
{
  "category": "Movers",
  "title": "Professional Moving Van Deposit",
  "estimatedCost": 1200,
  "actualCost": 1350,
  "isPaid": true,
  "receiptUrl": ""
}
```
- **Response (201 Created)**

### `GET /expenses/:expenseId`
Details a single expense item.
- **Access:** Viewer, Editor, or Owner
- **Response (200 OK)**

### `PATCH /expenses/:expenseId`
Updates expense details (costs, paid status, category).
- **Access:** Editor or Owner
- **Response (200 OK)**

### `DELETE /expenses/:expenseId`
Removes an expense line item.
- **Access:** Editor or Owner
- **Response (200 OK)**

---

### `GET /moves/:moveId/bookings`
Lists utility and mover service bookings sorted chronologically by `scheduledDate`.
- **Access:** Viewer, Editor, or Owner
- **Query Params:** `serviceType`, `status`, `search`
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Service bookings retrieved successfully",
  "data": {
    "bookings": [...],
    "summary": {
      "totalBookings": 2,
      "confirmedOrCompleted": 2,
      "statusCounts": {
        "Booked": 0,
        "Confirmed": 1,
        "Completed": 1,
        "Inquired": 0,
        "Cancelled": 0
      },
      "totalCost": 1250
    }
  }
}
```

### `POST /moves/:moveId/bookings`
Records a utility transfer or mover booking.
- **Access:** Editor or Owner
- **Request Body:**
```json
{
  "serviceType": "Electricity Transfer",
  "providerName": "City Power & Electric",
  "scheduledDate": "2026-12-28T09:00:00Z",
  "status": "Booked",
  "confirmationNumber": "PWR-44912",
  "cost": 50,
  "notes": "Transfer electric meter on moving morning"
}
```
- **Response (201 Created)**

### `GET /bookings/:bookingId`
Details a single service booking.
- **Access:** Viewer, Editor, or Owner
- **Response (200 OK)**

### `PATCH /bookings/:bookingId`
Updates booking status, date, or cost.
- **Access:** Editor or Owner
- **Response (200 OK)**

### `DELETE /bookings/:bookingId`
Deletes a service booking record.
- **Access:** Editor or Owner
- **Response (200 OK)**

---

## 11. Activity History Endpoints

### `GET /moves/:moveId/activity`
Returns the recent audit timeline in descending chronological order (`-createdAt`) with populated actor details.
- **Access:** Viewer, Editor, or Owner
- **Query Params:** `page`, `limit`, `entityType`, `action`
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Activity timeline retrieved successfully",
  "data": {
    "activities": [
      {
        "_id": "6729a100...",
        "moveId": "6729c123...",
        "userId": {
          "_id": "6729u001...",
          "name": "Jane Doe",
          "email": "jane@example.com"
        },
        "action": "BOX_DELIVERED",
        "details": "Box \"BOX-KIT-001\" status: Delivered",
        "entityType": "Box",
        "entityId": "6729b100...",
        "createdAt": "2026-11-05T10:00:00.000Z"
      }
    ],
    "pagination": { "total": 24, "page": 1, "limit": 20, "pages": 2 }
  }
}
```

