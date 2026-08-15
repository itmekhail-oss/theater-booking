// =========================================
// Firebase Imports
// =========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
    getFirestore,
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    setDoc,
    updateDoc,
    writeBatch,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

// =========================================
// Firebase Configuration
// =========================================

const firebaseConfig = {
    apiKey: "AIzaSyC7AxGT7c3qfVmkzAaPmSFCdjqhpbgEgn0",
    authDomain: "theater-booking-a4304.firebaseapp.com",
    projectId: "theater-booking-a4304",
    storageBucket: "theater-booking-a4304.firebasestorage.app",
    messagingSenderId: "280153451803",
    appId: "1:280153451803:web:786cb35c22285cda9577be",
    measurementId: "G-LW7PMSTW4N"
};


// =========================================
// Initialize Firebase
// =========================================

const app = initializeApp(firebaseConfig);

// تطبيق Auth ثانوي لإنشاء مستخدمين من لوحة الإدارة بدون تسجيل خروج المدير.
const userCreatorApp = initializeApp(firebaseConfig, "userCreatorApp");
const userCreatorAuth = getAuth(userCreatorApp);


// =========================================
// Firestore
// =========================================

export const db = getFirestore(app);


// =========================================
// Authentication
// =========================================

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();


// =========================================
// Admin Email
// =========================================

export const ADMIN_EMAILS = [
    "it.mekhail@gmail.com",
    "mekhail.morcos@yahoo.com"
];

export { firebaseConfig };

export async function createManagedUser(email, password) {
    const result = await createUserWithEmailAndPassword(userCreatorAuth, email, password);
    try { await signOut(userCreatorAuth); } catch {}
    return result.user;
}


// =========================================
// Firestore Exports
// =========================================

export {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    setDoc,
    updateDoc,
    writeBatch,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp
};


// =========================================
// Authentication Exports
// =========================================

export {
    signInWithPopup,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    createUserWithEmailAndPassword
};
