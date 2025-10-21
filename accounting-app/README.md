# Accounting App

A React-based login portal with Google Sheets integration for the Accounting user.

## Features

- User authentication with login screen
- Role-based access control
- Google Sheets iframe integration for Accounting user
- Responsive design
- Modern UI with gradient backgrounds

## Demo Users

- **Accounting** / `password123` - Access to Google Sheets
- **admin** / `admin123` - Generic dashboard

## Installation

1. Navigate to the app directory:
```bash
cd accounting-app
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

Start the development server:
```bash
npm start
```

The application will open in your browser at `http://localhost:3000`

## Building for Production

To create a production build:
```bash
npm run build
```

The optimized build will be in the `build` folder.

## Project Structure

```
accounting-app/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Login.js
│   │   └── Dashboard.js
│   ├── App.js
│   ├── App.css
│   └── index.js
├── package.json
└── README.md
```

## Google Sheets Integration

When the **Accounting** user logs in, they will see the configured Google Sheets document embedded in an iframe. Other users will see a default dashboard message.

## Customization

To add more users or change the Google Sheets URL, edit:
- `src/App.js` - Add users to the `users` array
- `src/components/Dashboard.js` - Update the `accountingSheetUrl` or add more user-specific content
