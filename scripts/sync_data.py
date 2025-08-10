import mysql.connector
import configparser

def sync_data():
         config = configparser.ConfigParser()
         config.read('config.ini')
         db = mysql.connector.connect(
             host=config['Database']['host'],
             user=config['Database']['user'],
             password=config['Database']['password'],
             database=config['Database']['database']
         )
         cursor = db.cursor()
         print("Syncing offline data...")
         cursor.execute("SELECT * FROM attendance")
         records = cursor.fetchall()
         print(f"Synced {len(records)} records")
         db.close()

if __name__ == "__main__":
         sync_data()