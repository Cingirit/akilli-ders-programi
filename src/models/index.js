const Course = require('./Course');
const { Student, Enrollment } = require('./enrollment');
const Instructor = require('./Instructor');
const Classroom = require('./Classroom');
const ScheduleEntry = require('./ScheduleEntry');
const ExamSchedule = require('./ExamSchedule');

// ─────────────────────────────────────────
// 🔗 İLİŞKİLER
// ─────────────────────────────────────────

// Hoca ↔ Ders (1:N)
Instructor.hasMany(Course, { foreignKey: 'InstructorId' });
Course.belongsTo(Instructor, { foreignKey: 'InstructorId' });

// Derslik ↔ Ders (1:N)
Classroom.hasMany(Course, { foreignKey: 'ClassroomId' });
Course.belongsTo(Classroom, { foreignKey: 'ClassroomId' });

// Ders ↔ Kayıt (1:N)
Course.hasMany(Enrollment, { foreignKey: 'courseId' });
Enrollment.belongsTo(Course, { foreignKey: 'courseId' });

// Öğrenci ↔ Kayıt (1:N)
Student.hasMany(Enrollment, { foreignKey: 'studentId' });
Enrollment.belongsTo(Student, { foreignKey: 'studentId' });

// Öğrenci ↔ Ders (N:M) — Enrollment üzerinden
Student.belongsToMany(Course, { through: Enrollment, foreignKey: 'studentId' });
Course.belongsToMany(Student, { through: Enrollment, foreignKey: 'courseId' });

// Ders ↔ ScheduleEntry (1:N) — bir dersin birden fazla haftalık slotu olabilir
Course.hasMany(ScheduleEntry, { foreignKey: 'courseId' });
ScheduleEntry.belongsTo(Course, { foreignKey: 'courseId' });

// Derslik ↔ ScheduleEntry (1:N)
Classroom.hasMany(ScheduleEntry, { foreignKey: 'classroomId' });
ScheduleEntry.belongsTo(Classroom, { foreignKey: 'classroomId' });

// Ders ↔ ExamSchedule (1:1) — bir dersin bir sınavı olur
Course.hasOne(ExamSchedule, { foreignKey: 'courseId' });
ExamSchedule.belongsTo(Course, { foreignKey: 'courseId' });

// Derslik ↔ ExamSchedule (1:N)
Classroom.hasMany(ExamSchedule, { foreignKey: 'classroomId' });
ExamSchedule.belongsTo(Classroom, { foreignKey: 'classroomId' });

// ─────────────────────────────────────────
// 📦 EXPORT
// ─────────────────────────────────────────
module.exports = {
  Course,
  Enrollment,
  Student,
  Instructor,
  Classroom,
  ScheduleEntry,
  ExamSchedule,
};