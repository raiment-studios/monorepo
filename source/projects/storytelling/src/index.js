import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: 'AIzaSyAYEQvVsW4nmbXWLVYFGoZ0xRbnC6g1Bjk',
    authDomain: 'raiment-8c8fb.firebaseapp.com',
    projectId: 'raiment-8c8fb',
    storageBucket: 'raiment-8c8fb.appspot.com',
    messagingSenderId: '435166022787',
    appId: '1:435166022787:web:6040274a425a933f9d9fb6',
    measurementId: 'G-0BC9RJ53SP',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

console.log(app);
