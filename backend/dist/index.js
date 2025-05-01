"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const department_routes_1 = __importDefault(require("./routes/department.routes"));
const subject_routes_1 = __importDefault(require("./routes/subject.routes"));
const subjectLifecycle_routes_1 = __importDefault(require("./routes/subjectLifecycle.routes"));
const batch_routes_1 = __importDefault(require("./routes/batch.routes"));
const student_routes_1 = __importDefault(require("./routes/student.routes"));
const faculty_routes_1 = __importDefault(require("./routes/faculty.routes"));
const attendance_routes_1 = __importDefault(require("./routes/attendance.routes"));
const marks_routes_1 = __importDefault(require("./routes/marks.routes"));
const iaConfig_routes_1 = __importDefault(require("./routes/iaConfig.routes"));
const assignmentConfig_routes_1 = __importDefault(require("./routes/assignmentConfig.routes"));
const results_routes_1 = __importDefault(require("./routes/results.routes"));
const reports_routes_1 = __importDefault(require("./routes/reports.routes"));
const profile_routes_1 = __importDefault(require("./routes/profile.routes"));
const auditLog_routes_1 = __importDefault(require("./routes/auditLog.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
// Load environment variables
dotenv_1.default.config();
// Initialize Prisma Client
exports.prisma = new client_1.PrismaClient();
// Create Express app
const app = (0, express_1.default)();
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);
// Routes
app.get('/', (req, res) => {
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
app.use('/api/reports', reports_routes_1.default);
app.use('/api/profile', profile_routes_1.default);
app.use('/api/audit-logs', auditLog_routes_1.default);
app.use('/api/dashboard', dashboard_routes_1.default);
// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});
// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
