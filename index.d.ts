interface SSEFetcherOpts {
    /** Send cookies to cross-origin URLs */
    withCredentials?: boolean;
    /** Initial reconnection delay */
    reconnectionDelay?: number;
}
interface Message {
    data: string;
    type: string;
}
export default class SSEFetcher {
    /** URL to be fetched */
    private _url;
    /** Send cookies to cross-origin URLs */
    private _withCredentials;
    /** Uncollected messages */
    private _messageQueue;
    /** Queued calls to nextMessage(). Also holds error state. */
    private _promiseQueue;
    /** Latest unresolved item in _promiseQueue */
    private _pendingPromiseResolve?;
    /** ID of last received message */
    private _lastId;
    /** Decoder for the current connection */
    private _decoder?;
    /** Buffered fetch data that doesn't form a whole message */
    private _buffer;
    /** Event type for the partial message */
    private _eventType;
    /** Data for the partial message */
    private _data;
    /** Last id: received for the partial message */
    private _lastIdBuffer;
    /** True when the user has requested the connection aborts */
    private _aborted;
    /** Milliseconds between reconnection */
    private _reconnectionDelay;
    constructor(url: RequestInfo, opts?: SSEFetcherOpts);
    /** Get the next server-sent message */
    nextMessage(): Promise<Message>;
    /** Terminate the SSE */
    private _error;
    /** Read from the stream until a whole line is found */
    private _readNextLine;
    /** Emit a message */
    private _flush;
    /** Process a given field + value */
    private _process;
    /** Connect & reconnect on error */
    private _maintainConnection;
    private _connect;
    close(): void;
}
export {};
