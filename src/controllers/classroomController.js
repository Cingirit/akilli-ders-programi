const { Classroom, Course } = require("../models");

// POST /api/classrooms
exports.createClassroom = async (req, res) => {
  try {
    const { roomCode, capacity, isLab, building, hasProjector } = req.body;

    if (!roomCode || !capacity) {
      return res.status(400).json({ error: "roomCode ve capacity zorunludur" });
    }

    const classroom = await Classroom.create({
      roomCode,
      capacity,
      isLab: isLab || false,
      building: building || null,
      hasProjector: hasProjector !== undefined ? hasProjector : true,
    });

    res.status(201).json(classroom);
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ error: "Bu oda kodu zaten mevcut" });
    }
    res.status(500).json({ error: error.message });
  }
};

// GET /api/classrooms
exports.getClassrooms = async (req, res) => {
  try {
    const { isLab, minCapacity } = req.query;
    const where = {};
    if (isLab !== undefined) where.isLab = isLab === "true";
    if (minCapacity) where.capacity = { $gte: parseInt(minCapacity) };

    const classrooms = await Classroom.findAll({
      where,
      order: [["roomCode", "ASC"]],
    });
    res.status(200).json(classrooms);
  } catch (error) {
    res.status(500).json({ error: "Derslikler getirilemedi" });
  }
};

// PUT /api/classrooms/:id
exports.updateClassroom = async (req, res) => {
  try {
    const classroom = await Classroom.findByPk(req.params.id);
    if (!classroom) return res.status(404).json({ error: "Derslik bulunamadı" });

    const { roomCode, capacity, isLab, building, hasProjector, unavailableSlots } = req.body;
    if (roomCode !== undefined) classroom.roomCode = roomCode;
    if (capacity !== undefined) classroom.capacity = capacity;
    if (isLab !== undefined) classroom.isLab = isLab;
    if (building !== undefined) classroom.building = building;
    if (hasProjector !== undefined) classroom.hasProjector = hasProjector;
    if (unavailableSlots !== undefined) classroom.unavailableSlots = unavailableSlots;

    await classroom.save();
    res.status(200).json(classroom);
  } catch (error) {
    res.status(500).json({ error: "Güncelleme başarısız" });
  }
};

// DELETE /api/classrooms/:id
exports.deleteClassroom = async (req, res) => {
  try {
    const deleted = await Classroom.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: "Derslik bulunamadı" });
    res.status(200).json({ message: "Derslik silindi" });
  } catch (error) {
    res.status(500).json({ error: "Silme başarısız" });
  }
};