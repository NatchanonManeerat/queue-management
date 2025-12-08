# ⚡ Quick Reference - Queue Management System

Fast lookup guide for developers. Full documentation in [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md).

---

## 🚀 Quick Commands

```bash
# Install dependencies
npm install

# Start development server (port 5174)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run ESLint
npm run lint
```

---

## 🗺️ Application Routes

| Route | Component | Type | Description |
|-------|-----------|------|-------------|
| `/` | App.jsx | Redirect | Redirects to `/customer/join` |
| `/customer/join` | Join.jsx | Public | Join a new queue |
| `/customer/status/:queueId` | Status.jsx | Public | Track queue position in real-time |
| `/customer/my-queue` | MyQueue.jsx | Public | Retrieve saved queues by ID or phone |
| `/admin/login` | AdminLogin.jsx | Public | Admin authentication |
| `/admin/dashboard` | Dashboard.jsx | Protected | Admin queue management panel |
| `/admin` | Dashboard.jsx | Protected | Alias for admin dashboard |

---

## 🔐 Authentication

### Admin Login
```javascript
// Default password (in AdminAuthContext.jsx line 15)
const ADMIN_PASSWORD = 'admin123';

// Change in AdminAuthContext.jsx:
const ADMIN_PASSWORD = 'your_new_password';
```

### useAdminAuth Hook
```javascript
import { useAdminAuth } from '@/context/AdminAuthContext';

const MyComponent = () => {
  const { isAdminLoggedIn, loading, login, logout } = useAdminAuth();
  
  if (loading) return <div>Loading...</div>;
  
  if (!isAdminLoggedIn) {
    return <button onClick={() => login('admin123')}>Login</button>;
  }
  
  return <button onClick={logout}>Logout</button>;
};
```

### Protected Routes
```javascript
// Use ProtectedAdminRoute component
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';

<ProtectedAdminRoute>
  <Dashboard />
</ProtectedAdminRoute>
```

---

## 📊 Queue Service Functions

### joinQueue(name, phone, partySize)
Join a new queue.

```javascript
import { joinQueue } from '@/services/queueService';

const queueId = await joinQueue('John Doe', '1234567890', 2);
console.log('Queue ID:', queueId); // 'queue_abc123'
```

**Returns:** `string` - Queue ID  
**Throws:** Error with message if validation fails

---

### getQueueStatus(queueId)
Get current queue data (one-time fetch).

```javascript
import { getQueueStatus } from '@/services/queueService';

const queue = await getQueueStatus('queue_abc123');
console.log(queue);
// {
//   name: 'McDonald\'s',
//   currentSize: 5,
//   estimatedWaitTime: 20,
//   customers: { ... }
// }
```

**Returns:** `object` - Queue data or `null` if not found

---

### subscribeToQueueStatus(queueId, callback)
Real-time queue position updates.

```javascript
import { subscribeToQueueStatus } from '@/services/queueService';

const unsubscribe = subscribeToQueueStatus('queue_abc123', (status) => {
  console.log('Position:', status.position);
  console.log('Wait time:', status.waitTime, 'minutes');
});

// Stop listening
unsubscribe();
```

**Callback:** `(status) => {}`  
- `status.position`: Current position (number)
- `status.waitTime`: Estimated wait time (number, minutes)

---

### searchQueueByPhone(phone)
Find queue by customer phone number.

```javascript
import { searchQueueByPhone } from '@/services/queueService';

try {
  const queue = await searchQueueByPhone('1234567890');
  console.log('Found queue:', queue.id);
} catch (error) {
  console.error('Queue not found:', error.message);
}
```

**Returns:** `object` - Queue data  
**Throws:** Error if phone not found  
**Accepts:** Exact match or last 7 digits

---

### updateQueueStatus(queueId, updates)
Update queue (admin only).

```javascript
import { updateQueueStatus } from '@/services/queueService';

await updateQueueStatus('queue_abc123', {
  estimatedWaitTime: 25,
  currentSize: 6
});
```

**Parameters:**
- `queueId`: Queue identifier
- `updates`: Object with fields to update

---

### deleteQueueEntry(queueId, customerId)
Remove customer from queue.

```javascript
import { deleteQueueEntry } from '@/services/queueService';

await deleteQueueEntry('queue_abc123', 'cust_001');
```

---

## ✔️ Validation Functions

All validation functions in `src/services/backendFunctions.js`

### validateName(name)
```javascript
import { validateName } from '@/services/backendFunctions';

const result = validateName('John Doe');
// { valid: true, message: '' }

const result = validateName('J'); // Too short
// { valid: false, message: 'Name must be 2-50 characters' }
```

**Rules:** 2-50 characters, not empty

---

### validatePhone(phone)
```javascript
import { validatePhone } from '@/services/backendFunctions';

const result = validatePhone('1234567890');
// { valid: true, message: '' }

const result = validatePhone('123456789'); // 9 digits
// { valid: false, message: 'Phone must be exactly 10 digits' }
```

**Rules:** Exactly 10 digits, numeric only

---

### validatePartySize(partySize)
```javascript
import { validatePartySize } from '@/services/backendFunctions';

const result = validatePartySize(4);
// { valid: true, message: '' }

const result = validatePartySize(25); // Too large
// { valid: false, message: 'Party size must be 1-20 people' }
```

**Rules:** 1-20 people

---

### validateJoinQueueForm(name, phone, partySize)
Validate entire form at once.

```javascript
import { validateJoinQueueForm } from '@/services/backendFunctions';

const result = validateJoinQueueForm('John Doe', '1234567890', 2);
// { valid: true, message: '' }

const result = validateJoinQueueForm('J', '123', '25');
// { valid: false, message: 'Name must be 2-50 characters' }
// (Stops at first error)
```

**Returns:** `{ valid: boolean, message: string }`  
**Behavior:** Stops validation at first error

---

## 💾 localStorage API

### Save Queue Reference
```javascript
const savedQueues = JSON.parse(localStorage.getItem('savedQueues')) || [];
savedQueues.push({
  id: 'queue_abc123',
  name: 'McDonald\'s',
  phone: '1234567890',
  joinedAt: Date.now()
});
localStorage.setItem('savedQueues', JSON.stringify(savedQueues));
```

### Retrieve Saved Queues
```javascript
const savedQueues = JSON.parse(localStorage.getItem('savedQueues')) || [];
console.log('Saved queues:', savedQueues);
```

### Clear All Saved Queues
```javascript
localStorage.removeItem('savedQueues');
```

### Admin Authentication Storage
```javascript
// After successful login
localStorage.setItem('adminAuth', 'true');

// After logout
localStorage.removeItem('adminAuth');

// Check login status
const isLoggedIn = localStorage.getItem('adminAuth') === 'true';
```

---

## 🔔 Notifications

### Browser Notification
```javascript
import { sendBrowserNotification } from '@/services/notificationService';

sendBrowserNotification('Your turn is coming!', {
  icon: 'notification-icon.png'
});
```

### Play Alert Sound
```javascript
import { playNotificationSound } from '@/services/notificationService';

playNotificationSound();
```

---

## 📁 Project Structure

```
src/
├── components/
│   ├── Navigation.jsx          # Top navbar with menu
│   ├── ProtectedAdminRoute.jsx # Admin route protection
│   └── Navigation.css
├── context/
│   └── AdminAuthContext.jsx    # Global auth state
├── pages/
│   ├── pages.css
│   ├── admin/
│   │   ├── AdminLogin.jsx      # Admin login form
│   │   └── Dashboard.jsx       # Admin management panel
│   └── customer/
│       ├── Join.jsx            # Join queue form
│       ├── Status.jsx          # Real-time position tracker
│       └── MyQueue.jsx         # Retrieve saved queues
├── services/
│   ├── queueService.js         # Firebase Realtime DB ops
│   ├── backendFunctions.js     # Validation & utilities
│   └── notificationService.js  # Notifications & alerts
├── App.jsx                     # Router configuration
├── main.jsx                    # App entry point
└── firebaseConfig.js           # Firebase initialization
```

---

## 🔥 Firebase Database Structure

```
queues/
  queue_abc123/
    name: "McDonald's"
    location: "Downtown"
    estimatedWaitTime: 20
    currentSize: 5
    customers/
      cust_001/
        name: "John Doe"
        phone: "1234567890"
        partySize: 2
        joinedAt: 1700000000000
        status: "active"
```

---

## ⚙️ Environment Variables (.env.local)

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## 🎨 Component Props & State

### Join.jsx
```javascript
// No props needed
<Join /> 

// Internal state:
const [name, setName] = useState('');
const [phone, setPhone] = useState('');
const [partySize, setPartySize] = useState('');
const [loading, setLoading] = useState(false);
const [queueId, setQueueId] = useState('');
```

### Status.jsx
```javascript
// Required prop:
<Status params={{ queueId: 'queue_abc123' }} />

// Shows real-time:
// - Current position
// - Wait time estimate
// - Customer details
// - Auto-save to localStorage
```

### MyQueue.jsx
```javascript
// No props needed
<MyQueue />

// Features:
// - Load saved queues from localStorage
// - Search by Queue ID
// - Search by phone number
// - View, navigate, or delete
```

### Dashboard.jsx (Admin)
```javascript
// Protected by ProtectedAdminRoute
<ProtectedAdminRoute>
  <Dashboard />
</ProtectedAdminRoute>

// Shows:
// - All active queues
// - Queue statistics
// - Manual position adjustment
// - Customer management
```

---

## 🧠 Common Tasks

### Join a Queue (Customer)
1. Navigate to `/customer/join`
2. Enter: Name (2-50 chars), Phone (10 digits), Party Size (1-20)
3. Click "Join Queue"
4. Get Queue ID
5. Automatically saves to localStorage

### Track Queue Position (Customer)
1. Navigate to `/customer/status/{queueId}`
2. See real-time position updates
3. Get browser notification when turn is approaching
4. Position auto-updates via Firebase real-time listener

### Retrieve Saved Queue (Customer)
1. Navigate to `/customer/my-queue`
2. Search by: Queue ID (exact match) OR Phone (10 digits)
3. View saved queues list
4. Click "View Status" to track
5. Click "Remove" to delete from saved

### Login as Admin
1. Navigate to `/admin/login`
2. Enter password: `admin123`
3. Click "Login"
4. Redirects to `/admin/dashboard`

### Manage Queues (Admin)
1. Already on `/admin/dashboard`
2. View all active queues
3. Advance customer position
4. See real-time statistics
5. Remove customers from queue

---

## 📞 Phone Number Validation

**Format:** Exactly 10 numeric digits  
**Examples:**
- ✅ Valid: `1234567890`, `9876543210`, `5551234567`
- ❌ Invalid: `123456789` (9 digits), `12345678901` (11 digits), `123-456-7890` (hyphens), `(123) 456-7890` (formatting)

**In Join.jsx:**
- Input automatically removes non-numeric characters
- Limits to 10 digits maximum
- Green checkmark when valid
- Red indicator when incomplete
- Button disabled until exactly 10 digits

---

## 🆘 Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `TypeError: Cannot read property 'trim'` | searchQueueByPhone received undefined | Check phone parameter is string |
| `PERMISSION_DENIED` Firebase error | Database rules don't allow access | Check Firebase Realtime DB rules |
| "Queue not found" | Queue deleted or wrong ID | Verify queue exists in dashboard |
| Blank screen | Missing .env.local or API key invalid | Copy correct Firebase credentials |
| Phone input accepts letters | Validation not working | Ensure handlePhoneChange() filters input |
| Can't login as admin | Wrong password | Default is `admin123` |
| Notifications not appearing | Browser permission denied | Enable notifications in browser settings |

---

## 📚 Further Reading

- **[PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md)** - Complete technical details
- **[README.md](./README.md)** - Features overview
- **[API_REFERENCE.md](./API_REFERENCE.md)** - Detailed function reference
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Installation instructions

---

## ✏️ Tips & Best Practices

1. **Always call unsubscribe()** on Firebase listeners to prevent memory leaks
2. **Validate input** - Use validation functions from `backendFunctions.js`
3. **Handle errors** - Wrap Firebase calls in try/catch blocks
4. **Check auth status** - Use `useAdminAuth()` before rendering admin pages
5. **Save to localStorage** - Queue IDs for user convenience
6. **Test on mobile** - Use IP address method in SETUP_GUIDE.md
7. **Monitor Firebase usage** - Free tier has limits on simultaneous connections

---

**Last Updated:** 2024  
**Version:** 1.0.0

## 🚀 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open browser
# http://localhost:5173
```

---

## 📍 Routes

| Route | Purpose |
|-------|---------|
| `/` | Redirects to `/customer/join` |
| `/customer/join` | Customer joins queue |
| `/customer/status/:queueId` | Track queue position |
| `/admin/dashboard` | Admin dashboard |

---

## 🎯 Core Services

### Queue Service
```javascript
import { 
  joinQueue,
  getQueueStatus,
  subscribeToQueueStatus,
  subscribeToQueueList,
  updateQueueStatus,
  getDailyStats,
  getCompletionHistory
} from './services/queueService'
```

### Notifications
```javascript
import { 
  sendBrowserNotification,
  playNotificationSound,
  showToast,
  requestNotificationPermission
} from './services/notificationService'
```

### Validation
```javascript
import {
  validateName,
  validatePhone,
  validatePartySize,
  validateStatus,
  formatTime,
  formatDate,
  calculateWaitTime
} from './services/backendFunctions'
```

---

## 💻 Component Files

### Pages
- `src/pages/customer/Join.jsx` - Join queue form
- `src/pages/customer/Status.jsx` - Position tracking
- `src/pages/admin/Dashboard.jsx` - Admin panel

### Components
- `src/components/Navigation.jsx` - Navigation bar

### Styles
- `src/index.css` - Global styles
- `src/App.css` - App layout
- `src/pages/pages.css` - Page styles
- `src/components/Navigation.css` - Nav styles

---

## 🔥 Firebase Setup

1. **Check `.env` file:**
   ```
   VITE_FIREBASE_API_KEY=your_key
   VITE_FIREBASE_PROJECT_ID=your_project_id
   etc.
   ```

2. **Create Firebase Realtime Database:**
   - Go to Firebase Console
   - Enable Realtime Database
   - Create `settings/config/averageServingTime: 5`

3. **Database Rules (test mode):**
   ```json
   {
     "rules": {
       "queues": { ".read": true, ".write": true },
       "settings": { ".read": true, ".write": false }
     }
   }
   ```

---

## 📊 Database Structure

```
queues/
└── {auto_id}
    ├── name: "John"
    ├── phone: "+1234567890"
    ├── partySize: 4
    ├── status: "waiting"
    ├── position: 1
    ├── createdAt: timestamp
    ├── servedAt: timestamp
    ├── completedAt: timestamp
    └── updatedAt: timestamp

settings/
└── config/
    └── averageServingTime: 5
```

---

## 🎨 Styling Colors

```css
Primary: #667eea (Purple)
Secondary: #764ba2 (Purple)
Success: #27ae60 (Green)
Warning: #ff9800 (Orange)
Error: #e74c3c (Red)
Background: #ecf0f1 (Light Gray)
Text: #2c3e50 (Dark Gray)
```

---

## 🔧 Common Tasks

### Add Customer to Queue
```javascript
const queueId = await joinQueue("John Doe", 4, "+1234567890");
navigate(`/customer/status/${queueId}`);
```

### Get Real-Time Queue
```javascript
const unsubscribe = subscribeToQueueList((queues) => {
  setQueues(queues);
});
// Later: unsubscribe();
```

### Mark Customer as Served
```javascript
await updateQueueStatus(queueId, "serving");
```

### Notify Customer
```javascript
sendBrowserNotification("Your Turn!", {
  body: "You're up next!"
});
playNotificationSound();
```

### Show Toast
```javascript
showToast("Successfully joined queue!", "success");
```

---

## 🐛 Troubleshooting

### White Screen
- Check `.env` has `VITE_` prefix
- Restart dev server
- Check console (F12)

### Firebase Error
- Verify `.env` credentials
- Check Realtime Database is enabled
- Check database rules

### Notifications Don't Work
- Allow browser notifications
- Use HTTPS in production
- Check browser permission

### Position Not Updating
- Check real-time listener is active
- Verify database has data
- Check connection in DevTools

---

## 📝 Environment Variables

```env
VITE_FIREBASE_API_KEY=key
VITE_FIREBASE_AUTH_DOMAIN=domain
VITE_FIREBASE_DATABASE_URL=url
VITE_FIREBASE_PROJECT_ID=id
VITE_FIREBASE_STORAGE_BUCKET=bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=id
VITE_FIREBASE_APP_ID=id
```

Copy from Firebase Console → Project Settings → Your apps → Web

---

## 🚢 Deployment

### Build
```bash
npm run build
```

### Preview
```bash
npm run preview
```

### Deploy to Firebase
```bash
npm install -g firebase-tools
firebase login
firebase deploy
```

---

## 📱 Responsive Breakpoints

```css
Mobile: < 480px
Tablet: 480px - 768px
Desktop: > 768px
```

---

## ⌚ Real-Time Updates

Listeners auto-update when Firebase data changes:
- Position updates
- Status changes
- New customers join
- Statistics refresh

**Always unsubscribe on unmount:**
```javascript
useEffect(() => {
  const unsubscribe = subscribe(callback);
  return () => unsubscribe();
}, []);
```

---

## 📚 Documentation Files

- `PROJECT_DOCUMENTATION.md` - Complete guide
- `SETUP_GUIDE.md` - Quick start
- `API_REFERENCE.md` - Detailed API docs
- `BUILD_SUMMARY.md` - What was built
- `README.md` - Original project info

---

## ✅ Testing Checklist

- [ ] Customer can join queue
- [ ] Position shows correctly
- [ ] Admin can see queue
- [ ] Admin can update status
- [ ] Statistics update
- [ ] Notifications work
- [ ] Mobile responsive
- [ ] No console errors

---

## 🎯 Key Files to Modify

### Customize Brand
- `src/components/Navigation.jsx` - Change app name

### Change Colors
- `src/index.css` - Update color values

### Add Features
- `src/services/queueService.js` - Add new functions
- `src/pages/*/` - Create new pages
- `src/App.jsx` - Add new routes

### Modify Validation
- `src/services/backendFunctions.js` - Update validators

---

## 💡 Tips

1. **Always restart server** after `.env` changes
2. **Check console** (F12) for error messages
3. **Use DevTools** Network tab for Firebase issues
4. **Test mobile** with F12 device emulation
5. **Backup `.env`** before changes

---

## 🔗 Links

- [Firebase Console](https://console.firebase.google.com)
- [Vite Dev Server](http://localhost:5173)
- [React Docs](https://react.dev)
- [React Router](https://reactrouter.com)
- [Firebase Docs](https://firebase.google.com/docs)

---

**Status:** ✅ Production Ready  
**Last Updated:** December 2024  
**Version:** 1.0.0
