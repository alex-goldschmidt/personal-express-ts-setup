"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoopCacheClient = void 0;
class NoopCacheClient {
    async get(_key) {
        return null;
    }
    async set(_key, _value, _options) {
        return;
    }
    async delete(_key) {
        return;
    }
    async deleteMany(_keys) {
        return;
    }
    async clear() {
        return;
    }
}
exports.NoopCacheClient = NoopCacheClient;
