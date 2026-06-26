const express = require("express");
require("dotenv").config();

const sequelize = require("./config/database");
require("./models"); // ilişkileri kur

const courseRoutes = require("./routes/courseRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");
const instructorRoutes = require("./routes/instructorRoutes");
const classroomRoutes = require("./routes/classroomRoutes");
const optimizeRoutes = require("./routes/optimizeRoutes");
const studentRoutes = require("./routes/studentRoutes");

const app = express();

app.use(express.json());

// CORS (ileride React frontend eklenince gerekli)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});

// Route'lar
app.use("/api", courseRoutes);
app.use("/api", enrollmentRoutes);
app.use("/api", instructorRoutes);
app.use("/api", classroomRoutes);
app.use("/api", optimizeRoutes);
app.use("/api", studentRoutes);

// Sağlık kontrolü
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "API çalışıyor 🚀" });
});

// Tüm mevcut endpoint'leri listele (geliştirme kolaylığı için)
app.get("/api/routes", (req, res) => {
  res.json({
    courses:     ["GET /api/courses", "POST /api/courses", "GET /api/courses/:id", "PUT /api/courses/:id", "DELETE /api/courses/:id"],
    instructors: ["GET /api/instructors", "POST /api/instructors", "PUT /api/instructors/:id", "DELETE /api/instructors/:id"],
    classrooms:  ["GET /api/classrooms", "POST /api/classrooms", "PUT /api/classrooms/:id", "DELETE /api/classrooms/:id"],
    enrollments: ["POST /api/enrollments", "GET /api/enrollments/:studentId", "DELETE /api/enrollments/:id"],
    optimizer:   ["POST /api/optimize/run  (yakında — Python mikroservis)"],
  });
});

// DB bağlantısı ve tablo senkronizasyonu
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("DB bağlantısı başarılı ✅");

    // alter:true → mevcut tablolara yeni sütun eklerse yıkmadan günceller
    // production'da migration kullan, development'ta alter yeterli
    await sequelize.sync({ alter: true });
    console.log("Tablolar senkronize edildi ✅");

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server ${PORT} portunda çalışıyor 🚀`);
      console.log(`Endpoint listesi: http://localhost:${PORT}/api/routes`);
    });
  } catch (err) {
    console.error("Başlatma hatası ❌", err);
    process.exit(1);
  }
};

startServer();