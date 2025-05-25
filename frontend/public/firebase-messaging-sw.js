importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDJzyhnHPkWVYzw38CuLBvj0d9syMTf6uw",
  authDomain: "medic-mamy.firebaseapp.com",
  projectId: "medic-mamy",
  messagingSenderId: "90914528083",
  appId: "1:90914528083:web:84e9a65d36da88b359dfa6",
});

const messaging = firebase.messaging();