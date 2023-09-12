// This file exists so that the old custom service worker at /service-worker.js is cleaned up and the new workbox sw.js can take over.

self.addEventListener('install', function (e) {
    //override old service worker
    self.skipWaiting();
});


self.addEventListener('activate', function (e) {

    //delete all caches
    caches.keys().then(function(names) {
        for (let name of names)
            caches.delete(name);
    });

    //unregister self, then reload
    self.registration.unregister()
        .then(function () {
            return self.clients.matchAll();
        })
        .then(function (clients) {
            clients.forEach(client => {
                console.log(`Navigating ${client.url}`)
                client.navigate(client.url)
            })
        });
});