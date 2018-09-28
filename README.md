# SSEFetcher

This a class that reads server sent events using `fetch()`. It works in Edge (which doesn't support `EventSource`) if you have a `TextDecoder` polyfill.

## Usage

```js
const sse = new SSEFetcher(url, opts);
// opts.withCredentials - Send cookies to cross-origin URLs.
// opts.reconnectionDelay - Initial reconnection delay.

(async function() {
  while (true) {
    const message = await sse.nextMessage();
    console.log(message);
    // message.data - Data sent
    // message.type - Event type sent
  }
})();

// Later, stop events & close the connection.
sse.close();
```

## Files

* `lib/index.ts` - Original typescript.
* `dist/SSEFetcher.mjs` - JS module. Default exports SSEFetcher.
* `dist/SSEFetcher.js` - Plain JS. Exposes SSEFetcher on the global.
* `dist/SSEFetcher-min.js` - Minified plain JS. 1k gzipped.
