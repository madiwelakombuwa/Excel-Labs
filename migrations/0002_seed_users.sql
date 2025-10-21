-- Seed initial users with their dashboard URLs
-- NOTE: In production, passwords should be hashed using bcrypt or similar

INSERT INTO users (username, password, full_name, role, dashboard_url, is_active) VALUES
('admin', 'admin123', 'Administrator', 'Admin', 'admin-dashboard.html', 1),
('user1', 'password1', 'John Doe', 'User', 'https://lookerstudio.google.com/embed/reporting/119d56c0-7d73-4bb0-8fb9-d67a5a41361c/page/ecoJD', 1),
('user2', 'password2', 'Jane Smith', 'User', 'https://lookerstudio.google.com/embed/reporting/e8a53377-0277-49c2-adb0-f6529163757b/page/gZbyC', 1),
('marketing', 'marketing123', 'Marketing Manager', 'Marketing', NULL, 1),
('Accounting', 'password123', 'Accounting Manager', 'Accounting', 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTJ8q9ySEqesYPjHvEulJE-esmds8i1Qb-pQOpfFX46_0yw1mJz99EzQI_EfZrcKFebl-ajC_7t9r5m/pubhtml?widget=true&chrome=false&single=true', 1),
('Accounting2', 'password123', 'Accounting Manager 2', 'Accounting', 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTJ8q9ySEqesYPjHvEulJE-esmds8i1Qb-pQOpfFX46_0yw1mJz99EzQI_EfZrcKFebl-ajC_7t9r5m/pubhtml?widget=true&chrome=false&single=true&gid=1550649253', 1);
