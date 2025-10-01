# Notification Service

A small, scalable notification service prototype built in Node.js + TypeScript, supporting multiple channels, user preferences, retries, templates, and basic rate limiting.

## Features

- Send notifications via Email (console log) and Webhook (HTTP call)
- Handle user preferences and opt-outs
- Retry failed notifications automatically
- Template support with {{variable}} substitution
- Rate limiting to prevent spam
- Track notification status: ENQUEUED, PROCESSING, DELIVERED, FAILED

## OpenAPI/Swagger documentation
### 1. Installation & Running the App
#### Clone the repository
> git clone https://github.com/caljanmarie/foboh-notifications.git
> cd foboh-notifications
#### Install dependencies
> npm install
#### Run in development
> npm run dev

Server will start at:
http://localhost:3000

### 2. Swagger / OpenAPI Documentation
The API is documented using OpenAPI. After running the app:

Open your browser and navigate to:
> http://localhost:3000/docs


You can explore endpoints, send test requests, and see request/response schemas.
Endpoints include:
- > POST /api/preferences/:userId – update user preferences
- >GET /api/preferences/:userId – get user preferences
- > POST /api/notifications – send a notification
- > GET /api/notifications/:id – check notification status


### 3. Running Tests
#### Unit & Integration Tests

##### Load Testing with k6
The service includes k6 scripts to simulate load and rate limiting behavior.
k6 reports include latency, success/failure rate, and throughput metrics
###### a) Load Test
Simulates 1000 notifications over 1 minute to check performance and scalability:
k6 run tests/load-test.js
*Adjust rate limiter in routes.ts for higher test loads*

What it tests:
System can handle a sustained load of 1000 notifications/minute
Measures request duration, throughput, and error rate
Helps identify performance bottlenecks

###### b) Rate Limit Test
Simulates requests exceeding the API rate limit to ensure rate limiting is enforced:
k6 run tests/rate-limit-test.js

What it tests:
- Confirms that users exceeding 5 requests/minute are throttled
- Ensures 429 Too Many Requests responses are returned appropriately