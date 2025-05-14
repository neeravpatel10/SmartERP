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
exports.unlockAccount = exports.confirmPasswordReset = exports.requestPasswordReset = exports.getCurrentUser = exports.changePassword = exports.login = void 0;
var bcryptjs_1 = require("bcryptjs");
var jsonwebtoken_1 = require("jsonwebtoken");
var index_1 = require("../index");
var crypto_1 = require("crypto");
// Maximum failed login attempts before account lockout
var MAX_FAILED_ATTEMPTS = 5;
// Lockout duration in milliseconds (30 minutes)
var LOCKOUT_DURATION = 30 * 60 * 1000;
var login = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, username, password, user, timeRemaining, isValidPassword, failedAttempts, updateData, payload, jwtSecret, expiresIn, token, userData, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 6, , 7]);
                _a = req.body, username = _a.username, password = _a.password;
                return [4 /*yield*/, index_1.prisma.user.findUnique({
                        where: { username: username },
                        include: {
                            student: true,
                            facultyAccount: true,
                            department: true
                        }
                    })];
            case 1:
                user = _b.sent();
                if (!user) {
                    return [2 /*return*/, res.status(401).json({
                            success: false,
                            message: 'Invalid credentials'
                        })];
                }
                // Check if account is locked
                if (user.lockedUntil && user.lockedUntil > new Date()) {
                    timeRemaining = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
                    return [2 /*return*/, res.status(403).json({
                            success: false,
                            message: "Account locked due to too many failed attempts. Try again in ".concat(timeRemaining, " minutes.")
                        })];
                }
                return [4 /*yield*/, bcryptjs_1.default.compare(password, user.passwordHash)];
            case 2:
                isValidPassword = _b.sent();
                if (!!isValidPassword) return [3 /*break*/, 4];
                failedAttempts = (user.failedLoginAttempts || 0) + 1;
                updateData = { failedLoginAttempts: failedAttempts };
                if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
                    updateData.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION);
                }
                // Update the user record with increased failed attempts and potential lock
                return [4 /*yield*/, index_1.prisma.user.update({
                        where: { id: user.id },
                        data: updateData
                    })];
            case 3:
                // Update the user record with increased failed attempts and potential lock
                _b.sent();
                return [2 /*return*/, res.status(401).json({
                        success: false,
                        message: 'Invalid credentials',
                        attemptsRemaining: Math.max(0, MAX_FAILED_ATTEMPTS - failedAttempts)
                    })];
            case 4: 
            // Successful login: reset failed attempts counter and clear any lock
            return [4 /*yield*/, index_1.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        lastLogin: new Date(),
                        failedLoginAttempts: 0,
                        lockedUntil: null
                    }
                })];
            case 5:
                // Successful login: reset failed attempts counter and clear any lock
                _b.sent();
                payload = {
                    userId: user.id,
                    username: user.username,
                    loginType: user.loginType
                };
                if (user.departmentId)
                    payload.departmentId = user.departmentId;
                jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
                expiresIn = process.env.JWT_EXPIRES_IN || '24h';
                token = jsonwebtoken_1.default.sign(payload, jwtSecret, { expiresIn: expiresIn });
                userData = {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    loginType: user.loginType,
                    department: user.department,
                    firstLogin: user.firstLogin
                };
                res.json({
                    success: true,
                    message: 'Login successful',
                    data: {
                        token: token,
                        user: userData
                    }
                });
                return [3 /*break*/, 7];
            case 6:
                error_1 = _b.sent();
                console.error('Login error:', error_1);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); };
exports.login = login;
var changePassword = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, currentPassword, newPassword, userId, user, isValidPassword, hashedPassword, error_2;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 5, , 6]);
                _a = req.body, currentPassword = _a.currentPassword, newPassword = _a.newPassword;
                userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId;
                if (!userId) {
                    return [2 /*return*/, res.status(401).json({
                            success: false,
                            message: 'Authentication required'
                        })];
                }
                return [4 /*yield*/, index_1.prisma.user.findUnique({
                        where: { id: userId }
                    })];
            case 1:
                user = _c.sent();
                if (!user) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'User not found'
                        })];
                }
                return [4 /*yield*/, bcryptjs_1.default.compare(currentPassword, user.passwordHash)];
            case 2:
                isValidPassword = _c.sent();
                if (!isValidPassword) {
                    return [2 /*return*/, res.status(401).json({
                            success: false,
                            message: 'Current password is incorrect'
                        })];
                }
                return [4 /*yield*/, bcryptjs_1.default.hash(newPassword, 10)];
            case 3:
                hashedPassword = _c.sent();
                return [4 /*yield*/, index_1.prisma.user.update({
                        where: { id: userId },
                        data: {
                            passwordHash: hashedPassword,
                            firstLogin: false
                        }
                    })];
            case 4:
                _c.sent();
                res.json({
                    success: true,
                    message: 'Password changed successfully'
                });
                return [3 /*break*/, 6];
            case 5:
                error_2 = _c.sent();
                console.error('Change password error:', error_2);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.changePassword = changePassword;
var getCurrentUser = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, user, error_3;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                if (!userId) {
                    return [2 /*return*/, res.status(401).json({
                            success: false,
                            message: 'Unauthorized'
                        })];
                }
                return [4 /*yield*/, index_1.prisma.user.findUnique({
                        where: { id: userId },
                        select: {
                            id: true,
                            username: true,
                            email: true,
                            loginType: true,
                            departmentId: true,
                            firstLogin: true,
                            department: true,
                            createdAt: true,
                            updatedAt: true
                        }
                    })];
            case 1:
                user = _b.sent();
                if (!user) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'User not found'
                        })];
                }
                res.json({
                    success: true,
                    data: user
                });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _b.sent();
                console.error('Get current user error:', error_3);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getCurrentUser = getCurrentUser;
var requestPasswordReset = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var email, user, resetToken, resetTokenExpiry, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                email = req.body.email;
                return [4 /*yield*/, index_1.prisma.user.findFirst({
                        where: { email: email }
                    })];
            case 1:
                user = _a.sent();
                if (!user) {
                    // For security reasons, don't reveal whether the email exists
                    return [2 /*return*/, res.json({
                            success: true,
                            message: 'If your email is registered, you will receive a password reset link'
                        })];
                }
                resetToken = (0, crypto_1.randomBytes)(32).toString('hex');
                resetTokenExpiry = new Date(Date.now() + 3600000);
                // Store the reset token in the database
                return [4 /*yield*/, index_1.prisma.user.update({
                        where: { id: user.id },
                        data: {
                            resetToken: resetToken,
                            resetTokenExpiry: resetTokenExpiry
                        }
                    })];
            case 2:
                // Store the reset token in the database
                _a.sent();
                // In a real application, send an email with the reset link
                // For this example, we'll just return the token in the response
                // In production, you would use an email service to send a link like:
                // https://yourdomain.com/reset-password?token=${resetToken}
                res.json({
                    success: true,
                    message: 'If your email is registered, you will receive a password reset link',
                    // Only included for development/testing
                    debug: {
                        resetToken: resetToken,
                        resetUrl: "https://yourdomain.com/reset-password?token=".concat(resetToken)
                    }
                });
                return [3 /*break*/, 4];
            case 3:
                error_4 = _a.sent();
                console.error('Request password reset error:', error_4);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.requestPasswordReset = requestPasswordReset;
var confirmPasswordReset = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, token, newPassword, user, hashedPassword, error_5;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 4, , 5]);
                _a = req.body, token = _a.token, newPassword = _a.newPassword;
                return [4 /*yield*/, index_1.prisma.user.findFirst({
                        where: {
                            resetToken: token,
                            resetTokenExpiry: {
                                gt: new Date()
                            }
                        }
                    })];
            case 1:
                user = _b.sent();
                if (!user) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Invalid or expired reset token'
                        })];
                }
                return [4 /*yield*/, bcryptjs_1.default.hash(newPassword, 10)];
            case 2:
                hashedPassword = _b.sent();
                // Update user with new password and clear reset token
                return [4 /*yield*/, index_1.prisma.user.update({
                        where: { id: user.id },
                        data: {
                            passwordHash: hashedPassword,
                            resetToken: null,
                            resetTokenExpiry: null,
                            firstLogin: false
                        }
                    })];
            case 3:
                // Update user with new password and clear reset token
                _b.sent();
                res.json({
                    success: true,
                    message: 'Password has been reset successfully'
                });
                return [3 /*break*/, 5];
            case 4:
                error_5 = _b.sent();
                console.error('Password reset confirmation error:', error_5);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.confirmPasswordReset = confirmPasswordReset;
// New method to unlock account
var unlockAccount = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var username, user, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                username = req.body.username;
                return [4 /*yield*/, index_1.prisma.user.findUnique({
                        where: { username: username }
                    })];
            case 1:
                user = _a.sent();
                if (!user) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'User not found'
                        })];
                }
                // Reset the failed attempts and remove lock
                return [4 /*yield*/, index_1.prisma.user.update({
                        where: { id: user.id },
                        data: {
                            failedLoginAttempts: 0,
                            lockedUntil: null
                        }
                    })];
            case 2:
                // Reset the failed attempts and remove lock
                _a.sent();
                res.json({
                    success: true,
                    message: 'Account unlocked successfully'
                });
                return [3 /*break*/, 4];
            case 3:
                error_6 = _a.sent();
                console.error('Unlock account error:', error_6);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.unlockAccount = unlockAccount;
