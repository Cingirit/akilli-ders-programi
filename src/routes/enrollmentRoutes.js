const express = require("express");
const router = express.Router();
const enrollmentController = require("../controllers/enrollmentController");

router.post("/enrollments", enrollmentController.createEnrollment);
router.get("/enrollments/:studentId", enrollmentController.getStudentEnrollments);
router.delete('/enrollments/:id', enrollmentController.deleteEnrollment);
router.put("/enrollments/:id", enrollmentController.updateEnrollment);

module.exports = router;