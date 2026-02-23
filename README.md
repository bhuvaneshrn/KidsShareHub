🤝 KidShare Hub
A Community Sharing & Exchange Platform for Students Aged 7–25
A full-stack community marketplace built for school and college campuses — enabling students to list, request, exchange items, and book turf slots in a safe, trust-verified environment.

🏛️ Project Vision
Aligned with the growing need for sustainable peer-to-peer sharing in educational institutions, KidShare Hub serves as a digital bridge between students who have resources and those who need them. The platform promotes a circular economy mindset — reducing waste, encouraging collaboration, and building community trust through technology.
Built as part of a campus innovation prototype, KidShare Hub demonstrates how modern web technologies can solve real student problems: from finding an affordable textbook to booking a football turf slot — all within a verified, safe ecosystem.

🚀 Key Features
1. 🔐 Authentication & Roles
Signup with name, age (7–25), email, password, and role selection
Firebase Authentication with Firestore profile storage
Role-based access control: Student and Admin
Admin banner and elevated privileges for moderation

2. 🏪 Community Dashboard
Real-time item feed powered by Firestore onSnapshot listeners
Category filters: Books, Games, Sports
Live item status badges: Available, Pending, Completed
Admin can delete any listing; owners can manage their own

3. ➕ Item Listing System
List items with name, category, condition, type, and optional image
Listing types: Sell / Rent / Exchange / Free
Status auto-set to Available on creation

4. 🤝 Request & Exchange System
Students can request any available item
Owner receives the request and can Accept or Reject
Full status lifecycle: Pending → Accepted → Completed
Dual confirmation required before marking an exchange complete

5. 🛡️ Safety & Trust System
Safe Zones — Admin-approved campus meetup locations (Library, Canteen, etc.)
Meeting Code — Auto-generated 6-digit OTP verified at the meetup
Dual Confirmation — Both parties must confirm before completion
Report System — Flag issues like no-show, payment disputes, unsafe behaviour
Trust Badges — 🆕 New Member / ⚠️ Low Trust / ✅ Trusted based on rating history

6. 🏟️ Turf Booking System
3 admin-managed turfs: Turf A, Turf B, Turf C
Fixed time slots: 3:00 PM – 6:00 PM (hourly)
Real-time slot availability — booked slots marked 🔴 and locked
Purpose of booking required for accountability
Admin dashboard to view and cancel all bookings

7. ⭐ Rating & Reputation System
Rate users (1–5 stars) after every completed exchange
Ratings stored in Firestore and averaged on profile
Trust badges dynamically calculated from rating history
Displayed prominently on the My Activity profile card

8. 🛡️ Admin Control Panel
Delete any listing from the dashboard
View and cancel all turf bookings
Review flagged reports from students
Admin identity shown across the app with a persistent banner

📦 Installation & Setup
1. Clone the Repository
bashgit clone https://github.com/your-username/kidshare-hub.git
cd kidshare-hub
2. Install Dependencies
npm install
3. Configure Environment Variables
Copy the example env file and fill in your Firebase credentials:
bashcp .env.example .env
Edit .env with your actual Firebase project values:
envREACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
4. Start Development Server
npm start
App runs at http://localhost:3000
5. Production Build
npm run build

🔥 Firebase Setup
Go to https://console.firebase.google.com
Create a new project → Register a Web App → copy firebaseConfig
Enable Authentication → Email/Password
Create Firestore Database in test mode
Paste credentials into your .env file

🔮 Future Improvements
FeatureDescription💬 In-app ChatReal-time messaging between requester and owner📱 React Native AppMobile version reusing the same Firebase backend💳 Payment EscrowRazorpay integration — funds held until both parties confirm🔔 Push NotificationsAlerts on request acceptance and slot availability🔍 Search BarSearch listings by keyword or item name📊 Admin AnalyticsDashboard showing users, bookings, reports, and trends🪪 Phone VerificationOTP at signup for stronger identity verification🗺️ Google MapsVisual map showing safe meetup zones on campus

💡 "Share more. Waste less. Trust the process."
