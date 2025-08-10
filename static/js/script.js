document.addEventListener('DOMContentLoaded', () => {
    const addStudentForm = document.getElementById('addStudentForm');
    const attendanceTable = document.getElementById('attendanceTable');
    const scanForm = document.getElementById('scanForm');
    const markAllBtn = document.getElementById('markAllBtn');
    const sendAlertsBtn = document.getElementById('sendAlertsBtn');

    // Load attendance for index table
    function loadAttendance() {
        if (attendanceTable) {
            fetch('/attendance')
                .then(response => response.json())
                .then(data => {
                    const tbody = attendanceTable.querySelector('tbody');
                    tbody.innerHTML = '';
                    if (data.length > 0) {
                        data.forEach(row => {
                            const tr = document.createElement('tr');
                            tr.innerHTML = `
                                <td>${row.full_name || 'N/A'}</td>
                                <td>${row.date || 'N/A'}</td>
                                <td>${row.time || 'N/A'}</td>
                                <td>${row.status || 'N/A'}</td>
                            `;
                            tbody.appendChild(tr);
                        });
                        alert('Attendance marked successfully for listed students!');
                    } else {
                        tbody.innerHTML = '<tr><td colspan="4">No attendance records found.</td></tr>';
                    }
                })
                .catch(error => console.error('Error loading attendance:', error));
        }
    }

    // Load students for admin table
    function loadStudents() {
        if (addStudentForm) {
            fetch('/admin')
                .then(response => response.text())
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const tbody = doc.querySelector('table tbody');
                    document.querySelector('table tbody').innerHTML = tbody.innerHTML;
                })
                .catch(error => console.error('Error loading students:', error));
        }
    }

    // Scan attendance
    if (scanForm) {
        scanForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const matric_number = document.getElementById('matric_number').value.trim();
            if (!matric_number) {
                alert('Matric number is required');
                return;
            }

            fetch('/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `matric_number=${encodeURIComponent(matric_number)}`
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message || data.error);
                loadAttendance(); // Refresh attendance table
            })
            .catch(error => console.error('Error scanning attendance:', error));
            scanForm.reset();
        });
    }

    // Add student (admin page)
    if (addStudentForm) {
        addStudentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const matric_number = document.getElementById('matric_number').value.trim();
            const full_name = document.getElementById('full_name').value.trim();
            const parent_email = document.getElementById('parent_email').value.trim();

            console.log('Submitting:', { matric_number, full_name, parent_email });
            if (!matric_number || !full_name || !parent_email) {
                alert('All fields are required');
                return;
            }

            fetch('/add_student', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `matric_number=${encodeURIComponent(matric_number)}&full_name=${encodeURIComponent(full_name)}&parent_email=${encodeURIComponent(parent_email)}`
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message || data.error);
                if (data.message) loadStudents();
            })
            .catch(error => console.error('Error adding student:', error));
            addStudentForm.reset();
        });
    }

    // Mark all attendance
    if (markAllBtn) {
        markAllBtn.addEventListener('click', () => {
            fetch('/mark_all_attendance', { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    alert(data.message);
                    sendAlertsBtn.disabled = false; // Enable send alerts button
                    loadAttendance(); // Refresh attendance table
                })
                .catch(error => console.error('Error:', error));
        });
    }

    // Send absence alerts
    if (sendAlertsBtn) {
        sendAlertsBtn.addEventListener('click', () => {
            if (sendAlertsBtn.disabled) return; // Prevent action if disabled
            fetch('/send_absence_alerts', { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    alert(data.message);
                    loadAttendance(); // Refresh attendance table
                    sendAlertsBtn.disabled = true; // Disable after sending
                })
                .catch(error => console.error('Error:', error));
        });
    }

    // Initial load based on page
    if (addStudentForm) loadStudents();
    if (attendanceTable) loadAttendance();
});