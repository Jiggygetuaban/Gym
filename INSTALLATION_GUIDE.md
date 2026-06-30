# GymLog Installation Guide

This guide explains how to install and run the GymLog system on another computer or mobile device.

GymLog has two parts:

- **Backend API:** Laravel app in `backend/`
- **Mobile/Web App:** Expo React Native app in the project root

## 1. Requirements

Install these before setting up the project:

- **PHP 8.2 or newer**
- **Composer**
- **Node.js 20 or newer**
- **npm**
- **Git**
- **Expo Go app** on your phone, if testing on a real mobile device
- **XAMPP**, optional but recommended on Windows because it includes PHP

For Android emulator testing, install **Android Studio**.

## 2. Copy the Project to the New Device

Option A: Clone from Git:

```bash
git clone https://github.com/Jiggygetuaban/Gym.git
cd Gym
```

Option B: Copy the whole `Gym` folder manually to the new device.

If you copy the folder manually, do not copy these folders unless you really need to:

- `node_modules/`
- `backend/vendor/`

They can be reinstalled.

## 3. Install the Backend

Open a terminal in the backend folder:

```bash
cd backend
```

Install PHP dependencies:

```bash
composer install
```

Create the Laravel environment file:

```powershell
Copy-Item .env.example .env
```

On macOS/Linux, use:

```bash
cp .env.example .env
```

Generate the app key:

```bash
php artisan key:generate
```

Create the SQLite database file if it does not exist:

```powershell
New-Item -ItemType File -Path database\database.sqlite -Force
```

On macOS/Linux, use:

```bash
touch database/database.sqlite
```

Run database migrations and seed demo data:

```bash
php artisan migrate --seed
```

Start the backend server:

```bash
php artisan serve --host=0.0.0.0 --port=8001
```

Keep this terminal open while using the app.

## 4. Install the Expo App

Open a second terminal in the main project folder:

```bash
cd Gym
```

Install JavaScript dependencies:

```bash
npm install
```

Start Expo:

```bash
npm start
```

Expo will show options for opening the app on:

- Web browser
- Android emulator
- iOS simulator, macOS only
- Expo Go on a real phone

## 5. Connect the App to the Backend

The app needs to know the backend API address.

### Same Computer

If the backend and Expo app are running on the same computer:

```bash
npm start
```

The default API is:

```text
http://localhost:8001/api
```

### Android Emulator

Android emulator uses this default API:

```text
http://10.0.2.2:8001/api
```

Usually no extra setup is needed.

### Real Phone on the Same Wi-Fi

Find the computer's local IP address.

On Windows:

```bash
ipconfig
```

Look for the IPv4 address, for example:

```text
192.168.1.25
```

Start Expo with the API URL:

```bash
$env:EXPO_PUBLIC_API_BASE="http://192.168.1.25:8001/api"; npm start
```

On macOS/Linux:

```bash
EXPO_PUBLIC_API_BASE=http://192.168.1.25:8001/api npm start
```

Make sure:

- The phone and computer are on the same Wi-Fi network
- The Laravel backend is running
- Windows Firewall allows PHP/Laravel on port `8001`

## 6. Demo Login

After running `php artisan migrate --seed`, you can log in with:

```text
Email: demo@gym.test
Password: password
```

Admin account:

```text
Email: admin@gym.test
Password: password
```

You can also create a new account from the app registration screen.

## 7. Optional AI Coach Setup

The AI Coach uses Groq.

Open `backend/.env` and add your Groq API key:

```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.1-8b-instant
GROQ_BASE_URL=https://api.groq.com/openai/v1
```

If `GROQ_API_KEY` is empty, the normal app still works, but AI suggestions will return a configuration error.

After editing `.env`, restart the Laravel server.

## 8. Common Commands

Backend:

```bash
cd backend
php artisan serve --host=0.0.0.0 --port=8001
php artisan migrate --seed
php artisan test
```

Frontend:

```bash
npm start
npm run android
npm run web
```

## 9. Troubleshooting

### Composer install fails

Check PHP version:

```bash
php -v
```

It must be PHP 8.2 or newer.

### App cannot connect to API

Check that the backend is running:

```bash
php artisan serve --host=0.0.0.0 --port=8001
```

Then open this in a browser:

```text
http://localhost:8001
```

For a real phone, use the computer IP address instead of `localhost`:

```text
http://YOUR_COMPUTER_IP:8001/api
```

### Database errors

Reset and reseed the database:

```bash
cd backend
php artisan migrate:fresh --seed
```

Warning: this deletes existing local data.

### Environment changes are not applied

Clear Laravel config cache:

```bash
cd backend
php artisan config:clear
```

Then restart the backend server.

## 10. Recommended Startup Order

Every time you want to run the system:

1. Open terminal 1:

   ```bash
   cd backend
   php artisan serve --host=0.0.0.0 --port=8001
   ```

2. Open terminal 2:

   ```bash
   npm start
   ```

3. Open the app in Expo Go, emulator, or browser.
