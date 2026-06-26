const express = require("express");
const router = express.Router();
const axios = require("axios");
const { Course, Instructor, Classroom, Enrollment, ScheduleEntry, ExamSchedule } = require("../models");

const OPTIMIZER_URL = process.env.OPTIMIZER_URL || "http://localhost:8001";

// POST /api/optimize/run
router.post("/optimize/run", async (req, res) => {
  try {
    const { semesterLabel } = req.body;

    const courses     = await Course.findAll({ include: [Instructor, Classroom] });
    const classrooms  = await Classroom.findAll();
    const instructors = await Instructor.findAll();
    const enrollments = await Enrollment.findAll(); // ÇAP kısıtı için

    if (courses.length === 0)     return res.status(400).json({ error: "Sistemde hiç ders yok" });
    if (classrooms.length === 0)  return res.status(400).json({ error: "Sistemde hiç derslik yok" });
    if (instructors.length === 0) return res.status(400).json({ error: "Sistemde hiç öğretim üyesi yok" });

    const payload = {
      courses: courses.map((c) => ({
        id: c.id, code: c.code, name: c.name,
        expectedStudents: c.expectedStudents, durationHours: c.durationHours || 2,
        weeklyHours: c.weeklyHours || 2, semester: c.semester,
        isCap: c.isCap, instructorId: c.InstructorId, classroomId: c.ClassroomId,
      })),
      classrooms: classrooms.map((r) => ({
        id: r.id, roomCode: r.roomCode, capacity: r.capacity, isLab: r.isLab,
      })),
      instructors: instructors.map((i) => ({
        id: i.id, name: i.name,
        availability: i.availability || {
          "0":[9,10,11,13,14,15],"1":[9,10,11,13,14,15],
          "2":[9,10,11,13,14,15],"3":[9,10,11,13,14,15],"4":[9,10,11,13,14,15],
        },
        maxWeeklyHours: i.maxWeeklyHours || 20,
      })),
      enrollments: enrollments.map((e) => ({
        studentId: e.studentId,
        courseId: e.courseId,
        isCapEnrollment: e.isCapEnrollment || false,
      })),
    };

    const response = await axios.post(`${OPTIMIZER_URL}/optimize`, payload, { timeout: 60000 });
    if (response.data.status === "error") return res.status(500).json({ error: response.data.message });

    const schedule = response.data.schedule;
    if (!schedule || schedule.length === 0) return res.status(400).json({ error: "Optimizasyon çözüm bulamadı" });

    await ScheduleEntry.destroy({ where: {} });
    for (const item of schedule) {
      await ScheduleEntry.create({
        courseId: item.courseId, classroomId: item.classroomId,
        dayOfWeek: item.dayOfWeek, startHour: item.startHour,
        durationHours: item.durationHours, semesterLabel: semesterLabel || null,
      });
    }

    res.status(200).json({ message: `${schedule.length} ders başarıyla programlandı`, schedule });
  } catch (error) {
    if (error.code === "ECONNREFUSED") return res.status(503).json({ error: "Python optimizer servisi çalışmıyor." });
    res.status(500).json({ error: error.message });
  }
});

// GET /api/optimize/schedule
router.get("/optimize/schedule", async (req, res) => {
  try {
    const DAY_NAMES = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"];
    const entries = await ScheduleEntry.findAll({
      include: [
        { model: Course, include: [{ model: Instructor, attributes: ["id", "name"] }] },
        { model: Classroom, attributes: ["id", "roomCode", "capacity"] },
      ],
      order: [["dayOfWeek", "ASC"], ["startHour", "ASC"]],
    });

    const schedule = entries.map((e) => ({
      id: e.id, courseId: e.courseId, code: e.Course?.code, name: e.Course?.name,
      semester: e.Course?.semester, instructor: e.Course?.Instructor?.name,
      classroom: e.Classroom?.roomCode, dayOfWeek: e.dayOfWeek,
      dayName: DAY_NAMES[e.dayOfWeek], startHour: e.startHour,
      endHour: e.startHour + e.durationHours, durationHours: e.durationHours,
      semesterLabel: e.semesterLabel,
    }));

    res.status(200).json({ schedule, total: schedule.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/optimize/exam
router.post("/optimize/exam", async (req, res) => {
  try {
    const { examPeriodLabel } = req.body;
    const courses     = await Course.findAll();
    const classrooms  = await Classroom.findAll();
    const enrollments = await Enrollment.findAll();

    if (courses.length === 0) return res.status(400).json({ error: "Sistemde hiç ders yok" });

    const payload = {
      courses: courses.map((c) => ({
        id: c.id, code: c.code, name: c.name,
        expectedStudents: c.expectedStudents, durationHours: c.durationHours || 2,
        weeklyHours: c.weeklyHours || 2, semester: c.semester,
        isCap: c.isCap, instructorId: c.InstructorId, classroomId: c.ClassroomId,
      })),
      classrooms: classrooms.map((r) => ({ id: r.id, roomCode: r.roomCode, capacity: r.capacity, isLab: r.isLab })),
      enrollments: enrollments.map((e) => ({
        studentId: e.studentId, courseId: e.courseId,
        isCapEnrollment: e.isCapEnrollment || false,
      })),
    };

    const response = await axios.post(`${OPTIMIZER_URL}/optimize/exam`, payload, { timeout: 60000 });
    if (response.data.status === "error") return res.status(500).json({ error: response.data.message });

    const examSchedule = response.data.examSchedule;
    if (!examSchedule || examSchedule.length === 0) return res.status(400).json({ error: "Sınav takvimi oluşturulamadı" });

    await ExamSchedule.destroy({ where: {} });
    for (const exam of examSchedule) {
      await ExamSchedule.create({
        courseId: exam.courseId, classroomId: exam.classroomId,
        examDay: exam.examDay, startHour: exam.startHour,
        endHour: exam.endHour, examPeriodLabel: examPeriodLabel || null,
      });
    }

    res.status(200).json({ message: `${examSchedule.length} sınav başarıyla planlandı`, examSchedule });
  } catch (error) {
    if (error.code === "ECONNREFUSED") return res.status(503).json({ error: "Python optimizer servisi çalışmıyor." });
    res.status(500).json({ error: error.message });
  }
});

// GET /api/optimize/exam/schedule
router.get("/optimize/exam/schedule", async (req, res) => {
  try {
    const exams = await ExamSchedule.findAll({
      include: [
        { model: Course, include: [{ model: Instructor, attributes: ["id", "name"] }] },
        { model: Classroom, attributes: ["id", "roomCode"] },
      ],
      order: [["examDay", "ASC"], ["startHour", "ASC"]],
    });

    const schedule = exams.map((e) => ({
      id: e.id, courseId: e.courseId, code: e.Course?.code, name: e.Course?.name,
      semester: e.Course?.semester, instructor: e.Course?.Instructor?.name,
      classroom: e.Classroom?.roomCode, examDay: e.examDay,
      startHour: e.startHour, endHour: e.endHour, examPeriodLabel: e.examPeriodLabel,
    }));

    res.status(200).json({ schedule, total: schedule.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// GET /api/export/excel
router.get("/export/excel", async (req, res) => {
  try {
    const [scheduleRes, examRes] = await Promise.all([
      ScheduleEntry.findAll({
        include: [
          { model: Course, include: [{ model: Instructor, attributes: ["id", "name"] }] },
          { model: Classroom, attributes: ["id", "roomCode"] },
        ],
        order: [["dayOfWeek", "ASC"], ["startHour", "ASC"]],
      }),
      ExamSchedule.findAll({
        include: [
          { model: Course, include: [{ model: Instructor, attributes: ["id", "name"] }] },
          { model: Classroom, attributes: ["id", "roomCode"] },
        ],
        order: [["examDay", "ASC"], ["startHour", "ASC"]],
      }),
    ]);

    const schedule = scheduleRes.map((e) => ({
      code: e.Course?.code, name: e.Course?.name,
      dayOfWeek: e.dayOfWeek, startHour: e.startHour,
      endHour: e.startHour + e.durationHours, durationHours: e.durationHours,
      classroom: e.Classroom?.roomCode, instructor: e.Course?.Instructor?.name,
    }));

    const examSchedule = examRes.map((e) => ({
      examDay: e.examDay, startHour: e.startHour, endHour: e.endHour,
      code: e.Course?.code, name: e.Course?.name,
      classroom: e.Classroom?.roomCode, instructor: e.Course?.Instructor?.name,
    }));

    const response = await axios.post(
      `${OPTIMIZER_URL}/export/excel`,
      { schedule, examSchedule },
      { responseType: "arraybuffer", timeout: 30000 }
    );

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=ders_programi.xlsx");
    res.send(Buffer.from(response.data));
  } catch (error) {
    console.error("Excel export hatası:", error.message);
    res.status(500).json({ error: "Excel oluşturulamadı" });
  }
});

module.exports = router;