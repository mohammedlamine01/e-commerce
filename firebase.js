import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
const admin = require("firebase-admin");
const path = require("path");

const firebaseConfig = {
  apiKey: "AIzaSyAoCIHBSwBpre2kfyF8teTKkRdRZyeLl9E",
  authDomain: "webapp-ce0ce.firebaseapp.com",
  projectId: "webapp-ce0ce",
  storageBucket: "webapp-ce0ce.appspot.com",
  messagingSenderId: "389804133548",
  appId: "1:389804133548:web:af04ba2bbc64afa969e309",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Path to your service account key file
const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");

try {
  const serviceAccount = require(serviceAccountPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  const db = admin.firestore();
  console.log("Firebase Admin SDK initialized successfully.");

  module.exports = { db };
} catch (error) {
  console.error(
    "Error initializing Firebase Admin SDK. Make sure 'serviceAccountKey.json' exists and is valid.",
    error.message
  );
  // Provide a mock db object in case of an error to avoid crashing the app
  module.exports = {
    db: {
      collection: () => ({
        add: () =>
          Promise.reject(
            new Error("Firestore is not initialized. Check your configuration.")
          ),
      }),
    },
  };
}