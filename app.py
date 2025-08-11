from flask import Flask, request, jsonify, render_template
import sqlite3
import configparser
import smtplib
from email.mime.text import MIMEText
from datetime import datetime
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64

app = Flask(__name__)

# Load configuration
config = configparser.ConfigParser()
config.read('config.ini')

# Database connection function
def get_db():
    conn = sqlite3.connect('attendance.db')  # Use file-based database
    conn.execute('PRAGMA foreign_keys = ON')
    conn.row_factory = sqlite3.Row
    return conn, conn.cursor()

# Initialize database schema (create tables if they don't exist)
def init_db():
    conn, cursor = get_db()
    with conn:
        cursor.executescript('''
            CREATE TABLE IF NOT EXISTS students (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                matric_number TEXT NOT NULL UNIQUE,
                full_name TEXT NOT NULL,
                fingerprint_template TEXT NOT NULL,
                parent_email TEXT NOT NULL
            );
            
            CREATE TABLE IF NOT EXISTS attendance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER,
                date TEXT,
                time TEXT,
                status TEXT DEFAULT 'absent' CHECK(status IN ('present', 'absent')),
                FOREIGN KEY (student_id) REFERENCES students(id)
            );
            
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER,
                notification_time TEXT,
                status TEXT DEFAULT 'failed' CHECK(status IN ('sent', 'failed')),
                FOREIGN KEY (student_id) REFERENCES students(id)
            );
        ''')
    conn.close()

init_db()  # Call at startup to create tables

# Hashing function for fingerprint template (simulated)
def hash_template(data):
    salt = b'salt_123'
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(data.encode()))
    return key.decode()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/admin')
def admin():
    conn, cursor = get_db()
    cursor.execute("SELECT id, matric_number, full_name, parent_email FROM students")
    students = cursor.fetchall()
    conn.close()
    return render_template('admin.html', students=students)

@app.route('/scan', methods=['POST'])
def scan():
    matric_number = request.form.get('matric_number')
    if not matric_number:
        return jsonify({'error': 'No matric number provided'}), 400

    template = hash_template(matric_number)
    conn, cursor = get_db()
    cursor.execute("SELECT id, full_name, parent_email FROM students WHERE matric_number = ?", (matric_number,))
    student = cursor.fetchone()
    if not student:
        conn.close()
        return jsonify({'error': 'Student not found'}), 404

    current_date = datetime.now().date().isoformat()
    current_time = datetime.now().time().isoformat()
    cursor.execute(
        "INSERT INTO attendance (student_id, date, time, status) VALUES (?, ?, ?, ?)",
        (student[0], current_date, current_time, 'present')
    )
    conn.commit()
    conn.close()

    # Removed send_notification call to prevent automatic email on scan
    return jsonify({'message': f'Attendance logged for {student[1]}'})

@app.route('/attendance', methods=['GET'])
def get_attendance():
    conn, cursor = get_db()
    cursor.execute("SELECT a.id as attendance_id, s.full_name, a.date, a.time, a.status FROM attendance a JOIN students s ON a.student_id = s.id")
    records = cursor.fetchall()
    conn.close()
    # Convert Row objects to list of dictionaries
    result = [dict(row) for row in records]
    return jsonify(result)

@app.route('/add_student', methods=['POST'])
def add_student():
    matric_number = request.form.get('matric_number')
    full_name = request.form.get('full_name')
    parent_email = request.form.get('parent_email')
    if not all([matric_number, full_name, parent_email]):
        return jsonify({'error': 'All fields are required'}), 400
    template = hash_template(matric_number)
    conn, cursor = get_db()
    try:
        cursor.execute(
            "INSERT INTO students (matric_number, full_name, fingerprint_template, parent_email) VALUES (?, ?, ?, ?)",
            (matric_number, full_name, template, parent_email)
        )
        conn.commit()
        conn.close()
        return jsonify({'message': 'Student added successfully'})
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Matric number already exists'}), 400
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 400

@app.route('/edit_student', methods=['POST'])
def edit_student():
    id = request.form.get('id')
    matric_number = request.form.get('matric_number')
    full_name = request.form.get('full_name')
    parent_email = request.form.get('parent_email')
    if not all([id, matric_number, full_name, parent_email]):
        return jsonify({'error': 'All fields are required'}), 400
    template = hash_template(matric_number)
    conn, cursor = get_db()
    try:
        cursor.execute(
            "UPDATE students SET matric_number = ?, full_name = ?, fingerprint_template = ?, parent_email = ? WHERE id = ?",
            (matric_number, full_name, template, parent_email, id)
        )
        conn.commit()
        conn.close()
        return jsonify({'message': 'Student updated successfully'})
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Matric number already exists'}), 400
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 400

@app.route('/delete_student', methods=['POST'])
def delete_student():
    id = request.form.get('id')
    if not id:
        return jsonify({'error': 'No id provided'}), 400
    conn, cursor = get_db()
    cursor.execute("DELETE FROM students WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Student deleted successfully'})

@app.route('/delete_attendance', methods=['POST'])
def delete_attendance():
    id = request.form.get('id')
    if not id:
        return jsonify({'error': 'No id provided'}), 400
    conn, cursor = get_db()
    cursor.execute("DELETE FROM attendance WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Attendance record deleted successfully'})

@app.route('/send_absence_alerts', methods=['POST'])
def send_absence_alerts():
    conn, cursor = get_db()
    current_date = datetime.now().date().isoformat()
    cursor.execute("""
        SELECT s.id, s.full_name, s.parent_email 
        FROM students s 
        WHERE NOT EXISTS (
            SELECT 1 FROM attendance a 
            WHERE a.student_id = s.id 
            AND a.date = ? 
            AND a.status = 'present'
        )
    """, (current_date,))
    absent_students = cursor.fetchall()
    conn.close()

    # Debug: Log the students being selected for alerts
    print(f"Students selected for absence alerts on {current_date}:")
    for student in absent_students:
        print(f"ID: {student[0]}, Name: {student[1]}, Email: {student[2]}")

    sent_statuses = []
    for student in absent_students:
        success = send_notification(student[2], student[1], 'absent')
        sent_statuses.append(success)

    conn, cursor = get_db()
    cursor.executemany(
        "INSERT INTO notifications (student_id, notification_time, status) VALUES (?, ?, ?)",
        [(student[0], datetime.now().isoformat(), 'sent' if sent else 'failed') for student, sent in zip(absent_students, sent_statuses)]
    )
    conn.commit()
    conn.close()
    return jsonify({'message': f'Sent absence alerts to {len(absent_students)} parents'})

def send_notification(email, student_name, status):
    try:
        msg = MIMEText(f"Greetings, and knowing how work is going, your child {student_name} was absent for class today.")
        msg['Subject'] = 'Attendance Notification'
        msg['From'] = config['SMTP']['sender']
        msg['To'] = email

        with smtplib.SMTP(config['SMTP']['server'], config['SMTP']['port']) as server:
            server.starttls()
            server.login(config['SMTP']['sender'], config['SMTP']['password'])
            server.sendmail(config['SMTP']['sender'], email, msg.as_string())
        return True
    except Exception as e:
        print(f"Notification failed for {email}: {e}")
        return False

if __name__ == '__main__':
    app.run(debug=True)