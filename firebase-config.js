// firebase-config.js
// ============================================
// Firebase Configuration for Ty's Food Spot
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import { getFirestore, collection, doc, getDocs, getDoc, addDoc, setDoc, deleteDoc, updateDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAPAUXcZLQizbTTHaq4XNiAMuGvJnF-MjU",
  authDomain: "tyfoodspot.firebaseapp.com",
  projectId: "tyfoodspot",
  storageBucket: "tyfoodspot.firebasestorage.app",
  messagingSenderId: "673735500493",
  appId: "1:673735500493:web:73c562e76c58dd646bff84",
  measurementId: "G-1HQ36YLXWX"
};

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Collection references
export const mealsRef = collection(db, "meals");
export const galleryRef = collection(db, "gallery");
export const extrasRef = collection(db, "extras");
export const sidesRef = collection(db, "sides");

export { collection, doc, getDocs, getDoc, addDoc, setDoc, deleteDoc, updateDoc, onSnapshot, query, orderBy, ref, uploadBytes, getDownloadURL };