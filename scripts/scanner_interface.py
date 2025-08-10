def capture_fingerprint():
         return input("Enter student ID (simulating fingerprint scan): ")

if __name__ == "__main__":
         student_id = capture_fingerprint()
         print(f"Captured student ID: {student_id}")