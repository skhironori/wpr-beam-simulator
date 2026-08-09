// WPR-47417 帯広 ビーム走査ジオメトリ・シミュレーター
// 最小構成のService Worker：アプリ本体（HTML/manifest/アイコン）だけをキャッシュ対象とし、
// 気象庁データ・地図タイル・CDNライブラリなど外部オリジンへのリクエストは
// 常にそのままネットワークへ通す（キャッシュしない＝常に最新を取得する）。
//
// キャッシュ戦略はネットワーク優先（network-first）。以前はキャッシュ優先だったため、
// 一度読み込んだ端末はそれ以降ずっと同じ内容が表示され続け、更新に気付けなかった。
// 今回からは毎回まずネットワークから最新を取りにいき、取得できた分だけキャッシュを
// 上書きする。オフライン時や通信エラー時のみキャッシュにフォールバックする。

var CACHE_NAME = 'wpr-obihiro-shell-v2';
var APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_NAME; })
          .map(function (k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (event) {
  var url = new URL(event.request.url);

  // 同一オリジン（アプリ本体）以外は一切キャッシュに介入しない。
  // 気象庁API・地図タイル・Three.js/Leaflet CDNは常にネットワークから直接取得する。
  if (url.origin !== self.location.origin) return;

  // GET以外（該当なしのはずだが念のため）はそのままネットワークへ
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request, { cache: 'no-store' }).then(function (response) {
      var copy = response.clone();
      caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, copy); });
      return response;
    }).catch(function () {
      // オフライン・通信エラー時のみキャッシュへフォールバック
      return caches.match(event.request).then(function (cached) {
        return cached || caches.match('./index.html');
      });
    })
  );
});
