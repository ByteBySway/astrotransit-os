import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

const hmrWebSocketMockPlugin: Plugin = {
  name: 'hmr-websocket-mock',
  transformIndexHtml: {
    order: 'pre',
    handler() {
      return [
        {
          tag: 'script',
          injectTo: 'head-prepend',
          children: `
(function() {
  if (typeof window === 'undefined') return;
  var NativeWebSocket = window.WebSocket;
  if (!NativeWebSocket) return;

  function isViteHmr(url, protocols) {
    var u = String(url || '');
    var p = String(protocols || '');
    return p.indexOf('vite-hmr') !== -1 ||
           u.indexOf('token=') !== -1 ||
           u.indexOf('vite-hmr') !== -1 ||
           (u.indexOf('3000') !== -1 && u.indexOf('ws') === 0);
  }

  function MockViteWebSocket(url, protocols) {
    var self = this;
    var target = new EventTarget();
    this.url = String(url || '');
    this.protocol = Array.isArray(protocols) ? protocols[0] : (protocols || 'vite-hmr');
    this.readyState = 0; // WebSocket.CONNECTING
    this.binaryType = 'blob';
    this.bufferedAmount = 0;
    this.extensions = '';
    this.CONNECTING = 0;
    this.OPEN = 1;
    this.CLOSING = 2;
    this.CLOSED = 3;

    this.onopen = null;
    this.onclose = null;
    this.onerror = null;
    this.onmessage = null;

    this.addEventListener = function(t, l, o) { target.addEventListener(t, l, o); };
    this.removeEventListener = function(t, l, o) { target.removeEventListener(t, l, o); };
    this.dispatchEvent = function(e) { return target.dispatchEvent(e); };
    this.send = function() {};
    this.close = function() {
      self.readyState = 3;
      var evt = new Event('close');
      if (typeof self.onclose === 'function') {
        try { self.onclose(evt); } catch (e) {}
      }
      target.dispatchEvent(evt);
    };

    setTimeout(function() {
      if (self.readyState === 0) {
        self.readyState = 1; // WebSocket.OPEN
        var evt = new Event('open');
        if (typeof self.onopen === 'function') {
          try { self.onopen(evt); } catch (e) {}
        }
        target.dispatchEvent(evt);
      }
    }, 0);
  }

  MockViteWebSocket.CONNECTING = 0;
  MockViteWebSocket.OPEN = 1;
  MockViteWebSocket.CLOSING = 2;
  MockViteWebSocket.CLOSED = 3;
  MockViteWebSocket.prototype = Object.create(EventTarget.prototype);

  window.WebSocket = function(url, protocols) {
    if (isViteHmr(url, protocols)) {
      return new MockViteWebSocket(url, protocols);
    }
    return new NativeWebSocket(url, protocols);
  };

  window.WebSocket.CONNECTING = 0;
  window.WebSocket.OPEN = 1;
  window.WebSocket.CLOSING = 2;
  window.WebSocket.CLOSED = 3;
  window.WebSocket.prototype = NativeWebSocket.prototype;
})();
          `.trim(),
        },
      ];
    },
  },
};

export default defineConfig(() => {
  return {
    plugins: [hmrWebSocketMockPlugin, react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: {
        overlay: false,
      },
      watch: null,
    },
  };
});
