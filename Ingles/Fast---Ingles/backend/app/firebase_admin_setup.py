
import firebase_admin
from firebase_admin import credentials
import os
import logging

logger = logging.getLogger(__name__)

def initialize_firebase_admin():
    """
    Initialize Firebase Admin SDK.
    Expects 'serviceAccountKey.json' in the root or GOOGLE_APPLICATION_CREDENTIALS env var.
    """
    try:
        if not firebase_admin._apps:
            # Check for local service account file
            cred_path = "serviceAccountKey.json" 
            
            if os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
                logger.info("Firebase Admin initialized with serviceAccountKey.json")
            else:
                # Use Application Default Credentials (ADC) or env var
                project_id = os.getenv('GOOGLE_CLOUD_PROJECT')
                if project_id:
                    firebase_admin.initialize_app(options={'projectId': project_id})
                    logger.info(f"Firebase Admin initialized with projectId={project_id}")
                else:
                    firebase_admin.initialize_app()
                    logger.info("Firebase Admin initialized with default credentials")
    except Exception as e:
        logger.error(f"Failed to initialize Firebase Admin: {e}")
        # In production, this should probably raise, but for now we log
