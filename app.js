// ==== Firebase Config (replace with your own config) ====
const firebaseConfig = {
    databaseURL: "https://muhammadhamza-8f6f1-default-rtdb.firebaseio.com/"
};

// ==== Firebase REST API base ====
const DB_URL = firebaseConfig.databaseURL + "/schoolData.json";

// ==== Simple login and dashboard logic ====
if (window.location.pathname.endsWith("index.html") || window.location.pathname.endsWith("/")) {
    // Login toggle logic
    const studentLoginBtn = document.getElementById("studentLoginBtn");
    const teacherLoginBtn = document.getElementById("teacherLoginBtn");
    const loginForm = document.getElementById("loginForm");
    const teacherLoginForm = document.getElementById("teacherLoginForm");
    studentLoginBtn.onclick = function() {
        studentLoginBtn.classList.add("active");
        teacherLoginBtn.classList.remove("active");
        loginForm.style.display = "block";
        teacherLoginForm.style.display = "none";
        document.getElementById("loginError").textContent = "";
    };
    teacherLoginBtn.onclick = function() {
        teacherLoginBtn.classList.add("active");
        studentLoginBtn.classList.remove("active");
        loginForm.style.display = "none";
        teacherLoginForm.style.display = "block";
        document.getElementById("loginError").textContent = "";
    };

    // Student login logic
    loginForm.onsubmit = async function(e) {
        e.preventDefault();
        const input = document.getElementById("studentName").value.trim();
        const cnic = document.getElementById("fatherCnic").value.trim();
        document.getElementById("loginError").textContent = "";
        try {
            const res = await fetch(DB_URL);
            const data = await res.json();
            const students = data.students || [];
            const student = students.find(s => (s.Name === input || String(s.ID) === input) && s.FatherCNIC === cnic);
            if (student) {
                localStorage.setItem("role", "student");
                localStorage.setItem("studentId", student.ID);
                localStorage.setItem("studentName", student.Name);
                window.location = "dashboard.html";
            } else {
                document.getElementById("loginError").textContent = "Invalid name/ID or father CNIC.";
            }
        } catch (err) {
            document.getElementById("loginError").textContent = "Error connecting to server.";
        }
    }
    // Teacher login logic
    teacherLoginForm.onsubmit = async function(e) {
        e.preventDefault();
        const id = document.getElementById("teacherId").value.trim();
        const cnic = document.getElementById("teacherCnic").value.trim();
        document.getElementById("loginError").textContent = "";
        try {
            const res = await fetch(DB_URL);
            const data = await res.json();
            const teachers = data.teachers || [];
            const teacher = teachers.find(t => (String(t.ID) === id || t.Name === id) && (t.CNIC === cnic));
            if (teacher) {
                localStorage.setItem("role", "teacher");
                localStorage.setItem("teacherId", teacher.ID);
                localStorage.setItem("teacherName", teacher.Name);
                window.location = "teacher_dashboard.html";
            } else {
                document.getElementById("loginError").textContent = "Invalid teacher ID/name or CNIC.";
            }
        } catch (err) {
            document.getElementById("loginError").textContent = "Error connecting to server.";
        }
    }
}

if (window.location.pathname.endsWith("dashboard.html")) {
    // Dashboard logic for students only
    const studentId = localStorage.getItem("studentId");
    const studentName = localStorage.getItem("studentName");
    const userRole = localStorage.getItem("role");
    if (!studentId && !userRole) {
        window.location = "index.html";
    }
    const isStudent = userRole === "student";
    if (isStudent) {
        document.getElementById("studentNameDisplay").textContent = studentName;
        document.getElementById("studentSection").style.display = "block";

        // Section navigation logic
        const sections = ["Summary", "Info", "Attendance", "Fee", "Exam", "Homework"];
        function showSection(name) {
            sections.forEach(sec => {
                document.getElementById("section" + sec).classList.remove("active");
                document.getElementById("btn" + sec).classList.remove("active");
            });
            document.getElementById("section" + name).classList.add("active");
            document.getElementById("btn" + name).classList.add("active");
        }
        sections.forEach(sec => {
            document.getElementById("btn" + sec).onclick = () => showSection(sec);
        });
        showSection("Summary"); // Show summary by default

        // Exam term filter logic
        let currentTerm = "First Term";
        const termButtons = [
            { id: "termFirst", term: "First Term" },
            { id: "termSecond", term: "Second Term" },
            { id: "termFinal", term: "Final Term" }
        ];
        termButtons.forEach(btn => {
            const el = document.getElementById(btn.id);
            if (el) {
                el.onclick = function() {
                    termButtons.forEach(b => document.getElementById(b.id).classList.remove("active"));
                    el.classList.add("active");
                    currentTerm = btn.term;
                    renderExamTable();
                };
            }
        });

        let allExamRecords = [];
        function renderExamTable() {
            let filtered = allExamRecords.filter(e => (e.Term || "").toLowerCase() === currentTerm.toLowerCase());
            // Calculate overall marks and percentage for this term
            let totalObtained = 0, totalMarks = 0;
            filtered.forEach(e => {
                totalObtained += Number(e.ObtainedMarks) || 0;
                totalMarks += Number(e.TotalMarks) || 0;
            });
            let percent = totalMarks > 0 ? ((totalObtained / totalMarks) * 100).toFixed(2) : "0.00";
            document.getElementById("examStats").innerHTML = `<b>Total Marks:</b> ${totalObtained} / ${totalMarks} &nbsp; <b>Percentage:</b> ${percent}%`;
            document.getElementById("examTable").innerHTML = arrayToTable(filtered, ["SubjectName","Term","ObtainedMarks","TotalMarks","Grade"]);
        }

        fetch(DB_URL)
            .then(res => res.json())
            .then(data => {
                const students = data.students || [];
                const student = students.find(s => s.ID == studentId);
                if (!student) {
                    document.getElementById("studentInfo").innerHTML = "Student not found.";
                    return;
                }
                // Student Info
                document.getElementById("studentInfo").innerHTML = `
                    <b>Roll No:</b> ${student.RollNo}<br>
                    <b>Father Name:</b> ${student.FName}<br>
                    <b>Class:</b> ${student.CurrentClass}<br>
                    <b>Section:</b> ${student.Section || ''}<br>
                `;
                // Attendance
                const attendance = (data.attendance || []).filter(a => a.StudentID == studentId);
                document.getElementById("attendanceTable").innerHTML = arrayToTable(attendance, ["Date","Slot","Status"]);
                // Fee
                const fee = (data.feeRecords || []).filter(f => f.StudentID == studentId);
                document.getElementById("feeTable").innerHTML = arrayToTable(fee, ["Month","Year","MonthlyFee","PaidAmount","Dues","TotalDues"]);
                // Exam
                allExamRecords = (data.examRecords || []).filter(e => e.StudentID == studentId);
                renderExamTable();
                // Homework (by class)
                const homework = (data.homework || []).filter(h => h.ClassName === student.CurrentClass);
                document.getElementById("homeworkTable").innerHTML = arrayToTable(homework, ["SubjectName","Description","AssignDate","DueDate"]);
                // Summary
                let totalAttendance = attendance.length;
                let present = attendance.filter(a => a.Status && a.Status.toLowerCase() === "present").length;
                let absent = attendance.filter(a => a.Status && a.Status.toLowerCase() === "absent").length;
                let feePaid = fee.reduce((sum, f) => sum + (Number(f.PaidAmount) || 0), 0);
                let feeDue = fee.reduce((sum, f) => sum + (Number(f.Dues) || 0), 0);
                let examTotal = allExamRecords.reduce((sum, e) => sum + (Number(e.ObtainedMarks) || 0), 0);
                let examMax = allExamRecords.reduce((sum, e) => sum + (Number(e.TotalMarks) || 0), 0);
                let examPercent = examMax > 0 ? ((examTotal / examMax) * 100).toFixed(2) : "0.00";
                document.getElementById("summaryContent").innerHTML = `
                    <div class="summary-box">
                        <div><b>Attendance:</b> ${present} / ${totalAttendance} Present, ${absent} Absent</div>
                        <div><b>Fee Paid:</b> Rs. ${feePaid.toLocaleString()} &nbsp; <b>Due:</b> Rs. ${feeDue.toLocaleString()}</div>
                        <div><b>Exam:</b> ${examTotal} / ${examMax} Marks &nbsp; <b>Overall %:</b> ${examPercent}%</div>
                    </div>
                `;
            });
    }
}

if (window.location.pathname.endsWith("teacher_dashboard.html")) {
    const teacherId = localStorage.getItem("teacherId");
    const teacherName = localStorage.getItem("teacherName");
    document.getElementById("teacherNameDisplay").textContent = teacherName || "Teacher";
    function logout() {
        localStorage.clear();
        window.location = "index.html";
    }
    window.logout = logout;
    // Section navigation logic
    const tSections = ["Info", "Salary", "Attendance", "Timetable"];
    function showTSection(name) {
        tSections.forEach(sec => {
            document.getElementById("sectionTeacher" + sec).classList.remove("active");
            document.getElementById("btnTeacher" + sec).classList.remove("active");
        });
        document.getElementById("sectionTeacher" + name).classList.add("active");
        document.getElementById("btnTeacher" + name).classList.add("active");
    }
    tSections.forEach(sec => {
        const btn = document.getElementById("btnTeacher" + sec);
        if (btn) btn.onclick = () => showTSection(sec);
    });
    showTSection("Info");
    // Fetch and display teacher data
    fetch(DB_URL)
        .then(res => res.json())
        .then(data => {
            const teachers = data.teachers || [];
            const teacher = teachers.find(t => String(t.ID) === teacherId);
            if (!teacher) {
                document.getElementById("teacherInfo").innerHTML = "Teacher not found.";
                return;
            }
            // Info Section
            document.getElementById("teacherInfo").innerHTML = `
                <b>ID:</b> ${teacher.ID}<br>
                <b>Name:</b> ${teacher.Name}<br>
                <b>CNIC:</b> ${teacher.CNIC}<br>
                <b>Phone:</b> ${teacher.Phone || ''}<br>
                <b>Address:</b> ${teacher.Address || ''}<br>
            `;
            // Salary Section
            document.getElementById("teacherSalary").innerHTML = `<b>Salary:</b> Rs. ${teacher.Salary?.toLocaleString() || 0}`;
            document.getElementById("teacherAdvance").innerHTML = `<b>Advance:</b> Rs. ${teacher.Advance?.toLocaleString() || 0}`;
            document.getElementById("teacherDeductions").innerHTML = `<b>Deductions:</b> Rs. ${teacher.Deductions?.toLocaleString() || 0}`;
            document.getElementById("teacherAllowance").innerHTML = `<b>Allowance:</b> Rs. ${teacher.Allowance?.toLocaleString() || 0}`;
            // Attendance Section
            const teacherAttendance = (data.teacherAttendance || []).filter(a => String(a.TeacherID) === teacherId);
            document.getElementById("teacherAttendanceTable").innerHTML = arrayToTable(teacherAttendance, ["Date","MorningStatus","AfternoonStatus","Time"]);
            // Timetable Section
            const timetable = (data.classSubjects || []).filter(s => String(s.TeacherID) === teacherId);
            document.getElementById("teacherTimetable").innerHTML = arrayToTable(timetable, ["ClassName","SubjectName","Day","StartTime","EndTime","Section"]);
        })
        .catch(() => {
            document.getElementById("teacherInfo").innerHTML = "Unable to load data.";
        });
}

// Dark mode toggle functionality
function initTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    const themeToggle = document.createElement('button');
    themeToggle.className = 'theme-toggle';
    themeToggle.innerHTML = theme === 'dark' ? '☀️' : '🌙';
    themeToggle.onclick = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeToggle.innerHTML = newTheme === 'dark' ? '☀️' : '🌙';
    };
    document.body.appendChild(themeToggle);
}

if (window.location.pathname.endsWith('dashboard.html') || 
    window.location.pathname.endsWith('teacher_dashboard.html') ||
    window.location.pathname.endsWith('index.html')) {
    initTheme();
}

function arrayToTable(arr, cols) {
    if (!arr || arr.length === 0) return "<i>No records found.</i>";
    let html = '<table><tr>' + cols.map(c => `<th>${c}</th>`).join('') + '</tr>';
    for (const row of arr) {
        html += '<tr>' + cols.map(c => `<td>${row[c] ?? ''}</td>`).join('') + '</tr>';
    }
    html += '</table>';
    return html;
}
