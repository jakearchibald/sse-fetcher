class SSEFetcher {
    constructor(url, opts = {}) {
        /** Uncollected messages */
        this._messageQueue = [];
        /** Queued calls to nextMessage(). Also holds error state. */
        this._promiseQueue = Promise.resolve();
        /** ID of last received message */
        this._lastId = '';
        /** Buffered fetch data that doesn't form a whole message */
        this._buffer = '';
        /** Event type for the partial message */
        this._eventType = '';
        /** Data for the partial message */
        this._data = '';
        /** Last id: received for the partial message */
        this._lastIdBuffer = '';
        /** True when the user has requested the connection aborts */
        this._aborted = false;
        this._url = url;
        this._withCredentials = !!opts.withCredentials;
        this._reconnectionDelay = opts.reconnectionDelay || 2000;
        this._maintainConnection();
    }
    /** Get the next server-sent message */
    nextMessage() {
        return this._promiseQueue = this._promiseQueue.then(() => {
            if (this._messageQueue.length > 0) {
                return this._messageQueue.shift();
            }
            return new Promise((resolve) => {
                this._pendingPromiseResolve = resolve;
            });
        });
    }
    /** Terminate the SSE */
    _error(error) {
        const rejection = Promise.reject(error);
        if (this._pendingPromiseResolve) {
            this._pendingPromiseResolve(rejection);
            this._pendingPromiseResolve = undefined;
        }
        this._promiseQueue = rejection;
    }
    /** Read from the stream until a whole line is found */
    async _readNextLine(reader) {
        while (true) {
            const re = /\r?\n/.exec(this._buffer);
            if (re) {
                const line = this._buffer.slice(0, re.index);
                this._buffer = this._buffer.slice(re.index + re[0].length);
                return line;
            }
            const { done, value } = await reader.read();
            if (done)
                throw Error('Connection terminated');
            const textValue = this._decoder.decode(value, { stream: true });
            this._buffer += textValue;
        }
    }
    /** Emit a message */
    _flush() {
        this._lastId = this._lastIdBuffer;
        if (this._data === '') {
            this._eventType = '';
            return;
        }
        if (this._data.slice(-1) === '\n')
            this._data = this._data.slice(0, -1);
        const message = {
            data: this._data,
            type: this._eventType
        };
        if (this._pendingPromiseResolve) {
            this._pendingPromiseResolve(message);
            this._pendingPromiseResolve = undefined;
        }
        else {
            this._messageQueue.push(message);
        }
        this._data = '';
        this._eventType = '';
    }
    /** Process a given field + value */
    _process(field, value) {
        switch (field) {
            case 'event':
                this._eventType = value;
                break;
            case 'data':
                this._data += value + '\n';
                break;
            case 'id':
                this._lastIdBuffer = value;
                break;
            case 'retry':
                const num = Number(value);
                if (num)
                    this._reconnectionDelay = num;
                break;
        }
    }
    /** Connect & reconnect on error */
    async _maintainConnection() {
        try {
            await this._connect();
        }
        catch (err) {
            await new Promise(r => setTimeout(r, this._reconnectionDelay));
            this._maintainConnection();
        }
    }
    async _connect() {
        const headers = new Headers({ 'Accept': 'text/event-stream' });
        if (this._lastId) {
            headers.set('Last-Event-ID', this._lastId);
        }
        const response = await fetch(this._url, {
            headers,
            credentials: this._withCredentials ? 'include' : 'same-origin',
            cache: 'no-store',
        });
        if (response.status !== 200) {
            this._error(Error('Bad status'));
            response.body.cancel();
            return;
        }
        const type = response.headers.get('content-type');
        if (!type || type.split(';')[0] !== 'text/event-stream') {
            this._error(Error('Bad content-type'));
            response.body.cancel();
            return;
        }
        const reader = response.body.getReader();
        // Reset everything for the new stream.
        this._decoder = new TextDecoder();
        this._buffer = '';
        this._eventType = '';
        this._data = '';
        this._lastIdBuffer = '';
        while (true) {
            if (this._aborted) {
                reader.cancel();
                return;
            }
            const line = await this._readNextLine(reader);
            if (line === '') {
                this._flush();
            }
            else if (line[0] === ':') ;
            else if (line.includes(':')) {
                const index = line.indexOf(':');
                const field = line.slice(0, index);
                let value = line.slice(index + 1);
                // Stript single leading space in value
                if (value[0] === ' ')
                    value = value.slice(1);
                this._process(field, value);
            }
            else {
                this._process(line, '');
            }
        }
    }
    close() {
        this._aborted = true;
        this._error(new DOMException('', 'AbortError'));
    }
}

export default SSEFetcher;
