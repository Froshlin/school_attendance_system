import mysql.connector
import configparser

def evaluate_system():
         config = configparser.ConfigParser()
         config.read('config.ini')
         db = mysql.connector.connect(
             host=config['Database']['host'],
             user=config['Database']['user'],
             password=config['Database']['password'],
             database=config['Database']['database']
         )
         cursor = db.cursor()
         cursor.execute("SELECT status, COUNT(*) FROM notifications GROUP BY status")
         results = cursor.fetchall()
         print("Notification Delivery Report:")
         for status, count in results:
             print(f"{status}: {count}")
         db.close()

if __name__ == "__main__":
         evaluate_system()