const fs = require('fs');
const path = require('path');
const { minify } = require('terser');
const CleanCSS = require('clean-css');

const root = process.cwd();

const flaggedAssets = [
  'assets/css/animate.min.css',
  'assets/css/flaticon.css',
  'assets/css/index-page.css',
  'assets/css/main.css',
  'assets/css/swiper-bundle.css',
  'assets/css/tg-cursor.css',
  'assets/js/ajax-form.js',
  'assets/js/blog-listing.js',
  'assets/js/index-footer.js',
  'assets/js/index-head.js',
  'assets/js/jquery.appear.js',
  'assets/js/main.js',
  'assets/js/tg-page-head.js',
  'whitelable/Aitrainer/css/animate.css',
  'whitelable/Aitrainer/css/base.css',
  'whitelable/Aitrainer/css/bootstrap-icons.css',
  'whitelable/Aitrainer/css/magnific-popup.css',
  'whitelable/Aitrainer/css/owl.carousel.css',
  'whitelable/Aitrainer/css/responsive.css',
  'whitelable/Aitrainer/css/spacing.css',
  'whitelable/Aitrainer/css/style.css',
  'whitelable/Aitrainer/js/jquery-appear.js',
  'whitelable/Aitrainer/js/theme-script.js',
  'whitelable/ecommerce/css/style.css',
  'whitelable/ecommerce/js/appear.js',
  'whitelable/ecommerce/js/jquery-ui.js',
  'whitelable/ecommerce/js/jquery.fancybox.js',
  'whitelable/ecommerce/js/main-slider-script.js',
  'whitelable/ecommerce/js/owl.js',
  'whitelable/ecommerce/js/script.js',
  'whitelable/ecommerce/plugins/revolution/css/layers.css',
  'whitelable/ecommerce/plugins/revolution/css/navigation.css',
  'whitelable/gymlandingpage/assets/js/theme-switcher.js'
];

const textExtensions = new Set(['.html', '.js']);
const skipDirs = new Set(['.git', 'node_modules']);

function outputFor(relPath) {
  if (relPath.includes('.min.')) {
    return relPath;
  }
  const ext = path.extname(relPath);
  return `${relPath.slice(0, -ext.length)}.min${ext}`;
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipDirs.has(entry.name)) {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
      continue;
    }
    if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

function replaceAll(content, replacements) {
  let next = content;
  for (const [from, to] of replacements) {
    if (from === to) {
      continue;
    }
    next = next.split(from).join(to);
  }
  return next;
}

async function minifyJs(input) {
  const result = await minify(input, {
    compress: true,
    mangle: false,
    format: {
      comments: false
    }
  });

  if (!result.code) {
    throw new Error('Terser returned empty output.');
  }

  return result.code;
}

function minifyCss(input) {
  const result = new CleanCSS({
    inline: ['none'],
    level: 2,
    returnPromise: false
  }).minify(input);

  if (result.errors.length) {
    throw new Error(result.errors.join('\n'));
  }

  return result.styles;
}

async function main() {
  const assetMap = flaggedAssets.map((relPath) => [relPath.replace(/\\/g, '/'), outputFor(relPath).replace(/\\/g, '/')]);
  const replacementMap = assetMap.filter(([from, to]) => from !== to);

  const repoFiles = walk(root).filter((filePath) => {
    if (!textExtensions.has(path.extname(filePath).toLowerCase())) {
      return false;
    }
    return path.relative(root, filePath).replace(/\\/g, '/') !== 'tools/minify-flagged-assets.js';
  });

  for (const filePath of repoFiles) {
    const original = fs.readFileSync(filePath, 'utf8');
    const updated = replaceAll(original, replacementMap);
    if (updated !== original) {
      fs.writeFileSync(filePath, updated);
    }
  }

  for (const relPath of flaggedAssets) {
    const srcPath = path.join(root, relPath);
    if (!fs.existsSync(srcPath)) {
      console.warn(`Skipping missing file: ${relPath}`);
      continue;
    }

    const outputPath = path.join(root, outputFor(relPath));
    const source = fs.readFileSync(srcPath, 'utf8');
    const ext = path.extname(relPath).toLowerCase();
    let minified;

    if (ext === '.js') {
      minified = await minifyJs(source);
    } else if (ext === '.css') {
      minified = minifyCss(source);
    } else {
      continue;
    }

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, minified);
    console.log(`${relPath} -> ${path.relative(root, outputPath)}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
