from flask import Flask, request, jsonify, render_template, send_from_directory
import requests
from bs4 import BeautifulSoup
import json
import re
import os
import zipfile
import uuid
from pathlib import Path
import urllib.parse

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500 MB

UPLOAD_DIR = Path('uploads')
UPLOAD_DIR.mkdir(exist_ok=True)

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
}

IMAGE_EXTS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'}
STL_EXTS = {'.stl', '.obj', '.3mf', '.amf', '.step', '.stp', '.gcode'}

SOURCE_MAP = {
    'printables.com': 'Printables',
    'thingiverse.com': 'Thingiverse',
    'myminifactory.com': 'MyMiniFactory',
    'cults3d.com': 'Cults3D',
    'thangs.com': 'Thangs',
    'makerworld.com': 'MakerWorld',
}


def extract_json_ld(soup):
    for script in soup.find_all('script', type='application/ld+json'):
        try:
            data = json.loads(script.string or '{}')
            if isinstance(data, list):
                data = data[0]
            return data
        except Exception:
            continue
    return {}


def get_meta(soup, prop=None, name=None):
    if prop:
        tag = soup.find('meta', property=prop)
    else:
        tag = soup.find('meta', attrs={'name': name})
    return tag.get('content', '').strip() if tag else ''


def scrape_page(url, soup, source):
    data = {
        'source': source, 'url': url,
        'title': '', 'description': '', 'tags': [],
        'images': [], 'license': '', 'category': '', 'creator': ''
    }

    ld = extract_json_ld(soup)

    data['title'] = (
        ld.get('name', '') or
        get_meta(soup, prop='og:title') or
        (soup.title.string.strip() if soup.title else '')
    )
    data['description'] = (
        ld.get('description', '') or
        get_meta(soup, prop='og:description') or
        get_meta(soup, name='description')
    )

    ld_images = ld.get('image', [])
    if isinstance(ld_images, str):
        ld_images = [ld_images]
    og_images = [m.get('content', '') for m in soup.find_all('meta', property='og:image')]
    data['images'] = list(dict.fromkeys(filter(None, ld_images + og_images)))[:12]

    kw = ld.get('keywords', '')
    if isinstance(kw, str) and kw:
        data['tags'] = [t.strip() for t in kw.split(',') if t.strip()]
    elif isinstance(kw, list):
        data['tags'] = [str(t).strip() for t in kw if t]
    if not data['tags']:
        meta_kw = get_meta(soup, name='keywords')
        if meta_kw:
            data['tags'] = [t.strip() for t in meta_kw.split(',') if t.strip()]
    data['tags'] = data['tags'][:20]

    data['license'] = str(ld.get('license', '') or ld.get('conditionsOfAccess', ''))

    creator = ld.get('author', ld.get('creator', {}))
    if isinstance(creator, dict):
        data['creator'] = creator.get('name', '')
    elif isinstance(creator, str):
        data['creator'] = creator

    data['title'] = str(data['title']).strip()
    data['description'] = str(data['description']).strip()

    return data


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/scrape', methods=['POST'])
def scrape():
    body = request.get_json(silent=True) or {}
    url = body.get('url', '').strip()
    if not url:
        return jsonify({'error': 'No URL provided'}), 400

    parsed = urllib.parse.urlparse(url)
    domain = parsed.netloc.lower().replace('www.', '')
    source = next((v for k, v in SOURCE_MAP.items() if k in domain), domain)

    try:
        resp = requests.get(url, headers=HEADERS, timeout=20)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, 'html.parser')
    except Exception as e:
        return jsonify({'error': f'Failed to fetch page: {e}'}), 400

    data = scrape_page(url, soup, source)
    return jsonify(data)


@app.route('/upload', methods=['POST'])
def upload():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    file = request.files['file']
    if not file.filename.lower().endswith('.zip'):
        return jsonify({'error': 'Please upload a ZIP file'}), 400

    session_id = str(uuid.uuid4())
    session_dir = UPLOAD_DIR / session_id
    session_dir.mkdir(parents=True)

    zip_path = session_dir / 'upload.zip'
    file.save(str(zip_path))

    stl_files, image_files, other_files = [], [], []

    with zipfile.ZipFile(zip_path, 'r') as zf:
        for name in zf.namelist():
            if name.endswith('/') or '__MACOSX' in name:
                continue
            ext = Path(name).suffix.lower()
            basename = Path(name).name
            if not basename or basename.startswith('.'):
                continue
            try:
                zf.extract(name, str(session_dir))
            except Exception:
                continue
            size = (session_dir / name).stat().st_size
            if ext in STL_EXTS:
                stl_files.append({'name': basename, 'zip_path': name, 'size': size, 'ext': ext})
            elif ext in IMAGE_EXTS:
                image_files.append({'name': basename, 'zip_path': name, 'size': size,
                                    'url': f'/file/{session_id}/{name}'})
            else:
                other_files.append({'name': basename, 'ext': ext, 'size': size})

    return jsonify({
        'session_id': session_id,
        'stl_files': stl_files,
        'image_files': image_files,
        'other_files': other_files,
    })


@app.route('/file/<session_id>/<path:filename>')
def serve_file(session_id, filename):
    session_dir = (UPLOAD_DIR / session_id).resolve()
    target = (session_dir / filename).resolve()
    if not str(target).startswith(str(session_dir)):
        return 'Forbidden', 403
    return send_from_directory(str(session_dir), filename)


if __name__ == '__main__':
    app.run(debug=True, port=5000)
