import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

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

// Path to your service account key file
const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");

let adminDb;

try {
  const serviceAccount = require(serviceAccountPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  adminDb = admin.firestore();
  console.log("Firebase Admin SDK initialized successfully.");

} catch (error) {
  console.error(
    "Error initializing Firebase Admin SDK. Make sure 'serviceAccountKey.json' exists and is valid.",
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
}

export { adminDb as db };