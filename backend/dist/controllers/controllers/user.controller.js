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
exports.getUsers = exports.updateUser = exports.registerUser = void 0;
var index_1 = require("../index");
var bcrypt_1 = require("bcrypt");
var registerUser = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, username, email, password, firstName, lastName, existingUser, hashedPassword, user, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 4, , 5]);
                _a = req.body, username = _a.username, email = _a.email, password = _a.password, firstName = _a.firstName, lastName = _a.lastName;
                return [4 /*yield*/, index_1.prisma.user.findFirst({
                        where: {
                            OR: [
                                { username: username },
                                { email: email }
                            ]
                        }
                    })];
            case 1:
                existingUser = _b.sent();
                if (existingUser) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Username or email already exists'
                        })];
                }
                return [4 /*yield*/, bcrypt_1.default.hash(password, 10)];
            case 2:
                hashedPassword = _b.sent();
                return [4 /*yield*/, index_1.prisma.user.create({
                        data: {
                            username: username,
                            email: email,
                            password: hashedPassword,
                            firstName: firstName,
                            lastName: lastName
                        },
                        select: {
                            id: true,
                            username: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            createdAt: true
                        }
                    })];
            case 3:
                user = _b.sent();
                res.status(201).json({
                    success: true,
                    message: 'User registered successfully',
                    data: user
                });
                return [3 /*break*/, 5];
            case 4:
                error_1 = _b.sent();
                console.error('Registration error:', error_1);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.registerUser = registerUser;
var updateUser = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, _a, email, firstName, lastName, existingUser, updatedUser, error_2;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 4, , 5]);
                userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId;
                _a = req.body, email = _a.email, firstName = _a.firstName, lastName = _a.lastName;
                if (!userId) {
                    return [2 /*return*/, res.status(401).json({
                            success: false,
                            message: 'Unauthorized'
                        })];
                }
                if (!email) return [3 /*break*/, 2];
                return [4 /*yield*/, index_1.prisma.user.findFirst({
                        where: {
                            email: email,
                            NOT: {
                                id: userId
                            }
                        }
                    })];
            case 1:
                existingUser = _c.sent();
                if (existingUser) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Email already exists'
                        })];
                }
                _c.label = 2;
            case 2: return [4 /*yield*/, index_1.prisma.user.update({
                    where: { id: userId },
                    data: {
                        email: email,
                        firstName: firstName,
                        lastName: lastName
                    },
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        updatedAt: true
                    }
                })];
            case 3:
                updatedUser = _c.sent();
                res.json({
                    success: true,
                    message: 'User updated successfully',
                    data: updatedUser
                });
                return [3 /*break*/, 5];
            case 4:
                error_2 = _c.sent();
                console.error('Update user error:', error_2);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.updateUser = updateUser;
var getUsers = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _b, page, _c, limit, _d, search, pageNumber, limitNumber, searchCondition, total, users, error_3;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                _e.trys.push([0, 3, , 4]);
                _a = req.query, _b = _a.page, page = _b === void 0 ? 1 : _b, _c = _a.limit, limit = _c === void 0 ? 10 : _c, _d = _a.search, search = _d === void 0 ? '' : _d;
                pageNumber = parseInt(page);
                limitNumber = parseInt(limit);
                searchCondition = search ? {
                    OR: [
                        { username: { contains: search } },
                        { email: { contains: search } },
                        { firstName: { contains: search } },
                        { lastName: { contains: search } }
                    ]
                } : {};
                return [4 /*yield*/, index_1.prisma.user.count({
                        where: searchCondition
                    })];
            case 1:
                total = _e.sent();
                return [4 /*yield*/, index_1.prisma.user.findMany({
                        where: searchCondition,
                        select: {
                            id: true,
                            username: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            createdAt: true,
                            updatedAt: true
                        },
                        skip: (pageNumber - 1) * limitNumber,
                        take: limitNumber,
                        orderBy: {
                            createdAt: 'desc'
                        }
                    })];
            case 2:
                users = _e.sent();
                res.json({
                    success: true,
                    data: {
                        users: users,
                        pagination: {
                            total: total,
                            page: pageNumber,
                            limit: limitNumber,
                            totalPages: Math.ceil(total / limitNumber)
                        }
                    }
                });
                return [3 /*break*/, 4];
            case 3:
                error_3 = _e.sent();
                console.error('Get users error:', error_3);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getUsers = getUsers;
