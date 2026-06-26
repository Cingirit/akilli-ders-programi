const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Instructor = sequelize.define('Instructor', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: { isEmail: true },
  },

  // Müsaitlik takvimi — OR-Tools bu veriyi okur
  // Beklenen format:
  // {
  //   "0": [9, 10, 11, 14, 15],   ← Pazartesi müsait saatler
  //   "1": [9, 10, 13, 14],        ← Salı müsait saatler
  //   "2": [],                     ← Çarşamba müsait değil
  //   "3": [10, 11, 15, 16],       ← Perşembe müsait saatler
  //   "4": [9, 10, 11]             ← Cuma müsait saatler
  // }
  availability: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      "0": [9, 10, 11, 13, 14, 15],
      "1": [9, 10, 11, 13, 14, 15],
      "2": [9, 10, 11, 13, 14, 15],
      "3": [9, 10, 11, 13, 14, 15],
      "4": [9, 10, 11, 13, 14, 15],
    },
  },

  // Haftada max kaç saat ders verebilir
  maxWeeklyHours: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 20,
  },

  // OR-Tools'un hesapladığı memnuniyet skoru (0-100)
  // Tercih ettiği saatlerde ders verilirse yüksek olur
  satisfactionScore: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },

  department: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = Instructor;