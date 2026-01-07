# backend/app.py

import datetime
import os
from flask import Flask, request, jsonify
import models
from pymongo import MongoClient
from flask_cors import CORS
from bson.objectid import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, JWTManager, jwt_required, get_jwt_identity, get_jwt

def create_app():
    app = Flask(__name__)

    # --- Configuration from Environment Variables ---
    app.config["SECRET_KEY"] = os.environ.get("FLASK_SECRET_KEY", "super-secret-dev-key-please-change")
    MONGO_URI = os.environ.get("MONGO_URI", "mongodb://127.0.0.1:27017/")
    MONGO_DB_NAME = os.environ.get("MONGO_DB_NAME", "microblog")
    app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "your-jwt-secret-key")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = datetime.timedelta(hours=1)

    # Default Admin User Config
    DEFAULT_ADMIN_USERNAME = os.environ.get("DEFAULT_ADMIN_USERNAME")
    DEFAULT_ADMIN_PASSWORD = os.environ.get("DEFAULT_ADMIN_PASSWORD")


    # Initialize Flask-JWT-Extended
    jwt = JWTManager(app)

    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # MongoDB Connection
    client = MongoClient(MONGO_URI)
    app.db = client[MONGO_DB_NAME]
    app.posts_collection = app.db.posts
    app.users_collection = app.db.users

    # --- Create Default Admin User if not exists ---
    if DEFAULT_ADMIN_USERNAME and DEFAULT_ADMIN_PASSWORD:
        if not app.users_collection.find_one({"username": DEFAULT_ADMIN_USERNAME}):
            hashed_password = generate_password_hash(DEFAULT_ADMIN_PASSWORD)
            app.users_collection.insert_one({
                "username": DEFAULT_ADMIN_USERNAME,
                "password": hashed_password,
                "is_admin": True # Set admin flag for default user
            })
            print(f"Default admin user '{DEFAULT_ADMIN_USERNAME}' created.")
        else:
            print(f"Default admin user '{DEFAULT_ADMIN_USERNAME}' already exists.")
   

    # --- User Registration Endpoint ---
    @app.route("/api/register", methods=["POST"])
    def register():
        data = request.get_json()
        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return jsonify({"msg": "Missing username or password"}), 400

        if app.users_collection.find_one({"username": username}):
            return jsonify({"msg": "Username already exists"}), 409 # Conflict

        hashed_password = generate_password_hash(password)
        # NEW: Regular users are not admins by default
        app.users_collection.insert_one({"username": username, "password": hashed_password, "is_admin": False})

        return jsonify({"msg": "User registered successfully"}), 201

    # --- User Login Endpoint ---
    @app.route("/api/login", methods=["POST"])
    def login():
        data = request.get_json()
        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return jsonify({"msg": "Missing username or password"}), 400

        user = app.users_collection.find_one({"username": username})

        if user and check_password_hash(user["password"], password):
            # NEW: Add custom claims to the JWT
            additional_claims = {"is_admin": user.get("is_admin", False)}
            access_token = create_access_token(identity=username, additional_claims=additional_claims)
            return jsonify(access_token=access_token, username=username, is_admin=user.get("is_admin", False)), 200
        else:
            return jsonify({"msg": "Bad username or password"}), 401 # Unauthorized

    # --- Admin Endpoint to List Users ---
    @app.route("/api/users", methods=["GET"])
    @jwt_required()
    def list_users():
        claims = get_jwt()
        is_admin = claims.get("is_admin", False)

        if not is_admin:
            return jsonify({"msg": "Admin access required"}), 403

        users = models.get_all_users()
        return jsonify(users), 200

    # --- Admin Endpoint to Delete User ---
    @app.route("/api/users/<string:user_id>", methods=["DELETE"])
    @jwt_required()
    def delete_user(user_id):
        claims = get_jwt()
        is_admin = claims.get("is_admin", False)

        if not is_admin:
            return jsonify({"msg": "Admin access required"}), 403

        current_user_identity = get_jwt_identity()
        user_to_delete_doc = models.get_user_by_username(current_user_identity) # Get full user doc for current user
        
        # Prevent admin from deleting themselves
        if user_to_delete_doc and str(user_to_delete_doc['_id']) == user_id:
            return jsonify({"msg": "Cannot delete your own account"}), 403

        if models.delete_user(user_id):
            return jsonify({"message": "User deleted successfully"}), 200
        else:
            return jsonify({"error": "User not found or failed to delete"}), 404

    # --- Post Endpoints (Modified for Authorization) ---

    @app.route("/api/posts", methods=["GET"])
    def get_posts():
        posts_from_db = app.posts_collection.find({}).sort("timestamp", -1)
        posts_list = []
        for post in posts_from_db:
            post['_id'] = str(post['_id'])
            posts_list.append(post)
        return jsonify(posts_list)

    @app.route("/api/posts", methods=["POST"])
    @jwt_required()
    def add_post():
        current_user = get_jwt_identity()
        data = request.get_json()
        post_content = data.get("content")

        if not post_content or post_content.strip() == "":
            return jsonify({"error": "Post content could not be empty!"}), 400

        now = datetime.datetime.now()
        formatted_date = now.strftime("%Y-%m-%d")
        formatted_timestamp = now.isoformat()

        new_post = {
            "content": post_content,
            "date": formatted_date,
            "timestamp": formatted_timestamp,
            "author": current_user # Author is the logged-in user
        }
        result = app.posts_collection.insert_one(new_post)

        new_post['_id'] = str(result.inserted_id)
        return jsonify(new_post), 201

    @app.route("/api/posts/<string:post_id>", methods=["PUT"])
    @jwt_required()
    def update_post(post_id):
        current_user = get_jwt_identity()
        claims = get_jwt() # Get custom claims from the JWT
        is_admin = claims.get("is_admin", False)

        try:
            object_id = ObjectId(post_id)
        except Exception:
            return jsonify({"error": "Invalid Post ID format"}), 400

        data = request.get_json()
        new_content = data.get("content")

        if not new_content or new_content.strip() == "":
            return jsonify({"error": "Content cannot be empty for update"}), 400

        post_to_update = app.posts_collection.find_one({"_id": object_id})

        if not post_to_update:
            return jsonify({"error": "Post not found"}), 404

        # Authorization check: Must be admin OR the author of the post
        if not is_admin and post_to_update.get("author") != current_user:
            return jsonify({"msg": "Unauthorized to edit this post"}), 403

        result = app.posts_collection.update_one(
            {"_id": object_id},
            {"$set": {"content": new_content}}
        )

        if result.modified_count == 0:
            return jsonify({"message": "No changes detected for post"}), 200

        updated_post = app.posts_collection.find_one({"_id": object_id})
        updated_post['_id'] = str(updated_post['_id'])
        return jsonify(updated_post), 200

    @app.route("/api/posts/<string:post_id>", methods=["DELETE"])
    @jwt_required()
    def delete_post(post_id):
        current_user = get_jwt_identity()
        claims = get_jwt() # Get custom claims from the JWT
        is_admin = claims.get("is_admin", False)

        try:
            object_id = ObjectId(post_id)
        except Exception:
            return jsonify({"error": "Invalid Post ID"}), 400

        post_to_delete = app.posts_collection.find_one({"_id": object_id})

        if not post_to_delete:
            return jsonify({"error": "Post not found"}), 404

        # Authorization check: Must be admin OR the author of the post
        if not is_admin and post_to_delete.get("author") != current_user:
            return jsonify({"msg": "Unauthorized to delete this post"}), 403

        result = app.posts_collection.delete_one({"_id": object_id})
        if result.deleted_count == 1:
            return jsonify({"message": "Post deleted successfully"}), 200
        else:
            return jsonify({"error": "Post not found"}), 404

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)