const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ScheduleEntry = sequelize.define("ScheduleEntry", {
  // Hangi ders
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // Hangi derslik
  classroomId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // Hangi gün: 0=Pazartesi, 4=Cuma
  dayOfWeek: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 0, max: 4 },
  },
  // Başlangıç saati: 8-18
  startHour: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 8, max: 18 },
  },
  // Kaç saat sürdüğü
  durationHours: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 2,
  },
  // Hangi dönem için oluşturuldu (örn: "2024-Bahar")
  semesterLabel: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = ScheduleEntry;