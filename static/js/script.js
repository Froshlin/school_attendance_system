document.addEventListener('DOMContentLoaded', () => {
    const addStudentForm = document.getElementById('addStudentForm');
    const attendanceTable = document.getElementById('attendanceTable');
    const scanForm = document.getElementById('scanForm');
    const sendAlertsBtn = document.getElementById('sendAlertsBtn');
    const editModal = document.getElementById('editModal');
    const editForm = document.getElementById('editStudentForm');
    const editId = document.getElementById('edit_id');
    const editMatric = document.getElementById('edit_matric_number');
    const editFullName = document.getElementById('edit_full_name');
    const editParentEmail = document.getElementById('edit_parent_email');

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
                                <td><button class="btn btn-danger btn-sm delete-attendance" data-id="${row.attendance_id}">Delete</button></td>
                            `;
                            tbody.appendChild(tr);
                        });
                        alert('Attendance marked successfully for listed students!');
                    } else {
                        tbody.innerHTML = '<tr><td colspan="5">No attendance records found.</td></tr>';
                    }
                    // Re-attach delete event listeners after loading
                    attachDeleteAttendanceListeners();
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
                    // Re-attach edit and delete event listeners after loading
                    attachEditDeleteListeners();
                })
                .catch(error => console.error('Error loading students:', error));
        }
    }

    // Attach edit and delete listeners
    function attachEditDeleteListeners() {
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const matric = e.target.dataset.matric;
                const fullname = e.target.dataset.fullname;
                const email = e.target.dataset.email;

                editId.value = id;
                editMatric.value = matric;
                editFullName.value = fullname;
                editParentEmail.value = email;

                const modal = new bootstrap.Modal(editModal); // Use editModal directly
                modal.show();
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                if (confirm('Are you sure you want to delete this student?')) {
                    fetch('/delete_student', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: `id=${encodeURIComponent(id)}`
                    })
                    .then(response => response.json())
                    .then(data => {
                        alert(data.message || data.error);
                        if (data.message) loadStudents();
                    })
                    .catch(error => console.error('Error deleting student:', error));
                }
            });
        });
    }

    // Attach delete listeners for attendance
    function attachDeleteAttendanceListeners() {
        document.querySelectorAll('.delete-attendance').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                if (confirm('Are you sure you want to delete this attendance record?')) {
                    fetch('/delete_attendance', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: `id=${encodeURIComponent(id)}`
                    })
                    .then(response => response.json())
                    .then(data => {
                        alert(data.message || data.error);
                        if (data.message) loadAttendance();
                    })
                    .catch(error => console.error('Error deleting attendance:', error));
                }
            });
        });
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

    // Edit student
    if (editForm) {
        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = editId.value;
            const matric_number = editMatric.value.trim();
            const full_name = editFullName.value.trim();
            const parent_email = editParentEmail.value.trim();

            console.log('Updating:', { id, matric_number, full_name, parent_email });
            if (!id || !matric_number || !full_name || !parent_email) {
                alert('All fields are required');
                return;
            }

            fetch('/edit_student', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `id=${encodeURIComponent(id)}&matric_number=${encodeURIComponent(matric_number)}&full_name=${encodeURIComponent(full_name)}&parent_email=${encodeURIComponent(parent_email)}`
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message || data.error);
                if (data.message) {
                    loadStudents();
                    const modal = bootstrap.Modal.getInstance(editModal); // Use editModal
                    modal.hide();
                }
            })
            .catch(error => console.error('Error editing student:', error));
        });
    }

    // Send absence alerts
    if (sendAlertsBtn) {
        sendAlertsBtn.addEventListener('click', () => {
            fetch('/send_absence_alerts', { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    alert(data.message);
                    loadAttendance(); // Refresh attendance table
                })
                .catch(error => console.error('Error:', error));
        });
    }

    // Initial load based on page
    if (addStudentForm) loadStudents();
    if (attendanceTable) loadAttendance();
    if (document.querySelectorAll('.edit-btn, .delete-btn').length > 0) attachEditDeleteListeners();
    if (document.querySelectorAll('.delete-attendance').length > 0) attachDeleteAttendanceListeners();
});