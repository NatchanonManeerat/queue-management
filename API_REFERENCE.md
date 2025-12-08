# 📚 Complete API Reference - Queue Management System

Detailed function signatures, parameters, return values, and code examples for developers.

---

## 📑 Table of Contents

1. [Queue Service API](#queue-service-api) - Firebase Realtime Database operations
2. [Validation Functions](#validation-functions) - Form validation
3. [Notification Service](#notification-service) - Alerts and notifications
4. [Admin Context API](#admin-context-api) - Authentication
5. [Components](#components) - React component documentation
6. [Firebase Data Models](#firebase-data-models) - Database structure
7. [Error Handling](#error-handling) - Common errors and solutions

---

## Queue Service API

**File:** `src/services/queueService.js`  
**Imports:**
```javascript
import { 
  joinQueue, 
  getQueueStatus, 
  subscribeToQueueStatus,
  subscribeToQueueList,
  searchQueueByPhone,
  updateQueueStatus,
  deleteQueueEntry
} from '@/services/queueService';
```

---

### joinQueue()

Join a new queue with customer information.

**Signature:**
```javascript
async function joinQueue(name, phone, partySize)
```

**Parameters:**
| Parameter | Type | Description | Validation |
|-----------|------|-------------|-----------|
| `name` | `string` | Customer name | 2-50 characters, required |
| `phone` | `string` | Phone number | Exactly 10 digits, numeric only |
| `partySize` | `number` | Number of people | 1-20 inclusive |

**Returns:**
```javascript
Promise<string> // Queue ID (e.g., 'queue_abc123')
```

**Throws:**
```javascript
// Validation error
Error('Name must be 2-50 characters')
Error('Phone must be exactly 10 digits')
Error('Party size must be 1-20 people')

// Firebase error
Error('Firebase error message')
```

**Example:**
```javascript
import { joinQueue } from '@/services/queueService';

try {
  const queueId = await joinQueue('John Doe', '1234567890', 2);
  console.log('Successfully joined! Queue ID:', queueId);
  
  // Save to localStorage
  const savedQueues = JSON.parse(localStorage.getItem('savedQueues')) || [];
  savedQueues.push({ id: queueId, name: 'John Doe', phone: '1234567890' });
  localStorage.setItem('savedQueues', JSON.stringify(savedQueues));
  
} catch (error) {
  console.error('Failed to join queue:', error.message);
}
```

---

### getQueueStatus()

Fetch current queue data (single request, not real-time).

**Signature:**
```javascript
async function getQueueStatus(queueId)
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `queueId` | `string` | Queue identifier (returned from joinQueue) |

**Returns:**
```javascript
Promise<QueueData | null>

// QueueData structure:
{
  id: string,
  name: string,
  location: string,
  estimatedWaitTime: number,
  currentSize: number,
  capacity?: number,
  createdAt: number,
  customers: {
    [customerId]: CustomerData
  }
}

// CustomerData structure:
{
  name: string,
  phone: string,
  partySize: number,
  joinedAt: number,
  status: 'active' | 'served' | 'cancelled'
}
```

**Returns:** `null` if queue doesn't exist

**Example:**
```javascript
import { getQueueStatus } from '@/services/queueService';

try {
  const queue = await getQueueStatus('queue_abc123');
  
  if (!queue) {
    console.log('Queue not found');
    return;
  }
  
  console.log('Queue name:', queue.name);
  console.log('Current size:', queue.currentSize);
  console.log('Wait time:', queue.estimatedWaitTime, 'minutes');
  
  // List all customers
  Object.entries(queue.customers).forEach(([id, customer]) => {
    console.log(`${customer.name}: ${customer.partySize} people`);
  });
  
} catch (error) {
  console.error('Error fetching queue:', error);
}
```

---

### subscribeToQueueStatus()

Real-time queue updates via Firebase listener.

**Signature:**
```javascript
function subscribeToQueueStatus(queueId, callback)
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `queueId` | `string` | Queue identifier |
| `callback` | `function` | Called on each update with QueueStatus object |

**Returns:**
```javascript
function // Unsubscribe function - call to stop listening
```

**QueueStatus Object:**
```javascript
{
  position: number,        // Current position in queue (1-based)
  waitTime: number,        // Estimated minutes until served
  queueData: QueueData,    // Full queue object
  customerId: string       // Your customer ID
}
```

**Example:**
```javascript
import { subscribeToQueueStatus } from '@/services/queueService';

const queueId = 'queue_abc123';

// Start listening
const unsubscribe = subscribeToQueueStatus(queueId, (status) => {
  console.log('Position:', status.position);
  console.log('Wait time:', status.waitTime, 'minutes');
  
  // Update UI
  document.getElementById('position').textContent = status.position;
  document.getElementById('waitTime').textContent = status.waitTime;
  
  // Notify when almost served
  if (status.position === 1) {
    console.log('You\'re next!');
    playNotificationSound();
  }
});

// Stop listening when component unmounts
// Call this in useEffect cleanup:
return () => unsubscribe();
```

**Real-time Updates:** Callback fires immediately when subscribed and whenever queue changes

---

### subscribeToQueueList()

Real-time all queues with optional filtering.

**Signature:**
```javascript
function subscribeToQueueList(callback, filter = {})
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `callback` | `function` | Called with array of QueueData objects |
| `filter` | `object` | Optional filter object (see below) |

**Filter Options:**
```javascript
{
  status: 'active' | 'all',  // Only active queues or all
  sortBy: 'name' | 'size' | 'wait', // Sort order
  limit?: number            // Max number of queues
}
```

**Example:**
```javascript
import { subscribeToQueueList } from '@/services/queueService';

const unsubscribe = subscribeToQueueList((queues) => {
  console.log('Total queues:', queues.length);
  
  queues.forEach(queue => {
    console.log(`${queue.name}: ${queue.currentSize} people waiting`);
  });
  
}, { status: 'active', sortBy: 'wait' });

// Stop listening
return () => unsubscribe();
```

---

### searchQueueByPhone()

Find a queue by customer phone number.

**Signature:**
```javascript
async function searchQueueByPhone(phone)
```

**Parameters:**
| Parameter | Type | Description | Requirements |
|-----------|------|-------------|--------------|
| `phone` | `string` | Phone number | 10 digits, numeric only |

**Returns:**
```javascript
Promise<QueueData> // Full queue object containing customer
```

**Throws:**
```javascript
Error('Queue not found') // If phone not in any queue
```

**Matching Behavior:**
- Tries exact match first
- Falls back to last 7 digits matching
- Case-insensitive
- Removes spaces and special characters automatically

**Example:**
```javascript
import { searchQueueByPhone } from '@/services/queueService';

try {
  const queue = await searchQueueByPhone('1234567890');
  
  console.log('Found queue:', queue.name);
  console.log('Your position:', queue.currentSize);
  
  // Save to localStorage
  const savedQueues = JSON.parse(localStorage.getItem('savedQueues')) || [];
  savedQueues.push({
    id: queue.id,
    name: queue.name,
    phone: '1234567890',
    joinedAt: Date.now()
  });
  localStorage.setItem('savedQueues', JSON.stringify(savedQueues));
  
} catch (error) {
  console.error('Phone not found in any queue:', error.message);
}
```

---

### updateQueueStatus()

Update queue properties (admin only).

**Signature:**
```javascript
async function updateQueueStatus(queueId, updates)
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `queueId` | `string` | Queue identifier |
| `updates` | `object` | Fields to update (see below) |

**Updatable Fields:**
```javascript
{
  estimatedWaitTime: number,
  currentSize: number,
  name: string,
  location: string,
  capacity: number
}
```

**Example:**
```javascript
import { updateQueueStatus } from '@/services/queueService';

try {
  // Advance queue position
  const currentQueue = await getQueueStatus('queue_abc123');
  
  await updateQueueStatus('queue_abc123', {
    currentSize: currentQueue.currentSize - 1,
    estimatedWaitTime: Math.max(0, currentQueue.estimatedWaitTime - 5)
  });
  
  console.log('Queue updated!');
  
} catch (error) {
  console.error('Update failed:', error);
}
```

---

### deleteQueueEntry()

Remove a customer from a queue.

**Signature:**
```javascript
async function deleteQueueEntry(queueId, customerId)
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `queueId` | `string` | Queue identifier |
| `customerId` | `string` | Customer ID to remove |

**Example:**
```javascript
import { deleteQueueEntry } from '@/services/queueService';

try {
  await deleteQueueEntry('queue_abc123', 'cust_001');
  console.log('Customer removed from queue');
} catch (error) {
  console.error('Delete failed:', error);
}
```

---

## Validation Functions

**File:** `src/services/backendFunctions.js`

**Imports:**
```javascript
import {
  validateName,
  validatePhone,
  validatePartySize,
  validateJoinQueueForm
} from '@/services/backendFunctions';
```

---

### validateName()

Validate customer name.

**Signature:**
```javascript
function validateName(name)
```

**Parameters:**
| Parameter | Type | Rules |
|-----------|------|-------|
| `name` | `string` | 2-50 characters, not empty |

**Returns:**
```javascript
{
  valid: boolean,
  message: string // Empty if valid, error message if invalid
}
```

**Example:**
```javascript
import { validateName } from '@/services/backendFunctions';

const result = validateName('John Doe');
// { valid: true, message: '' }

const result = validateName('J');
// { valid: false, message: 'Name must be 2-50 characters' }

const result = validateName('');
// { valid: false, message: 'Name must be 2-50 characters' }

// In component:
const { valid, message } = validateName(name);
if (!valid) {
  showError(message);
}
```

---

### validatePhone()

Validate phone number.

**Signature:**
```javascript
function validatePhone(phone)
```

**Parameters:**
| Parameter | Type | Rules |
|-----------|------|-------|
| `phone` | `string` | Exactly 10 digits, numeric only |

**Returns:**
```javascript
{
  valid: boolean,
  message: string
}
```

**Examples:**
```javascript
import { validatePhone } from '@/services/backendFunctions';

validatePhone('1234567890');
// { valid: true, message: '' }

validatePhone('123456789'); // 9 digits
// { valid: false, message: 'Phone must be exactly 10 digits' }

validatePhone('(123) 456-7890'); // Has formatting
// { valid: false, message: 'Phone must be exactly 10 digits' }

validatePhone('123456789a'); // Has letter
// { valid: false, message: 'Phone must be exactly 10 digits' }
```

---

### validatePartySize()

Validate party size.

**Signature:**
```javascript
function validatePartySize(partySize)
```

**Parameters:**
| Parameter | Type | Rules |
|-----------|------|-------|
| `partySize` | `number` | 1-20 inclusive |

**Returns:**
```javascript
{
  valid: boolean,
  message: string
}
```

**Examples:**
```javascript
import { validatePartySize } from '@/services/backendFunctions';

validatePartySize(5);
// { valid: true, message: '' }

validatePartySize(0); // Too small
// { valid: false, message: 'Party size must be 1-20 people' }

validatePartySize(21); // Too large
// { valid: false, message: 'Party size must be 1-20 people' }

validatePartySize('5'); // String converted to number
// { valid: true, message: '' }
```

---

### validateJoinQueueForm()

Validate entire join form at once.

**Signature:**
```javascript
function validateJoinQueueForm(name, phone, partySize)
```

**Parameters:**
| Parameter | Type | Validation |
|-----------|------|-----------|
| `name` | `string` | 2-50 chars |
| `phone` | `string` | 10 digits |
| `partySize` | `number` | 1-20 |

**Returns:**
```javascript
{
  valid: boolean,
  message: string
}
```

**Behavior:** Stops at first error (returns immediately)

**Example:**
```javascript
import { validateJoinQueueForm } from '@/services/backendFunctions';

// Valid form
validateJoinQueueForm('John Doe', '1234567890', 2);
// { valid: true, message: '' }

// Multiple errors, returns first
validateJoinQueueForm('J', '123', 25);
// { valid: false, message: 'Name must be 2-50 characters' }

// In component:
const handleSubmit = (e) => {
  e.preventDefault();
  
  const { valid, message } = validateJoinQueueForm(name, phone, partySize);
  
  if (!valid) {
    showError(message);
    return;
  }
  
  // Proceed with joining
  joinQueue(name, phone, partySize);
};
```

---

## Notification Service

**File:** `src/services/notificationService.js`

**Imports:**
```javascript
import {
  sendBrowserNotification,
  playNotificationSound
} from '@/services/notificationService';
```

---

### sendBrowserNotification()

Send browser notification to user.

**Signature:**
```javascript
async function sendBrowserNotification(title, options = {})
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `title` | `string` | Notification title |
| `options` | `object` | See below |

**Options:**
```javascript
{
  body: string,           // Notification message
  icon: string,           // Icon URL
  tag: string,            // Notification ID (prevents duplicates)
  requireInteraction: boolean // Keep until clicked (default: false)
}
```

**Example:**
```javascript
import { sendBrowserNotification } from '@/services/notificationService';

// Simple notification
sendBrowserNotification('Your turn is coming!');

// Detailed notification
sendBrowserNotification('Queue Update', {
  body: 'You are 2nd in line. Wait time: 10 minutes',
  icon: '/notification-icon.png',
  requireInteraction: true
});

// Note: User must grant notification permission first
// Browser will prompt on first call
```

---

### playNotificationSound()

Play alert sound.

**Signature:**
```javascript
function playNotificationSound()
```

**Parameters:** None

**Returns:** void

**Example:**
```javascript
import { playNotificationSound } from '@/services/notificationService';

// When customer is next
if (position === 1) {
  playNotificationSound();
  sendBrowserNotification('You\'re next!');
}
```

---

## Admin Context API

**File:** `src/context/AdminAuthContext.jsx`

**Imports:**
```javascript
import { useAdminAuth } from '@/context/AdminAuthContext';
```

---

### useAdminAuth() Hook

Access admin authentication state and methods.

**Signature:**
```javascript
function useAdminAuth()
```

**Returns:**
```javascript
{
  isAdminLoggedIn: boolean,  // true if admin is logged in
  loading: boolean,          // true while checking auth status
  error: string | null,      // Error message if login failed
  login: async (password: string) => void,  // Login function
  logout: () => void         // Logout function
}
```

**Example:**
```javascript
import { useAdminAuth } from '@/context/AdminAuthContext';

export function AdminPanel() {
  const { isAdminLoggedIn, loading, login, logout } = useAdminAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!isAdminLoggedIn) {
    return (
      <button onClick={() => login('admin123')}>
        Login as Admin
      </button>
    );
  }
  
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

---

### login()

Authenticate as admin.

**Signature:**
```javascript
async function login(password)
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `password` | `string` | Admin password |

**Throws:** Error if password incorrect

**Behavior:** 
- Stores auth status in localStorage
- Updates isAdminLoggedIn state

**Example:**
```javascript
const { login } = useAdminAuth();

try {
  await login('admin123');
  console.log('Login successful');
} catch (error) {
  console.error('Login failed:', error.message);
}
```

---

### logout()

Clear admin session.

**Signature:**
```javascript
function logout()
```

**Parameters:** None

**Returns:** void

**Behavior:** Removes auth from localStorage

**Example:**
```javascript
const { logout } = useAdminAuth();

<button onClick={logout}>Logout</button>
```

---

## Components

---

### ProtectedAdminRoute

Wrapper component that protects routes requiring admin login.

**Location:** `src/components/ProtectedAdminRoute.jsx`

**Props:**
```javascript
{
  children: ReactNode // Component to protect
}
```

**Behavior:**
- If admin logged in: Renders children
- If not logged in: Shows loading or redirects to /admin/login
- Checks localStorage on mount

**Example:**
```javascript
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import Dashboard from '@/pages/admin/Dashboard';

<ProtectedAdminRoute>
  <Dashboard />
</ProtectedAdminRoute>
```

---

### Navigation

Top navigation bar with conditional rendering.

**Location:** `src/components/Navigation.jsx`

**Features:**
- Shows customer links: "Join Queue", "My Queue"
- Shows admin link: "Admin Login" (if not logged in)
- Shows admin links: "Dashboard", "Logout" (if logged in)
- Responsive mobile menu

**Example:**
```javascript
import Navigation from '@/components/Navigation';

<Navigation />
```

---

## Firebase Data Models

---

### Queue Object

```javascript
{
  id: string,                    // Unique queue identifier
  name: string,                  // Queue name (e.g., "McDonald's Downtown")
  location: string,              // Location description
  estimatedWaitTime: number,     // Minutes until served
  currentSize: number,           // Current position in line (not count of customers)
  capacity: number,              // Maximum capacity
  createdAt: number,             // Timestamp when queue created
  customers: {
    [customerId]: {
      name: string,              // Customer name
      phone: string,             // Phone number (10 digits)
      partySize: number,         // Number of people
      joinedAt: number,          // Timestamp when joined
      status: 'active' | 'served' | 'cancelled'
    },
    // ... more customers
  }
}
```

---

### Firebase Database Rules

```json
{
  "rules": {
    "queues": {
      ".read": true,
      ".write": "auth != null"
    },
    "settings": {
      ".read": true,
      ".write": false
    },
    ".read": false,
    ".write": false
  }
}
```

---

## Error Handling

---

### Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `TypeError: Cannot read property 'trim'` | phone is null/undefined | Check phone validation before searchQueueByPhone |
| `PERMISSION_DENIED` | Database rules blocking access | Update Firebase Realtime DB rules |
| `Cannot find module '@/services/queueService'` | Path alias misconfigured | Check vite.config.js has resolve.alias for '@' |
| `sendBrowserNotification is not a function` | Wrong import path | Use: `import { sendBrowserNotification } from '@/services/notificationService'` |
| Queue not found from getQueueStatus | Queue was deleted | Handle null return value |
| Admin login keeps showing spinner | localStorage access denied | Check browser privacy settings |

---

### Error Handling Best Practices

**Always wrap Firebase calls:**
```javascript
try {
  const queue = await getQueueStatus(queueId);
  // Use queue
} catch (error) {
  console.error('Failed to fetch queue:', error);
  showErrorUI('Unable to load queue. Please try again.');
}
```

**Validate input before API calls:**
```javascript
const { valid, message } = validatePhone(phone);
if (!valid) {
  showError(message);
  return;
}

const queue = await searchQueueByPhone(phone);
```

**Always unsubscribe from listeners:**
```javascript
useEffect(() => {
  const unsubscribe = subscribeToQueueStatus(queueId, callback);
  
  return () => unsubscribe(); // Cleanup
}, [queueId]);
```

---

## TypeScript Types (for reference)

```typescript
interface QueueData {
  id: string;
  name: string;
  location: string;
  estimatedWaitTime: number;
  currentSize: number;
  capacity?: number;
  createdAt: number;
  customers: Record<string, CustomerData>;
}

interface CustomerData {
  name: string;
  phone: string;
  partySize: number;
  joinedAt: number;
  status: 'active' | 'served' | 'cancelled';
}

interface ValidationResult {
  valid: boolean;
  message: string;
}

interface QueueStatus {
  position: number;
  waitTime: number;
  queueData: QueueData;
  customerId: string;
}

interface AdminAuthContext {
  isAdminLoggedIn: boolean;
  loading: boolean;
  error: string | null;
  login: (password: string) => Promise<void>;
  logout: () => void;
}
```

---

## Environment Variables Reference

```env
# Firebase Configuration (get from Firebase Console)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Note: All VITE_ prefixed variables are exposed to frontend
# Do NOT put sensitive secrets here
```

---

## Complete Example: Join Queue Feature

```javascript
import { useState } from 'react';
import { joinQueue } from '@/services/queueService';
import { validateJoinQueueForm } from '@/services/backendFunctions';

export function JoinQueueForm() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [partySize, setPartySize] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePhoneChange = (e) => {
    // Remove non-numeric characters
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(cleaned);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate form
    const { valid, message } = validateJoinQueueForm(name, phone, partySize);
    if (!valid) {
      setError(message);
      return;
    }

    setLoading(true);
    try {
      // Join queue
      const queueId = await joinQueue(name, phone, parseInt(partySize));

      // Save to localStorage
      const savedQueues = JSON.parse(localStorage.getItem('savedQueues')) || [];
      savedQueues.push({
        id: queueId,
        name,
        phone,
        joinedAt: Date.now()
      });
      localStorage.setItem('savedQueues', JSON.stringify(savedQueues));

      // Navigate to status page
      window.location.href = `/customer/status/${queueId}`;

    } catch (err) {
      setError(err.message || 'Failed to join queue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        disabled={loading}
      />

      <input
        type="tel"
        value={phone}
        onChange={handlePhoneChange}
        placeholder="Phone (10 digits)"
        inputMode="numeric"
        maxLength="10"
        disabled={loading}
      />

      <input
        type="number"
        value={partySize}
        onChange={(e) => setPartySize(e.target.value)}
        placeholder="Party size"
        min="1"
        max="20"
        disabled={loading}
      />

      {error && <div className="error">{error}</div>}

      <button
        type="submit"
        disabled={loading || phone.length !== 10}
      >
        {loading ? 'Joining...' : 'Join Queue'}
      </button>
    </form>
  );
}
```

---

**Version:** 1.0.0  
**Last Updated:** 2024  
**Maintainer:** Queue Management Team

## Backend Services Overview

All backend logic is organized into service files for clean separation of concerns.

### 1. Queue Service (`src/services/queueService.js`)

#### Customer Operations

##### joinQueue(name, partySize, phone)
```javascript
// Join a queue
const queueId = await joinQueue("John Doe", 4, "+1234567890");

// Returns: "doc_id_123"
// Throws: Error with validation message
```

**Validation:**
- Name: required, 1-50 characters
- Phone: required, valid format
- PartySize: 1-20 people

---

##### getQueueStatus(queueId)
```javascript
// Get customer's status
const status = await getQueueStatus("doc_id_123");

// Returns:
{
  id: "doc_id_123",
  name: "John Doe",
  partySize: 4,
  phone: "+1234567890",
  status: "waiting",
  position: 5,
  estimatedWaitTime: 25,  // in minutes
  createdAt: Date
}
```

---

##### subscribeToQueueStatus(queueId, callback)
```javascript
// Real-time subscription
const unsubscribe = subscribeToQueueStatus(
  "doc_id_123",
  (queueData) => {
    console.log("New position:", queueData.position);
  }
);

// Later, unsubscribe to stop listening
unsubscribe();
```

---

#### Admin Operations

##### subscribeToQueueList(callback)
```javascript
// Get real-time queue list (sorted by position)
const unsubscribe = subscribeToQueueList((queues) => {
  queues.forEach(queue => {
    console.log(`${queue.position}: ${queue.name}`);
  });
});

// unsubscribe() to stop listening
```

---

##### updateQueueStatus(queueId, newStatus)
```javascript
// Update customer status
await updateQueueStatus("doc_id_123", "serving");
// Valid statuses: "waiting", "serving", "completed", "skipped"

// When updated to "serving":
// - servedAt timestamp is set
// When updated to "completed":
// - completedAt timestamp is set
// - Positions automatically reorganized
```

---

##### reorderQueues(queueId1, queueId2)
```javascript
// Swap two customers' positions
await reorderQueues("doc_id_1", "doc_id_2");

// Useful for: jump queue, priority customers, etc.
```

---

##### getDailyStats()
```javascript
// Get today's statistics
const stats = await getDailyStats();

// Returns:
{
  totalServed: 42,        // customers completed today
  totalPeople: 156,       // total people served today
  avgWaitTime: 12,        // average wait in minutes
  peakHour: "N/A"         // can be extended
}
```

---

##### getCompletionHistory(limit = 20)
```javascript
// Get list of completed customers
const history = await getCompletionHistory(50);

// Returns array of completed queue entries with timestamps
```

---

##### deleteQueueEntry(queueId)
```javascript
// Remove customer from queue (when they leave)
await deleteQueueEntry("doc_id_123");
```

---

### 2. Notification Service (`src/services/notificationService.js`)

#### Notification Functions

##### checkNotification(currentPosition, previousPosition, queueList)
```javascript
// Check if customer should be notified
const notification = checkNotification(3, 5, queueList);

if (notification) {
  // { type: "approaching", message: "...", peopleAhead: 2 }
}
```

**Notification Threshold:** Notifies when 2 people or fewer ahead

---

##### requestNotificationPermission()
```javascript
// Request browser notification permission
const granted = await requestNotificationPermission();

if (granted) {
  console.log("Notifications enabled");
}
```

---

##### sendBrowserNotification(title, options)
```javascript
// Send browser notification
sendBrowserNotification("Your Turn!", {
  body: "You're next in line!",
  tag: "queue-alert"  // prevent duplicates
});
```

---

##### playNotificationSound()
```javascript
// Play beep sound alert
playNotificationSound();
// Uses Web Audio API - works on all modern browsers
```

---

##### showToast(message, type)
```javascript
// Show in-app toast notification
showToast("Successfully joined queue!", "success");
showToast("Error occurred", "error");

// Types: "success", "error", "info", "warning"
// Auto-dismisses after 4 seconds
```

---

### 3. Backend Functions (`src/services/backendFunctions.js`)

#### Validation Functions

All return `{ valid: boolean, message: string }`

##### validateName(name)
```javascript
const result = validateName("John Doe");
if (!result.valid) alert(result.message);
```

---

##### validatePhone(phone)
```javascript
const result = validatePhone("+1234567890");
// Accepts: numbers, dashes, spaces, parentheses
```

---

##### validatePartySize(partySize)
```javascript
const result = validatePartySize("5");
// Range: 1-20
```

---

##### validateStatus(status)
```javascript
const result = validateStatus("serving");
// Valid: "waiting", "serving", "completed", "skipped"
```

---

#### Utility Functions

##### formatTime(date)
```javascript
formatTime(new Date());  // "2:30 PM"
```

---

##### formatDate(date)
```javascript
formatDate(new Date());  // "Dec 7, 2024"
```

---

##### calculateWaitTime(createdAt, servedAt)
```javascript
const waitMinutes = calculateWaitTime(createdAt, servedAt);
// Returns: 15 (minutes)
```

---

##### generateQueueId()
```javascript
const customId = generateQueueId();
// Returns: "Q-1701924000000-abc123def"
```

---

## Complete Implementation Example

### Customer Join Flow

```javascript
import { joinQueue } from '../services/queueService';
import { showToast } from '../services/notificationService';
import { validateName, validatePhone } from '../services/backendFunctions';

// In your component
const handleJoin = async (name, phone, partySize) => {
  // Validate inputs
  if (!validateName(name).valid) {
    showToast("Invalid name", "error");
    return;
  }
  
  if (!validatePhone(phone).valid) {
    showToast("Invalid phone", "error");
    return;
  }
  
  try {
    // Join queue
    const queueId = await joinQueue(name, partySize, phone);
    showToast("Successfully joined!", "success");
    navigate(`/customer/status/${queueId}`);
  } catch (error) {
    showToast(error.message, "error");
  }
};
```

---

### Admin Monitoring Flow

```javascript
import { subscribeToQueueList, updateQueueStatus } from '../services/queueService';

// In admin component
useEffect(() => {
  // Subscribe to queue updates
  const unsubscribe = subscribeToQueueList((queues) => {
    setQueues(queues);
    
    queues.forEach(queue => {
      if (queue.status === 'waiting' && queue.position === 1) {
        // First in queue - auto-notify admin
        console.log(`Next: ${queue.name}`);
      }
    });
  });
  
  return () => unsubscribe();
}, []);

// Mark customer as served
const handleServe = async (queueId) => {
  try {
    await updateQueueStatus(queueId, "serving");
  } catch (error) {
    console.error("Error:", error);
  }
};

// Complete service
const handleComplete = async (queueId) => {
  try {
    await updateQueueStatus(queueId, "completed");
    // Refresh stats
    const stats = await getDailyStats();
    setStats(stats);
  } catch (error) {
    console.error("Error:", error);
  }
};
```

---

### Real-Time Status Page Flow

```javascript
import { 
  subscribeToQueueStatus,
  deleteQueueEntry 
} from '../services/queueService';
import { 
  sendBrowserNotification,
  playNotificationSound 
} from '../services/notificationService';

// In status component
useEffect(() => {
  const unsubscribe = subscribeToQueueStatus(queueId, (data) => {
    setQueueData(data);
    
    // Check if position improved
    if (data.position < previousPosition) {
      playNotificationSound();
      sendBrowserNotification("Position Update", {
        body: `You're now #${data.position}!`
      });
    }
    
    // Check if being served
    if (data.status === "serving") {
      playNotificationSound();
      sendBrowserNotification("Your Turn!", {
        body: "Please proceed to the counter"
      });
    }
    
    setPreviousPosition(data.position);
  });
  
  return () => unsubscribe();
}, [queueId, previousPosition]);

// Leave queue
const handleLeave = async () => {
  await deleteQueueEntry(queueId);
  navigate('/customer/join');
};
```

---

## Firebase Realtime Database Structure

### Recommended Database Path
```
└── Root
    ├── queues/
    │   ├── auto_id_1/
    │   │   ├── name: "John Doe"
    │   │   ├── phone: "+1234567890"
    │   │   ├── partySize: 4
    │   │   ├── status: "waiting"
    │   │   ├── position: 1
    │   │   ├── createdAt: 1702000000000
    │   │   ├── servedAt: null
    │   │   ├── completedAt: null
    │   │   └── updatedAt: 1702000001000
    │   │
    │   └── auto_id_2/
    │       └── ... (same structure)
    │
    └── settings/
        └── config/
            ├── averageServingTime: 5
            └── maxQueueSize: 100
```

---

## Error Handling

All functions use standard JavaScript error objects:

```javascript
try {
  const queueId = await joinQueue(name, partySize, phone);
} catch (error) {
  console.error("Error code:", error.code);      // Firebase error code
  console.error("Error message:", error.message); // Human-readable message
  
  // Show to user
  showToast(error.message, "error");
}
```

Common errors:
- "Please fill in all fields correctly"
- "Failed to join queue"
- "Queue entry not found"
- "Invalid status"
- "Permission denied"

---

## Performance Tips

1. **Use Subscriptions Wisely**
   - Subscribe only on active pages
   - Always unsubscribe when component unmounts

2. **Batch Operations**
   - When updating multiple queues, batch in one operation

3. **Limit Real-Time Listeners**
   - Max 100 concurrent listeners per database
   - Close unused listeners

4. **Caching**
   - Store `queueId` in localStorage for quick access
   - Don't re-join if already in queue

---

## Testing Scenarios

1. **New Customer**
   - Join queue → Get position → Leave queue

2. **Active Monitoring**
   - Admin views live queue → Updates status → Stats update

3. **Real-Time Position Change**
   - Customer A is position 5 → Customer B completes → Customer A becomes position 4

4. **Notifications**
   - Enable notifications → Move to position 1 → Receive alert

5. **Statistics**
   - Serve 10 customers → Check daily stats → Verify calculations

---

## Cloud Functions Deployment (Optional)

For production, deploy validation to Cloud Functions:

```bash
firebase init functions
cd functions
npm install
# Add functions from backendFunctions.js
firebase deploy --only functions
```

This moves validation to server-side for extra security.

---

## Additional Resources

- [Firebase Realtime Database Docs](https://firebase.google.com/docs/database)
- [Web Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [React Hooks](https://react.dev/reference/react)
