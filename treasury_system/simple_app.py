#!/usr/bin/env python3
from flask import Flask, jsonify, render_template
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return '''
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <title>نظام الخزينة المتكامل</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa; }
            .container { margin-top: 50px; }
            .card { border: none; border-radius: 15px; box-shadow: 0 0 20px rgba(0,0,0,0.08); padding: 30px; }
            h1 { color: #667eea; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="card text-center">
                <h1>🏦 نظام الخزينة المتكامل</h1>
                <p class="lead">مرحباً بك في نظام إدارة الخزينة</p>
                <hr>
                <div class="alert alert-success">
                    ✅ الخادم يعمل بنجاح على المنفذ 5000
                </div>
                <p>النظام جاهز للعمل!</p>
                <div class="mt-4">
                    <button class="btn btn-primary" onclick="testAPI()">اختبار API</button>
                </div>
                <div id="result" class="mt-3"></div>
            </div>
        </div>
        <script>
            async function testAPI() {
                try {
                    const response = await fetch('/api/test');
                    const data = await response.json();
                    document.getElementById('result').innerHTML = 
                        '<div class="alert alert-info">استجابة API: ' + JSON.stringify(data) + '</div>';
                } catch (error) {
                    document.getElementById('result').innerHTML = 
                        '<div class="alert alert-danger">خطأ: ' + error + '</div>';
                }
            }
        </script>
    </body>
    </html>
    '''

@app.route('/api/test')
def test_api():
    return jsonify({
        'status': 'success',
        'message': 'API يعمل بنجاح',
        'timestamp': '2024-01-01'
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting Flask server on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=True)