"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSlashAuth = void 0;
var react_use_metamask_1 = require("@navvi/react-use-metamask");
var useSlashAuth = function () {
    var metamaskContext = (0, react_use_metamask_1.useMetaMask)();
    return {
        metamaskContext: metamaskContext,
        connect: metamaskContext.connect,
        provider: metamaskContext.ethereum,
    };
};
exports.useSlashAuth = useSlashAuth;
//# sourceMappingURL=use-slashauth.js.map