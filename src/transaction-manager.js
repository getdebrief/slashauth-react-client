"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var TRANSACTION_STORAGE_KEY_PREFIX = 'a0.spajs.txs';
var TransactionManager = /** @class */ (function () {
    function TransactionManager(storage, clientId) {
        this.storage = storage;
        this.clientId = clientId;
        this.storageKey = "".concat(TRANSACTION_STORAGE_KEY_PREFIX, ".").concat(this.clientId);
        this.transaction = this.storage.get(this.storageKey);
    }
    TransactionManager.prototype.create = function (transaction) {
        this.transaction = transaction;
        this.storage.save(this.storageKey, transaction, {
            daysUntilExpire: 1,
        });
    };
    TransactionManager.prototype.get = function () {
        return this.transaction;
    };
    TransactionManager.prototype.remove = function () {
        delete this.transaction;
        this.storage.remove(this.storageKey);
    };
    return TransactionManager;
}());
exports.default = TransactionManager;
//# sourceMappingURL=transaction-manager.js.map