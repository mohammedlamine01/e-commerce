import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import admin from "firebase-admin";

const firebaseConfig = {
  apiKey: "AIzaSyAoCIHBSwBpre2kfyF8teTKkRdRZyeLl9E",
  authDomain: "webapp-ce0ce.firebaseapp.com",
  projectId: "webapp-ce0ce",
  storageBucket: "webapp-ce0ce.appspot.com",
  messagingSenderId: "389804133548",
  appId: "1:389804133548:web:af04ba2bbc64afa969e309",
};

const app = initializeApp(firebaseConfig);
export const clientDb = getFirestore(app);

let adminDb;
let bucket;

try {
  if (!process.env.FIREBASE_KEY) {
    throw new Error("FIREBASE_KEY environment variable is missing.");
  }

  const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: firebaseConfig.storageBucket,
  });

  adminDb = admin.firestore();
  bucket = admin.storage().bucket();
  console.log("Firebase Admin SDK initialized successfully.");

} catch (error) {
  console.error(
    "Error initializing Firebase Admin SDK. Please configure the FIREBASE_KEY environment variable.",
    error.message
  );
  // Provide a mock db object in case of an error to avoid crashing the app
  adminDb = {
    collection: () => ({
      add: () =>
        Promise.reject(
          new Error("Firestore is not initialized. Check your configuration.")
        ),
    }),
  };
  bucket = null;
}

export { adminDb as db, bucket };