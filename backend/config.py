import os

class Config:
    MYSQL_HOST = "localhost"
    MYSQL_USER = "your_mysql_username"
    MYSQL_PASSWORD = "your_mysql_password"
    MYSQL_DB = "printapp"
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
