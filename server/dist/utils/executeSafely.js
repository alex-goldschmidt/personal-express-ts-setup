"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeSafely = executeSafely;
/**
 * Execute a service call, send a standardized successful response or handle empty results,
 * and forward errors to the global error handler via `next`.
 *
 * Usage: return executeSafely(() => Service.getX(id), res, next, { successStatus: 200 });
 */
async function executeSafely(fn, res, next, opts = {}) {
    try {
        const data = await fn();
        const isEmpty = data === null ||
            data === undefined ||
            (Array.isArray(data) && data.length === 0);
        if (isEmpty && opts.onEmpty) {
            res
                .status(opts.onEmpty.status)
                .json({ message: opts.onEmpty.message ?? "Not found" });
            return;
        }
        if (opts.contentType)
            res.type(opts.contentType);
        const payload = opts.transform ? opts.transform(data) : data;
        res.status(opts.successStatus ?? 200).json(payload);
    }
    catch (err) {
        next(err);
    }
}
exports.default = executeSafely;
