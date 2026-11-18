const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const htmlPath = path.join(rootDir, 'index.html');
const cssPath = path.join(rootDir, 'style.css');
const jsPath = path.join(rootDir, 'script.js');

let htmlContent = fs.readFileSync(htmlPath, 'utf8');
const cssContent = fs.readFileSync(cssPath, 'utf8');
let jsContent = fs.readFileSync(jsPath, 'utf8');

// Ensure initialization is robust for standalone HTML
if (jsContent.includes("document.addEventListener('DOMContentLoaded', () => {")) {
  jsContent = jsContent.replace(
    "document.addEventListener('DOMContentLoaded', () => {\n  window.simApp = new SimulationApp();\n});",
    `if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.simApp = new SimulationApp();
  });
} else {
  window.simApp = new SimulationApp();
}`
  );
}

// 1. Replace CSS (either link or previous <style>)
const cssReplacement = `    <!-- Custom Inlined CSS for 100% Single-File Standalone Execution -->
    <style>
${cssContent}
    </style>`;

if (htmlContent.includes('<link rel="stylesheet" href="./style.css" />')) {
  htmlContent = htmlContent.replace(
    /^[ \t]*(<!-- Custom CSS -->\r?\n[ \t]*)?<link rel="stylesheet" href="\.\/style\.css" \/>/m,
    cssReplacement
  );
} else if (htmlContent.includes('<!-- Custom Inlined CSS for 100% Single-File Standalone Execution -->')) {
  htmlContent = htmlContent.replace(
    /[ \t]*<!-- Custom Inlined CSS for 100% Single-File Standalone Execution -->\r?\n[ \t]*<style>[\s\S]*?<\/style>/m,
    cssReplacement
  );
}

// 2. Replace JS (either script tag or previous inline script)
const jsReplacement = `    <!-- Main Application JavaScript Inlined for 100% Single-File Standalone Execution -->
    <script>
${jsContent}
    </script>`;

if (htmlContent.includes('<script type="module" src="./script.js"></script>')) {
  htmlContent = htmlContent.replace(
    /^[ \t]*(<!-- Main Application JavaScript -->\r?\n[ \t]*)?<script type="module" src="\.\/script\.js"><\/script>/m,
    jsReplacement
  );
} else if (htmlContent.includes('<!-- Main Application JavaScript Inlined for 100% Single-File Standalone Execution -->')) {
  htmlContent = htmlContent.replace(
    /[ \t]*<!-- Main Application JavaScript Inlined for 100% Single-File Standalone Execution -->\r?\n[ \t]*<script>[\s\S]*?<\/script>/m,
    jsReplacement
  );
}

// 3. Add Save Single HTML button to navbar if not present
const downloadBtnHtml = `            <!-- 1-Click Export / Download Single File HTML -->
            <button type="button" class="btn btn-sm btn-outline-info d-flex align-items-center gap-1 font-monospace" id="btn-download-single-file" title="Download entire application as a single standalone HTML file">
              <i class="bi bi-file-earmark-code-fill"></i>
              <span class="d-none d-xl-inline">SAVE</span> SINGLE HTML
            </button>`;

if (!htmlContent.includes('id="btn-download-single-file"')) {
  htmlContent = htmlContent.replace(
    /(<div class="d-flex align-items-center gap-2 mode-toggle-container">)/,
    `${downloadBtnHtml}\n            $1`
  );
}

// Write to both files
fs.writeFileSync(path.join(rootDir, 'autonomous_vehicle_simulation_single_file.html'), htmlContent, 'utf8');
fs.writeFileSync(htmlPath, htmlContent, 'utf8');

console.log('Successfully written both index.html and autonomous_vehicle_simulation_single_file.html (Single-File HTML standalone).');
