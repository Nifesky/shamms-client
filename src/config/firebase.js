import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDYYcuzTBp2eXNHAXiUsG1IqHIPN2FcKTU",
  authDomain: "shamms-a2175.firebaseapp.com",
  projectId: "shamms-a2175",
  storageBucket: "shamms-a2175.firebasestorage.app",
  messagingSenderId: "534468022996",
  appId: "1:534468022996:web:9b78e8fe15e233e6d3e141"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);