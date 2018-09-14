/**
 * Welcome to your Workbox-powered service worker!
 *
 * You'll need to register this file in your web app and you should
 * disable HTTP caching for this file too.
 * See https://goo.gl/nhQhGp
 *
 * The rest of the code is auto-generated. Please don't update this file
 * directly; instead, make changes to your Workbox build configuration
 * and re-run your build process.
 * See https://goo.gl/2aRDsh
 */

importScripts("https://storage.googleapis.com/workbox-cdn/releases/3.4.1/workbox-sw.js");

/**
 * The workboxSW.precacheAndRoute() method efficiently caches and responds to
 * requests for URLs in the manifest.
 * See https://goo.gl/S9QRab
 */
self.__precacheManifest = [
  {
    "url": "icons/144.png",
    "revision": "a2ad7642988d56550921ff35242c5894"
  },
  {
    "url": "icons/192.png",
    "revision": "07b6ace53c733b6f3d96d951300c9115"
  },
  {
    "url": "icons/48.png",
    "revision": "8c2e1b25a7f5720413a1f8b3ce6b752a"
  },
  {
    "url": "icons/512.png",
    "revision": "e37cec359c329774b9d8282a9cb495e0"
  },
  {
    "url": "icons/72.png",
    "revision": "8e6782a67515a5f01543ef98ef3c0864"
  },
  {
    "url": "icons/96.png",
    "revision": "c1e73339c62601802d0cc6d965773f0f"
  },
  {
    "url": "index.html",
    "revision": "1bf3be9b8e92eea21ff5d056f31d4ce4"
  },
  {
    "url": "main.js",
    "revision": "3dc611fd1cc3325585994db2e43ba4ad"
  },
  {
    "url": "manifest.json",
    "revision": "e740bd254a7936c2a262409fcbf23533"
  },
  {
    "url": "workbox-config.js",
    "revision": "b788ea060510a7ebbad51411f4f91897"
  }
].concat(self.__precacheManifest || []);
workbox.precaching.suppressWarnings();
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});
