// Google Sheets Webhook Integration
// Updates Google Sheet when new users are added via Apps Script Web App

/**
 * Update Google Sheet cell with new user name via webhook
 * This uses a Google Apps Script Web App as a webhook endpoint
 */
export async function updateGoogleSheet(username, env) {
    // Check if webhook URL is configured
    if (!env.GOOGLE_SHEETS_WEBHOOK_URL) {
        console.log('Google Sheets webhook not configured - skipping update');
        return { success: false, message: 'Webhook not configured' };
    }

    try {
        // Send username to Google Apps Script webhook
        const response = await fetch(env.GOOGLE_SHEETS_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                timestamp: new Date().toISOString()
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Google Sheets webhook error:', error);
            return { success: false, message: 'Failed to update sheet' };
        }

        const result = await response.json();
        console.log('Google Sheets updated successfully:', result);
        return { success: true, message: 'Sheet updated' };

    } catch (error) {
        console.error('Error calling Google Sheets webhook:', error);
        return { success: false, message: error.message };
    }
}
