import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBVatKVTnrF_ZSXxMUder3Kuev9A-U4Nrg",
  authDomain: "trd20-1f99a.firebaseapp.com",
  projectId: "trd20-1f99a",
  storageBucket: "trd20-1f99a.firebasestorage.app",
  messagingSenderId: "523221324751",
  appId: "1:523221324751:web:8738a48952521a9a92b8ba",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Storage
export const storage = getStorage(app);

export default app;
