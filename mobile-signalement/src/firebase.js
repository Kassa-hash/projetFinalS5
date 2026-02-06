import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBxTuYtxj32_aY9NlTJuhiGcFkBpI0syRI",
  authDomain: "cloud-807c9.firebaseapp.com",
  projectId: "cloud-807c9",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
