"""Start the complete, offline SmartHire demo with one command."""
from unified.app import app, init_db


if __name__ == "__main__":
    init_db()
    print("SmartHire is ready at http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000, debug=False)
