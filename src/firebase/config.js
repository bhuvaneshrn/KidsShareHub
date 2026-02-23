import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCkdyf4akyNkna8LhuVHgGi37W4x8IKqtw",
  authDomain: "kidshare-hub.firebaseapp.com",
  projectId: "kidshare-hub",
  storageBucket: "kidshare-hub.firebasestorage.app",
  messagingSenderId: "770295938942",
  appId: "1:770295938942:web:c8edfffd67760a712a3d2f"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;