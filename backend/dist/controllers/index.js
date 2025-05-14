"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
var express_1 = require("express");
var cors_1 = require("cors");
var helmet_1 = require("helmet");
var express_rate_limit_1 = require("express-rate-limit");
var client_1 = require("@prisma/client");
var dotenv_1 = require("dotenv");
var auth_routes_1 = require("./routes/auth.routes");
var user_routes_1 = require("./routes/user.routes");
var department_routes_1 = require("./routes/department.routes");
var subject_routes_1 = require("./routes/subject.routes");
var subjectLifecycle_routes_1 = require("./routes/subjectLifecycle.routes");
var batch_routes_1 = require("./routes/batch.routes");
var student_routes_1 = require("./routes/student.routes");
var faculty_routes_1 = require("./routes/faculty.routes");
var attendance_routes_1 = require("./routes/attendance.routes");
var marks_routes_1 = require("./routes/marks.routes");
var iaConfig_routes_1 = require("./routes/iaConfig.routes");
var assignmentConfig_routes_1 = require("./routes/assignmentConfig.routes");
var results_routes_1 = require("./routes/results.routes");
var profile_routes_1 = require("./routes/profile.routes");
var auditLog_routes_1 = require("./routes/auditLog.routes");
var dashboard_routes_1 = require("./routes/dashboard.routes");
// Load environment variables
dotenv_1.default.config();
// Initialize Prisma Client
exports.prisma = new client_1.PrismaClient();
// Verify database connection
exports.prisma.$connect()
    .then(function () {
    console.log('Successfully connected to database');
})
    .catch(function (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
});
// Handle Prisma errors
exports.prisma.$on('query', function (e) {
    console.log('Query:', e.query);
    console.log('Duration:', e.duration, 'ms');
});
exports.prisma.$on('error', function (e) {
    console.error('Prisma Error:', e);
});
// Create Express app
var app = (0, express_1.default)();
// Trust proxy for correct rate limiting
app.set('trust proxy', 1);
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Rate limiting
var limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);
// Routes
app.get('/', function (req, res) {
    res.json({ message: 'Welcome to AIET College ERP API' });
});
// API Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/departments', department_routes_1.default);
app.use('/api/subjects', subject_routes_1.default);
app.use('/api/lifecycle', subjectLifecycle_routes_1.default);
app.use('/api/batches', batch_routes_1.default);
app.use('/api/students', student_routes_1.default);
app.use('/api/faculty', faculty_routes_1.default);
app.use('/api/attendance', attendance_routes_1.default);
app.use('/api/marks', marks_routes_1.default);
app.use('/api/ia-config', iaConfig_routes_1.default);
app.use('/api/assignment-config', assignmentConfig_routes_1.default);
app.use('/api/results', results_routes_1.default);
app.use('/api/profile', profile_routes_1.default);
app.use('/api/audit-logs', auditLog_routes_1.default);
app.use('/api/dashboard', dashboard_routes_1.default);
// 404 Handler
app.use(function (req, res) {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});
// Error handling middleware
app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});
// Start server
var PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
    console.log("Server is running on port ".concat(PORT));
});
