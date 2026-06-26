// routes/instructorRoutes.js
const express = require("express");
const router = express.Router();
const instructorController = require("../controllers/instructorController");

router.post("/instructors", instructorController.createInstructor);
router.get("/instructors", instructorController.getInstructors);
router.put("/instructors/:id", instructorController.updateInstructor);
router.delete("/instructors/:id", instructorController.deleteInstructor);

module.exports = router;