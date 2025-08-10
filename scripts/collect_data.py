# Placeholder for scanner SDK integration
def collect_fingerprint(student_id):
    print(f"Simulating fingerprint collection for student ID: {student_id}")
    return f"fingerprint_{student_id}.png"

if __name__ == "__main__":
    student_id = input("Enter student ID: ")
    fingerprint = collect_fingerprint(student_id)
    print(f"Saved {fingerprint}")