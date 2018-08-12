// This file will handle the installed service worker
// Add all cache-worthy resources here

importScripts('cache-polyfill.js');

self.addEventListener('install', function(e) {
	e.waitUntil(
		caches.open('Omega').then(function(cache) {
			return cache.addAll([
				'index.html',
				'icons/48.png',
				'icons/72.png',
				'icons/96.png',
				'icons/144.png',
				'icons/192.png',
				'icons/512.png'
			]);
		})
	);
});

self.addEventListener('fetch', function(event) {
	console.log(event.request.url);
	event.respondWith(
		caches.match(event.request).then(function(response) {
			return response || fetch(event.request);
		})
	);
});
