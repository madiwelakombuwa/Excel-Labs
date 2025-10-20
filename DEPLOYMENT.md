# Deployment Guide for Cloudflare Pages

This guide explains how to deploy the Excel Labs documentation site to Cloudflare Pages.

## Prerequisites

- A Cloudflare account (sign up at https://dash.cloudflare.com/sign-up)
- Node.js and npm installed (for Wrangler CLI method)

## Method 1: Deploy via Cloudflare Dashboard (Easiest)

1. **Connect your GitHub repository:**
   - Go to https://dash.cloudflare.com
   - Navigate to "Workers & Pages"
   - Click "Create application" > "Pages" > "Connect to Git"
   - Select your GitHub repository: `Excel-Labs`
   - Authorize Cloudflare to access your repository

2. **Configure build settings:**
   - **Project name:** `excel-labs` (or your preferred name)
   - **Production branch:** `claude/cloudflare-deployment-011CUKAEHqx5MLDYtnVJSfhp`
   - **Build command:** (leave empty)
   - **Build output directory:** `docs`

3. **Deploy:**
   - Click "Save and Deploy"
   - Cloudflare will automatically deploy your site
   - Your site will be available at `https://excel-labs.pages.dev`

4. **Custom domain (optional):**
   - Go to your project settings
   - Click "Custom domains"
   - Add your custom domain

## Method 2: Deploy via Wrangler CLI

1. **Install Wrangler:**
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare:**
   ```bash
   wrangler login
   ```

3. **Deploy the site:**
   ```bash
   npm run deploy
   ```

   Or directly with Wrangler:
   ```bash
   wrangler pages deploy docs --project-name=excel-labs
   ```

4. **Your site will be deployed to:**
   `https://excel-labs.pages.dev`

## Local Development

To test the site locally before deploying:

```bash
# Using Wrangler
npm run dev

# Or with a simple HTTP server
npx http-server docs -p 8080
```

Then open http://localhost:8080 in your browser.

## Automatic Deployments

Once connected via Method 1, Cloudflare Pages will automatically:
- Deploy on every push to your production branch
- Create preview deployments for pull requests
- Provide deployment history and rollback options

## Environment Variables

No environment variables are required for this static site.

## Custom Configuration

The site includes:
- **Security headers** (defined in `docs/_headers`)
- **Redirects** (defined in `docs/_redirects`)
- **Wrangler config** (defined in `wrangler.toml`)

## Troubleshooting

- **Build fails:** Ensure the `docs` directory exists and contains `index.html`
- **404 errors:** Check that the build output directory is set to `docs`
- **CSS not loading:** Verify that `styles.css` is in the `docs` directory

## Support

For Cloudflare Pages support:
- Documentation: https://developers.cloudflare.com/pages
- Community: https://community.cloudflare.com

For Excel Labs project support:
- GitHub Issues: https://github.com/microsoft/Excel-Labs/issues
