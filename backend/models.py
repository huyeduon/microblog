# backend/models.py

from pymongo import MongoClient
from bson.objectid import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash
import datetime
import os


# --- Helper function to convert HTML to plain text ---
def html_to_plain_text(html_content):
    """Converts an HTML string to plain text."""
    if not html_content:
        return ""
    soup = BeautifulSoup(html_content, 'html.parser')
    # Get text, then strip extra whitespace
    plain_text = soup.get_text(separator=' ', strip=True)
    return plain_text

# --- Database Connection (initialized once) ---
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://127.0.0.1:27017/")
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
    user_data['_id'] = str(result.inserted_id)
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
        return False

    result = users_collection.delete_one({"_id": object_id})
    return result.deleted_count > 0

# --- Post Model Functions ---
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
            post['_id'] = str(post['_id'])
        return post
    except Exception:
        return None

def create_post(html_content, author): # <--- Changed parameter name
    """Creates a new post with current timestamp and author, converting HTML to plain text."""
    plain_text_content = html_to_plain_text(html_content) # <--- CONVERT TO PLAIN TEXT
    now = datetime.datetime.now()
    formatted_date = now.strftime("%Y-%m-%d")
    formatted_timestamp = now.isoformat()
    new_post = {
        "content": plain_text_content, # <--- Store plain text
        "date": formatted_date,
        "timestamp": formatted_timestamp,
        "author": author
    }
    result = posts_collection.insert_one(new_post)
    new_post['_id'] = str(result.inserted_id)
    return new_post

def update_post(post_id, html_content): # <--- Changed parameter name
    """Updates the content of an existing post, converting HTML to plain text."""
    plain_text_content = html_to_plain_text(html_content) # <--- CONVERT TO PLAIN TEXT
    try:
        object_id = ObjectId(post_id)
    except Exception:
        return False

    result = posts_collection.update_one(
        {"_id": object_id},
        {"$set": {"content": plain_text_content}} # <--- Store plain text
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