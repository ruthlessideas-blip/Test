var state = {
  step: 1,
  scraped: null,
  tags: [],
  uploadResult: null,
};

function goStep(n) {
  if (n === 3) syncReviewFields();
  if (n === 4) buildExportContent();
  state.step = n;
  document.querySelectorAll('.panel').forEach(function(p, i) {
    p.classList.toggle('active', i + 1 === n);
  });
  document.querySelectorAll('.step-tab').forEach(function(t, i) {
    t.classList.remove('active', 'done');
    if (i + 1 < n) t.classList.add('done');
    if (i + 1 === n) t.classList.add('active');
  });
  window.scrollTo(0, 0);
}

// ---- Step 1: Scrape ----
function doScrape() {
  var url = document.getElementById('scrape-url').value.trim();
  if (!url) { setStatus('scrape-status', 'error', 'Please enter a URL.'); return; }
  var btn = document.getElementById('btn-scrape');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Scraping…';
  setStatus('scrape-status', 'info', 'Fetching page…');

  fetch('/scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: url })
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    btn.disabled = false;
    btn.innerHTML = 'Scrape';
    if (data.error) { setStatus('scrape-status', 'error', data.error); return; }
    state.scraped = data;
    state.tags = (data.tags || []).slice();
    renderScrapedData(data);
    setStatus('scrape-status', 'success', 'Scraped successfully from ' + (data.source || 'page') + '!');
  })
  .catch(function(e) {
    btn.disabled = false;
    btn.innerHTML = 'Scrape';
    setStatus('scrape-status', 'error', 'Network error: ' + e.message);
  });
}

function renderScrapedData(data) {
  document.getElementById('scraped-data-card').style.display = '';
  document.getElementById('step1-actions').style.display = '';
  document.getElementById('scraped-source').textContent = data.source || '';
  document.getElementById('scraped-url-display').textContent = data.url || '';
  document.getElementById('field-title').value = data.title || '';
  document.getElementById('field-description').value = data.description || '';
  document.getElementById('field-license').value = data.license || '';
  document.getElementById('field-creator').value = data.creator || '';
  renderTags();

  var grid = document.getElementById('images-grid');
  grid.innerHTML = '';
  var imgs = data.images || [];
  document.getElementById('images-count').textContent = imgs.length;
  imgs.forEach(function(src, i) {
    var d = document.createElement('div');
    d.className = 'img-thumb';
    d.innerHTML = '<img src="' + escHtml(src) + '" loading="lazy" onerror="this.parentNode.style.display=\'none\'">' +
                  '<div class="img-num">' + (i + 1) + '</div>';
    grid.appendChild(d);
  });
}

// ---- Tags ----
function renderTags() {
  var c = document.getElementById('tags-container');
  c.innerHTML = '';
  state.tags.forEach(function(tag, i) {
    var el = document.createElement('span');
    el.className = 'tag';
    el.innerHTML = escHtml(tag) + '<span class="tag-remove" onclick="removeTag(' + i + ')">&#215;</span>';
    c.appendChild(el);
  });
  document.getElementById('tags-count').textContent = state.tags.length;
}

function addTag() {
  var inp = document.getElementById('tag-input');
  var val = inp.value.trim();
  if (val && !state.tags.includes(val)) { state.tags.push(val); renderTags(); }
  inp.value = ''; inp.focus();
}

function removeTag(i) { state.tags.splice(i, 1); renderTags(); }

function tagKeydown(e) { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }

// ---- Step 2: Upload ----
document.addEventListener('DOMContentLoaded', function() {
  var dz = document.getElementById('drop-zone');
  dz.addEventListener('dragover', function(e) { e.preventDefault(); dz.classList.add('drag-over'); });
  dz.addEventListener('dragleave', function() { dz.classList.remove('drag-over'); });
  dz.addEventListener('drop', function(e) {
    e.preventDefault(); dz.classList.remove('drag-over');
    if (e.dataTransfer.files[0]) uploadFile(e.dataTransfer.files[0]);
  });
  document.getElementById('scrape-url').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') doScrape();
  });
});

function handleFileSelect(input) { if (input.files[0]) uploadFile(input.files[0]); }

function uploadFile(file) {
  if (!file.name.toLowerCase().endsWith('.zip')) {
    setStatus('upload-status', 'error', 'Please upload a .zip file.'); return;
  }
  setStatus('upload-status', 'info', '<span class="spinner"></span>Uploading and extracting…');
  var wrap = document.getElementById('upload-progress-wrap');
  var bar = document.getElementById('upload-progress');
  wrap.style.display = ''; bar.style.width = '5%';

  var fd = new FormData();
  fd.append('file', file);
  var xhr = new XMLHttpRequest();
  xhr.open('POST', '/upload');
  xhr.upload.onprogress = function(e) {
    if (e.lengthComputable) bar.style.width = Math.round(e.loaded / e.total * 90) + '%';
  };
  xhr.onload = function() {
    bar.style.width = '100%';
    var data;
    try { data = JSON.parse(xhr.responseText); } catch(e) {
      setStatus('upload-status', 'error', 'Invalid response.'); return;
    }
    if (data.error) { setStatus('upload-status', 'error', data.error); wrap.style.display = 'none'; return; }
    state.uploadResult = data;
    renderUploadResults(data);
    setStatus('upload-status', 'success',
      'Extracted ' + (data.stl_files.length + data.image_files.length) + ' files from ' + file.name);
    document.getElementById('btn-step2-next').disabled = false;
  };
  xhr.onerror = function() { setStatus('upload-status', 'error', 'Upload failed.'); wrap.style.display = 'none'; };
  xhr.send(fd);
}

function renderUploadResults(data) {
  document.getElementById('upload-results-card').style.display = '';

  var stlList = document.getElementById('stl-list');
  stlList.innerHTML = '';
  document.getElementById('stl-count').textContent = data.stl_files.length;
  data.stl_files.forEach(function(f) {
    stlList.appendChild(fileItem('&#127381;', f.name, f.ext.toUpperCase() + ' • ' + fmtSize(f.size)));
  });
  if (!data.stl_files.length) stlList.innerHTML = '<p style="color:#64748b;font-size:0.82rem">No 3D files found</p>';

  var imgGrid = document.getElementById('upload-images-grid');
  imgGrid.innerHTML = '';
  document.getElementById('img-count').textContent = data.image_files.length;
  data.image_files.forEach(function(f, i) {
    var d = document.createElement('div');
    d.className = 'img-thumb';
    d.innerHTML = '<img src="' + escHtml(f.url) + '" loading="lazy"><div class="img-num">' + (i+1) + '</div>';
    imgGrid.appendChild(d);
  });
  if (!data.image_files.length) imgGrid.innerHTML = '<p style="color:#64748b;font-size:0.82rem">No images found</p>';

  var otherSection = document.getElementById('other-files-section');
  var otherList = document.getElementById('other-list');
  otherList.innerHTML = '';
  if (data.other_files && data.other_files.length) {
    otherSection.style.display = '';
    data.other_files.forEach(function(f) { otherList.appendChild(fileItem('&#128196;', f.name, f.ext)); });
  } else {
    otherSection.style.display = 'none';
  }
}

function fileItem(icon, name, meta) {
  var d = document.createElement('div');
  d.className = 'file-item';
  d.innerHTML = '<div class="file-icon">' + icon + '</div><div class="file-info">' +
    '<div class="file-name">' + escHtml(name) + '</div>' +
    '<div class="file-meta">' + escHtml(meta) + '</div></div>';
  return d;
}

// ---- Step 3: Review ----
function syncReviewFields() {
  document.getElementById('review-title').value = document.getElementById('field-title').value;
  document.getElementById('review-description').value = document.getElementById('field-description').value;
  document.getElementById('review-license').value = document.getElementById('field-license').value;
  document.getElementById('review-creator').value = document.getElementById('field-creator').value;
  document.getElementById('review-tags').value = state.tags.join(', ');

  var imgs = (state.scraped || {}).images || [];
  var revGrid = document.getElementById('review-images-grid');
  revGrid.innerHTML = '';
  document.getElementById('review-img-count').textContent = imgs.length;
  imgs.forEach(function(src, i) {
    var d = document.createElement('div');
    d.className = 'img-thumb';
    d.innerHTML = '<img src="' + escHtml(src) + '" loading="lazy" onerror="this.parentNode.style.display=\'none\'">' +
                  '<div class="img-num">' + (i+1) + '</div>';
    revGrid.appendChild(d);
  });

  var stlList = document.getElementById('review-stl-list');
  stlList.innerHTML = '';
  var stls = ((state.uploadResult || {}).stl_files || []);
  document.getElementById('review-stl-count').textContent = stls.length;
  stls.forEach(function(f) { stlList.appendChild(fileItem('&#127381;', f.name, f.ext.toUpperCase() + ' • ' + fmtSize(f.size))); });
  if (!stls.length) stlList.innerHTML = '<p style="color:#64748b;font-size:0.82rem">No 3D files uploaded</p>';
}

// ---- Step 4: Export ----
function collectFinalData() {
  var tagsStr = document.getElementById('review-tags').value || document.getElementById('tags-count').textContent;
  var tagArr = (document.getElementById('review-tags').value || '')
    .split(',').map(function(t) { return t.trim(); }).filter(Boolean);
  if (!tagArr.length) tagArr = state.tags;
  return {
    title: document.getElementById('review-title').value || document.getElementById('field-title').value,
    description: document.getElementById('review-description').value || document.getElementById('field-description').value,
    license: document.getElementById('review-license').value || document.getElementById('field-license').value,
    creator: document.getElementById('review-creator').value || document.getElementById('field-creator').value,
    tags: tagArr,
    source_url: (state.scraped || {}).url || '',
    source_site: (state.scraped || {}).source || '',
    images: (state.scraped || {}).images || [],
    stl_files: ((state.uploadResult || {}).stl_files || []).map(function(f) { return f.name; }),
    image_files: ((state.uploadResult || {}).image_files || []).map(function(f) { return f.name; }),
  };
}

function buildExportContent() {
  var d = collectFinalData();
  var plain = [
    'TITLE\n' + d.title,
    'DESCRIPTION\n' + d.description,
    'TAGS\n' + d.tags.join(', '),
    'LICENSE\n' + d.license,
    'CREATOR\n' + d.creator,
    'SOURCE\n' + d.source_url,
    '3D FILES\n' + (d.stl_files.join('\n') || '(none)'),
    'IMAGES (scraped)\n' + (d.images.slice(0, 5).join('\n') || '(none)'),
  ].join('\n\n---\n\n');
  document.getElementById('plain-text-output').value = plain;
  buildFillScript();
}

var SELECTORS = {
  generic:       { title: 'input[name*="title" i],input[id*="title" i],input[placeholder*="title" i]',
                   description: 'textarea[name*="desc" i],textarea[id*="desc" i],textarea[placeholder*="desc" i],[contenteditable][id*="desc" i]',
                   tags: 'input[name*="tag" i],input[id*="tag" i],input[placeholder*="tag" i]' },
  printables:    { title: 'input[name="name"],input[id="name"]',
                   description: '.ql-editor,.ProseMirror,textarea[name="description"]',
                   tags: 'input[placeholder*="tag" i]' },
  thingiverse:   { title: 'input[name="name"],input[id="thing_name"]',
                   description: '.ql-editor,textarea[name="description"]',
                   tags: 'input[name*="tag" i],input[id*="tag" i]' },
  myminifactory: { title: 'input[name="name"],input[id*="name" i]',
                   description: '.fr-element,.ql-editor,textarea[name="description"]',
                   tags: 'input[placeholder*="tag" i]' },
  cults3d:       { title: 'input[name="creation[name]"],input[id*="creation_name"]',
                   description: '.ProseMirror,textarea[id*="description"]',
                   tags: 'input[placeholder*="tag" i],input[name*="tag" i]' },
  makerworld:    { title: 'input[placeholder*="title" i],input[name*="title" i]',
                   description: '.ql-editor,textarea[placeholder*="description" i]',
                   tags: 'input[placeholder*="tag" i]' },
};

function buildFillScript() {
  var d = collectFinalData();
  var site = document.getElementById('target-site').value;
  var sel = SELECTORS[site] || SELECTORS.generic;
  var payload = JSON.stringify({ title: d.title, description: d.description, tags: d.tags }, null, 2);

  var script =
'(function() {\n' +
'  var data = ' + payload + ';\n\n' +
'  function triggerEvents(el) {\n' +
'    el.dispatchEvent(new Event("input", {bubbles:true}));\n' +
'    el.dispatchEvent(new Event("change", {bubbles:true}));\n' +
'  }\n\n' +
'  function setVal(el, val) {\n' +
'    var proto = el.tagName === "INPUT" ? HTMLInputElement : HTMLTextAreaElement;\n' +
'    var setter = Object.getOwnPropertyDescriptor(proto.prototype, "value").set;\n' +
'    setter.call(el, val);\n' +
'  }\n\n' +
'  function fill(selector, value, isRich) {\n' +
'    var els = document.querySelectorAll(selector);\n' +
'    els.forEach(function(el) {\n' +
'      if (isRich || el.getAttribute("contenteditable")) {\n' +
'        el.innerHTML = value.replace(/\\n/g, "<br>");\n' +
'      } else {\n' +
'        setVal(el, value);\n' +
'      }\n' +
'      triggerEvents(el);\n' +
'    });\n' +
'    return els.length;\n' +
'  }\n\n' +
'  var r = {};\n' +
'  r.title       = fill(' + JSON.stringify(sel.title) + ', data.title);\n' +
'  r.description = fill(' + JSON.stringify(sel.description) + ', data.description, true);\n\n' +
'  var tagInput = document.querySelector(' + JSON.stringify(sel.tags) + ');\n' +
'  r.tags = 0;\n' +
'  if (tagInput && data.tags.length) {\n' +
'    data.tags.forEach(function(tag) {\n' +
'      tagInput.focus();\n' +
'      setVal(tagInput, tag);\n' +
'      triggerEvents(tagInput);\n' +
'      tagInput.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",keyCode:13,bubbles:true}));\n' +
'      tagInput.dispatchEvent(new KeyboardEvent("keyup",{key:"Enter",keyCode:13,bubbles:true}));\n' +
'    });\n' +
'    r.tags = data.tags.length;\n' +
'  }\n\n' +
'  console.log("%c STL Filler ","background:#7c3aed;color:#fff;font-weight:bold;padding:4px 8px;border-radius:4px");\n' +
'  console.table(r);\n' +
'  if (!r.title && !r.description)\n' +
'    console.warn("No fields matched. Navigate to the form page first, then re-run.");\n' +
'})();';

  document.getElementById('fill-script-output').value = script;
}

function copyText(id, btn) {
  var el = document.getElementById(id);
  el.select();
  try { document.execCommand('copy'); } catch(e) { navigator.clipboard.writeText(el.value); }
  if (btn) { var t = btn.innerHTML; btn.innerHTML = '&#10003; Copied!'; setTimeout(function() { btn.innerHTML = t; }, 1500); }
}

function downloadJson() {
  var d = collectFinalData();
  var blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (d.title || 'stl-model').replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '.json';
  a.click();
}

function startOver() {
  state = { step: 1, scraped: null, tags: [], uploadResult: null };
  ['scrape-url','field-title','field-description','field-license','field-creator'].forEach(function(id) {
    var el = document.getElementById(id); if (el) el.value = '';
  });
  document.getElementById('scrape-status').innerHTML = '';
  document.getElementById('scraped-data-card').style.display = 'none';
  document.getElementById('step1-actions').style.display = 'none';
  document.getElementById('upload-results-card').style.display = 'none';
  document.getElementById('btn-step2-next').disabled = true;
  document.getElementById('upload-status').innerHTML = '';
  document.getElementById('upload-progress-wrap').style.display = 'none';
  document.getElementById('file-input').value = '';
  goStep(1);
}

function setStatus(id, type, msg) {
  document.getElementById(id).innerHTML = '<div class="alert alert-' + type + '">' + msg + '</div>';
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmtSize(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b/1024).toFixed(1) + ' KB';
  return (b/1048576).toFixed(1) + ' MB';
}
