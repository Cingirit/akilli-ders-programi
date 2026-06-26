// routes/classroomRoutes.js
const express = require("express");
const router = express.Router();
const classroomController = require("../controllers/classroomController");

router.post("/classrooms", classroomController.createClassroom);
router.get("/classrooms", classroomController.getClassrooms);
router.put("/classrooms/:id", classroomController.updateClassroom);
router.delete("/classrooms/:id", classroomController.deleteClassroom);

module.exports = router;