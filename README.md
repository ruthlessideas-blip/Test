# STL Scraper & Uploader

A multi-step web app to scrape model info from STL sites and package it for upload elsewhere.

## Supported scraping sources

Printables, Thingiverse, MyMiniFactory, Cults3D, MakerWorld, Thangs (and any site with standard meta tags).

## Setup

```bash
pip install -r requirements.txt
python app.py
```

Open http://localhost:5000

## Workflow

1. **Step 1 - Scrape**: Paste the model URL. Pulls title, description, tags, images, license, creator.
2. **Step 2 - Upload**: Drag & drop a ZIP containing your STL/OBJ/3MF files and images. Files are sorted automatically.
3. **Step 3 - Review**: Edit all fields before export.
4. **Step 4 - Export & Fill**: Three options:
   - **Plain text** - copy and paste manually
   - **F12 Console script** - paste into browser DevTools Console to auto-fill forms on the target site
   - **JSON download** - structured metadata file

## F12 auto-fill instructions

1. Go to the "create/upload" page on your target site
2. In the app select that site from the dropdown in Step 4
3. Copy the generated script
4. Press **F12** in your browser, go to the **Console** tab
5. Paste the script and press **Enter**

The script fills title, description, and tags using React-compatible event dispatching.
