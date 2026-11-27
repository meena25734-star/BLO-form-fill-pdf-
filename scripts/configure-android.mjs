import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const rootDir = process.cwd();
const androidDir = path.join(rootDir, 'android');

if (!fs.existsSync(androidDir)) {
  console.error('android/ directory not found. Run `npx cap add android` first.');
  process.exit(1);
}

// 1. Ensure Target SDK 35 & Min SDK 24 (satisfies Indus Appstore, Galaxy Store & Google Play)
const variablesGradlePath = path.join(androidDir, 'variables.gradle');
if (fs.existsSync(variablesGradlePath)) {
  let vars = fs.readFileSync(variablesGradlePath, 'utf8');
  vars = vars.replace(/minSdkVersion\s*=\s*\d+/, 'minSdkVersion = 24');
  vars = vars.replace(/compileSdkVersion\s*=\s*\d+/, 'compileSdkVersion = 35');
  vars = vars.replace(/targetSdkVersion\s*=\s*\d+/, 'targetSdkVersion = 35');
  fs.writeFileSync(variablesGradlePath, vars, 'utf8');
  console.log('Updated android/variables.gradle to compileSdk=35, targetSdk=35, minSdk=24');
}

// 2. Add optional CAMERA permission & hardware features to AndroidManifest.xml
const manifestPath = path.join(androidDir, 'app', 'src', 'main', 'AndroidManifest.xml');
if (fs.existsSync(manifestPath)) {
  let manifest = fs.readFileSync(manifestPath, 'utf8');
  const additions = [
    '<uses-permission android:name="android.permission.CAMERA" />',
    '<uses-feature android:name="android.hardware.camera" android:required="false" />',
    '<uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />',
  ];

  for (const tag of additions) {
    if (!manifest.includes(tag)) {
      manifest = manifest.replace('</manifest>', `    ${tag}\n</manifest>`);
    }
  }
  fs.writeFileSync(manifestPath, manifest, 'utf8');
  console.log('Updated AndroidManifest.xml with optional CAMERA permissions');
}

// 3. Configure Release Signing & Version in android/app/build.gradle
const appBuildGradlePath = path.join(androidDir, 'app', 'build.gradle');
if (fs.existsSync(appBuildGradlePath)) {
  let gradle = fs.readFileSync(appBuildGradlePath, 'utf8');
  const versionCode = process.env.ANDROID_VERSION_CODE || '2';
  const versionName = process.env.ANDROID_VERSION_NAME || '1.1.0';

  gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`);
  gradle = gradle.replace(/versionName\s+"[^"]+"/, `versionName "${versionName}"`);

  if (!gradle.includes('signingConfigs')) {
    const signingBlock = `
    signingConfigs {
        release {
            def ksPath = System.getenv("KEYSTORE_PATH")
            if (ksPath != null && file(ksPath).exists()) {
                storeFile file(ksPath)
                storePassword System.getenv("KEYSTORE_PASSWORD") ?: "bloformpdf123"
                keyAlias System.getenv("KEY_ALIAS") ?: "bloformkey"
                keyPassword System.getenv("KEY_PASSWORD") ?: "bloformpdf123"
            }
        }
    }
    buildTypes {`;

    gradle = gradle.replace('buildTypes {', signingBlock);
    gradle = gradle.replace(
      /release\s*\{/,
      `release {\n            signingConfig signingConfigs.release`
    );
  }

  fs.writeFileSync(appBuildGradlePath, gradle, 'utf8');
  console.log(`Configured android/app/build.gradle (versionCode=${versionCode}, versionName=${versionName})`);
}

// 4. Replace default Capacitor icons with the real BLO Form PDF icon across mipmap densities
const resDir = path.join(androidDir, 'app', 'src', 'main', 'res');
const sourceIcon512 = path.join(rootDir, 'public', 'pwa-512x512.png');
const sourceIcon192 = path.join(rootDir, 'public', 'pwa-192x192.png');

if (fs.existsSync(sourceIcon512) && fs.existsSync(resDir)) {
  const densities = [
    { dir: 'mipmap-mdpi', size: 48, fgSize: 108 },
    { dir: 'mipmap-hdpi', size: 72, fgSize: 162 },
    { dir: 'mipmap-xhdpi', size: 96, fgSize: 216 },
    { dir: 'mipmap-xxhdpi', size: 144, fgSize: 324 },
    { dir: 'mipmap-xxxhdpi', size: 192, fgSize: 432 },
  ];

  let hasPythonPil = false;
  try {
    execSync('python3 -c "import PIL"', { stdio: 'ignore' });
    hasPythonPil = true;
  } catch {
    hasPythonPil = false;
  }

  for (const { dir, size, fgSize } of densities) {
    const targetDir = path.join(resDir, dir);
    if (!fs.existsSync(targetDir)) continue;

    if (hasPythonPil) {
      const pyScript = `
from PIL import Image
img = Image.open(${JSON.stringify(sourceIcon512)}).convert("RGBA")
img.resize((${size}, ${size}), Image.LANCZOS).save(${JSON.stringify(path.join(targetDir, 'ic_launcher.png'))})
img.resize((${size}, ${size}), Image.LANCZOS).save(${JSON.stringify(path.join(targetDir, 'ic_launcher_round.png'))})
canvas = Image.new("RGBA", (${fgSize}, ${fgSize}), (30, 58, 95, 255))
inner = int(${fgSize} * 0.68)
resized = img.resize((inner, inner), Image.LANCZOS)
offset = (${fgSize} - inner) // 2
canvas.paste(resized, (offset, offset), resized)
canvas.save(${JSON.stringify(path.join(targetDir, 'ic_launcher_foreground.png'))})
`;
      execSync(`python3 -c ${JSON.stringify(pyScript)}`);
    } else if (fs.existsSync(sourceIcon192)) {
      fs.copyFileSync(sourceIcon192, path.join(targetDir, 'ic_launcher.png'));
      fs.copyFileSync(sourceIcon192, path.join(targetDir, 'ic_launcher_round.png'));
      fs.copyFileSync(sourceIcon512, path.join(targetDir, 'ic_launcher_foreground.png'));
    }
  }

  // Match adaptive icon background color (#1E3A5F)
  const bgColorXml = path.join(resDir, 'values', 'ic_launcher_background.xml');
  if (fs.existsSync(bgColorXml)) {
    fs.writeFileSync(
      bgColorXml,
      `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#1E3A5F</color>\n</resources>\n`,
      'utf8'
    );
  }
  console.log('Applied BLO Form PDF launcher icons across all Android mipmap densities');
}
