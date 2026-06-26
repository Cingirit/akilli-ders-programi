const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ExamSchedule = sequelize.define("ExamSchedule", {
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
  // Sınav dönemi kaçıncı günü (1-10)
  examDay: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 10 },
  },
  // Başlangıç saati: 9, 11, 13, 15
  startHour: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // Bitiş saati (startHour + 2)
  endHour: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // Hangi sınav dönemi (örn: "2024-Bahar-Final")
  examPeriodLabel: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = ExamSchedule;