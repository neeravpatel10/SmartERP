# 🎓 SmartERP College System – AIET

A role-based Enterprise Resource Planning (ERP) system for **Alva's Institute of Engineering and Technology (AIET)**. Designed to streamline marks management, attendance tracking, student-faculty mappings, and department-level analytics across multiple departments.

---

## 📌 Overview

The College ERP is a centralized, modular system with clear access controls and interfaces tailored to each stakeholder:

- **Students** can view marks, attendance, and comprehensive profile details.
- **Faculty** can upload marks, record attendance, and manage assigned subjects.
- **Department Admins** have faculty capabilities plus department-specific management of faculty, subjects, students, and analytics.
- **Super Admins** have complete control over users, departments, mappings, and global settings.

This system supports real-time updates, Excel upload/download support, mobile-first UI for students, and role-based dashboards.

---

## 🧩 Modules

| Module          | Description |
|----------------|-------------|
| **Login & Role-Based Access** | JWT authentication, session handling, refresh tokens |
| **Marks Entry** | IA/Assignments/Final split, Excel upload/download, component-wise upload, internal marks management, assignment & quiz marks with overall totals |
| **Attendance Tracking** | Session-based with lab support (3-period block), Excel-based upload |
| **Faculty–Subject Mapping** | Multi-department, semester & section support with robust validation |
| **Reports & Analytics** | Performance analysis at student, subject, and department level |
| **Profile Picture Upload** | REST endpoints for avatars, stored in local FS/S3 |
| **Admin Controls** | User creation, subject control, academic setting management |
| **Student Profile** | Comprehensive view with personal information, guardian details, and education history |

---

## ⚙️ Tech Stack

| Layer        | Technology |
|--------------|------------|
| **Frontend** | React (TypeScript), Material UI, Redux Toolkit |
| **Backend**  | Node.js + Express (TypeScript) |
| **Database** | MySQL + Prisma ORM |
| **Storage**  | Local file system for avatars (`/uploads/`) |
| **Excel Support** | SheetJS + Multer for upload parsing |
| **Security** | JWT Auth, Bcrypt for passwords |

---

## 🚦 Role-Based Access Matrix

| Feature Area     | Student | Faculty | Dept Admin | Super Admin |
|------------------|---------|---------|------------|-------------|
| View Marks       | ✅ Own   | ✅ Assigned | ✅ Dept     | ✅ All       |
| Upload Marks     | ❌      | ✅ Own     | ✅ Own     | ✅ All       |
| Export Marks     | ❌      | ✅ Own     | ✅ Dept    | ✅ All       |
| View Attendance  | ✅ Own   | ✅ Own     | ✅ Dept     | ✅ All       |
| Upload Attendance| ❌      | ✅        | ✅          | ✅           |
| Manage Users     | ❌      | ❌        | ✅ Dept     | ✅ All       |
| Mapping Subjects | ❌      | View     | ✅ Dept     | ✅ All       |
| View Reports     | ❌      | ❌        | ✅ Dept     | ✅ All       |

> Note: Department Admins (login_type=3) have both faculty and admin capabilities, meaning they can perform all faculty functions in addition to their administrative duties.

> Defined in the `login_type` column: `-1=Student`, `2=Faculty`, `3=Dept Admin`, `1=Super Admin`.

---

## 🔄 Recent Improvements

- **Assignment & Quiz Marks Module**: Complete system for managing non-CIE component marks including assignments, quizzes, and seminars with overall totals calculation
- **Enhanced Student Profiles**: Comprehensive student data display including personal information, guardian details, and education history
- **Faculty-Subject Mapping**: Fixed critical issues with the mapping table to prevent 400 errors by ensuring proper API parameter validation
- **Department Selection**: Improved department dropdown for SuperAdmin users, ensuring proper loading and selection of departments
- **API Optimizations**: Fixed issues with redundant authorization headers and implemented proper debouncing to prevent race conditions
- **Internal Marks Module**: Advanced management system for tracking and analyzing student performance across different assessment components

---

## 📂 Folder Structure

```
SmartERP/
├── backend/                # Node.js + Express backend
│   ├── prisma/             # Prisma ORM schema and migrations
│   ├── src/
│   │   ├── controllers/    # API controllers
│   │   ├── middleware/     # Auth and validation middleware
│   │   ├── routes/         # API route definitions
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Helper functions
│   │   └── index.ts        # Main entry point
│   └── package.json
│
├── frontend/               # React frontend
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   │   ├── marks/      # Marks management
│   │   │   ├── attendance/ # Attendance tracking
│   │   │   └── ...         # Other modules
│   │   ├── services/       # API services
│   │   ├── store/          # Redux store
│   │   ├── utils/          # Helper functions
│   │   └── App.tsx         # Main App component
│   └── package.json
│
├── documents/              # Documentation
│   └── features/           # Feature specifications
│
└── uploads/                # File uploads (avatars, etc.)
```

---

## 🚀 Installation & Setup

### Prerequisites

- Node.js (v16+) and npm/yarn
- MySQL (v8.0+)
- Git

### Getting the Code

```bash
# Clone the repository
git clone https://github.com/neeravpatel10/SmartERP.git
cd SmartERP
```

### Database Setup

1. Create a MySQL database for the project:

```sql
CREATE DATABASE smart_erp;
CREATE USER 'erp_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON smart_erp.* TO 'erp_user'@'localhost';
FLUSH PRIVILEGES;
```

2. Configure database connection in the backend:

```bash
# Navigate to backend directory
cd backend

# Create .env file
cp .env.example .env

# Edit .env file with your database credentials
# DATABASE_URL="mysql://erp_user:your_password@localhost:3306/smart_erp"
```

3. Run Prisma migrations:

```bash
npm install
npx prisma migrate deploy
npx prisma generate
```

### Running the Backend

```bash
# In the backend directory
npm install
npm run dev
```

The server will start on http://localhost:8000 by default.

### Running the Frontend

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

The React application will start on http://localhost:3000.

### Initial Setup

1. The system creates a default Super Admin user on first run:
   - Username: `admin`
   - Password: `admin123`

2. After first login, navigate to the Admin panel to:
   - Change the default password
   - Create departments
   - Add faculty members
   - Configure subjects

### Troubleshooting

- If you encounter CORS errors, ensure the backend is running and check the CORS configuration in `backend/src/index.ts`
- For database connection issues, verify your MySQL credentials and check if the database server is running
- If Prisma throws errors, run `npx prisma generate` again to update the client

