# MoveMate Postman API Testing Guide

This directory contains the complete, turnkey Postman collection and environment files to test all MoveMate REST endpoints.

---

## 📁 Files Included

1. **`MoveMate_API.postman_collection.json`**
   - Covers all 12 API modules: System Health, Auth, Moves, Rooms, Boxes & QR Codes, Inventory, Tasks, Collaboration & Members, Budget, Bookings, Dashboard, Tracker, and Activity.
   - Includes automatic response tests that capture generated IDs (`moveId`, `roomId`, `boxId`, `taskId`, etc.) and the JWT `token` into environment variables so sequential calls work immediately.
2. **`MoveMate_Local.postman_environment.json`**
   - Configured for `http://localhost:5000/api/v1` with pre-defined keys for tokens and entity IDs.

---

## 🚀 How to Import & Run in Postman

### Step 1: Start the Backend Server
Make sure the MoveMate backend is running on port 5000:
```powershell
cd backend
npm run dev
```

### Step 2: Import Files into Postman
1. Open the [Postman app](https://www.postman.com/downloads/).
2. Click **Import** (top left).
3. Drag & drop or browse to select both:
   - `postman/MoveMate_API.postman_collection.json`
   - `postman/MoveMate_Local.postman_environment.json`
4. In the top-right environment selector dropdown, select **MoveMate Local Environment**.

### Step 3: Run the Requests in Order
Execute requests sequentially from top to bottom:
1. **00. System & Health** &rarr; Verify API status (`200 OK`).
2. **01. Authentication** &rarr; Run `Register User (Owner)`. The test script automatically saves the `token`.
3. **02. Moving Plans** &rarr; Run `Create Moving Plan`. Automatically saves `moveId`.
4. **03. Rooms** &rarr; Run `Create Room`. Saves `roomId`.
5. **04. Boxes & QR Codes** &rarr; Run `Create Box`. Saves `boxId`. Inspect `Get Box by ID` to see the generated Base64 QR code!
6. **05. Inventory Items** &rarr; Run `Create Inventory Item`.
7. **06. Tasks & Checklist** &rarr; Run `Create Essential Task` and `Complete Task`.
8. **07. Collaboration & Members** &rarr; Run `Register Collaborator` then `Invite Collaborator`.
9. **08. Budget & Expenses** &rarr; Run `Create Expense` and `List Expenses & Variance`.
10. **09. Service Bookings** &rarr; Run `Create Service Booking`.
11. **10. Readiness Dashboard** &rarr; Run `Get Smart Readiness Dashboard` to view the 4-pillar score calculation ($0-100\%$).
12. **11. Moving Day Tracker** &rarr; Run `Get Moving Day Transit Status`.
13. **12. Activity Timeline** &rarr; Run `Get Activity Timeline` to view the historical audit feed.

### Or Run the Entire Collection Automatically:
1. In Postman, click on the **MoveMate REST API Collection**.
2. Click **Run collection** (Collection Runner).
3. Ensure **MoveMate Local Environment** is selected.
4. Click **Run MoveMate REST API Collection**. All tests will execute and pass sequentially!
