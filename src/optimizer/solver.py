from ortools.sat.python import cp_model

DAYS = [0, 1, 2, 3, 4]
HOURS = list(range(8, 19))

def run_optimizer(courses, classrooms, instructors, enrollments=[]):
    model = cp_model.CpModel()

    instructor_map = {i["id"]: i for i in instructors}
    classroom_map  = {r["id"]: r for r in classrooms}

    # ─── DEĞİŞKENLER ──────────────────────────────────────────────────────────
    assignments = {}
    for course in courses:
        cid = course["id"]
        dur = course["durationHours"]
        for classroom in classrooms:
            rid = classroom["id"]
            if classroom["capacity"] < course["expectedStudents"]:
                continue
            for day in DAYS:
                for hour in HOURS:
                    if hour + dur > 19:
                        continue
                    var = model.NewBoolVar(f"c{cid}_r{rid}_d{day}_h{hour}")
                    assignments[(cid, rid, day, hour)] = var

    # ─── ZORUNLU KISITLAR ─────────────────────────────────────────────────────

    # KISIT 1: Her ders tam olarak 1 slota atanmalı
    for course in courses:
        cid = course["id"]
        slots = [var for (c, r, d, h), var in assignments.items() if c == cid]
        if not slots:
            print(f"UYARI: {course['code']} için uygun slot bulunamadı!")
            continue
        model.AddExactlyOne(slots)

    # KISIT 2: Aynı derslik aynı anda iki ders alamaz
    for classroom in classrooms:
        rid = classroom["id"]
        for day in DAYS:
            for hour in HOURS:
                overlapping = []
                for course in courses:
                    cid = course["id"]
                    dur = course["durationHours"]
                    for start in HOURS:
                        if start <= hour < start + dur:
                            key = (cid, rid, day, start)
                            if key in assignments:
                                overlapping.append(assignments[key])
                if len(overlapping) > 1:
                    model.AddAtMostOne(overlapping)

    # KISIT 3: Aynı hoca aynı anda iki derse giremez
    for instructor in instructors:
        iid = instructor["id"]
        inst_courses = [c for c in courses if c["instructorId"] == iid]
        for day in DAYS:
            for hour in HOURS:
                overlapping = []
                for course in inst_courses:
                    cid = course["id"]
                    dur = course["durationHours"]
                    for start in HOURS:
                        if start <= hour < start + dur:
                            for (c, r, d, h), var in assignments.items():
                                if c == cid and d == day and h == start:
                                    overlapping.append(var)
                if len(overlapping) > 1:
                    model.AddAtMostOne(overlapping)

    # KISIT 4: Aynı dönemdeki dersler çakışamaz
    semesters = set(c["semester"] for c in courses if c["semester"] is not None)
    for sem in semesters:
        sem_courses = [c for c in courses if c["semester"] == sem]
        for day in DAYS:
            for hour in HOURS:
                overlapping = []
                for course in sem_courses:
                    cid = course["id"]
                    dur = course["durationHours"]
                    for start in HOURS:
                        if start <= hour < start + dur:
                            for (c, r, d, h), var in assignments.items():
                                if c == cid and d == day and h == start:
                                    overlapping.append(var)
                if len(overlapping) > 1:
                    model.AddAtMostOne(overlapping)

    # KISIT 5: Öğrenci bazlı çakışma kontrolü
    # Hem ÇAP öğrencileri hem de alttan ders alanlar için
    if enrollments:
        # Öğrenci → aldığı tüm dersler
        student_courses = {}
        student_cap_courses = {}

        for e in enrollments:
            sid = e["studentId"]
            cid = e["courseId"]
            is_cap = e.get("isCapEnrollment", False)

            if sid not in student_courses:
                student_courses[sid] = []
            student_courses[sid].append(cid)

            if is_cap:
                if sid not in student_cap_courses:
                    student_cap_courses[sid] = []
                student_cap_courses[sid].append(cid)

        for sid, course_ids in student_courses.items():
            if len(course_ids) < 2:
                continue

            cap_ids = student_cap_courses.get(sid, [])
            normal_ids = [c for c in course_ids if c not in cap_ids]

            # Tüm ders çiftleri için çakışma kontrolü
            # (ÇAP-normal, normal-normal farklı dönem, hepsi)
            for i in range(len(course_ids)):
                for j in range(i + 1, len(course_ids)):
                    cid_a = course_ids[i]
                    cid_b = course_ids[j]

                    course_a = next((c for c in courses if c["id"] == cid_a), None)
                    course_b = next((c for c in courses if c["id"] == cid_b), None)

                    if not course_a or not course_b:
                        continue

                    # Aynı dönemdeyse zaten KISIT 4 hallediyor, atla
                    if course_a.get("semester") == course_b.get("semester") and course_a.get("semester") is not None:
                        continue

                    print(f"Öğrenci {sid}: {course_a['code']} ↔ {course_b['code']} çakışma kısıtı eklendi")

                    # Bu iki ders aynı saatte olamaz
                    for day in DAYS:
                        for hour in HOURS:
                            vars_a = []
                            dur_a = course_a["durationHours"]
                            for start in HOURS:
                                if start <= hour < start + dur_a:
                                    for (c, r, d, h), var in assignments.items():
                                        if c == cid_a and d == day and h == start:
                                            vars_a.append(var)

                            vars_b = []
                            dur_b = course_b["durationHours"]
                            for start in HOURS:
                                if start <= hour < start + dur_b:
                                    for (c, r, d, h), var in assignments.items():
                                        if c == cid_b and d == day and h == start:
                                            vars_b.append(var)

                            for va in vars_a:
                                for vb in vars_b:
                                    model.AddAtMostOne([va, vb])

    # ─── YUMUŞAK KISITLAR ─────────────────────────────────────────────────────
    satisfaction_terms = []
    for course in courses:
        cid = course["id"]
        instructor = instructor_map.get(course["instructorId"])
        if not instructor:
            continue
        availability = instructor.get("availability", {})
        for (c, r, d, h), var in assignments.items():
            if c != cid:
                continue
            preferred_hours = availability.get(str(d), [])
            if h in preferred_hours:
                satisfaction_terms.append(10 * var)
            else:
                satisfaction_terms.append(-5 * var)

    if satisfaction_terms:
        model.Maximize(sum(satisfaction_terms))

    # ─── ÇÖZÜM ────────────────────────────────────────────────────────────────
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 60.0
    status = solver.Solve(model)

    DAY_NAMES = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"]

    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        schedule = []
        for (cid, rid, day, hour), var in assignments.items():
            if solver.Value(var) == 1:
                course = next(c for c in courses if c["id"] == cid)
                classroom = classroom_map[rid]
                schedule.append({
                    "courseId":      cid,
                    "courseCode":    course["code"],
                    "courseName":    course["name"],
                    "classroomId":   rid,
                    "roomCode":      classroom["roomCode"],
                    "dayOfWeek":     day,
                    "dayName":       DAY_NAMES[day],
                    "startHour":     hour,
                    "endHour":       hour + course["durationHours"],
                    "durationHours": course["durationHours"],
                    "isCap":         course["isCap"],
                })
        schedule.sort(key=lambda x: (x["dayOfWeek"], x["startHour"]))
        print(f"✅ Çözüm bulundu: {len(schedule)} ders atandı")
        return schedule
    else:
        print("❌ Çözüm bulunamadı!")
        return []