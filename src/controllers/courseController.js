const { Course, Instructor, Classroom } = require("../models");

// POST /api/courses
exports.createCourse = async (req, res) => {
  try {
    const {
      name,
      code,
      expectedStudents,
      durationHours,
      weeklyHours,
      semester,
      isCap,
      InstructorId,
      ClassroomId,
    } = req.body;

    // Zorunlu alan kontrolü
    if (!name || !code || !InstructorId) {
      return res.status(400).json({ error: "name, code ve InstructorId zorunludur" });
    }

    // Hoca var mı?
    const instructor = await Instructor.findByPk(InstructorId);
    if (!instructor) {
      return res.status(404).json({ error: "Belirtilen hoca bulunamadı" });
    }

    // Derslik belirtildiyse var mı ve kapasitesi yeterli mi?
    if (ClassroomId) {
      const classroom = await Classroom.findByPk(ClassroomId);
      if (!classroom) {
        return res.status(404).json({ error: "Belirtilen derslik bulunamadı" });
      }
      if (expectedStudents && classroom.capacity < expectedStudents) {
        return res.status(400).json({
          error: `Derslik kapasitesi (${classroom.capacity}) yetersiz (${expectedStudents} öğrenci)`,
        });
      }
    }

    const newCourse = await Course.create({
      name,
      code,
      expectedStudents: expectedStudents || 0,
      durationHours: durationHours || 2,
      weeklyHours: weeklyHours || 2,
      semester: semester || null,
      isCap: isCap || false,
      InstructorId,
      ClassroomId: ClassroomId || null,
      // dayOfWeek ve startHour OR-Tools tarafından atanacak, şimdilik null
    });

    // İlişkili verilerle birlikte döndür
    const result = await Course.findByPk(newCourse.id, {
      include: [Instructor, Classroom],
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("createCourse hatası:", error);
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ error: "Bu ders kodu zaten mevcut" });
    }
    res.status(500).json({ error: error.message });
  }
};

// GET /api/courses
exports.getCourses = async (req, res) => {
  try {
    const { semester, isCap, InstructorId } = req.query;

    const where = {};
    if (semester) where.semester = semester;
    if (isCap !== undefined) where.isCap = isCap === "true";
    if (InstructorId) where.InstructorId = InstructorId;

    const courses = await Course.findAll({
      where,
      include: [
        { model: Instructor, attributes: ["id", "name", "email"] },
        { model: Classroom, attributes: ["id", "roomCode", "capacity"] },
      ],
      order: [["semester", "ASC"], ["code", "ASC"]],
    });

    res.status(200).json(courses);
  } catch (error) {
    console.error("getCourses hatası:", error);
    res.status(500).json({ error: "Dersler getirilemedi" });
  }
};

// GET /api/courses/:id
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id, {
      include: [Instructor, Classroom],
    });
    if (!course) return res.status(404).json({ error: "Ders bulunamadı" });
    res.status(200).json(course);
  } catch (error) {
    console.error("getCourseById hatası:", error);
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/courses/:id
exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, code, expectedStudents, durationHours,
      weeklyHours, semester, isCap, InstructorId, ClassroomId,
      // OR-Tools tarafından da güncellenebilir:
      dayOfWeek, startHour,
    } = req.body;

    const course = await Course.findByPk(id);
    if (!course) return res.status(404).json({ error: "Ders bulunamadı" });

    // Sadece gönderilen alanları güncelle
    if (name !== undefined) course.name = name;
    if (code !== undefined) course.code = code;
    if (expectedStudents !== undefined) course.expectedStudents = expectedStudents;
    if (durationHours !== undefined) course.durationHours = durationHours;
    if (weeklyHours !== undefined) course.weeklyHours = weeklyHours;
    if (semester !== undefined) course.semester = semester;
    if (isCap !== undefined) course.isCap = isCap;
    if (InstructorId !== undefined) course.InstructorId = InstructorId;
    if (ClassroomId !== undefined) course.ClassroomId = ClassroomId;
    if (dayOfWeek !== undefined) course.dayOfWeek = dayOfWeek;
    if (startHour !== undefined) course.startHour = startHour;

    await course.save();

    const result = await Course.findByPk(id, { include: [Instructor, Classroom] });
    res.status(200).json(result);
  } catch (error) {
    console.error("updateCourse hatası:", error);
    res.status(500).json({ error: "Güncelleme başarısız" });
  }
};

// DELETE /api/courses/:id
exports.deleteCourse = async (req, res) => {
  try {
    const deleted = await Course.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: "Ders bulunamadı" });
    res.status(200).json({ message: "Ders silindi" });
  } catch (error) {
    console.error("deleteCourse hatası:", error);
    res.status(500).json({ error: "Silme işlemi başarısız" });
  }
};