
// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  onSnapshot,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Your Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCoqYoEqgPiMVnsC2xeARhyDdfOYPWwiLM",
  authDomain: "obs-cricket-scoreboard.firebaseapp.com",
  projectId: "obs-cricket-scoreboard",
  storageBucket: "obs-cricket-scoreboard.firebasestorage.app",
  messagingSenderId: "593318975208",
  appId: "1:593318975208:web:507301f084c1f838c21b5d",
  measurementId: "G-JBDGWMSZNF"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, doc, getDoc, onSnapshot, updateDoc };
