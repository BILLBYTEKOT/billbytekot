# Fix Google Drive Download - Requires Sign In

## Problem
When users click download, Google Drive asks them to sign in instead of downloading directly.

## Cause
The file sharing permissions are not set correctly in Google Drive.

## Solution

### Step 1: Open Google Drive
1. Go to: https://drive.google.com
2. Find your file: `RestoBill-Setup-1.3.0-win.exe`

### Step 2: Change Sharing Settings
1. **Right-click** on the file
2. Click **"Share"** or **"Get link"**
3. Under "General access", click the dropdown (it probably says "Restricted")
4. Select **"Anyone with the link"**
5. Make sure the permission is set to **"Viewer"** (not Editor)
6. Click **"Done"**

### Step 3: Verify the Link
Your link should look like:
```
https://drive.google.com/file/d/1k-3AhQlDhj3c4VtlUbGCAhDW0VY3wOES/view?usp=sharing
```

### Step 4: Test
Open this link in an incognito/private browser window:
```
https://drive.google.com/uc?export=download&id=1k-3AhQlDhj3c4VtlUbGCAhDW0VY3wOES&confirm=t
```

If it asks for sign-in, the permissions are still wrong.
If it downloads or shows virus scan warning, permissions are correct!

## Alternative: Use a Different Hosting Service

If Google Drive keeps asking for sign-in, consider these alternatives:

### Option 1: Dropbox
1. Upload file to Dropbox
2. Get shareable link
3. Change `www.dropbox.com` to `dl.dropboxusercontent.com` in the URL
4. Remove `?dl=0` and add `?dl=1`

### Option 2: GitHub Releases (Make Repo Public)
1. Go to: https://github.com/shivshankar9/restro-ai
2. Settings → Change visibility to Public
3. Create a new release
4. Upload the .exe file
5. Use the direct download URL

### Option 3: Your Own Server
Upload to your backend server and serve it directly.

## Quick Fix for Now

If you can't fix Google Drive permissions immediately, update the code to show instructions:

```javascript
if (isWindows) {
  // Show download instructions
  toast.info("Click 'Download anyway' on the next page to get the app", { 
    duration: 5000 
  });
  
  // Open Google Drive link
  window.open("https://drive.google.com/file/d/1k-3AhQlDhj3c4VtlUbGCAhDW0VY3wOES/view", '_blank');
}
```

## Recommended Solution

**Use GitHub Releases with Public Repo:**
- Most reliable
- No sign-in required
- Fast downloads
- Professional

Just make your repo public and use GitHub releases!
