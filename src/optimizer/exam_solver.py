from ortools.sat.python import cp_model

EXAM_DAYS = list(range(10))
EXAM_SLOTS = [9, 11, 13, 15]
EXAM_DURATION = 2
MAX_EXAMS_PER_STUDENT_PER_DAY = 2

def run_exam_optimizer(courses, classrooms, enrollments):
    model = cp_model.CpModel()
    classroom_map = {r["id"]: r for r in classrooms}

    # ─── DEĞİŞKENLER ──────────────────────────────────────────────────────────
    assignments = {}
    for course in courses:
        cid = course["id"]
        for classroom in classrooms:
            rid = classroom["id"]
            if classroom["capacity"] < course["expectedStudents"]:
                continue
            for day in EXAM_DAYS:
                for slot in EXAM_SLOTS:
                    var = model.NewBoolVar(f"exam_c{cid}_r{rid}_d{day}_s{slot}")
                    assignments[(cid, rid, day, slot)] = var

    # ─── KISIT 1: Her ders tam olarak 1 slota atanmalı ────────────────────────
    for course in courses:
        cid = course["id"]
        slots = [var for (c, r, d, s), var in assignments.items() if c == cid]
        if not slots:
            print(f"UYARI: {course['code']} için uygun sınav slotu bulunamadı!")
            continue
        model.AddExactlyOne(slots)

    # ─── KISIT 2: Aynı derslik aynı anda iki sınav yapamaz ───────────────────
    for classroom in classrooms:
        rid = classroom["id"]
        for day in EXAM_DAYS:
            for slot in EXAM_SLOTS:
                overlapping = [
                    var for (c, r, d, s), var in assignments.items()
                    if r == rid and d == day and s == slot
                ]
                if len(overlapping) > 1:
                    model.AddAtMostOne(overlapping)

    # ─── KISIT 3: Aynı dönemdeki dersler aynı gün ve slotta sınav yapamaz ────
    semesters = set(c["semester"] for c in courses if c.get("semester") is not None)
    for sem in semesters:
        sem_ids = [c["id"] for c in courses if c.get("semester") == sem]
        for day in EXAM_DAYS:
            for slot in EXAM_SLOTS:
                overlapping = [
                    var for (c, r, d, s), var in assignments.items()
                    if c in sem_ids and d == day and s == slot
                ]
                if len(overlapping) > 1:
                    model.AddAtMostOne(overlapping)

    # ─── KISIT 4: Aynı hoca aynı anda iki sınavda olamaz ─────────────────────
    instructor_courses = {}
    for course in courses:
        iid = course.get("instructorId")
        if iid is None:
            continue
        if iid not in instructor_courses:
            instructor_courses[iid] = []
        instructor_courses[iid].append(course["id"])

    for iid, course_ids in instructor_courses.items():
        if len(course_ids) < 2:
            continue
        for day in EXAM_DAYS:
            for slot in EXAM_SLOTS:
                overlapping = [
                    var for (c, r, d, s), var in assignments.items()
                    if c in course_ids and d == day and s == slot
                ]
                if len(overlapping) > 1:
                    model.AddAtMostOne(overlapping)
                    print(f"Hoca {iid} çakışma kısıtı: Gün {day}, Slot {slot}, Dersler {course_ids}")

    # ─── KISIT 5: Öğrenci bazlı çakışma kontrolü ─────────────────────────────
    if enrollments:
        student_courses = {}
        for e in enrollments:
            sid = e["studentId"]
            cid = e["courseId"]
            if sid not in student_courses:
                student_courses[sid] = []
            student_courses[sid].append(cid)

        for sid, course_ids in student_courses.items():
            if len(course_ids) < 2:
                continue

            # Aynı gün aynı saatte iki sınav olamaz
            for day in EXAM_DAYS:
                for slot in EXAM_SLOTS:
                    same_slot_vars = []
                    for cid in course_ids:
                        for rid in [r["id"] for r in classrooms]:
                            key = (cid, rid, day, slot)
                            if key in assignments:
                                same_slot_vars.append(assignments[key])
                    if len(same_slot_vars) > 1:
                        model.AddAtMostOne(same_slot_vars)

            # Aynı gün max 2 sınav
            for day in EXAM_DAYS:
                day_vars = []
                for cid in course_ids:
                    for slot in EXAM_SLOTS:
                        for rid in [r["id"] for r in classrooms]:
                            key = (cid, rid, day, slot)
                            if key in assignments:
                                day_vars.append(assignments[key])
                if len(day_vars) > MAX_EXAMS_PER_STUDENT_PER_DAY:
                    model.Add(sum(day_vars) <= MAX_EXAMS_PER_STUDENT_PER_DAY)

    # ─── YUMUŞAK KISITLAR ─────────────────────────────────────────────────────
    preference_terms = []
    for (c, r, d, s), var in assignments.items():
        if s == 9:
            preference_terms.append(3 * var)
        elif s == 11:
            preference_terms.append(2 * var)
        elif s == 13:
            preference_terms.append(1 * var)

    if preference_terms:
        model.Maximize(sum(preference_terms))

    # ─── ÇÖZÜM ────────────────────────────────────────────────────────────────
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 30.0
    status = solver.Solve(model)

    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        exam_schedule = []
        for (cid, rid, day, slot), var in assignments.items():
            if solver.Value(var) == 1:
                course = next(c for c in courses if c["id"] == cid)
                classroom = classroom_map[rid]
                exam_schedule.append({
                    "courseId":      cid,
                    "courseCode":    course["code"],
                    "courseName":    course["name"],
                    "classroomId":   rid,
                    "roomCode":      classroom["roomCode"],
                    "examDay":       day + 1,
                    "startHour":     slot,
                    "endHour":       slot + EXAM_DURATION,
                    "semester":      course.get("semester"),
                })

        exam_schedule.sort(key=lambda x: (x["examDay"], x["startHour"]))
        print(f"✅ Sınav takvimi oluşturuldu: {len(exam_schedule)} sınav atandı")
        return exam_schedule
    else:
        print("❌ Sınav takvimi çözüm bulunamadı!")
        return []