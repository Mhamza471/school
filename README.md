# School Web Portal

This is a simple web portal for students to view their attendance, fee, exam, and homework records. Data is synced from your Unity app to Firebase Realtime Database as a JSON file.

## Usage

1. Upload the `webportal` folder to your GitHub repository.
2. Enable GitHub Pages in your repository settings (set source to `/webportal` folder).
3. Update the `databaseURL` in `app.js` to your own Firebase Realtime Database URL if needed.
4. Open `index.html` in your browser or via GitHub Pages.

## Features
- Student login using name and father CNIC
- Dashboard with attendance, fee, exam, and homework records
- Reads data from Firebase Realtime Database (schoolData.json)

## Note
- Make sure your Unity app is syncing data to Firebase every minute.
- For security, do not expose sensitive data in the database.
