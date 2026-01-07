# backend/models.py

from pymongo import MongoClient
from bson.objectid import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash
import datetime
import os
# REMOVED: from bs4 import BeautifulSoup
# REMOVED: html_to_plain_text function

# --- Database Connection (initialized once) ---
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
MONGO_DB_NAME = os.environ.get("MONGO_DB_NAME", "microblog")

client = MongoClient(MONGO_URI)
db = client[MONGO_DB_NAME]

posts_collection = db.posts
users_collection = db.users

# --- User Model Functions (unchanged) ---
def get_user_by_username(username):
    """Retrieves a user document by username."""
    return users_collection.find_one({"username": username})

def create_user(username, password, is_admin=False):
    """Creates a new user with hashed password."""
    hashed_password = generate_password_hash(password)
    user_data = {
        "username": username,
        "password": hashed_password,
        "is_admin": is_admin
    }
    result = users_collection.insert_one(user_data)
    user_data['_id'] = str(result.inserted_id) # Add stringified ID for convenience
    return user_data

def verify_user_password(username, password):
    """Verifies a user's password and returns the user if successful."""
    user = get_user_by_username(username)
    if user and check_password_hash(user["password"], password):
        return user
    return None

def get_all_users():
    """Retrieves all user documents, excluding passwords."""
    users_cursor = users_collection.find({}, {"password": 0}) # Exclude password field
    users_list = []
    for user in users_cursor:
        user['_id'] = str(user['_id'])
        users_list.append(user)
    return users_list

def delete_user(user_id):
    """Deletes a user by their ObjectId."""
    try:
        object_id = ObjectId(user_id)
    except Exception:
        return False # Invalid ObjectId format

    result = users_collection.delete_one({"_id": object_id})
    return result.deleted_count > 0 # True if deleted, False if not found

# --- Post Model Functions (Updated to store HTML) ---
def get_all_posts():
    """Retrieves all posts, sorted by timestamp descending."""
    posts_cursor = posts_collection.find({}).sort("timestamp", -1)
    posts_list = []
    for post in posts_cursor:
        post['_id'] = str(post['_id'])
        posts_list.append(post)
    return posts_list

def get_post_by_id(post_id):
    """Retrieves a single post by its ObjectId."""
    try:
        post = posts_collection.find_one({"_id": ObjectId(post_id)})
        if post:
            post['_id'] = str(post['_id']) # Stringify _id for JSON serialization
        return post
    except Exception:
        return None # Invalid ObjectId format or other error

def create_post(html_content, author): # Parameter name remains html_content
    """Creates a new post with current timestamp and author, storing HTML directly."""
    # REMOVED: plain_text_content = html_to_plain_text(html_content)
    now = datetime.datetime.now()
    formatted_date = now.strftime("%Y-%m-%d")
    formatted_timestamp = now.isoformat()
    new_post = {
        "content": html_content, # Store HTML directly
        "date": formatted_date,
        "timestamp": formatted_timestamp,
        "author": author
    }
    result = posts_collection.insert_one(new_post)
    new_post['_id'] = str(result.inserted_id)
    return new_post

def update_post(post_id, html_content): # Parameter name remains html_content
    """Updates the content of an existing post, storing HTML directly."""
    # REMOVED: plain_text_content = html_to_plain_text(html_content)
    try:
        object_id = ObjectId(post_id)
    except Exception:
        return False

    result = posts_collection.update_one(
        {"_id": object_id},
        {"$set": {"content": html_content}} # Store HTML directly
    )
    return result.matched_count > 0 and result.modified_count > 0

def delete_post(post_id):
    """Deletes a post by its ObjectId."""
    try:
        object_id = ObjectId(post_id)
    except Exception:
        return False

    result = posts_collection.delete_one({"_id": object_id})
    return result.deleted_count > 0