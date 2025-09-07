import mysql.connector
from config import Config
import os

# Initialize MySQL connection
db = mysql.connector.connect(
    host=Config.MYSQL_HOST,
    user=Config.MYSQL_USER,
    password=Config.MYSQL_PASSWORD,
    database=Config.MYSQL_DB
)

# Ensure upload folder exists
os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)

def get_online_shops():
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM Shop WHERE status='online'")
    shops = cursor.fetchall()
    cursor.close()
    return shops

def create_order(user_id, shop_id, order_type, instructions, file_path=None):
    cursor = db.cursor()
    cursor.execute(
        "INSERT INTO `Order` (userId, shopId, orderType, filePath, instructions, status) VALUES (%s,%s,%s,%s,%s,%s)",
        (user_id, shop_id, order_type, file_path, instructions, 'pending')
    )
    db.commit()
    order_id = cursor.lastrowid
    cursor.close()
    return order_id

def update_order_file_path(order_id, file_path):
    cursor = db.cursor()
    cursor.execute(
        "UPDATE `Order` SET filePath = %s WHERE orderId = %s",
        (file_path, order_id)
    )
    db.commit()
    cursor.close()
