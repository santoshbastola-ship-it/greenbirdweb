importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSy...",
    authDomain: "greenbirdhomestead-cloud.firebaseapp.com",
    projectId: "greenbirdhomestead-cloud",
    storageBucket: "greenbirdhomestead-cloud.appspot.com",
    messagingSenderId: "338804680879",
    appId: "1:338804680879:web:1ed1c3725661138400490b",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/icons/icon-192x192.png',
        data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
