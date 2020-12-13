// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG)
// Initialize Firebase
firebase.initializeApp(firebaseConfig)
firebase.analytics()
