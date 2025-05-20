# Changelog

All notable changes to the AIET College ERP will be documented in this file.

## [Unreleased]

## [1.0.0] - 2025-05-20

### Added

- **Internal Marks Module**: Complete implementation of the CIE/IA marks workflow
  - Added database schema with four new tables: `internal_exam_blueprint`, `internal_subquestion`, `student_subquestion_marks`, and `student_internal_totals`
  - Implemented REST API endpoints at `/marks/internal/*` with proper authentication and authorization
  - Built Excel template generation and upload functionality
  - Created faculty-facing UI for blueprint creation and marks entry
  - Implemented "Best of Part A & B" scoring algorithm with proper rounding
  - Added comprehensive unit tests for the scoring algorithm

### Fixed

- Faculty-Subject Mapping: Department Admins (login type 3) are now correctly recognized as both faculty and admin users
- Faculty-Subject Mapping API: Fixed 400 errors by ensuring that at least one valid parameter is always sent
- Department Dropdown in Faculty-Subject Mapping Form: Fixed issues with dropdown not showing options for SuperAdmin users

### Changed

- Updated authentication middleware to better handle faculty and department admin roles
