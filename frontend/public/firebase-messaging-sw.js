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
// If you would like to customize notifications that are received in the
// background (Web app is closed or not in browser focus) then you should
// implement this optional method.
// Keep in mind that FCM will still show notification messages automatically 
// and you should use data messages for custom notifications.
// For more info see: 
// https://firebase.google.com/docs/cloud-messaging/concept-options
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = 'Background Message Title';
  const notificationOptions = {
    body: 'Background Message body.',
    icon: '/img/logo.svg'
  };

  self.registration.showNotification(notificationTitle,
    notificationOptions);
});