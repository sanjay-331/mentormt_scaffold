try:
    print("Importing app.main...")
    from app.main import app
    print("Successfully imported app.main.")
    print(f"App: {app}")
except Exception as e:
    import traceback
    print("Failed to import app.main:")
    traceback.print_exc()
