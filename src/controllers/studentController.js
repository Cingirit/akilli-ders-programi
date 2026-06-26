const { Student, Enrollment, Course } = require("../models");

// POST /api/students
exports.createStudent = async (req, res) => {
  try {
    const { studentNo, name, email, department, capDepartment, year } = req.body;

    if (!studentNo || !name) {
      return res.status(400).json({ error: "studentNo ve name zorunludur" });
    }

    const student = await Student.create({
      studentNo,
      name,
      email: email || null,
      department: department || null,
      capDepartment: capDepartment || null,
      year: year || null,
    });

    res.status(201).json(student);
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ error: "Bu öğrenci numarası zaten kayıtlı" });
    }
    res.status(500).json({ error: error.message });
  }
};

// GET /api/students
exports.getStudents = async (req, res) => {
  try {
    const students = await Student.findAll({
      order: [["studentNo", "ASC"]],
    });
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ error: "Öğrenciler getirilemedi" });
  }
};

// GET /api/students/:id
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id, {
      include: [{ model: Enrollment, include: [Course] }],
    });
    if (!student) return res.status(404).json({ error: "Öğrenci bulunamadı" });
    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/students/:id
exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) return res.status(404).json({ error: "Öğrenci bulunamadı" });

    const { studentNo, name, email, department, capDepartment, year } = req.body;
    if (studentNo !== undefined) student.studentNo = studentNo;
    if (name !== undefined) student.name = name;
    if (email !== undefined) student.email = email;
    if (department !== undefined) student.department = department;
    if (capDepartment !== undefined) student.capDepartment = capDepartment;
    if (year !== undefined) student.year = year;

    await student.save();
    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({ error: "Güncelleme başarısız" });
  }
};

// DELETE /api/students/:id
exports.deleteStudent = async (req, res) => {
  try {
    const deleted = await Student.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: "Öğrenci bulunamadı" });
    res.status(200).json({ message: "Öğrenci silindi" });
  } catch (error) {
    res.status(500).json({ error: "Silme başarısız" });
  }
};