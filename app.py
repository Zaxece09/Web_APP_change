from flask import Flask, render_template, send_from_directory
import os

app = Flask(__name__, 
            static_folder='static',
            template_folder='.')

@app.route('/css/<path:filename>')
def css_files(filename):
    return send_from_directory('css', filename)

@app.route('/javascript/<path:filename>')
def js_files(filename):
    return send_from_directory('javascript', filename)

@app.route('/images/<path:filename>')
def image_files(filename):
    return send_from_directory('images', filename)

@app.route('/fonts/<path:filename>')
def font_files(filename):
    return send_from_directory('fonts', filename)

@app.route('/icons/<path:filename>')
def icon_files(filename):
    return send_from_directory('icons', filename)

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/html/<path:filename>')
def html_files(filename):
    return send_from_directory('html', filename)

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=8080)