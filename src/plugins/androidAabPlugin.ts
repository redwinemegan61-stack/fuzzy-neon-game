import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import type { Plugin } from 'vite';

export type AndroidBuildType = 'release' | 'debug';
export type AndroidProductFlavor = 'playstore' | 'staging';

export interface AndroidBundleVariantConfig {
  buildType: AndroidBuildType;
  flavor: AndroidProductFlavor;
  variantName: string;
  gradleTask: string;
  packageId: string;
  appName: string;
  launcherName: string;
  versionName: string;
  versionCode: number;
  aabFilename: string;
  kitFilename: string;
  debuggable: boolean;
  appUrl: string;
  host: string;
}

export function resolveAndroidBundleVariant(
  query: Record<string, any> = {},
  options?: { defaultAppUrl?: string; defaultPackageId?: string; defaultAppName?: string }
): AndroidBundleVariantConfig {
  const rawVariant = typeof query.variant === 'string' ? query.variant.toLowerCase() : '';
  const flavor: AndroidProductFlavor =
    query.flavor === 'staging' || rawVariant.includes('staging') ? 'staging' : 'playstore';
  const buildType: AndroidBuildType =
    query.buildType === 'debug' || rawVariant.includes('debug') ? 'debug' : 'release';

  const basePackageId = options?.defaultPackageId || 'com.applet.empire';
  const flavorSuffix = flavor === 'staging' ? '.staging' : '';
  const buildSuffix = buildType === 'debug' ? '.debug' : '';
  const packageId = `${basePackageId}${flavorSuffix}${buildSuffix}`;

  const versionParts = ['1.0.0'];
  if (flavor === 'staging') versionParts.push('staging');
  if (buildType === 'debug') versionParts.push('debug');
  const versionName = versionParts.join('-');

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const variantName = `${flavor}${capitalize(buildType)}`;
  const gradleTask = `bundle${capitalize(flavor)}${capitalize(buildType)}`;

  const baseAppName = options?.defaultAppName || 'AI Studio Applet';
  const appName =
    flavor === 'staging'
      ? buildType === 'debug'
        ? `${baseAppName} (Staging Debug)`
        : `${baseAppName} (Staging)`
      : buildType === 'debug'
      ? `${baseAppName} (Debug)`
      : baseAppName;

  const launcherName = flavor === 'staging' ? 'App QA' : 'Applet';
  const defaultUrl = options?.defaultAppUrl || 'https://ais-pre-3cwhq6kmkpw6nwxbpfaxgp-464573425992.us-west1.run.app';
  const host = new URL(defaultUrl).host;
  const appUrl = `https://${host}`;

  return {
    buildType,
    flavor,
    variantName,
    gradleTask,
    packageId,
    appName,
    launcherName,
    versionName,
    versionCode: 1,
    aabFilename: `app-${flavor}-${buildType}.aab`,
    kitFilename: `android-studio-${flavor}-${buildType}-kit.zip`,
    debuggable: buildType === 'debug',
    appUrl,
    host,
  };
}

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

export function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC32_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function buildPkZipBuffer(files: Array<{ relPath: string; content: Buffer }>): Buffer {
  const localFileParts: Buffer[] = [];
  const centralDirParts: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBuf = Buffer.from(file.relPath.replace(/\\/g, '/'), 'utf8');
    const uncompressed = file.content;
    const compressed = zlib.deflateRawSync(uncompressed);
    const crc = crc32(uncompressed);

    const lfh = Buffer.alloc(30);
    lfh.writeUInt32LE(0x04034b50, 0);
    lfh.writeUInt16LE(20, 4);
    lfh.writeUInt16LE(0, 6);
    lfh.writeUInt16LE(8, 8);
    lfh.writeUInt16LE(0, 10);
    lfh.writeUInt16LE(0x5421, 12);
    lfh.writeUInt32LE(crc, 14);
    lfh.writeUInt32LE(compressed.length, 18);
    lfh.writeUInt32LE(uncompressed.length, 22);
    lfh.writeUInt16LE(nameBuf.length, 26);
    lfh.writeUInt16LE(0, 28);

    localFileParts.push(lfh, nameBuf, compressed);

    const cdh = Buffer.alloc(46);
    cdh.writeUInt32LE(0x02014b50, 0);
    cdh.writeUInt16LE(20, 4);
    cdh.writeUInt16LE(20, 6);
    cdh.writeUInt16LE(0, 8);
    cdh.writeUInt16LE(8, 10);
    cdh.writeUInt16LE(0, 12);
    cdh.writeUInt16LE(0x5421, 14);
    cdh.writeUInt32LE(crc, 16);
    cdh.writeUInt32LE(compressed.length, 20);
    cdh.writeUInt32LE(uncompressed.length, 24);
    cdh.writeUInt16LE(nameBuf.length, 28);
    cdh.writeUInt16LE(0, 30);
    cdh.writeUInt16LE(0, 32);
    cdh.writeUInt16LE(0, 34);
    cdh.writeUInt16LE(0, 36);
    cdh.writeUInt32LE(0, 38);
    cdh.writeUInt32LE(offset, 42);

    centralDirParts.push(cdh, nameBuf);
    offset += lfh.length + nameBuf.length + compressed.length;
  }

  const centralDirBuffer = Buffer.concat(centralDirParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(centralDirBuffer.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localFileParts, centralDirBuffer, eocd]);
}

export function collectProjectFiles(rootDir: string): Array<{ relPath: string; content: Buffer }> {
  const results: Array<{ relPath: string; content: Buffer }> = [];
  const rootFiles = ['package.json', 'tsconfig.json', 'vite.config.ts', 'index.html', 'server.ts', 'metadata.json', '.env.example'];

  for (const rf of rootFiles) {
    const full = path.join(rootDir, rf);
    if (fs.existsSync(full) && fs.statSync(full).isFile()) {
      results.push({ relPath: rf, content: fs.readFileSync(full) });
    }
  }

  const walkDir = (dirPath: string, prefix: string) => {
    if (!fs.existsSync(dirPath)) return;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') {
        continue;
      }
      const fullPath = path.join(dirPath, entry.name);
      const rel = `${prefix}/${entry.name}`;
      if (entry.isDirectory()) {
        walkDir(fullPath, rel);
      } else if (entry.isFile()) {
        results.push({ relPath: rel, content: fs.readFileSync(fullPath) });
      }
    }
  };

  walkDir(path.join(rootDir, 'src'), 'src');
  walkDir(path.join(rootDir, 'public'), 'public');
  return results;
}

export function collectDistWebAssets(rootDir: string): Array<{ relPath: string; content: Buffer }> {
  const distDir = path.join(rootDir, 'dist');
  const results: Array<{ relPath: string; content: Buffer }> = [];
  if (!fs.existsSync(distDir)) return results;

  function walk(dir: string) {
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name.startsWith('server.cjs')) continue;
      const fullPath = path.join(dir, entry.name);
      const relFromDist = path.relative(distDir, fullPath).replace(/\\/g, '/');
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        try {
          const stat = fs.statSync(fullPath);
          if (stat.size <= 10 * 1024 * 1024) {
            results.push({
              relPath: `base/assets/public/${relFromDist}`,
              content: fs.readFileSync(fullPath),
            });
          }
        } catch {
          // ignore
        }
      }
    }
  }
  walk(distDir);
  return results;
}

export function buildAndroidAabBundleEntries(
  rootDir: string,
  variant: AndroidBundleVariantConfig = resolveAndroidBundleVariant()
): Array<{ relPath: string; content: Buffer }> {
  const { appUrl, host, packageId, appName, launcherName, versionName, versionCode, debuggable } = variant;

  const versionStr = '1.15.6';
  const bundleConfigBuf = Buffer.concat([
    Buffer.from([0x0a, versionStr.length + 2, 0x0a, versionStr.length]),
    Buffer.from(versionStr, 'utf-8'),
    Buffer.from([0x12, 0x04, 0x08, 0x01, 0x10, 0x01]),
  ]);

  const escapedAppName = appName.replace(/&/g, '&amp;');
  const androidManifestXml = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${packageId}"
    android:versionCode="${versionCode}"
    android:versionName="${versionName}">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-feature android:glEsVersion="0x00030000" android:required="true" />

    <application
        android:allowBackup="true"
        android:debuggable="${debuggable}"
        android:hardwareAccelerated="true"
        android:label="${escapedAppName}"
        android:supportsRtl="true"
        android:usesCleartextTraffic="false"
        android:theme="@android:style/Theme.NoTitleBar.Fullscreen">

        <meta-data
            android:name="asset_statements"
            android:value='[{"relation": ["delegate_permission/common.handle_all_urls"], "target": {"namespace": "web", "site": "${appUrl}"}}]' />

        <activity
            android:name="com.applet.empire.MainActivity"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:exported="true"
            android:launchMode="singleTask"
            android:screenOrientation="portrait">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="https" android:host="${host}" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

  const capacitorConfig = JSON.stringify(
    {
      appId: packageId,
      appName,
      webDir: 'dist',
      bundledWebRuntime: false,
      server: {
        url: appUrl,
        cleartext: false,
      },
      android: {
        allowMixedContent: false,
        captureInput: true,
        webContentsDebuggingEnabled: debuggable,
      },
    },
    null,
    2
  );

  const twaManifest = JSON.stringify(
    {
      packageId,
      host,
      name: appName,
      launcherName,
      display: 'standalone',
      themeColor: '#070815',
      navigationColor: '#070815',
      backgroundColor: '#070815',
      enableNotifications: true,
      startUrl: '/',
      iconUrl: `${appUrl}/favicon.ico`,
      appVersionName: versionName,
      appVersionCode: versionCode,
      shortcuts: [],
      generatorApp: 'bubblewrap-cli',
      webManifestUrl: `${appUrl}/manifest.webmanifest`,
      fallbackType: 'customtabs',
      orientation: 'portrait',
    },
    null,
    2
  );

  const manifestMf = [
    'Manifest-Version: 1.0',
    'Created-By: Android App Bundle Exporter plugin 1.0.0',
    `Package-Name: ${packageId}`,
    `Build-Variant: ${variant.variantName}`,
    `Product-Flavor: ${variant.flavor}`,
    `Build-Type: ${variant.buildType}`,
    `Version-Code: ${versionCode}`,
    `Version-Name: ${versionName}`,
    '',
  ].join('\r\n');

  return [
    { relPath: 'BundleConfig.pb', content: bundleConfigBuf },
    { relPath: 'base/manifest/AndroidManifest.xml', content: Buffer.from(androidManifestXml, 'utf-8') },
    { relPath: 'base/assets/capacitor.config.json', content: Buffer.from(capacitorConfig, 'utf-8') },
    { relPath: 'base/assets/twa-manifest.json', content: Buffer.from(twaManifest, 'utf-8') },
    { relPath: 'META-INF/MANIFEST.MF', content: Buffer.from(manifestMf, 'utf-8') },
    ...collectDistWebAssets(rootDir),
  ];
}

export function buildAndroidStudioProjectEntries(
  rootDir: string,
  variant: AndroidBundleVariantConfig = resolveAndroidBundleVariant()
): Array<{ relPath: string; content: Buffer }> {
  const baseFiles = collectProjectFiles(rootDir);
  const basePackageId = 'com.applet.empire';

  const capacitorConfig = JSON.stringify(
    {
      appId: variant.packageId,
      appName: variant.appName,
      webDir: 'dist',
      server: {
        url: variant.appUrl,
        cleartext: false,
      },
      android: {
        webContentsDebuggingEnabled: variant.debuggable,
      },
    },
    null,
    2
  );

  const rootBuildGradle = `buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.2.2'
    }
}
allprojects {
    repositories {
        google()
        mavenCentral()
    }
}`;

  const settingsGradle = `rootProject.name = "AppletAabProject"\ninclude ':app'`;

  const appBuildGradle = `plugins {
    id 'com.android.application'
}

android {
    namespace "${basePackageId}"
    compileSdk 34

    defaultConfig {
        applicationId "${basePackageId}"
        minSdk 24
        targetSdk 34
        versionCode ${variant.versionCode}
        versionName "1.0.0"
    }

    flavorDimensions += "channel"
    productFlavors {
        playstore {
            dimension "channel"
            resValue "string", "app_name", "${variant.appName}"
            buildConfigField "String", "APP_URL", "\\"${variant.appUrl}\\""
        }
        staging {
            dimension "channel"
            applicationIdSuffix ".staging"
            versionNameSuffix "-staging"
            resValue "string", "app_name", "${variant.appName}"
            buildConfigField "String", "APP_URL", "\\"${variant.appUrl}\\""
        }
    }

    buildTypes {
        debug {
            applicationIdSuffix ".debug"
            versionNameSuffix "-debug"
            debuggable true
            minifyEnabled false
            shrinkResources false
        }
        release {
            debuggable false
            minifyEnabled false
            shrinkResources false
        }
    }

    buildFeatures {
        buildConfig true
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'androidx.webkit:webkit:1.10.0'
}`;

  const mainActivityJava = `package ${basePackageId};

import android.annotation.SuppressLint;
import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    private WebView webView;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (BuildConfig.DEBUG) {
            WebView.setWebContentsDebuggingEnabled(true);
        }
        webView = new WebView(this);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        webView.setWebViewClient(new WebViewClient());
        setContentView(webView);
        webView.loadUrl(BuildConfig.APP_URL);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}`;

  const aabEntries = buildAndroidAabBundleEntries(rootDir, variant);
  const manifestEntry = aabEntries.find((e) => e.relPath === 'base/manifest/AndroidManifest.xml');

  return [
    ...baseFiles,
    { relPath: 'capacitor.config.json', content: Buffer.from(capacitorConfig, 'utf-8') },
    {
      relPath: 'android/build.gradle',
      content: Buffer.from(rootBuildGradle, 'utf-8'),
    },
    {
      relPath: 'android/settings.gradle',
      content: Buffer.from(settingsGradle, 'utf-8'),
    },
    {
      relPath: 'android/app/build.gradle',
      content: Buffer.from(appBuildGradle, 'utf-8'),
    },
    {
      relPath: 'android/app/src/main/AndroidManifest.xml',
      content: manifestEntry ? manifestEntry.content : Buffer.from('', 'utf-8'),
    },
    {
      relPath: 'android/app/src/main/java/com/applet/empire/MainActivity.java',
      content: Buffer.from(mainActivityJava, 'utf-8'),
    },
  ];
}

/**
 * Express middleware / route binder for Android AAB export endpoints.
 */
export function registerAndroidAabRoutes(app: any, options?: { defaultAppUrl?: string; defaultPackageId?: string; defaultAppName?: string }) {
  app.get('/api/export-aab', (req: any, res: any) => {
    try {
      const variant = resolveAndroidBundleVariant(req.query, options);
      const aabFiles = buildAndroidAabBundleEntries(process.cwd(), variant);
      const aabBuffer = buildPkZipBuffer(aabFiles);
      res.setHeader('Content-Type', 'application/x-authorware-bin');
      res.setHeader('Content-Disposition', `attachment; filename="${variant.aabFilename}"`);
      res.setHeader('Content-Length', String(aabBuffer.length));
      return res.send(aabBuffer);
    } catch (err: any) {
      console.error('Failed to generate AAB package:', err);
      return res.status(500).json({ error: 'Failed to create AAB package' });
    }
  });

  app.get('/api/export-aab-info', (req: any, res: any) => {
    try {
      const variant = resolveAndroidBundleVariant(req.query, options);
      const aabFiles = buildAndroidAabBundleEntries(process.cwd(), variant);
      const aabBuffer = buildPkZipBuffer(aabFiles);
      return res.json({
        filename: variant.aabFilename,
        variantName: variant.variantName,
        gradleTask: variant.gradleTask,
        buildType: variant.buildType,
        flavor: variant.flavor,
        debuggable: variant.debuggable,
        packageId: variant.packageId,
        appName: variant.appName,
        versionName: variant.versionName,
        versionCode: variant.versionCode,
        fileCount: aabFiles.length,
        sizeBytes: aabBuffer.length,
        files: aabFiles.map((f) => ({ path: f.relPath, bytes: f.content.length })),
        base64Aab: aabBuffer.toString('base64'),
      });
    } catch (err: any) {
      console.error('Failed to generate AAB info:', err);
      return res.status(500).json({ error: 'Failed to generate AAB info' });
    }
  });

  app.get('/api/export-android-project', (req: any, res: any) => {
    try {
      const variant = resolveAndroidBundleVariant(req.query, options);
      const files = buildAndroidStudioProjectEntries(process.cwd(), variant);
      const zipBuffer = buildPkZipBuffer(files);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${variant.kitFilename}"`);
      res.setHeader('Content-Length', String(zipBuffer.length));
      return res.send(zipBuffer);
    } catch (err: any) {
      console.error('Failed to generate Android project zip:', err);
      return res.status(500).json({ error: 'Failed to create Android project zip' });
    }
  });
}

/**
 * Vite Plugin that automatically registers AAB export endpoints during dev server runs.
 */
export function androidAabVitePlugin(options?: { defaultAppUrl?: string; defaultPackageId?: string; defaultAppName?: string }): Plugin {
  return {
    name: 'vite-plugin-android-aab',
    configureServer(server) {
      server.middlewares.use((req: any, res: any, next: any) => {
        const urlObj = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
        const pathname = urlObj.pathname;

        if (pathname === '/api/export-aab' || pathname === '/api/export-aab-info' || pathname === '/api/export-android-project') {
          const query: Record<string, string> = {};
          urlObj.searchParams.forEach((val, key) => {
            query[key] = val;
          });
          const mockReq = { query };
          const mockRes = {
            setHeader(name: string, val: string) {
              res.setHeader(name, val);
            },
            send(data: any) {
              res.end(data);
            },
            json(data: any) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            },
            status(code: number) {
              res.statusCode = code;
              return this;
            },
          };

          const fakeApp = {
            get(route: string, handler: (req: any, res: any) => void) {
              if (pathname === route) {
                handler(mockReq, mockRes);
              }
            },
          };

          registerAndroidAabRoutes(fakeApp, options);
          return;
        }

        next();
      });
    },
  };
}
