#!/usr/bin/env python3
"""Static dev server for the MERIS Home prototype with caching disabled,
so edits to the .jsx/.css files always load fresh on reload."""
import http.server
import os

PORT = 5173
os.chdir(os.path.dirname(os.path.abspath(__file__)))


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


if __name__ == "__main__":
    httpd = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), NoCacheHandler)
    print(f"Serving MERIS Home (no-cache) at http://127.0.0.1:{PORT}/Home.html")
    httpd.serve_forever()
