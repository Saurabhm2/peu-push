importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyD1NA7FETpU8ouWppQvZfl5YhnR208YxxA",
  authDomain: "puneexamupdate-fbefe.firebaseapp.com",
  projectId: "puneexamupdate-fbefe",
  storageBucket: "puneexamupdate-fbefe.firebasestorage.app",
  messagingSenderId: "316110951786",
  appId: "1:316110951786:web:a7e4c32a6e7331c7568113"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  const { title, body, icon } = payload.notification;
  self.registration.showNotification(title || 'Pune Exam Update', {
    body: body || 'New update!',
    icon: icon || 'https://www.puneexamupdate.in/favicon.ico',
    badge: 'https://www.puneexamupdate.in/favicon.ico',
    data: { url: payload.data?.url || 'https://www.puneexamupdate.in' },
    actions: [{ action: 'open', title: '📖 Read Now' }]
  });
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = event.notification.data?.url || 'https://www.puneexamupdate.in';
  event.waitUntil(clients.openWindow(url));
});
