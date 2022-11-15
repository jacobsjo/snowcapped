export type { };
declare const self: ServiceWorkerGlobalScope;

import { IS_EXPERIMENTAL, SNOWCAPPED_VERSION_ID } from "../SharedConstants"

// Select files for caching.
/*
Copyright 2016 Google Inc. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

// Names of the two caches used in this version of the service worker.
// Change to v2, etc. when you update any of the local resources, which will
// in turn trigger the install event again.
const PRECACHE = 'precache-v' + SNOWCAPPED_VERSION_ID;

// A list of local resources we always want to be cached.
const PRECACHE_URLS = [
    "/",
    "/style.css",
    "/bundle.js",
    "/bundle.js.map",
    "/bundle.js.LICENSE.txt",
    "/multinoiseworker.js",
    "/multinoiseworker.js.map",
    "/multinoiseworker.js.LICENSE.txt",
    "/manifest.webmanifest",
    "/index.html",
    "/about.html",
    '/style_terms.css',
    "/images/add-gray.svg",
    "/images/add.svg",
    "/images/back-arrow.svg",
    "/images/biomes-icon.svg",
    "/images/blank-file.svg",
    "/images/close_down.svg",
    "/images/close_left.svg",
    "/images/close_right.svg",
    "/images/close_up.svg",
    "/images/edit-pen.svg",
    "/images/expand-arrows.svg",
    "/images/export-file.svg",
    "/images/eye.svg",
    "/images/factor-icon.svg",
    "/images/grid.svg",
    "/images/grid-view.svg",
    "/images/header-black.svg",
    "/images/header.svg",
    "/images/isolines.svg",
    "/images/jaggedness-icon.svg",
    "/images/list-view.svg",
    "/images/mode_A.png",
    "/images/mode_B.png",
    "/images/moon.svg",
    "/images/mountain.svg",
    "/images/offset-icon.svg",
    "/images/open-file-folder.svg",
    "/images/save.svg",
    "/images/save-as.svg",
    "/images/settings-gear.svg",
    "/images/sun.svg",
    "/images/trash-bin.svg",
    "/images/refresh.svg",
    "/images/insert.svg",
    "/images/add-zip.svg",
    "/images/add-folder.svg",
    "/icons/icon.svg",
    "/icons/icon_128.png",
    "/icons/icon_192.png",
    "/icons/icon_512.png",
    "/icons/icon.png",
    "/minecraft_overworld_1_19.snowcapped.json",
    "/empty.snowcapped.json",
    "/export_presets/1_19/factor.json",
    "/export_presets/1_19/offset.json",
    "/export_presets/1_19/jaggedness.json",
    "/export_presets/1_19/pack.mcmeta",
    
];

// The install handler takes care of precaching the resources we always need.
self.addEventListener('install', (event) => {
    var now = Date.now();

    event.waitUntil(
        caches.open(PRECACHE).then(cache => {
            var cachePromises = PRECACHE_URLS.map(function (urlToPrefetch) {
                if (IS_EXPERIMENTAL){
                    urlToPrefetch = "/experimental" + urlToPrefetch
                }
                var url = new URL(urlToPrefetch, location.href);
                url.search += (url.search ? '&' : '?') + 'cache-bust=' + now;
                return fetch(url.toString()).then(function (response) {
                    if (response.status >= 400) {
                        throw new Error('request for ' + urlToPrefetch +
                            ' failed with status ' + response.statusText);
                    }

                    return cache.put(urlToPrefetch, response);
                }).catch(function (error) {
                    console.error('Not caching ' + urlToPrefetch + ' due to ' + error);
                });
            });

            return Promise.all(cachePromises).then(function () {
                console.log('Pre-fetching complete.');
            });
        }).catch(function (error) {
            console.error('Pre-fetching failed:', error);
        })
    )
});

// The activate handler takes care of cleaning up old caches.
self.addEventListener('activate', (event) => {
    const currentCaches = [PRECACHE];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
        }).then(cachesToDelete => {
            return Promise.all(cachesToDelete.map(cacheToDelete => {
                return caches.delete(cacheToDelete);
            }));
        }).then(() => self.clients.claim())
    );
});

// The fetch handler serves responses for same-origin resources from a cache.
// If no response is found, it populates the runtime cache with the response
// from the network before returning it to the page.
self.addEventListener('fetch', event => {
    // Skip cross-origin requests, like those for Google Analytics.
    if (event.request.url.startsWith(self.location.origin)) {
        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request)
            })
        );
    }
});