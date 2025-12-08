# Queue Management System - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Features](#features)
4. [Technology Stack](#technology-stack)
5. [Installation & Setup](#installation--setup)
6. [File Descriptions](#file-descriptions)
7. [Database Schema](#database-schema)
8. [API Reference](#api-reference)
9. [Routes](#routes)
10. [Troubleshooting](#troubleshooting)
11. [Deployment](#deployment)

---

## Overview

**Queue Management System** is a real-time web application for restaurants to manage customer queues efficiently. Customers can join queues, track their position, and receive notifications. Admins can monitor queues, update status, and view statistics.

### Key Features
- ✅ Real-time queue position tracking
- ✅ Customer queue persistence (localStorage)
- ✅ Search queues by ID or phone number
- ✅ Admin authentication & dashboard
- ✅ Real-time notifications & sound alerts
- ✅ Queue statistics & completion history
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Input validation with real-time feedback

---

## Project Structure

```
Queue_Management/
├── src/
│   ├── context/
│   │   └── AdminAuthContext.jsx          # Admin authentication provider
│   ├── components/
│   │   ├── Navigation.jsx                # Top navigation bar
│   │   ├── Navigation.css                # Navigation styling
│   │   └── ProtectedAdminRoute.jsx       # Admin route protection
│   ├── pages/
│   │   ├── pages.css                     # All page styling
│   │   ├── customer/
│   │   │   ├── Join.jsx                  # Join queue page
│   │   │   ├── Status.jsx                # Queue status tracking
│   │   │   └── MyQueue.jsx               # Retrieved queues page
│   │   └── admin/
│   │       ├── Dashboard.jsx             # Admin dashboard
│   │       └── AdminLogin.jsx            # Admin login page
│   ├── services/
│   │   ├── queueService.js               # Queue operations (Firebase)
│   │   ├── notificationService.js        # Notifications & alerts
│   │   └── backendFunctions.js           # Validation functions
│   ├── firebaseConfig.js                 # Firebase configuration
│   ├── App.jsx                           # Main app component
│   ├── App.css                           # App styling
│   ├── main.jsx                          # Entry point with providers
│   └── index.css                         # Global styling
├── public/
│   └── notification-sound.mp3            # Alert sound
├── .env                                  # Firebase credentials
├── package.json                          # Dependencies
├── vite.config.js                        # Vite configuration
└── README.md                             # Quick start guide
```

---

## Features

### 👤 Customer Features

#### 1. **Join Queue**
- Enter name (2-50 characters)
- Enter phone number (exactly 10 digits)
- Enter party size (1-20 people)
- Real-time validation with error messages
- Auto-save to localStorage

#### 2. **Queue Status Tracking**
- Real-time position updates
- Estimated wait time calculation
- Queue status indicators
- Leave queue option
- Real-time position change notifications

#### 3. **My Queue - Queue Retrieval**
- **Search by Queue ID**: Enter received Queue ID to retrieve queue
- **Search by Phone Number**: Enter phone number used during join
- View all saved queues with details
- Quick access buttons to status page
- Remove saved queues from list
- Auto-save retrieved queues

#### 4. **Notifications**
- Browser notifications when position improves
- Sound alerts for updates
- Toast notifications for user feedback
- Request notification permission

---

### 👨‍💼 Admin Features

#### 1. **Admin Authentication**
- Password-protected login (default: `admin123`)
- Session persistence (localStorage)
- Logout functionality
- Protected routes

#### 2. **Dashboard**
- **Queue Management**
  - View all active queues in real-time
  - See customer details (name, phone, party size)
  - Serve queue (change status to "serving")
  - Complete queue (change status to "completed")
  - Skip queue (mark as "skipped")
  - Reorder queues manually

- **Statistics**
  - Total customers served today
  - Average wait time
  - Total queues in system
  - Average serving time

- **Completion History**
  - View completed queue entries
  - See wait times for each entry
  - Track service history

---

## Technology Stack

### Frontend
- **React 19.2.0** - UI framework
- **React Router 7.10.1** - Client-side routing
- **Vite 7.2.4** - Build tool & dev server

### Backend
- **Firebase Realtime Database** - NoSQL database
- **Firebase Authentication** (built-in support)

### Styling
- **CSS3** - Custom styling with gradients & animations
- **Responsive Design** - Mobile-first approach

### Utilities
- **Web Notifications API** - Browser notifications
- **Web Audio API** - Sound alerts
- **localStorage API** - Client-side persistence

---

## Installation & Setup

### 1. **Clone or Download Project**
```bash
cd Queue_Management
```

### 2. **Install Dependencies**
```bash
npm install
```

### 3. **Configure Firebase**

Create `.env` file in root directory:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_DATABASE_URL=your_database_url
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. **Firebase Realtime Database Setup**

In Firebase Console:
1. Go to Realtime Database
2. Create new database in `locked mode`
3. Update Rules:
```json
{
  "rules": {
    "queues": {
      ".read": true,
      ".write": true,
      "$queueId": {
        ".validate": "newData.hasChildren(['name', 'phone', 'partySize', 'status', 'position'])"
      }
    },
    "settings": {
      ".read": true,
      ".write": false,
      "config": {
        ".write": true
      }
    }
  }
}
```

4. Add initial data:
```json
{
  "settings": {
    "config": {
      "averageServingTime": 5
    }
  }
}
```

### 5. **Start Development Server**
```bash
npm run dev
```

Visit: `http://localhost:5174`

---

## File Descriptions

### Context
**`src/context/AdminAuthContext.jsx`**
- Manages admin authentication state globally
- Methods: `login(password)`, `logout()`
- Stores auth status in localStorage
- Provides `useAdminAuth` hook

### Components
**`src/components/Navigation.jsx`**
- Top navigation bar with logo and links
- Shows different links for customers vs admins
- Admin login/logout buttons
- Responsive on mobile

**`src/components/ProtectedAdminRoute.jsx`**
- Protects admin routes from unauthorized access
- Redirects to login if not authenticated
- Shows loading state while checking auth

### Pages
**`src/pages/customer/Join.jsx`**
- Form to join queue
- Real-time validation feedback
- 10-digit phone validation with visual indicator
- Auto-saves to localStorage on success
- Redirects to status page

**`src/pages/customer/Status.jsx`**
- Displays real-time queue position
- Shows estimated wait time
- Notifications when position changes
- Leave queue option
- Auto-saves queue to localStorage

**`src/pages/customer/MyQueue.jsx`**
- Retrieve saved queues from localStorage
- Search by Queue ID
- Search by phone number (searches all queues)
- View list of saved queues
- Quick access to status page
- Remove saved queues

**`src/pages/admin/AdminLogin.jsx`**
- Password input with toggle visibility
- Real-time login feedback
- Redirects to dashboard on success
- Default password: `admin123`

**`src/pages/admin/Dashboard.jsx`**
- Real-time queue list
- Manage queue status (serve, complete, skip)
- Reorder queues
- View daily statistics
- View completion history

### Services
**`src/services/queueService.js`** (Firebase Realtime Database)
- `joinQueue(name, partySize, phone)` - Add to queue
- `getQueueStatus(queueId)` - Get queue details
- `subscribeToQueueStatus(queueId, callback)` - Real-time updates
- `subscribeToQueueList(callback)` - All queues for admin
- `updateQueueStatus(queueId, newStatus)` - Change status
- `deleteQueueEntry(queueId)` - Leave/remove queue
- `searchQueueByPhone(phone)` - Search by phone number
- `getDailyStats()` - Calculate statistics
- `getCompletionHistory(limit)` - Completed queues
- Helper functions for position, wait time calculation

**`src/services/notificationService.js`**
- `requestNotificationPermission()` - Ask for browser notifications
- `sendBrowserNotification(title, options)` - Send notification
- `playNotificationSound()` - Play alert sound
- `showToast(message, type)` - Toast notifications

**`src/services/backendFunctions.js`** (Validation)
- `validateName(name)` - Check 2-50 characters
- `validatePhone(phone)` - Check 10 digits exactly
- `validatePartySize(partySize)` - Check 1-20 people
- `validateJoinQueueForm(name, phone, partySize)` - Validate all
- Utility functions: `formatTime()`, `formatDate()`, `calculateWaitTime()`

---

## Database Schema

### Realtime Database Structure

```
queues/
├── {auto_id_1}/
│   ├── name: "John Doe"
│   ├── phone: "1234567890"
│   ├── partySize: 4
│   ├── status: "waiting" | "serving" | "completed" | "skipped"
│   ├── position: 1
│   ├── createdAt: 1702000000000
│   ├── updatedAt: 1702000000000
│   ├── servedAt: 1702000060000 (optional)
│   └── completedAt: 1702000120000 (optional)
└── {auto_id_2}/
    └── ...

settings/
└── config/
    └── averageServingTime: 5
```

### Status Values
- `"waiting"` - Waiting in queue
- `"serving"` - Currently being served
- `"completed"` - Service completed
- `"skipped"` - Skipped by admin

---

## API Reference

### Queue Service

#### **`joinQueue(name, partySize, phone)`**
Adds customer to queue.

**Parameters:**
- `name` (string): Customer name
- `partySize` (number): Number of people
- `phone` (string): Phone number (10 digits)

**Returns:** Promise<string> - Queue ID

**Example:**
```javascript
const queueId = await joinQueue("John", 4, "1234567890");
console.log(queueId); // "-NxyZ1234abcd..."
```

---

#### **`getQueueStatus(queueId)`**
Retrieves single queue status.

**Parameters:**
- `queueId` (string): Queue ID

**Returns:** Promise<object> - Queue data with calculated position & wait time

**Example:**
```javascript
const status = await getQueueStatus("-NxyZ1234abcd");
// {
//   name: "John",
//   position: 3,
//   estimatedWaitTime: 15,
//   status: "waiting",
//   ...
// }
```

---

#### **`subscribeToQueueStatus(queueId, callback)`**
Real-time listener for single queue updates.

**Parameters:**
- `queueId` (string): Queue ID
- `callback` (function): Called with updated data

**Returns:** Function - Unsubscribe function

**Example:**
```javascript
const unsubscribe = subscribeToQueueStatus(queueId, (data) => {
  console.log("Position:", data.position);
});
// Later: unsubscribe();
```

---

#### **`subscribeToQueueList(callback)`**
Real-time listener for all queues (admin).

**Parameters:**
- `callback` (function): Called with filtered & sorted queue list

**Returns:** Function - Unsubscribe function

---

#### **`updateQueueStatus(queueId, newStatus)`**
Changes queue status.

**Parameters:**
- `queueId` (string): Queue ID
- `newStatus` (string): "serving", "completed", or "skipped"

**Returns:** Promise<void>

**Example:**
```javascript
await updateQueueStatus("-NxyZ1234", "serving");
```

---

#### **`searchQueueByPhone(phone)`**
Searches all queues by phone number.

**Parameters:**
- `phone` (string): Phone number (supports exact or partial match - last 7 digits)

**Returns:** Promise<object> - Queue data with ID

**Example:**
```javascript
const queue = await searchQueueByPhone("1234567890");
// { id: "-NxyZ1234", name: "John", phone: "1234567890", ... }
```

---

#### **`deleteQueueEntry(queueId)`**
Removes queue entry.

**Parameters:**
- `queueId` (string): Queue ID

**Returns:** Promise<void>

---

### Validation Service

#### **`validateJoinQueueForm(name, phone, partySize)`**
Validates all join form fields together.

**Parameters:**
- `name` (string): Customer name
- `phone` (string): Phone number
- `partySize` (number): Party size

**Returns:** Object
```javascript
{
  valid: boolean,
  message: string
}
```

**Example:**
```javascript
const result = validateJoinQueueForm("John", "1234567890", 4);
if (result.valid) {
  // Proceed
} else {
  console.log(result.message); // Error message
}
```

---

#### **`validateName(name)`**
Validates customer name.

**Validation Rules:**
- Not empty
- 2-50 characters
- Trims whitespace

---

#### **`validatePhone(phone)`**
Validates phone number.

**Validation Rules:**
- Exactly 10 digits
- Only numeric characters
- No spaces or special characters

---

#### **`validatePartySize(partySize)`**
Validates party size.

**Validation Rules:**
- Minimum: 1 person
- Maximum: 20 people
- Must be integer

---

### Notification Service

#### **`sendBrowserNotification(title, options)`**
Sends browser notification.

**Parameters:**
- `title` (string): Notification title
- `options` (object): Icon, body, etc.

---

#### **`playNotificationSound()`**
Plays alert sound.

---

#### **`showToast(message, type)`**
Shows temporary toast message.

**Parameters:**
- `message` (string): Message text
- `type` (string): "success", "error", "info"

---

## Routes

### Customer Routes

| Route | Component | Access | Description |
|-------|-----------|--------|-------------|
| `/` | - | Public | Redirects to `/customer/join` |
| `/customer/join` | Join.jsx | Public | Join queue form |
| `/customer/status/:queueId` | Status.jsx | Public | Track queue status |
| `/customer/my-queue` | MyQueue.jsx | Public | Retrieve saved queues |

### Admin Routes

| Route | Component | Access | Description |
|-------|-----------|--------|-------------|
| `/admin/login` | AdminLogin.jsx | Public | Admin login |
| `/admin/dashboard` | Dashboard.jsx | Protected | Admin dashboard |
| `/admin` | Dashboard.jsx | Protected | Redirect to dashboard |

---

## Troubleshooting

### Issue: "Can't determine Firebase Database URL"
**Solution:** Check `.env` file has `VITE_FIREBASE_DATABASE_URL` with correct value

### Issue: "Join Queue stuck on Joining..."
**Solution:** 
- Check Firebase Realtime Database rules allow write access
- Verify internet connection
- Check browser console for errors

### Issue: "Phone search not working"
**Solution:**
- Phone number must be exactly 10 digits
- Supports exact match or last 7 digits partial match
- Check the queue has valid phone number saved

### Issue: "Notifications not appearing"
**Solution:**
- Allow notifications when browser asks
- Check browser notification settings
- Notifications work only on HTTPS (production) or localhost

### Issue: "Queue ID not saving to localStorage"
**Solution:**
- Check browser allows localStorage
- Clear browser cache/cookies
- Check for browser storage limits

---

## Deployment

### Firebase Hosting

#### 1. **Install Firebase CLI**
```bash
npm install -g firebase-tools
```

#### 2. **Initialize Firebase**
```bash
firebase login
firebase init hosting
```

#### 3. **Build Project**
```bash
npm run build
```

#### 4. **Deploy**
```bash
firebase deploy
```

### Environment Variables
Ensure `.env` has all Firebase credentials before deployment.

### Production Checklist
- ✅ Change admin password in `AdminAuthContext.jsx`
- ✅ Update Firebase Realtime Database rules
- ✅ Enable HTTPS
- ✅ Test all features
- ✅ Check responsive design on mobile
- ✅ Enable browser notifications

---

## Summary

This Queue Management System provides a complete solution for restaurant queue management with:
- Real-time tracking using Firebase
- Persistent queue storage using localStorage
- Admin authentication & dashboard
- Customer notifications & alerts
- Comprehensive validation
- Mobile-responsive design

All features are production-ready and fully documented. Refer to API Reference for implementation details.

## Overview
A full-stack Real-Time Queue Management Web Application for restaurants, built with React, Firebase, and Vite.

## Features

### Customer Features
- ✅ Join queue by submitting name, party size, and phone number
- ✅ Real-time view of current queue position
- ✅ Estimated waiting time calculation
- ✅ Browser notifications when turn is approaching
- ✅ Leave queue functionality

### Admin Features
- ✅ Real-time queue monitoring dashboard
- ✅ Update queue status (waiting → serving → completed/skipped)
- ✅ View daily statistics (total served, average wait time)
- ✅ Access completion history
- ✅ Automatic position reorganization

## Project Structure

```
Queue_Management/
├── src/
│   ├── components/
│   │   ├── Navigation.jsx          # Main navigation component
│   │   ├── Navigation.css          # Navigation styles
│   │   └── Write.jsx               # Legacy component (can be removed)
│   ├── pages/
│   │   ├── customer/
│   │   │   ├── Join.jsx            # Customer join queue page
│   │   │   └── Status.jsx          # Customer status tracking page
│   │   ├── admin/
│   │   │   └── Dashboard.jsx       # Admin dashboard
│   │   └── pages.css               # Page styles
│   ├── services/
│   │   ├── queueService.js         # Queue management functions
│   │   ├── notificationService.js  # Notification utilities
│   │   └── backendFunctions.js     # Backend logic & validation
│   ├── App.jsx                     # Main app with routes
│   ├── App.css                     # App styles
│   ├── main.jsx                    # Entry point with BrowserRouter
│   ├── index.css                   # Global styles
│   └── firebaseConfig.js           # Firebase configuration
├── public/
├── .env                            # Environment variables
├── vite.config.js                  # Vite configuration
├── package.json                    # Dependencies
├── eslint.config.js                # ESLint configuration
└── README.md                       # This file
```

## Installation & Setup

### 1. Prerequisites
- Node.js 16+ installed
- Firebase project created at https://firebase.google.com
- Firebase Realtime Database enabled

### 2. Install Dependencies
```bash
npm install
```

Required packages:
- `react`: 19.2.0
- `react-router-dom`: 7.10.1
- `firebase`: 12.6.0
- `vite`: 7.2.4

### 3. Configure Firebase

#### Get your Firebase credentials:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click "Settings" → "Project Settings"
4. Copy your web app credentials

#### Update `.env` file:
```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_DATABASE_URL=your_database_url
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Setup Firebase Realtime Database Rules
```json
{
  "rules": {
    "queues": {
      ".read": true,
      ".write": true,
      "$queueId": {
        ".validate": "newData.hasChildren(['name', 'phone', 'partySize', 'status'])"
      }
    },
    "settings": {
      ".read": true,
      ".write": "auth != null"
    }
  }
}
```

### 5. Initialize Firebase Collections (in Firestore/Realtime DB)
```javascript
// Create "settings" document with default values
{
  "settings": {
    "config": {
      "averageServingTime": 5  // minutes
    }
  }
}
```

## Running the Application

### Development Mode
```bash
npm run dev
```
Opens at `http://localhost:5173`

### Production Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Firestore/Realtime Database Schema

### Collections

#### `queues` Collection
```javascript
{
  id: "auto_generated_id",
  name: "John Doe",
  partySize: 4,
  phone: "+1234567890",
  status: "waiting",  // or "serving", "completed", "skipped"
  position: 1,
  createdAt: timestamp,
  servedAt: timestamp,        // added when status = "serving"
  completedAt: timestamp,     // added when status = "completed"
  updatedAt: timestamp
}
```

#### `settings` Collection
```javascript
{
  config: {
    averageServingTime: 5  // average time per customer in minutes
  }
}
```

## API Reference

### Queue Service (`src/services/queueService.js`)

#### Customer Functions

**`joinQueue(name, partySize, phone)`**
- Adds customer to queue
- Returns: Queue ID
- Throws: Error on validation failure

**`getQueueStatus(queueId)`**
- Gets current status and position
- Returns: Queue data with position and estimated wait time

**`subscribeToQueueStatus(queueId, callback)`**
- Real-time updates to queue status
- Returns: Unsubscribe function

#### Admin Functions

**`subscribeToQueueList(callback)`**
- Real-time queue list
- Returns: Unsubscribe function

**`updateQueueStatus(queueId, newStatus)`**
- Updates status: "waiting" → "serving" → "completed"/"skipped"
- Returns: Promise

**`getDailyStats()`**
- Returns: { totalServed, totalPeople, avgWaitTime }

**`getCompletionHistory(limit)`**
- Returns: Array of completed queue entries

### Notification Service (`src/services/notificationService.js`)

**`requestNotificationPermission()`**
- Requests browser notification permission

**`sendBrowserNotification(title, options)`**
- Sends browser notification

**`playNotificationSound()`**
- Plays notification sound

**`showToast(message, type)`**
- Shows in-app toast notification

## Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | CustomerJoin | Redirect to customer join |
| `/customer/join` | CustomerJoin | Customer join queue page |
| `/customer/status/:queueId` | CustomerStatus | Customer status tracking |
| `/admin/dashboard` | AdminDashboard | Admin dashboard |

## Key Features Implementation

### Real-Time Updates
- Uses Firebase `onSnapshot()` for real-time listeners
- Automatic position updates when customers complete service
- Real-time queue list for admin dashboard

### Notifications
- Browser notifications when approaching turn
- Sound alerts (Web Audio API)
- In-app toast notifications

### Validation
- Client-side validation for all inputs
- Phone number format validation
- Party size limits (1-20)

### Responsive Design
- Mobile-first approach
- Tablet and desktop optimizations
- Touch-friendly buttons

## Environment Variables

```env
VITE_FIREBASE_API_KEY      # Firebase API Key
VITE_FIREBASE_AUTH_DOMAIN  # Firebase Auth Domain
VITE_FIREBASE_DATABASE_URL # Firebase Realtime Database URL
VITE_FIREBASE_PROJECT_ID   # Firebase Project ID
VITE_FIREBASE_STORAGE_BUCKET # Firebase Storage Bucket
VITE_FIREBASE_MESSAGING_SENDER_ID # Messaging Sender ID
VITE_FIREBASE_APP_ID       # Firebase App ID
```

## Deployment

### Deploy to Firebase Hosting

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase:
```bash
firebase init hosting
```

4. Build the project:
```bash
npm run build
```

5. Deploy:
```bash
firebase deploy
```

## Troubleshooting

### White Screen Issue
- Check `.env` file has correct VITE_ prefixes
- Restart dev server after `.env` changes
- Check browser console for errors (F12)

### Firebase Connection Errors
- Verify Firebase credentials in `.env`
- Check Realtime Database is enabled
- Confirm database rules allow read/write

### Notifications Not Working
- Allow browser notifications when prompted
- Check browser notification settings
- Some browsers require HTTPS for notifications

## Performance Optimization

- Real-time listeners only on visible pages
- Lazy loading of routes
- Optimized re-renders with React hooks
- Firestore indexing on frequently queried fields

## Security

- Firebase security rules restrict unauthorized access
- Input validation on all forms
- Server-side validation recommended for production
- Use Firebase Authentication for admin dashboard in production

## Future Enhancements

1. Admin Authentication
2. SMS/Email notifications
3. Queue analytics dashboard
4. Estimated service time prediction
5. Customer feedback/ratings
6. Multi-location support
7. Custom queue management workflows
8. Integration with POS systems

## Support & Issues

For issues or feature requests, check:
1. Browser console for errors (F12)
2. Firebase console for database issues
3. Network tab for API issues

## License

This project is open source and available under the MIT License.

## Created
December 2024
