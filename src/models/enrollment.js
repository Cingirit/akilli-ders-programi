const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// Öğrenci modeli — enrollment.js ile aynı dosyada tutuyoruz
// İleride ayrı dosyaya taşıyabilirsin
const Student = sequelize.define("Student", {
  studentNo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, // Örn: 2021123456
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    validate: { isEmail: true },
  },
  // Hangi bölümde okuyor
  department: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // ÇAP yapıyor mu? Yapıyorsa ikinci bölümü
  capDepartment: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Kaçıncı sınıf
  year: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 1, max: 5 },
  },
});

// Enrollment: Hangi öğrenci hangi dersi alıyor
const Enrollment = sequelize.define("Enrollment", {
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // ÇAP kapsamında mı alıyor bu dersi?
  isCapEnrollment: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

module.exports = { Student, Enrollment };