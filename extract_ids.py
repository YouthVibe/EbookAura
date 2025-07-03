import json
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
from typing import List, Dict, Any
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def export_mongo_docs() -> None:
    """
    Export all MongoDB documents to a JSON file with proper error handling and datetime conversion.
    """
    # MongoDB connection details
    MONGO_URI = "mongodb+srv://EpicDev14:Ultron%4019%23@ebookaura.93knrsp.mongodb.net/?retryWrites=true&w=majority&appName=EbookAura"
    DB_NAME = "test"
    COLLECTION_NAME = "books"
    OUTPUT_FILE = "books.json"

    try:
        # Connect to MongoDB with connection timeout
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        
        # Test connection
        client.server_info()
        logger.info("Successfully connected to MongoDB")

        db = client[DB_NAME]
        collection = db[COLLECTION_NAME]

        # Fetch all documents
        documents: List[Dict] = list(collection.find({}))

        # Convert ObjectId, datetime, and other non-serializable types to JSON-compatible formats
        def convert_to_serializable(doc: Any) -> Any:
            if isinstance(doc, dict):
                return {k: convert_to_serializable(v) for k, v in doc.items()}
            elif isinstance(doc, list):
                return [convert_to_serializable(item) for item in doc]
            elif isinstance(doc, ObjectId):
                return str(doc)
            elif isinstance(doc, datetime):
                return doc.isoformat()  # Convert datetime to ISO 8601 string
            return doc

        # Convert documents to JSON-serializable format
        serializable_docs = [convert_to_serializable(doc) for doc in documents]

        # Write to JSON file with proper formatting
        with open(OUTPUT_FILE, "w", encoding="utf-8") as file:
            json.dump(serializable_docs, file, indent=2, ensure_ascii=False)
        
        logger.info(f"Successfully exported {len(serializable_docs)} documents to {OUTPUT_FILE}")

    except Exception as e:
        logger.error(f"Error occurred: {str(e)}")
        raise
    
    finally:
        # Ensure connection is closed even if an error occurs
        try:
            client.close()
            logger.info("MongoDB connection closed")
        except:
            pass

if __name__ == "__main__":
    export_mongo_docs()