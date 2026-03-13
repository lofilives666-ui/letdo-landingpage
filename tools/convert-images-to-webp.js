const fs = require('fs');
const path = require('path');

async function main() {
  const sharp = require('sharp');

  const root = process.cwd();
  const assetRoots = [
    path.join(root, 'assets'),
    path.join(root, 'whitelable'),
  ];
  const textExtensions = new Set(['.html', '.css', '.scss', '.js', '.json', '.xml']);
  const imageExtensions = new Set(['.jpg', '.jpeg', '.png']);
  const skipPathFragments = [
    `${path.sep}node_modules${path.sep}`,
    `${path.sep}.git${path.sep}`,
    `${path.sep}android${path.sep}`,
    `${path.sep}ios${path.sep}`,
    `${path.sep}AppIcon.appiconset${path.sep}`,
    `${path.sep}LaunchImage.imageset${path.sep}`,
    `${path.sep}mipmap-`,
    `${path.sep}app-icons${path.sep}`,
    `${path.sep}web${path.sep}icons${path.sep}`,
  ];
  const skipFileNames = new Set([
    'favicon.png',
    'favicon.ico',
    'Icon-192.png',
    'Icon-512.png',
    'Icon-maskable-192.png',
    'Icon-maskable-512.png',
    'apple-touch-icon.png',
  ]);

  const converted = [];
  const textFiles = [];
  const imageMap = new Map();

  function shouldSkip(filePath) {
    const normalized = path.normalize(filePath);
    const baseName = path.basename(normalized);

    if (skipFileNames.has(baseName)) {
      return true;
    }

    return skipPathFragments.some((fragment) => normalized.includes(fragment));
  }

  function walk(dir) {
    if (!fs.existsSync(dir)) {
      return;
    }

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);

      if (shouldSkip(fullPath)) {
        continue;
      }

      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      const ext = path.extname(entry.name).toLowerCase();
      if (imageExtensions.has(ext)) {
        imageMap.set(fullPath, `${fullPath.slice(0, -ext.length)}.webp`);
      } else if (textExtensions.has(ext)) {
        textFiles.push(fullPath);
      }
    }
  }

  walk(root);
  assetRoots.forEach(walk);

  for (const [sourcePath, targetPath] of imageMap.entries()) {
    const image = sharp(sourcePath, { animated: false });
    const metadata = await image.metadata();
    const quality = metadata.hasAlpha ? 90 : 82;

    await image
      .rotate()
      .webp({
        quality,
        effort: 4,
      })
      .toFile(targetPath);

    converted.push({
      sourcePath,
      targetPath,
    });
  }

  let updatedFiles = 0;

  for (const filePath of textFiles) {
    let content = fs.readFileSync(filePath, 'utf8');
    let nextContent = content;
    const fileDir = path.dirname(filePath);

    for (const [sourcePath, targetPath] of imageMap.entries()) {
      if (!fs.existsSync(targetPath)) {
        continue;
      }

      const sourceRel = path.relative(root, sourcePath).split(path.sep).join('/');
      const targetRel = path.relative(root, targetPath).split(path.sep).join('/');
      const sourceFromFile = path.relative(fileDir, sourcePath).split(path.sep).join('/');
      const targetFromFile = path.relative(fileDir, targetPath).split(path.sep).join('/');
      const sourceAbsUrl = `/${sourceRel}`;
      const targetAbsUrl = `/${targetRel}`;
      const sourceSiteUrl = `https://www.letsdocreative.com/${sourceRel}`;
      const targetSiteUrl = `https://www.letsdocreative.com/${targetRel}`;

      nextContent = nextContent.split(sourceRel).join(targetRel);
      nextContent = nextContent.split(sourceFromFile).join(targetFromFile);
      nextContent = nextContent.split(sourceAbsUrl).join(targetAbsUrl);
      nextContent = nextContent.split(sourceSiteUrl).join(targetSiteUrl);
    }

    if (nextContent !== content) {
      fs.writeFileSync(filePath, nextContent, 'utf8');
      updatedFiles += 1;
    }
  }

  console.log(`converted=${converted.length}`);
  console.log(`updated_files=${updatedFiles}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
