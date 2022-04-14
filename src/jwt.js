"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verify = exports.decode = void 0;
var utils_1 = require("./utils");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
var isNumber = function (n) { return typeof n === 'number'; };
var idTokendecoded = [
    'iss',
    'aud',
    'exp',
    'nbf',
    'iat',
    'jti',
    'azp',
    'nonce',
    'auth_time',
    'at_hash',
    'c_hash',
    'acr',
    'amr',
    'sub_jwk',
    'cnf',
    'sip_from_tag',
    'sip_date',
    'sip_callid',
    'sip_cseq_num',
    'sip_via_branch',
    'orig',
    'dest',
    'mky',
    'events',
    'toe',
    'txn',
    'rph',
    'sid',
    'vot',
    'vtm',
];
var decode = function (token) {
    var parts = token.split('.');
    var _a = __read(parts, 3), header = _a[0], payload = _a[1], signature = _a[2];
    if (parts.length !== 3 || !header || !payload || !signature) {
        throw new Error('ID token could not be decoded');
    }
    var payloadJSON = JSON.parse((0, utils_1.urlDecodeB64)(payload));
    var claims = { __raw: token };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    var user = {};
    Object.keys(payloadJSON).forEach(function (k) {
        claims[k] = payloadJSON[k];
        if (!idTokendecoded.includes(k)) {
            user[k] = payloadJSON[k];
        }
    });
    return {
        encoded: { header: header, payload: payload, signature: signature },
        header: JSON.parse((0, utils_1.urlDecodeB64)(header)),
        claims: claims,
        user: user,
    };
};
exports.decode = decode;
var verify = function (options) {
    if (!options.id_token) {
        throw new Error('ID token is required but missing');
    }
    var decoded = (0, exports.decode)(options.id_token);
    if (!decoded.claims.iss) {
        throw new Error('Issuer (iss) claim must be a string present in the ID token');
    }
    if (decoded.claims.iss !== options.iss) {
        throw new Error("Issuer (iss) claim mismatch in the ID token; expected \"".concat(options.iss, "\", found \"").concat(decoded.claims.iss, "\""));
    }
    if (!decoded.user.sub) {
        throw new Error('Subject (sub) claim must be a string present in the ID token');
    }
    if (decoded.header.alg !== 'RS256') {
        throw new Error("Signature algorithm of \"".concat(decoded.header.alg, "\" is not supported. Expected the ID token to be signed with \"RS256\"."));
    }
    if (!decoded.claims.aud ||
        !(typeof decoded.claims.aud === 'string' ||
            Array.isArray(decoded.claims.aud))) {
        throw new Error('Audience (aud) claim must be a string or array of strings present in the ID token');
    }
    if (Array.isArray(decoded.claims.aud)) {
        if (!decoded.claims.aud.includes(options.aud)) {
            throw new Error("Audience (aud) claim mismatch in the ID token; expected \"".concat(options.aud, "\" but was not one of \"").concat(decoded.claims.aud.join(', '), "\""));
        }
        if (decoded.claims.aud.length > 1) {
            if (!decoded.claims.azp) {
                throw new Error('Authorized Party (azp) claim must be a string present in the ID token when Audience (aud) claim has multiple values');
            }
            if (decoded.claims.azp !== options.aud) {
                throw new Error("Authorized Party (azp) claim mismatch in the ID token; expected \"".concat(options.aud, "\", found \"").concat(decoded.claims.azp, "\""));
            }
        }
    }
    else if (decoded.claims.aud !== options.aud) {
        throw new Error("Audience (aud) claim mismatch in the ID token; expected \"".concat(options.aud, "\" but found \"").concat(decoded.claims.aud, "\""));
    }
    if (options.nonce) {
        if (!decoded.claims.nonce) {
            throw new Error('Nonce (nonce) claim must be a string present in the ID token');
        }
        if (decoded.claims.nonce !== options.nonce) {
            throw new Error("Nonce (nonce) claim mismatch in the ID token; expected \"".concat(options.nonce, "\", found \"").concat(decoded.claims.nonce, "\""));
        }
    }
    if (options.max_age && !isNumber(decoded.claims.auth_time)) {
        throw new Error('Authentication Time (auth_time) claim must be a number present in the ID token when Max Age (max_age) is specified');
    }
    /* istanbul ignore next */
    if (!isNumber(decoded.claims.exp)) {
        throw new Error('Expiration Time (exp) claim must be a number present in the ID token');
    }
    if (!isNumber(decoded.claims.iat)) {
        throw new Error('Issued At (iat) claim must be a number present in the ID token');
    }
    var leeway = options.leeway || 60;
    var now = new Date(options.now || Date.now());
    var expDate = new Date(0);
    var nbfDate = new Date(0);
    var authTimeDate = new Date(0);
    authTimeDate.setUTCSeconds(parseInt(decoded.claims.auth_time || '0') +
        (options.max_age || 63072000) +
        leeway);
    expDate.setUTCSeconds(decoded.claims.exp || Date.now() / 1000 + leeway);
    nbfDate.setUTCSeconds(decoded.claims.nbf || Date.now() / 1000 - leeway);
    if (now > expDate) {
        throw new Error("Expiration Time (exp) claim error in the ID token; current time (".concat(now, ") is after expiration time (").concat(expDate, ")"));
    }
    if (isNumber(decoded.claims.nbf) && now < nbfDate) {
        throw new Error("Not Before time (nbf) claim in the ID token indicates that this token can't be used just yet. Currrent time (".concat(now, ") is before ").concat(nbfDate));
    }
    if (isNumber(decoded.claims.auth_time) && now > authTimeDate) {
        throw new Error("Authentication Time (auth_time) claim in the ID token indicates that too much time has passed since the last end-user authentication. Currrent time (".concat(now, ") is after last auth at ").concat(authTimeDate));
    }
    if (options.organizationId) {
        if (!decoded.claims.org_id) {
            throw new Error('Organization ID (org_id) claim must be a string present in the ID token');
        }
        else if (options.organizationId !== decoded.claims.org_id) {
            throw new Error("Organization ID (org_id) claim mismatch in the ID token; expected \"".concat(options.organizationId, "\", found \"").concat(decoded.claims.org_id, "\""));
        }
    }
    return decoded;
};
exports.verify = verify;
//# sourceMappingURL=jwt.js.map