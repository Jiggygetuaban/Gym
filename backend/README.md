# GymLog API

Laravel API for the GymLog Expo app. It provides email/password auth, bearer token sessions, workout template/session sync, demo seed data, and Groq-backed AI coach suggestions.

## Setup

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve --host=0.0.0.0 --port=8001
```

The seeded demo account is:

```text
Email: demo@gym.test
Password: password
```

## AI Coach

Add a Groq API key to `.env`:

```text
GROQ_API_KEY=
GROQ_MODEL=llama-3.1-8b-instant
GROQ_BASE_URL=https://api.groq.com/openai/v1
```

If the key is missing, `/api/ai/suggestions` returns `503` with a configuration error.

## Expo App Connection

By default the app uses `http://localhost:8001/api` on web/iOS simulator and `http://10.0.2.2:8001/api` on Android emulator.

To override it, start Expo with:

```bash
EXPO_PUBLIC_API_BASE=http://YOUR_HOST:8001/api npm start
```

## Tests

```bash
php artisan test
```
