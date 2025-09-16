import http.server
import socketserver

PORT = 8001

class MyHttpRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add your custom headers here
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        # Call the parent class's end_headers method
        super().end_headers()

# Create a TCP server with the custom handler
with socketserver.TCPServer(("", PORT), MyHttpRequestHandler) as httpd:
    print(f"Serving at http://localhost:{PORT}")
    # Start the server
    httpd.serve_forever()
