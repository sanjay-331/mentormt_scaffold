
from bson import ObjectId
import json
from fastapi.encoders import jsonable_encoder

def test_objectid_serialization():
    data = {
        "id": "123",
        "_id": ObjectId()
    }
    
    try:
        print("Attempting to encode dict with ObjectId...")
        # FastAPI uses jsonable_encoder before JSON conversion
        encoded = jsonable_encoder(data)
        print("Encoded:", encoded)
    except Exception as e:
        print("FAILED in jsonable_encoder:", type(e), e)
        # This is where the 'Object' must have __dict__ error often comes from 
        # when it falls back to trying to find a __dict__ on unknown types.

if __name__ == "__main__":
    test_objectid_serialization()
