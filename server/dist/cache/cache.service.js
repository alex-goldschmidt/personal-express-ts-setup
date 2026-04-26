"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const noop_cache_1 = require("./noop.cache");
class CacheService {
    static client = new noop_cache_1.NoopCacheClient();
    static configure(client) {
        this.client = client;
    }
    static reset() {
        this.client = new noop_cache_1.NoopCacheClient();
    }
    static async get(key) {
        return await this.client.get(key);
    }
    static async set(key, value, options) {
        await this.client.set(key, value, options);
    }
    static async delete(key) {
        await this.client.delete(key);
    }
    static async deleteMany(keys) {
        await this.client.deleteMany(keys);
    }
    static async getOrSet(key, loader, options) {
        const existingValue = await this.client.get(key);
        if (existingValue !== null) {
            return existingValue;
        }
        const freshValue = await loader();
        await this.client.set(key, freshValue, options);
        return freshValue;
    }
}
exports.CacheService = CacheService;
