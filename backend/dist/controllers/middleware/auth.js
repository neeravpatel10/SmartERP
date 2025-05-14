"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isStudent = exports.isDeptAdmin = exports.isFaculty = exports.isSuperAdmin = exports.authorize = exports.authenticate = void 0;
var jsonwebtoken_1 = require("jsonwebtoken");
var index_1 = require("../index");
var authenticate = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var authHeader, token, decoded, user, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                authHeader = req.headers.authorization;
                if (!authHeader) {
                    return [2 /*return*/, res.status(401).json({
                            success: false,
                            message: 'No token provided'
                        })];
                }
                token = authHeader.split(' ')[1];
                if (!token) {
                    return [2 /*return*/, res.status(401).json({
                            success: false,
                            message: 'Invalid token format'
                        })];
                }
                decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
                return [4 /*yield*/, index_1.prisma.user.findUnique({
                        where: { id: decoded.userId }
                    })];
            case 1:
                user = _a.sent();
                if (!user) {
                    return [2 /*return*/, res.status(401).json({
                            success: false,
                            message: 'User no longer exists'
                        })];
                }
                // Attach the user info to the request
                req.user = decoded;
                next();
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                if (error_1 instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                    return [2 /*return*/, res.status(401).json({
                            success: false,
                            message: 'Invalid token'
                        })];
                }
                if (error_1 instanceof jsonwebtoken_1.default.TokenExpiredError) {
                    return [2 /*return*/, res.status(401).json({
                            success: false,
                            message: 'Token expired'
                        })];
                }
                console.error('Authentication error:', error_1);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.authenticate = authenticate;
var authorize = function (allowedRoles) {
    return function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
        var resourceDepartmentId;
        return __generator(this, function (_a) {
            if (!req.user) {
                return [2 /*return*/, res.status(401).json({
                        success: false,
                        message: 'Authentication required'
                    })];
            }
            if (!allowedRoles.includes(req.user.loginType)) {
                return [2 /*return*/, res.status(403).json({
                        success: false,
                        message: 'Access denied'
                    })];
            }
            // For department-scoped access
            if (req.user.loginType === 3 && req.user.departmentId) {
                resourceDepartmentId = req.params.departmentId || req.body.departmentId;
                if (resourceDepartmentId && resourceDepartmentId !== req.user.departmentId) {
                    return [2 /*return*/, res.status(403).json({
                            success: false,
                            message: 'Access denied to other departments'
                        })];
                }
            }
            next();
            return [2 /*return*/];
        });
    }); };
};
exports.authorize = authorize;
// Role-specific middleware
exports.isSuperAdmin = (0, exports.authorize)([1]);
exports.isFaculty = (0, exports.authorize)([2]);
exports.isDeptAdmin = (0, exports.authorize)([3]);
exports.isStudent = (0, exports.authorize)([-1]);
