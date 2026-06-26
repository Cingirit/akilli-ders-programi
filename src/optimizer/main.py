from fastapi import FastAPI
from fastapi.responses import Response
from pydantic import BaseModel
from typing import List, Optional
from solver import run_optimizer
from exam_solver import run_exam_optimizer
from exporter import generate_excel

app = FastAPI(title="Ders Programı Optimizer", version="1.0")

class Instructor(BaseModel):
    id: int
    name: str
    availability: dict
    maxWeeklyHours: int = 20

class Classroom(BaseModel):
    id: int
    roomCode: str
    capacity: int
    isLab: bool = False

class Course(BaseModel):
    id: int
    code: str
    name: str
    expectedStudents: int
    durationHours: int = 2
    weeklyHours: int = 2
    semester: Optional[int] = None
    isCap: bool = False
    instructorId: int
    classroomId: Optional[int] = None

class Enrollment(BaseModel):
    studentId: int
    courseId: int
    isCapEnrollment: bool = False

class OptimizeRequest(BaseModel):
    courses: List[Course]
    classrooms: List[Classroom]
    instructors: List[Instructor]
    enrollments: List[Enrollment] = []

class ExamOptimizeRequest(BaseModel):
    courses: List[Course]
    classrooms: List[Classroom]
    enrollments: List[Enrollment] = []

class ExportRequest(BaseModel):
    schedule: list = []
    examSchedule: list = []

@app.get("/")
def root():
    return {"status": "ok", "message": "Optimizer servisi çalışıyor 🚀"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/optimize")
def optimize(req: OptimizeRequest):
    try:
        result = run_optimizer(
            courses=[c.dict() for c in req.courses],
            classrooms=[r.dict() for r in req.classrooms],
            instructors=[i.dict() for i in req.instructors],
            enrollments=[e.dict() for e in req.enrollments],
        )
        return {"status": "ok", "schedule": result}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/optimize/exam")
def optimize_exam(req: ExamOptimizeRequest):
    try:
        result = run_exam_optimizer(
            courses=[c.dict() for c in req.courses],
            classrooms=[r.dict() for r in req.classrooms],
            enrollments=[e.dict() for e in req.enrollments],
        )
        return {"status": "ok", "examSchedule": result}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/export/excel")
def export_excel(req: ExportRequest):
    try:
        excel_bytes = generate_excel(req.schedule, req.examSchedule)
        return Response(
            content=excel_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=ders_programi.xlsx"}
        )
    except Exception as e:
        return {"status": "error", "message": str(e)}