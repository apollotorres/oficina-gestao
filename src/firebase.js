import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  projectId: "oficina-gestao-5412",
  appId: "1:548571870947:web:d34e765eb28920736bf7d6",
  storageBucket: "oficina-gestao-5412.firebasestorage.app",
  apiKey: "AIzaSyB5RA8YUSRxTIqcSJGWRpMT9Jj16NS6FbQ",
  authDomain: "oficina-gestao-5412.firebaseapp.com",
  messagingSenderId: "548571870947",
  projectNumber: "548571870947"
};

export const app = initializeApp(firebaseConfig);
export const firestore = getFirestore(app);

