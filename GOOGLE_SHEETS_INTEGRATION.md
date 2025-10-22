# Google Sheets Integration Setup

This guide will help you set up automatic Google Sheets updates when new users are added via the admin CLI.

## How It Works

When you add a new user using the `adduser` command in the admin terminal, the system will automatically update cell A1 in your Google Sheet with the new username.

## Setup Steps

### Step 1: Create Google Apps Script Webhook

1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1L0PVjSv996FNPaEFmwk17uJzjVru4x0DIipYcFsHAnY/edit

2. Click **Extensions** → **Apps Script**

3. Delete any existing code and replace it with this:

```javascript
function doPost(e) {
  try {
    // Parse the incoming request
    const data = JSON.parse(e.postData.contents);
    const username = data.username;
    const timestamp = data.timestamp;

    // Get the active spreadsheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');

    // Update cell A1 with the new username
    sheet.getRange('A1').setValue(username);

    // Optional: Log the update with timestamp in a separate cell
    // sheet.getRange('B1').setValue(new Date(timestamp));

    // Return success response
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Sheet updated successfully',
      username: username
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Return error response
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

4. Click **Deploy** → **New deployment**

5. Click the gear icon next to "Select type" and choose **Web app**

6. Configure the deployment:
   - **Description**: "User creation webhook"
   - **Execute as**: Me
   - **Who has access**: Anyone

7. Click **Deploy**

8. **IMPORTANT**: Copy the **Web app URL** that appears. It will look like:
   ```
   https://script.google.com/macros/s/AKfycby.../exec
   ```

### Step 2: Add Webhook URL to Cloudflare

1. Go to your Cloudflare Pages dashboard

2. Navigate to **Excel Labs** → **Settings** → **Environment variables**

3. Add a new environment variable:
   - **Variable name**: `GOOGLE_SHEETS_WEBHOOK_URL`
   - **Value**: Paste the Web app URL you copied from Step 1
   - **Environment**: Production (and Preview if needed)

4. Click **Save**

5. Redeploy your site to activate the new environment variable:
   - Go to **Deployments** tab
   - Click **Create deployment** or trigger a new deployment

### Step 3: Test the Integration

1. Log in to your Excel Labs dashboard as admin

2. Click the **ADMIN TERMINAL** button

3. Add a test user:
   ```
   adduser testuser password123 Test User User https://example.com/dashboard
   ```

4. Check your Google Sheet - cell A1 should now show "testuser"

## Optional Enhancements

You can modify the Google Apps Script to:

### Log All User Additions (Not Just Latest)

Replace the script with this version to append each new user to a list:

```javascript
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const username = data.username;
    const timestamp = data.timestamp;

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');

    // Update A1 with latest user
    sheet.getRange('A1').setValue(username);

    // Append to a log starting from row 3
    const lastRow = sheet.getLastRow();
    const nextRow = Math.max(3, lastRow + 1);

    sheet.getRange(nextRow, 1).setValue(username);
    sheet.getRange(nextRow, 2).setValue(new Date(timestamp));

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Sheet updated successfully',
      username: username
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

### Send Email Notification

Add this to the script to get email notifications:

```javascript
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const username = data.username;
    const timestamp = data.timestamp;

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
    sheet.getRange('A1').setValue(username);

    // Send email notification
    MailApp.sendEmail({
      to: 'your-email@example.com',
      subject: 'New User Added to Excel Labs',
      body: `A new user "${username}" was added at ${new Date(timestamp).toLocaleString()}`
    });

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Sheet updated and email sent',
      username: username
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

## Troubleshooting

### Webhook Not Working

1. Check that the `GOOGLE_SHEETS_WEBHOOK_URL` environment variable is set correctly in Cloudflare Pages

2. Verify the Google Apps Script is deployed as a Web app with "Anyone" access

3. Check the Cloudflare Pages function logs for any errors

4. Test the webhook directly using curl:
   ```bash
   curl -X POST "YOUR_WEBHOOK_URL" \
     -H "Content-Type: application/json" \
     -d '{"username":"testuser","timestamp":"2024-01-01T00:00:00Z"}'
   ```

### Cell A1 Not Updating

1. Make sure you're updating the correct sheet (Sheet1 by default)

2. Check the Google Apps Script execution log:
   - Open Apps Script editor
   - Click **Executions** on the left sidebar
   - Look for recent executions and any errors

3. Verify the sheet isn't protected or locked

## Technical Details

The integration works as follows:

1. User runs `adduser` command in admin terminal
2. Frontend calls `/api/manage-users?action=add` with user data
3. Backend creates user in D1 database
4. Backend calls `updateGoogleSheet()` function (functions/lib/google-sheets.js)
5. Function sends POST request to Google Apps Script webhook
6. Apps Script updates cell A1 in your Google Sheet
7. Success/failure is logged in Cloudflare function logs

The webhook will gracefully fail if not configured - the user will still be created successfully even if the sheet update fails.
