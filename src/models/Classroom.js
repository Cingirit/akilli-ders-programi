const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Classroom = sequelize.define('Classroom', {
  roomCode: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, // Örn: A101, LAB-2
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  isLab: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  // Bina bilgisi (kampüs büyükse önemli)
  building: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Projeksiyon var mı?
  hasProjector: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  // OR-Tools bu sınıfı o saatte müsait mi diye kontrol eder
  // Özel kapalı günler için (tadilat, etkinlik vb.)
  unavailableSlots: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    // Beklenen format: [{"day": 0, "hour": 9}, {"day": 2, "hour": 14}]
  },
});

module.exports = Classroom;