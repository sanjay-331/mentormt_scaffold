import asyncio, traceback
from app.db import get_db

async def smoke():
    try:
        db = get_db()
        print("Connected to DB:", db.name)

        cols = await db.list_collection_names()
        print("Collections:", cols)

        test_doc = {'_test': True, 'msg': 'smoke-test'}
        res = await db['__smoke_test_collection__'].insert_one(test_doc)
        print("Inserted id:", res.inserted_id)

        found = await db['__smoke_test_collection__'].find_one({'_id': res.inserted_id})
        print("Found doc:", found)

        await db['__smoke_test_collection__'].delete_one({'_id': res.inserted_id})
        await db['__smoke_test_collection__'].drop()
        print("Cleaned up test document and collection.")

        print("\\nSMOKE TEST: SUCCESS")
    except Exception as e:
        print("\\nSMOKE TEST: FAILED")
        traceback.print_exc()

if __name__ == '__main__':
    asyncio.run(smoke())
