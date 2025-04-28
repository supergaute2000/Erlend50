import http.server
import socketserver
import json
import os
from urllib.parse import urlparse, parse_qs

# File to store high scores
HIGHSCORES_FILE = 'highscores.json'

# Ensure the highscores file exists
if not os.path.exists(HIGHSCORES_FILE):
    with open(HIGHSCORES_FILE, 'w') as f:
        json.dump([], f)

class HighScoresHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Parse the URL
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        
        # Handle /scores endpoint
        if path == '/scores':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            # Read high scores from file
            try:
                with open(HIGHSCORES_FILE, 'r') as f:
                    high_scores = json.load(f)
            except Exception as e:
                print(f"Error reading high scores: {e}")
                high_scores = []
            
            # Send response with consistent format
            self.wfile.write(json.dumps({'highScores': high_scores}).encode())
            return
        
        # For all other paths, serve files as usual
        return http.server.SimpleHTTPRequestHandler.do_GET(self)
    
    def do_POST(self):
        # Parse the URL
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        
        # Handle /scores endpoint
        if path == '/scores':
            # Get content length
            content_length = int(self.headers['Content-Length'])
            
            # Read request body
            post_data = self.rfile.read(content_length)
            
            try:
                # Parse JSON data
                data = json.loads(post_data.decode('utf-8'))
                
                # Validate data
                if 'name' not in data or 'score' not in data:
                    self.send_response(400)
                    self.send_header('Content-type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': 'Missing name or score'}).encode())
                    return
                
                # Read existing high scores
                try:
                    with open(HIGHSCORES_FILE, 'r') as f:
                        high_scores = json.load(f)
                except Exception as e:
                    print(f"Error reading high scores: {e}")
                    high_scores = []
                
                # Add new score
                high_scores.append({
                    'name': data['name'],
                    'score': data['score'],
                    'date': data.get('date', '')
                })
                
                # Sort by score (highest first)
                high_scores.sort(key=lambda x: x['score'], reverse=True)
                
                # Keep only top 10
                high_scores = high_scores[:10]
                
                # Write back to file
                with open(HIGHSCORES_FILE, 'w') as f:
                    json.dump(high_scores, f, indent=2)
                
                # Send response with consistent format
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'highScores': high_scores}).encode())
                
            except Exception as e:
                print(f"Error processing POST request: {e}")
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode())
            
            return
        
        # For all other paths, return 404
        self.send_response(404)
        self.end_headers()
    
    def do_OPTIONS(self):
        # Handle CORS preflight requests
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

# Set up the server
# Use PORT environment variable if available (for Render.com)
PORT = int(os.environ.get('PORT', 8000))
Handler = HighScoresHandler

print(f"Starting server on port {PORT}...")
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving at port {PORT}")
    httpd.serve_forever() 