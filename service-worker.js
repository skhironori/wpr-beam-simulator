// WPR-47417 帯広 ビーム走査ジオメトリ・シミュレーター
//
// 【廃止用Service Worker】
// これまでのバージョンのService Workerがキャッシュの不整合（更新が反映されない）を
// 繰り返し引き起こしたため、Service Workerの利用自体を取りやめることにした。
// このファイルの役目は、既存のキャッシュを全て削除し、自分自身の登録を解除して、
// 開いている画面を強制的に再読み込みさせることだけ。以後はこのアプリで
// Service Workerを一切使わない（index.html側も新規登録は行わない）。
//
// 気象庁データ・地図タイルなど常に最新が必要な情報を扱うツールである以上、
// オフラインキャッシュより「常にネットワークから確実に最新を取得できる」ことを優先する。

self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (k) { return caches.delete(k); }));
      })
      .then(function () {
        return self.registration.unregister();
      })
      .then(function () {
        return self.clients.matchAll({ type: 'window' });
      })
      .then(function (clients) {
        clients.forEach(function (client) {
          client.navigate(client.url);
        });
      })
  );
});
