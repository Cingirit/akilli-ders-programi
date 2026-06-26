const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Course = sequelize.define("Course", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, // Örn: BLM101
  },
  expectedStudents: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },

  // --- ZAMANLAMA (OR-Tools bu alanları dolduracak) ---
  // STRING yerine INTEGER: 0=Pazartesi, 1=Salı, ..., 4=Cuma
  dayOfWeek: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 0, max: 4 },
  },
  // Saat sayısı olarak: 8, 9, 10, ... 18
  startHour: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 8, max: 18 },
  },
  // Kaç saat sürdüğü: genellikle 2 veya 3
  durationHours: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 2,
  },

  // --- DERS ÖZELLİKLERİ ---
  // Dönem: 1-8 arası (hangi sınıf/yarıyıl)
  semester: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 1, max: 8 },
  },
  // Haftalık ders saati (kredi değil, fiziksel saat)
  weeklyHours: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 2,
  },
  // ÇAP/Yandal dersi mi? OR-Tools çakışma önleme için kritik
  isCap: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  // Sınav dersi mi? (sınav takvimi ayrı optimize edilecek)
  isExam: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },

  // --- FOREIGN KEY'LER ---
  InstructorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // OR-Tools atanana kadar null kalır
  ClassroomId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});

module.exports = Course;