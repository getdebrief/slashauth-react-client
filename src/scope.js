"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUniqueScopes = void 0;
var dedupe = function (arr) { return Array.from(new Set(arr)); };
var getUniqueScopes = function () {
    var scopes = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        scopes[_i] = arguments[_i];
    }
    return dedupe(scopes.join(' ').trim().split(/\s+/)).join(' ');
};
exports.getUniqueScopes = getUniqueScopes;
//# sourceMappingURL=scope.js.map