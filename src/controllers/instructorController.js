const { Instructor, Course, Classroom } = require("../models");

// POST /api/instructors
exports.createInstructor = async (req, res) => {
  try {
    const { name, email, availability, maxWeeklyHours, department } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "name ve email zorunludur" });
    }

    const instructor = await Instructor.create({
      name,
      email,
      availability: availability || null,
      maxWeeklyHours: maxWeeklyHours || 20,
      department: department || null,
    });

    res.status(201).json(instructor);
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ error: "Bu e-posta zaten kayıtlı" });
    }
    res.status(500).json({ error: error.message });
  }
};

// GET /api/instructors
exports.getInstructors = async (req, res) => {
  try {
    const instructors = await Instructor.findAll({
      include: [{ model: Course, attributes: ["id", "code", "name"] }],
      order: [["name", "ASC"]],
    });
    res.status(200).json(instructors);
  } catch (error) {
    res.status(500).json({ error: "Hocalar getirilemedi" });
  }
};

// PUT /api/instructors/:id
exports.updateInstructor = async (req, res) => {
  try {
    const instructor = await Instructor.findByPk(req.params.id);
    if (!instructor) return res.status(404).json({ error: "Hoca bulunamadı" });

    const { name, email, availability, maxWeeklyHours, department } = req.body;
    if (name !== undefined) instructor.name = name;
    if (email !== undefined) instructor.email = email;
    if (availability !== undefined) instructor.availability = availability;
    if (maxWeeklyHours !== undefined) instructor.maxWeeklyHours = maxWeeklyHours;
    if (department !== undefined) instructor.department = department;

    await instructor.save();
    res.status(200).json(instructor);
  } catch (error) {
    res.status(500).json({ error: "Güncelleme başarısız" });
  }
};

// DELETE /api/instructors/:id
exports.deleteInstructor = async (req, res) => {
  try {
    const deleted = await Instructor.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: "Hoca bulunamadı" });
    res.status(200).json({ message: "Hoca silindi" });
  } catch (error) {
    res.status(500).json({ error: "Silme başarısız" });
  }
};