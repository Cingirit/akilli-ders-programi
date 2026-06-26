const { Enrollment, Course, Student, Instructor, Classroom } = require("../models");

// Yardımcı: İki ders çakışıyor mu?
// Ders A: startHour=9, durationHours=2 → 9,10 saatlerini kaplar
// Ders B: startHour=10, durationHours=2 → 10,11 saatlerini kaplar → ÇAKIŞIR
const hasTimeConflict = (courseA, courseB) => {
  if (courseA.dayOfWeek !== courseB.dayOfWeek) return false;
  if (courseA.dayOfWeek === null || courseB.dayOfWeek === null) return false;

  const aStart = courseA.startHour;
  const aEnd = aStart + courseA.durationHours;
  const bStart = courseB.startHour;
  const bEnd = bStart + courseB.durationHours;

  return aStart < bEnd && bStart < aEnd;
};

// POST /api/enrollments
exports.createEnrollment = async (req, res) => {
  try {
    const { studentId, courseId, isCapEnrollment } = req.body;

    if (!studentId || !courseId) {
      return res.status(400).json({ error: "studentId ve courseId zorunludur" });
    }

    // Öğrenci var mı?
    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ error: "Öğrenci bulunamadı" });
    }

    // Seçilmek istenen ders var mı?
    const selectedCourse = await Course.findByPk(courseId);
    if (!selectedCourse) {
      return res.status(404).json({ error: "Ders bulunamadı" });
    }

    // Zaten kayıtlı mı?
    const alreadyEnrolled = await Enrollment.findOne({ where: { studentId, courseId } });
    if (alreadyEnrolled) {
      return res.status(400).json({ error: "Öğrenci bu dersi zaten seçmiş" });
    }

    // Çakışma kontrolü OR-Tools optimizasyonu tarafından yapılmaktadır.
    // Enrollment aşamasında çakışma kontrolü uygulanmaz.

    const newEnrollment = await Enrollment.create({
      studentId,
      courseId,
      isCapEnrollment: isCapEnrollment || false,
    });

    res.status(201).json({
      message: "Ders kaydı başarılı",
      enrollment: newEnrollment,
    });
  } catch (error) {
    console.error("createEnrollment hatası:", error);
    res.status(500).json({ error: "Ders seçimi yapılamadı" });
  }
};

// GET /api/enrollments/:studentId
exports.getStudentEnrollments = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findByPk(studentId);
    if (!student) return res.status(404).json({ error: "Öğrenci bulunamadı" });

    const enrollments = await Enrollment.findAll({
      where: { studentId },
      include: [
        {
          model: Course,
          include: [
            { model: Instructor, attributes: ["id", "name"] },
            { model: Classroom, attributes: ["id", "roomCode"] },
          ],
        },
      ],
      order: [[Course, "dayOfWeek", "ASC"], [Course, "startHour", "ASC"]],
    });

    res.status(200).json({
      student: { id: student.id, name: student.name, studentNo: student.studentNo },
      enrollments,
      total: enrollments.length,
    });
  } catch (error) {
    console.error("getStudentEnrollments hatası:", error);
    res.status(500).json({ error: "Öğrenci dersleri getirilemedi" });
  }
};

exports.updateEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findByPk(req.params.id);
    if (!enrollment) return res.status(404).json({ error: "Kayıt bulunamadı" });

    const { isCapEnrollment } = req.body;
    if (isCapEnrollment !== undefined) enrollment.isCapEnrollment = isCapEnrollment;

    await enrollment.save();
    res.status(200).json(enrollment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/enrollments/:id
exports.deleteEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findByPk(req.params.id);
    if (!enrollment) return res.status(404).json({ error: "Kayıt bulunamadı" });

    await enrollment.destroy();
    res.status(200).json({ message: "Ders bırakıldı" });
  } catch (error) {
    console.error("deleteEnrollment hatası:", error);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};