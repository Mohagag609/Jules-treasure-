#!/usr/bin/env python3
import os
import sys

# تعيين المسار
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    print("Starting Treasury System...")
    print("=" * 50)
    
    # محاولة استيراد المكتبات
    print("Importing Flask...")
    from flask import Flask
    print("✓ Flask imported successfully")
    
    print("Importing SQLAlchemy...")
    from sqlalchemy import create_engine
    print("✓ SQLAlchemy imported successfully")
    
    print("Importing database module...")
    from database import init_db
    print("✓ Database module imported successfully")
    
    print("Importing app module...")
    from app import app
    print("✓ App module imported successfully")
    
    print("=" * 50)
    print("Starting server on http://localhost:5000")
    print("Press Ctrl+C to stop")
    print("=" * 50)
    
    # تشغيل التطبيق
    app.run(host='0.0.0.0', port=5000, debug=False)
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()