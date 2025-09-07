import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

# Configure upload folder
app.config['UPLOAD_FOLDER'] = 'uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# In-memory order storage
orders = []
order_id_counter = 1
users = []
producers = []

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()
    role = data.get('role')
    username = data.get('username')
    password = data.get('password')

    if not all([role, username, password]):
        return jsonify({"error": "role, username and password required"}), 400

    user_list = users if role == 'user' else producers if role == 'producer' else None
    if user_list is None:
        return jsonify({"error": "Invalid role"}), 400

    if any(u['username'] == username for u in user_list):
        return jsonify({"error": "User already exists"}), 400

    user_list.append({
        "username": username,
        "password": password  # Plaintext for demo; use hash in real apps
    })
    return jsonify({"message": f"{role} registered successfully"}), 201


@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    role = data.get('role')
    username = data.get('username')
    password = data.get('password')

    if not all([role, username, password]):
        return jsonify({"error": "role, username and password required"}), 400

    user_list = users if role == 'user' else producers if role == 'producer' else None
    if user_list is None:
        return jsonify({"error": "Invalid role"}), 400

    user = next((u for u in user_list if u['username'] == username and u['password'] == password), None)
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    # Return user info (no token for this demo)
    return jsonify({"username": username, "role": role}), 200

# Route to upload files
@app.route('/api/upload', methods=['POST'])
def upload():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in request'}), 400
    
    f = request.files['file']
    
    if f.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    filename = secure_filename(f.filename)
    save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    f.save(save_path)
    
    return jsonify({'file_url': f'/api/file/{filename}'}), 201

# Route to serve uploaded files
@app.route('/api/file/<filename>')
def file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# Route to list or create orders
@app.route('/api/orders', methods=['GET', 'POST'])
def order_list():
    global orders, order_id_counter
    
    if request.method == 'POST':
        data = request.get_json()
        required_fields = ['user', 'file_url', 'print_options', 'address']
        
        # Validate input
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing field: {field}'}), 400
        
        order = {
            "id": order_id_counter,
            "user": data['user'],
            "file_url": data['file_url'],
            "print_options": data['print_options'],
            "address": data['address'],
            "status": "Placed"
        }
        orders.append(order)
        order_id_counter += 1
        return jsonify(order), 201
    else:
        return jsonify(orders)

# Route to update order status
@app.route('/api/orders/<int:order_id>', methods=['PATCH'])
def update_order(order_id):
    data = request.get_json()
    status = data.get('status')
    
    if not status:
        return jsonify({"error": "Status field is required"}), 400
    
    for order in orders:
        if order['id'] == order_id:
            order['status'] = status
            return jsonify(order)
    
    return jsonify({"error": "Order not found"}), 404

if __name__ == '__main__':
    app.run(debug=True)
