# 🔧 Setup Guide - Queue Management System

Complete installation and configuration guide for the Real-Time Queue Management Web Application.

---

## 📋 Prerequisites

Before starting, ensure you have:

1. **Node.js 16+** - [Download here](https://nodejs.org/)
   - Check: `node --version` (should be v16.0.0 or higher)
   - Includes npm automatically

2. **Firebase Account** - [Create free account](https://firebase.google.com/)
   - Free tier includes Realtime Database with 100 simultaneous connections

3. **Text Editor/IDE** - VS Code recommended
   - [Download VS Code](https://code.visualstudio.com/)

4. **Git** (optional, for cloning) - [Download here](https://git-scm.com/)

---

## 🚀 Step 1: Clone or Download Project

**Option A: Using Git**
```bash
git clone <repository-url>
cd Queue_Management
```

**Option B: Manual Download**
1. Download project files
2. Extract to desired location
3. Open terminal in project folder

---

## 📦 Step 2: Install Dependencies

Run the following command in project directory:

```bash
npm install
```

This installs:
- React 19.2.0
- React Router 7.10.1
- Vite 7.2.4 (build tool)
- Firebase SDK
- ESLint (code quality)

**Expected output:**
```
added XXX packages in X.XXs
```

---

## 🔐 Step 3: Firebase Realtime Database Setup

### 3.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `Queue_Management`
4. Click "Create project"
5. Wait for Firebase to initialize (1-2 minutes)

### 3.2 Set Up Realtime Database

**⚠️ IMPORTANT: Use Realtime Database, NOT Firestore**

1. In Firebase Console, go to **Build** → **Realtime Database**
2. Click "Create Database"
3. Select region closest to you
4. Choose **Start in test mode** (for development)
5. Click "Enable"

**Your database URL will look like:**
```
https://queue-management-xxxxx.firebaseio.com
```

Save this URL - you'll need it for `.env` file.

### 3.3 Get Firebase Credentials

1. In Firebase Console, click ⚙️ **Settings** → **Project Settings**
2. Go to **Service Accounts** tab
3. Click **Generate New Private Key**
4. Download the JSON file (keep it safe!)
5. Open the JSON file and find these values:

```json
{
  "apiKey": "YOUR_API_KEY",
  "authDomain": "YOUR_PROJECT_ID.firebaseapp.com",
  "databaseURL": "https://YOUR_PROJECT_ID.firebaseio.com",
  "projectId": "YOUR_PROJECT_ID",
  "storageBucket": "YOUR_PROJECT_ID.appspot.com",
  "messagingSenderId": "YOUR_MESSAGING_SENDER_ID",
  "appId": "YOUR_APP_ID"
}
```

**Also get your API Key:**
1. Go to **Build** → **Authentication** → **Web API Key**
2. Or use the `apiKey` from the service account JSON

---

## 🔑 Step 4: Configure Environment Variables

1. In project root directory, create file: `.env.local`

2. Add Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

3. **Replace each value** with actual Firebase credentials from Step 3.3

**⚠️ Important Security Notes:**
- Never commit `.env.local` to Git
- `.env.local` is already in `.gitignore`
- Each developer should have their own `.env.local`
- For production, use environment secrets in hosting platform

---

## 📊 Step 5: Configure Firebase Realtime Database Rules

**These rules are CRITICAL for proper operation**

1. In Firebase Console, go to **Realtime Database** → **Rules** tab

2. Replace all rules with this JSON:

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

**What these rules do:**
- `queues`: Anyone can read (public queues), authenticated users can write
- `settings`: Read-only (configuration data)
- All other paths: No access (protected)

3. Click "Publish" to save rules

---

## 📝 Step 6: Initialize Database Data

### 6.1 Create Initial Queues (Optional)

In Firebase Console, manually add sample queues:

1. Go to **Realtime Database** → **Data** tab
2. Click the `+` button next to "queues"
3. Add sample queue:

```json
{
  "name": "McDonald's Main",
  "location": "Downtown",
  "capacity": 50,
  "currentSize": 2,
  "estimatedWaitTime": 15,
  "createdAt": 1700000000000,
  "customers": {
    "cust_001": {
      "name": "John Doe",
      "phone": "1234567890",
      "partySize": 2,
      "joinedAt": 1700000000000,
      "status": "active"
    }
  }
}
```

### 6.2 Initialize Settings

Add application settings:

1. Click `+` next to database root
2. Create "settings" node:

```json
{
  "adminPassword": "admin123",
  "appName": "Queue Management System",
  "version": "1.0.0"
}
```

---

## ▶️ Step 7: Start Development Server

Run the development server:

```bash
npm run dev
```

**Expected output:**
```
  VITE v7.2.4  ready in XXX ms

  ➜  Local:   http://localhost:5174/
  ➜  press h to show help
```

---

## 🌐 Step 8: Access the Application

1. Open browser and go to: `http://localhost:5174/`
2. You should see the Queue Management System homepage
3. Try joining a queue as a customer

---

## 🧪 Step 9: Verify Everything Works

### Test Customer Features:
1. Click "Join Queue"
2. Enter name, phone (10 digits), party size
3. ✅ Should see joining animation
4. ✅ Should get Queue ID
5. ✅ Should see real-time position
6. Go to "My Queue" → Search by ID you just got
7. ✅ Should retrieve your queue

### Test Admin Features:
1. Click "🔐 Admin Login"
2. Enter password: `admin123`
3. ✅ Should see admin dashboard
4. ✅ Should see all active queues
5. ✅ Should see "Logout" button in navbar

### Test Phone Number Search:
1. Note a phone number from an active queue
2. Go to "My Queue" → "📞 Phone Number" tab
3. Enter the phone number (10 digits)
4. ✅ Should find and display queue

### Test Notifications:
1. Stay in "Status" page of a queue
2. In another browser tab, go to Admin Dashboard
3. Advance that queue position
4. ✅ Original tab should show notification alert

---

## 🔑 Important Configuration Values

### Default Admin Password
```javascript
// Location: src/context/AdminAuthContext.jsx (line 15)
const ADMIN_PASSWORD = 'admin123';
```

**To change admin password:**
1. Edit `src/context/AdminAuthContext.jsx`
2. Change line 15: `const ADMIN_PASSWORD = 'your_new_password';`
3. Save and restart dev server

### Database Paths
```
/queues/{queueId}
  - name: string
  - location: string
  - estimatedWaitTime: number (minutes)
  - currentSize: number
  - customers: object (customer data)

/settings
  - adminPassword: string
  - appName: string
  - version: string
```

### localStorage Keys
```javascript
// Saved queues (customer side)
localStorage.getItem('savedQueues') // Array of queue objects

// Admin authentication status
localStorage.getItem('adminAuth') // 'true' or null
```

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 5174 already in use | Run `npm run dev -- --port 5175` |
| Firebase credentials error | Check `.env.local` has correct values with no extra spaces |
| "CORS error" from Firebase | Check database URL matches Firebase Console |
| App shows blank white screen | Open DevTools (F12) and check Console tab for errors |
| Can't join queue (stuck loading) | Verify Firebase Realtime Database is enabled (not Firestore) |
| Admin login doesn't work | Check password in `AdminAuthContext.jsx` is correct |
| Phone search returns "Not found" | Verify phone number in database matches format (10 digits) |
| No notifications appearing | Check browser notifications permission is enabled |
| Changes not appearing in real-time | Check Firebase database rules allow read access |

**Getting detailed error info:**
1. Open DevTools: Press `F12`
2. Go to **Console** tab
3. Look for red error messages
4. Screenshot and include in bug report

---

## 📱 Testing with Multiple Devices

To test on different devices (mobile, tablet):

1. Get your computer's IP address:
   ```bash
   # Windows PowerShell
   ipconfig | Select-String "IPv4"
   
   # Or use this IP
   hostname -I
   ```

2. Modify `vite.config.js`:
   ```javascript
   export default defineConfig({
     server: {
       host: '0.0.0.0', // Listen on all IPs
       port: 5174
     }
   })
   ```

3. On other device, go to: `http://YOUR_IP:5174/`

---

## 🚀 Ready for Production?

See [Deployment Guide](./DEPLOYMENT.md) for:
- Building for production (`npm run build`)
- Firebase Hosting deployment
- Environment variable setup in production
- Security best practices
- Performance optimization

---

## 📚 Next Steps

1. **Read [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md)** - Complete technical documentation
2. **Check [README.md](./README.md)** - Features overview and quick start
3. **Review [API_REFERENCE.md](./API_REFERENCE.md)** - Function signatures and examples

---

## ✅ Setup Complete!

Your Queue Management System is ready to use. Start with:
```bash
npm run dev
```

**Support:** Check troubleshooting section above or review PROJECT_DOCUMENTATION.md for detailed explanations.

**Version:** 1.0.0  
**Last Updated:** 2024

## Quick Start Guide

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Firebase
Your `.env` file is already configured with these variables:
```
VITE_FIREBASE_API_KEY=AIzaSyCgDTv6x2GqY9onrUi-Try8g6TBwcjiT_Y
VITE_FIREBASE_AUTH_DOMAIN=queue-management-b2104.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://queue-management-b2104-default-rtdb.asia-southeast1.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=queue-management-b2104
VITE_FIREBASE_STORAGE_BUCKET=queue-management-b2104.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=228245548904
VITE_FIREBASE_APP_ID=1:228245548904:web:a58897c25658915fccb0dd
```

### Step 3: Run Development Server
```bash
npm run dev
```

The application will start at `http://localhost:5173`

### Step 4: Test the Application

#### Customer Flow
1. Go to `/customer/join`
2. Enter your name, party size, and phone number
3. Click "Join Queue"
4. You'll be taken to status page showing your position
5. Enable notifications to get alerts

#### Admin Flow
1. Go to `/admin/dashboard`
2. View all customers in queue
3. Click "Serve" to start serving a customer
4. Click "Done" to complete service
5. View statistics and completion history

## Firebase Database Setup

### Enable Realtime Database
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project "queue-management-b2104"
3. Navigate to "Realtime Database"
4. Create database if not exists
5. Start in "Test mode" for development

### Create Initial Data
In Firebase Console, create this structure:
```
queues/           (auto-generated documents)
settings/
  └─ config
     └─ averageServingTime: 5
```

### Database Rules (For Development)
```json
{
  "rules": {
    "queues": {
      ".read": true,
      ".write": true
    },
    "settings": {
      ".read": true,
      ".write": false
    }
  }
}
```

## File Structure Overview

```
src/
├── pages/
│   ├── customer/
│   │   ├── Join.jsx          ← Customer join page
│   │   └── Status.jsx        ← Track queue position
│   ├── admin/
│   │   └── Dashboard.jsx     ← Admin management
│   └── pages.css             ← Page styling
├── services/
│   ├── queueService.js       ← Database operations
│   ├── notificationService.js← Alerts & notifications
│   └── backendFunctions.js   ← Validation & utilities
├── components/
│   ├── Navigation.jsx        ← Top navigation bar
│   └── Navigation.css
├── App.jsx                   ← Routes setup
└── firebaseConfig.js         ← Firebase init
```

## Important Notes

⚠️ **Firebase Configuration Variables**
- All variables use `VITE_` prefix (required for Vite)
- Never commit real credentials to public repos
- Restart dev server after changing `.env`

⚠️ **Database Structure**
- Collections: `queues`, `settings`
- Documents auto-generate in `queues` collection
- `settings/config` must exist with `averageServingTime`

⚠️ **Real-Time Updates**
- Uses Firebase `onSnapshot()` listeners
- Listeners auto-unsubscribe on component unmount
- Position updates automatically when someone completes

## Customization

### Change Average Serving Time
Edit in Firebase Console:
```
settings → config → averageServingTime: 5  (change to your value)
```

### Modify Colors
Edit `src/index.css` - Look for `:root` color variables:
```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
}
```

### Change Restaurant Name
Edit `src/components/Navigation.jsx`:
```jsx
<Link to="/" className="nav-logo">
  <span className="logo-icon">🍽️</span>
  Your Restaurant Name  {/* ← Change this */}
</Link>
```

## Common Issues & Solutions

### Issue: "Failed to resolve import firebase"
**Solution:** Run `npm install firebase`

### Issue: "Missing Firebase environment variables"
**Solution:** 
- Check `.env` file exists
- Verify variable names have `VITE_` prefix
- Restart dev server

### Issue: "Can't determine Firebase Database URL"
**Solution:** 
- Check `.env` has `VITE_FIREBASE_DATABASE_URL`
- Remove quotes from values in `.env`
- Restart server

### Issue: Notifications not working
**Solution:**
- Check browser notification permission
- Use HTTPS in production
- Check browser console for errors

### Issue: Real-time updates not working
**Solution:**
- Verify Firebase Realtime Database is enabled
- Check database rules allow read/write
- Check browser console for connection errors

## Building for Production

1. Create production build:
```bash
npm run build
```

2. Test production build locally:
```bash
npm run preview
```

3. Deploy to Firebase Hosting:
```bash
npm install -g firebase-tools
firebase login
firebase deploy
```

## Environment Variables Explained

| Variable | Purpose |
|----------|---------|
| VITE_FIREBASE_API_KEY | Authentication for API calls |
| VITE_FIREBASE_AUTH_DOMAIN | Firebase Auth domain |
| VITE_FIREBASE_DATABASE_URL | Real-time database endpoint |
| VITE_FIREBASE_PROJECT_ID | Identifies your Firebase project |
| VITE_FIREBASE_STORAGE_BUCKET | Cloud Storage bucket |
| VITE_FIREBASE_MESSAGING_SENDER_ID | FCM sender ID |
| VITE_FIREBASE_APP_ID | Unique app identifier |

## Testing Checklist

- [ ] Can join queue as customer
- [ ] Can see position and wait time
- [ ] Admin can view all customers
- [ ] Admin can mark customer as "Serving"
- [ ] Admin can mark customer as "Done"
- [ ] Position updates in real-time
- [ ] Statistics update correctly
- [ ] Notifications work (browser notifications)
- [ ] Page is responsive on mobile
- [ ] Can leave queue

## Next Steps

1. **For Production:**
   - Enable Firebase Authentication
   - Update database rules for security
   - Deploy to Firebase Hosting
   - Setup admin login

2. **For Features:**
   - Add SMS notifications
   - Add customer feedback
   - Add analytics dashboard
   - Multi-location support

3. **For Performance:**
   - Add database indexing
   - Implement caching
   - Optimize images
   - Minimize bundle size

## Support Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [React Router Documentation](https://reactrouter.com)
- [Vite Documentation](https://vitejs.dev)
- [Web Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)

---

**Happy Queue Managing! 🍽️**
