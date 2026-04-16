// Bailey HQ service worker — push + notification handling.
// renotify:false means same-tag pushes silently REPLACE prior notification
// instead of buzzing again. Backend tags each push by `draft-${id}` so the
// same draft never re-buzzes.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) {
    data = { title: 'Bailey HQ', body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'Bailey HQ';
  const tag = data.tag || (data.issueNumber ? `draft-${data.issueNumber}` : 'bailey-hq');
  const opts = {
    body: data.body || '',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    tag,
    renotify: true,             // always buzz — Bailey needs to see these
    requireInteraction: false,  // auto-dismiss after a few seconds
    data: { url: data.url || '/', issueNumber: data.issueNumber || null, tag },
  };
  event.waitUntil(self.registration.showNotification(title, opts));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) { if ('focus' in c) return c.focus(); }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
