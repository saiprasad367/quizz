import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getAnalytics, isSupported } from "firebase/analytics"

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCxmDyem_zAmBkEvE9BNZgVi6SAFCl5-fY",
  authDomain: "quizz-1bc7f.firebaseapp.com",
  projectId: "quizz-1bc7f",
  storageBucket: "quizz-1bc7f.firebasestorage.app",
  messagingSenderId: "177863753134",
  appId: "1:177863753134:web:8223065c7eab3b06501c3f",
  measurementId: "G-VZ2RX7G964",
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
const auth = getAuth(app)
const db = getFirestore(app)

// Initialize Analytics conditionally (only in browser)
let analytics = null
if (typeof window !== "undefined") {
  isSupported().then((yes) => yes && (analytics = getAnalytics(app)))
}

export { app, auth, db, analytics }

