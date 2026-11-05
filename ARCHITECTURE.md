# MoveMate Architecture Blueprint & System Design

**System Name:** MoveMate – Intelligent Home Moving Coordinator  
**Stack:** MERN (MongoDB Atlas, Express.js, React.js with Vite & Tailwind CSS, Node.js)  
**Version:** 1.0.0-blueprint  

---

## 1. System Overview & Problem Statement
Moving households involves parallel, high-friction workstreams: packing room by room, labeling fragile containers, scheduling utility cutovers, coordinating external movers, managing budget vs. actuals, and tracking family/member assignments. 

**MoveMate** consolidates these disjointed workflows into a centralized, deterministic system with:
- Multi-plan support per user with granular move-member permissions.
- Room-to-box and item-to-box hierarchical inventory tracking with QR code labeling.
- Deterministic **Weighted Moving Readiness Score** that prioritizes essential tasks and vulnerable items.
- Strict state-machine transitions for box tracking on moving day.
- Complete financial management (estimated vs. actual expenses) and service booking tracking.
- Immutable activity audit log.

---

## 2. High-Level Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT TIER                                      |
|  React 18 + Vite + Tailwind CSS + Lucide Icons + React Router DOM + Axios         |
+-----------------------------------------+-----------------------------------------+
                                          | HTTPS / REST JSON (/api/v1)
                                          v
+-----------------------------------------------------------------------------------+
|                                 APPLICATION TIER                                  |
|                            Node.js + Express.js API                               |
|                                                                                   |
|  +--------------------+  +--------------------+  +--------------------+           |
|  | Security & Limiters|  | Auth Middleware    |  | Ownership Guard    |           |
|  | Helmet, CORS, Rate |  | JWT & bcryptjs     |  | Plan & Role Verify |           |
|  +--------------------+  +--------------------+  +--------------------+           |
|                                                                                   |
|  +--------------------+  +--------------------+  +--------------------+           |
|  | Route Handlers     |  | Service Layer      |  | Zod Validators     |           |
|  | /api/v1/*          |  | Business Logic     |  | Strict Schemas     |           |
|  +--------------------+  +--------------------+  +--------------------+           |
|                                                                                   |
|  +--------------------+  +--------------------+  +--------------------+           |
|  | Readiness Engine   |  | QR Code Generator  |  | Error Handler      |           |
|  | Weighted Formula   |  | DataURL & Labels   |  | Centralized Global |           |
|  +--------------------+  +--------------------+  +--------------------+           |
+-----------------------------------------+-----------------------------------------+
                                          | Mongoose ODM
                                          v
+-----------------------------------------------------------------------------------+
|                                    DATA TIER                                      |
|                              MongoDB Atlas Cluster                                |
|                                                                                   |
|  - Users             - Moves            - MoveMembers       - Tasks               |
|  - Rooms             - Boxes            - InventoryItems    - Expenses            |
|  - ServiceBookings   - ActivityLogs                                               |
+-----------------------------------------------------------------------------------+
```

---

## 3. Directory Structure

```
MoveMate/
├── .gitignore
├── DEVELOPMENT_STATUS.md
├── API_DOCUMENTATION.md
├── ARCHITECTURE.md
├── README.md
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js          # MongoDB connection with retry & pool logic
│   │   │   └── env.js               # Validated env vars using Zod
│   │   ├── constants/
│   │   │   ├── roles.js             # Owner, Member, Viewer permissions
│   │   │   ├── statuses.js          # Task, Box, Move, Booking statuses
│   │   │   └── priorities.js        # Low, Medium, High, Urgent
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── moveController.js
│   │   │   ├── taskController.js
│   │   │   ├── roomController.js
│   │   │   ├── boxController.js
│   │   │   ├── inventoryController.js
│   │   │   ├── memberController.js
│   │   │   ├── dashboardController.js
│   │   │   ├── trackingController.js
│   │   │   ├── expenseController.js
│   │   │   ├── bookingController.js
│   │   │   └── activityController.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js     # Bearer JWT verification & req.user injection
│   │   │   ├── moveAuthMiddleware.js # Ownership & Member access control check
│   │   │   ├── validateMiddleware.js # Zod validation runner
│   │   │   ├── rateLimiter.js        # Auth-specific and global rate limiters
│   │   │   └── errorHandler.js       # Centralized error handler with safe client responses
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Move.js
│   │   │   ├── MoveMember.js
│   │   │   ├── Task.js
│   │   │   ├── Room.js
│   │   │   ├── Box.js
│   │   │   ├── InventoryItem.js
│   │   │   ├── Expense.js
│   │   │   ├── ServiceBooking.js
│   │   │   └── ActivityLog.js
│   │   ├── routes/
│   │   │   ├── index.js              # Base router mounting /api/v1
│   │   │   ├── authRoutes.js
│   │   │   ├── moveRoutes.js
│   │   │   ├── taskRoutes.js
│   │   │   ├── roomRoutes.js
│   │   │   ├── boxRoutes.js
│   │   │   ├── inventoryRoutes.js
│   │   │   ├── memberRoutes.js
│   │   │   ├── dashboardRoutes.js
│   │   │   ├── trackingRoutes.js
│   │   │   ├── expenseRoutes.js
│   │   │   ├── bookingRoutes.js
│   │   │   └── activityRoutes.js
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   ├── moveService.js
│   │   │   ├── taskService.js
│   │   │   ├── roomService.js
│   │   │   ├── boxService.js
│   │   │   ├── inventoryService.js
│   │   │   ├── memberService.js
│   │   │   ├── dashboardService.js   # Weighted Readiness Calculation
│   │   │   ├── trackingService.js    # Moving day state management
│   │   │   ├── expenseService.js
│   │   │   ├── bookingService.js
│   │   │   └── activityService.js    # Audit logging
│   │   ├── utils/
│   │   │   ├── apiResponse.js        # Standardized { success, message, data, errors }
│   │   │   ├── apiError.js           # Custom AppError extending Error
│   │   │   ├── qrCodeHelper.js       # Box QR code generation helper
│   │   │   └── asyncHandler.js       # Express async route wrapper
│   │   ├── validators/
│   │   │   ├── authValidators.js
│   │   │   ├── moveValidators.js
│   │   │   ├── taskValidators.js
│   │   │   ├── roomValidators.js
│   │   │   ├── boxValidators.js
│   │   │   ├── inventoryValidators.js
│   │   │   ├── memberValidators.js
│   │   │   ├── expenseValidators.js
│   │   │   └── bookingValidators.js
│   │   ├── app.js                    # Express app configuration & middlewares
│   │   └── server.js                 # Server entry point with DB connection
│   ├── tests/
│   │   ├── auth.test.js
│   │   ├── move.test.js
│   │   ├── task.test.js
│   │   ├── box.test.js
│   │   └── readiness.test.js
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   ├── axiosClient.js        # Axios instance with JWT interceptors
    │   │   ├── authApi.js
    │   │   ├── moveApi.js
    │   │   ├── taskApi.js
    │   │   ├── roomApi.js
    │   │   ├── boxApi.js
    │   │   ├── inventoryApi.js
    │   │   ├── memberApi.js
    │   │   ├── dashboardApi.js
    │   │   ├── trackingApi.js
    │   │   ├── expenseApi.js
    │   │   └── bookingApi.js
    │   ├── assets/
    │   ├── components/
    │   │   ├── common/               # Button, Input, Modal, Badge, Card, Spinner, Alert
    │   │   ├── layout/               # Navbar, Sidebar, PageHeader, Footer
    │   │   ├── dashboard/            # ReadinessGauge, StatCard, UpcomingTasks, ActivityFeed
    │   │   ├── boxes/                # BoxCard, QRCodeModal, StatusSelector
    │   │   ├── tasks/                # TaskItem, TaskFilter, TaskModal
    │   │   └── budget/               # BudgetSummary, ExpenseList, ExpenseModal
    │   ├── context/
    │   │   ├── AuthContext.jsx       # User state, login, logout, refresh
    │   │   └── MoveContext.jsx       # Active move plan selection & metadata
    │   ├── pages/
    │   │   ├── LandingPage.jsx
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── MovesPage.jsx
    │   │   ├── CreateMovePage.jsx
    │   │   ├── DashboardPage.jsx
    │   │   ├── TasksPage.jsx
    │   │   ├── RoomsPage.jsx
    │   │   ├── BoxesPage.jsx
    │   │   ├── InventoryPage.jsx
    │   │   ├── MembersPage.jsx
    │   │   ├── BudgetPage.jsx
    │   │   ├── BookingsPage.jsx
    │   │   ├── TrackingPage.jsx
    │   │   └── SettingsPage.jsx
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── tailwind.config.js
    ├── vite.config.js
    └── package.json
```

---

## 4. Database Schema & Relational Model

MoveMate stores 10 interconnected collections inside MongoDB. All child resources reference their parent `Move` (`moveId`) and maintain referential integrity.

### 4.1 Collection Relationships Diagram
```
                     +-------------------+
                     |       User        |
                     +---------+---------+
                               | 1
                               | owns / belongs
                               v *
+--------------------+   +-----+-------------+
|    ActivityLog     |   |       Move        |
|  (moveId, userId)  |<--+ (userId = Owner)  |
+--------------------+   +-----+-------+-----+
                               |       |
             +-----------------+       +-----------------+
             | 1:N                     | 1:N             | 1:N
             v                         v                 v
     +-------+--------+        +-------+--------+  +-----+----------+
     |   MoveMember   |        |      Room      |  |      Task      |
     | (moveId,userId)|        | (moveId, name) |  | (moveId, room, |
     +----------------+        +-------+--------+  |  assignedTo)   |
                                       | 1:N       +----------------+
                                       v
                               +-------+--------+
                               |      Box       |
                               | (moveId, room) |
                               +-------+--------+
                                       | 1:N
                                       v
                               +-------+--------+
                               | InventoryItem  |
                               | (moveId, room, |
                               |     boxId)     |
                               +----------------+

     +----------------+        +----------------+
     |    Expense     |        | ServiceBooking |
     | (moveId, user) |        | (moveId, type) |
     +----------------+        +----------------+
```

### 4.2 Data Models Specification

1. **User**
   - `_id`: ObjectId
   - `name`: String, required, trim
   - `email`: String, required, unique, lowercase, indexed
   - `password`: String (bcrypt hashed, min 8 chars, never returned in projections)
   - `phone`: String, optional
   - `createdAt`, `updatedAt`: Timestamps

2. **Move**
   - `_id`: ObjectId
   - `userId`: ObjectId -> User (Owner), indexed
   - `title`: String, required, trim
   - `currentAddress`: String, required
   - `destinationAddress`: String, required
   - `moveDate`: Date, required, indexed
   - `status`: String, enum: `['Planning', 'In Progress', 'Moving Day', 'Completed', 'Cancelled']`, default: `'Planning'`
   - `notes`: String, optional
   - `createdAt`, `updatedAt`: Timestamps

3. **MoveMember**
   - `_id`: ObjectId
   - `moveId`: ObjectId -> Move, indexed
   - `userId`: ObjectId -> User, indexed
   - `role`: String, enum: `['Owner', 'Editor', 'Viewer']`, default: `'Editor'`
   - `inviteStatus`: String, enum: `['Accepted', 'Pending']`, default: `'Accepted'`
   - *Compound Index:* `{ moveId: 1, userId: 1 }` (unique)

4. **Task**
   - `_id`: ObjectId
   - `moveId`: ObjectId -> Move, indexed
   - `roomId`: ObjectId -> Room, optional
   - `title`: String, required, trim
   - `description`: String, optional
   - `status`: String, enum: `['Pending', 'In Progress', 'Completed']`, default: `'Pending'`, indexed
   - `priority`: String, enum: `['Low', 'Medium', 'High', 'Urgent']`, default: `'Medium'`
   - `dueDate`: Date, optional, indexed
   - `isEssential`: Boolean, default: false, indexed
   - `assignedTo`: ObjectId -> User, optional, indexed
   - `completedAt`: Date, optional
   - `createdAt`, `updatedAt`: Timestamps

5. **Room**
   - `_id`: ObjectId
   - `moveId`: ObjectId -> Move, indexed
   - `name`: String, required, trim (e.g., "Master Bedroom", "Kitchen")
   - `floor`: String, optional (e.g., "1st Floor", "Basement")
   - `colorCode`: String, optional (hex color for box labels)
   - *Compound Index:* `{ moveId: 1, name: 1 }` (unique within move)

6. **Box**
   - `_id`: ObjectId
   - `moveId`: ObjectId -> Move, indexed
   - `roomId`: ObjectId -> Room, required, indexed
   - `boxNumber`: Number, required (auto-incrementing per move)
   - `boxLabel`: String, required (e.g., `BOX-MBR-001`), unique within move
   - `description`: String, optional
   - `isFragile`: Boolean, default: false
   - `isPriority`: Boolean, default: false
   - `status`: String, enum: `['Not Started', 'Packing', 'Packed', 'Loaded', 'In Transit', 'Delivered', 'Missing']`, default: `'Not Started'`, indexed
   - `qrCodeData`: String (embedded payload or unique scan URL)
   - *Compound Index:* `{ moveId: 1, boxLabel: 1 }` (unique)

7. **InventoryItem**
   - `_id`: ObjectId
   - `moveId`: ObjectId -> Move, indexed
   - `roomId`: ObjectId -> Room, required, indexed
   - `boxId`: ObjectId -> Box, optional, indexed
   - `name`: String, required, trim, indexed
   - `quantity`: Number, default: 1
   - `isFragile`: Boolean, default: false
   - `isPacked`: Boolean, default: false
   - `estimatedValue`: Number, default: 0
   - `notes`: String, optional
   - `createdAt`, `updatedAt`: Timestamps

8. **Expense**
   - `_id`: ObjectId
   - `moveId`: ObjectId -> Move, indexed
   - `category`: String, enum: `['Movers', 'Packing Supplies', 'Truck Rental', 'Storage', 'Cleaning', 'Utilities', 'Food & Travel', 'Other']`, required
   - `title`: String, required
   - `estimatedCost`: Number, required, min: 0
   - `actualCost`: Number, default: 0, min: 0
   - `isPaid`: Boolean, default: false
   - `receiptUrl`: String, optional
   - `createdAt`, `updatedAt`: Timestamps

9. **ServiceBooking**
   - `_id`: ObjectId
   - `moveId`: ObjectId -> Move, indexed
   - `serviceType`: String, enum: `['Moving Company', 'Electricity Transfer', 'Water Service', 'Internet / Cable', 'Gas Connection', 'Cleaning Service', 'Locksmith', 'Other']`, required
   - `providerName`: String, required
   - `contactPhone`: String, optional
   - `scheduledDate`: Date, required
   - `status`: String, enum: `['Inquired', 'Booked', 'Confirmed', 'Completed', 'Cancelled']`, default: `'Booked'`
   - `confirmationNumber`: String, optional
   - `cost`: Number, default: 0
   - `notes`: String, optional

10. **ActivityLog**
    - `_id`: ObjectId
    - `moveId`: ObjectId -> Move, indexed
    - `userId`: ObjectId -> User, required
    - `action`: String, required (e.g., `TASK_COMPLETED`, `BOX_LOADED`, `EXPENSE_ADDED`)
    - `details`: String, required
    - `entityType`: String, enum: `['Move', 'Task', 'Box', 'Item', 'Expense', 'Booking', 'Member']`
    - `entityId`: ObjectId, optional
    - `createdAt`: Date, default: Date.now, indexed

---

## 5. Security & Authorization Matrix

### 5.1 Authentication Flow
1. Passwords hashed with `bcryptjs` (salt rounds: 12).
2. JWT tokens signed with `JWT_SECRET`, expiring in `7d`.
3. Client stores token securely in localStorage / authorization header `Bearer <token>`.
4. Password fields explicitly excluded in Mongoose schemas via `select: false`.

### 5.2 Ownership & Multi-Plan Authorization Guard
Every API endpoint operating on a move or a move child entity passes through `moveAuthMiddleware`:
```
User (JWT verified) -> Extract moveId from params/body/child ->
  1. Is user the owner of the move? (Move.userId == req.user._id) -> ALLOW (FULL ACCESS)
  2. Is user a member of MoveMember for this moveId?
     - Role == 'Editor' -> ALLOW (CREATE, UPDATE, DELETE items/tasks/boxes)
     - Role == 'Viewer' -> ALLOW (READ ONLY)
  3. Neither -> Return 403 Forbidden ("You do not have permission to access this moving plan")
```

---

## 6. Weighted Moving Readiness Engine

Rather than a simplistic `completedTasks / totalTasks * 100`, MoveMate implements a **Deterministic 4-Pillar Weighted Readiness Index** that reflects real-world moving readiness:

### 6.1 Pillar Breakdown (Total = 100 Points)

| Pillar | Description | Weight | Formula |
|---|---|---|---|
| **Pillar 1: Essential Tasks** | High-stakes deadlines (leases, contracts, keys) | **35%** | `(Completed Essential Tasks / Total Essential Tasks) * 35` (If 0 essential tasks exist, fallback to regular tasks weight) |
| **Pillar 2: Box Packing** | Physical packing progress across rooms | **30%** | `(Packed Boxes + Loaded Boxes + Delivered Boxes) / (Total Boxes) * 30` |
| **Pillar 3: Inventory Packing** | Item-level packing validation | **20%** | `(Packed Items / Total Items) * 20` |
| **Pillar 4: Critical Utilities** | Utility transfers & mover confirmations | **15%** | `(Confirmed or Completed Services / Total Services) * 15` |

$$\text{Readiness Percentage} = W_{\text{essential}} + W_{\text{boxes}} + W_{\text{inventory}} + W_{\text{services}}$$

### 6.2 Edge Case Normalization
- If a user has no tasks, boxes, or services yet, readiness displays `0%` with clear actionable tips on what to create first.
- If Overdue tasks exist, an **Alert Status** is triggered (e.g., "Overdue Warning: 3 tasks past due date").

---

## 7. Moving Day State Machine (Box Tracking)

To ensure logistics sanity on moving day, boxes follow a directed forward state progression with allowed exception transitions:

```
[Not Started] ---> [Packing] ---> [Packed] ---> [Loaded] ---> [In Transit] ---> [Delivered]
      |               |             |             |               |
      +---------------+-------------+-------------+---------------+---> [Missing] (Flagged)
                                                                           |
                                                                           v
                                                                 (Recovered -> Delivered)
```

**Transition Rules:**
- A box cannot be marked `Loaded` unless it has first reached `Packed`.
- Any box can be flagged as `Missing` from `Packed`, `Loaded`, or `In Transit`.
- Marking a box `Delivered` automatically marks all items inside that box as delivered/present.

---

## 8. Standard API Response Structure

Every response strictly follows the standardized schema:

### Success Response (2xx)
```json
{
  "success": true,
  "message": "Task updated successfully",
  "data": {
    "_id": "6729c123...",
    "title": "Transfer broadband",
    "status": "Completed"
  }
}
```

### Error Response (4xx / 5xx)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "dueDate",
      "message": "Due date cannot be in the past"
    }
  ]
}
```

---

## 9. Phased Implementation Roadmap

- **Phase 1 (CURRENT):** Project architecture, directory design, blueprint, and development tracker.
- **Phase 2:** Environment configuration, backend initialization, Express server setup, security middleware (Helmet, CORS, Rate Limit), and health endpoints.
- **Phase 3:** MongoDB Atlas connection, 10 Mongoose schemas, compound indexes, and referential validation.
- **Phase 4:** Authentication & Security (Registration, Login, JWT, Password Hashing, Me profile, Zod validation).
- **Phase 5:** Move Management & Task Management APIs with priority/due date/essential filters.
- **Phase 6:** Room, Box, and Inventory Item APIs with unique box labels and QR Code data generator.
- **Phase 7:** Move Member collaboration & task assignment engine with access control.
- **Phase 8:** Dashboard Readiness Engine, Moving Day Tracker, Budget, Service Bookings, and Activity Log.
- **Phase 9:** React frontend UI with Tailwind CSS, Lucide icons, responsive navigation, and complete API integration.
- **Phase 10:** End-to-end testing, error handling audit, Postman collection, README documentation, and deployment guidelines.

