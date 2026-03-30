"""
server.py — Vākya Local Development Server
============================================
Serves the Vākya frontend using Flask.

Usage:
    pip install flask
    python server.py

Then open: http://localhost:8080

Why Flask instead of just opening index.html directly?
  - Avoids browser CORS restrictions on file:// URLs
  - Serves static files with correct MIME types
  - Mimics a real web server environment
  - Required for clipboard API and voice input (needs http://)
"""

from flask import Flask, render_template, send_from_directory
import os

app = Flask(
    __name__,
    template_folder='templates',
    static_folder='static',
    static_url_path='/static'
)


@app.route('/')
def index():
    """Serve the main application page."""
    return render_template('index.html')


@app.route('/static/<path:filename>')
def static_files(filename):
    """Serve static assets (CSS, JS)."""
    return send_from_directory('static', filename)


@app.route('/health')
def health():
    """Health check endpoint."""
    return {'status': 'ok', 'app': 'Vākya'}


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    print(f"""
╔══════════════════════════════════════════╗
║   Vākya — Intelligent Writing Assistant  ║
║   वाक्य                                  ║
╠══════════════════════════════════════════╣
║   Server running on:                     ║
║   http://localhost:{port:<24}║
╚══════════════════════════════════════════╝
    """)
    app.run(
        host='0.0.0.0',
        port=port,
        debug=True
    )