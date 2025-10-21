import React from 'react';

function Dashboard({ user, onLogout }) {
  // Google Sheets URL for Accounting user
  const accountingSheetUrl = 'https://docs.google.com/spreadsheets/d/1MOi94WoHSk5N0ooItm4aWQ8-3vfRiLi5HG4_fdCzl7s/template/preview';

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Welcome, {user}!</h1>
          <button onClick={onLogout} className="logout-button">
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {user === 'Accounting' ? (
          <div className="iframe-container">
            <iframe
              src={accountingSheetUrl}
              title="Accounting Spreadsheet"
              frameBorder="0"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="default-content">
            <h2>Dashboard</h2>
            <p>Welcome to your dashboard. No specific content configured for your user role.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
