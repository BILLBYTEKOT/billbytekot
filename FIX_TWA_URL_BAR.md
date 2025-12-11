# Fix Android TWA URL Bar Issue

## Problem
The Android app shows a URL bar at the top instead of running in full-screen mode.

## Cause
Digital Asset Links verification is failing. This happens when:
1. Wrong package name in assetlinks.json
2. Wrong SHA-256 fingerprint
3. File not accessible at `https://billbytekot.in/.well-known/assetlinks.json`

## Solution Applied

### 1. Updated assetlinks.json
- ✅ Changed package name from `app.vercel.restro_ai_u9kz.twa` to `in.billbytekot.twa`
- ✅ Updated SHA-256 fingerprint
- ✅ Placed at `frontend/public/.well-known/assetlinks.json`

### 2. Verify After Deploy

After deploying your website, verify the file is accessible:

**Test URL:**
```
https://billbytekot.in/.well-known/assetlinks.json
```

**Should return:**
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "in.billbytekot.twa",
    "sha256_cert_fingerprints": ["85:7C:B2:AA:70:1E:2E:1F:BC:13:F0:42:BB:73:CC:9A:56:AC:A3:06:24:7A:B2:DD:C4:C8:25:56:6F:7E:3F:92"]
  }
}]
```

### 3. Test Digital Asset Links

Use Google's verification tool:
```
https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://billbytekot.in&relation=delegate_permission/common.handle_all_urls
```

Should show your app package.

### 4. Rebuild and Reinstall App

After deploying the website:

1. **Uninstall old app** from your phone
2. **Rebuild APK** with version 6:
   ```bash
   cd frontend/billbytekot
   bubblewrap build
   ```
3. **Install new APK** on your phone
4. **Wait 5-10 minutes** for Android to verify the asset links
5. **Open the app** - URL bar should be gone!

## Why It Takes Time

Android verifies Digital Asset Links in the background:
- First launch: May show URL bar
- After 5-10 minutes: Android completes verification
- Next launch: URL bar disappears

## Troubleshooting

### If URL bar still shows:

1. **Check file is accessible:**
   ```
   curl https://billbytekot.in/.well-known/assetlinks.json
   ```

2. **Verify package name matches:**
   - assetlinks.json: `in.billbytekot.twa`
   - build.gradle: `in.billbytekot.twa`
   - twa-manifest.json: `in.billbytekot.twa`

3. **Clear app data:**
   - Settings → Apps → RestoBill → Storage → Clear Data
   - Reopen app

4. **Wait longer:**
   - Android can take up to 24 hours to verify
   - Be patient!

## Quick Checklist

- [ ] Deploy website with updated assetlinks.json
- [ ] Verify file accessible at `https://billbytekot.in/.well-known/assetlinks.json`
- [ ] Uninstall old app from phone
- [ ] Rebuild APK with `bubblewrap build`
- [ ] Install new APK
- [ ] Wait 5-10 minutes
- [ ] Reopen app - URL bar should be gone!

## Important Notes

1. **Must use HTTPS** - Asset links only work with HTTPS
2. **Exact domain match** - Must be `billbytekot.in` (not `www.billbytekot.in`)
3. **Case sensitive** - Package name must match exactly
4. **Takes time** - Android verifies in background

## Expected Result

After verification completes:
- ✅ No URL bar at top
- ✅ Full-screen app experience
- ✅ Looks like native app
- ✅ No browser UI

---

**Status:** ✅ assetlinks.json updated

**Next:** Deploy website and rebuild APK
