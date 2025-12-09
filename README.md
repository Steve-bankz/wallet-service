# 🚀 Secure Wallet Service API

## Overview
The Wallet Service API is a robust backend application built with **NestJS**, **TypeScript**, and **TypeORM**, providing a secure and scalable platform for managing user wallets, funds, and API keys. It integrates with **Paystack** for secure payment processing and utilizes **PostgreSQL** as its primary data store.

## Features
-   **User Authentication**: Seamless Google OAuth2 login and JWT-based authentication for secure user access.
-   **API Key Management**: Generate, rollover, and revoke API keys with granular permissions and configurable expiry dates for programmatic access.
-   **Wallet Management**: Core functionalities for user wallets, including balance inquiry and transaction history.
-   **Funds Deposit**: Initiate and process secure deposits into user wallets via Paystack integration, with comprehensive webhook handling.
-   **Funds Transfer**: Facilitate secure peer-to-peer transfers between internal wallets with atomic database transactions.
-   **Secure Data Handling**: Implements bcrypt for hashing sensitive data like API keys and leverages TypeORM for robust database interactions.
-   **Unified Authentication Guard**: Supports both JWT (for users) and API Key (for services/integrations) authentication methods.
-   **Containerization**: Ready for deployment using Docker and Docker Compose for easy setup and scaling.

## Getting Started
To get this project up and running on your local machine, follow these steps.

### Installation
Make sure you have Node.js (LTS), npm, and Docker installed on your system.

1.  📥 **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/wallet-service.git
    cd wallet-service
    ```
2.  📦 **Install dependencies:**
    ```bash
    npm install
    ```
3.  ⚙️ **Set up your environment variables:**
    Create a `.env` file in the root directory and configure it as shown in the "Environment Variables" section below.
4.  🐳 **Start the PostgreSQL database using Docker Compose:**
    ```bash
    docker-compose up -d
    ```
    This will spin up a PostgreSQL container named `wallet_db_container` and expose it on port `5432`.
5.  🚀 **Start the NestJS application:**
    ```bash
    npm run start:dev
    ```
    The application will automatically synchronize the database schema and start listening on the configured port (default: 3000).

### Environment Variables
Create a `.env` file in the project root with the following variables:

```dotenv
# Application Port
PORT=3000

# Database Configuration (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=hindgeisiil83e
DB_NAME=steve_wallet_db

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_here # Use a strong, random string

# Google OAuth2 Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback # Adjust if deploying

# Paystack Integration
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxx # Get from your Paystack dashboard

# API Key Lifetime Configuration (in hours)
API_KEY_MIN_EXPIRY_HOURS=1
API_KEY_MAX_EXPIRY_HOURS=720 # (e.g., 30 days * 24 hours = 720)
```

## API Documentation

### Base URL
`http://localhost:3000` (or the `PORT` specified in your `.env` file)

### Authentication
This API uses two primary authentication methods:

1.  **JWT (JSON Web Token)**: Used for authenticated user sessions.
    *   **Header**: `Authorization: Bearer <your_jwt_token>`
    *   **Usage**: Obtained after Google OAuth2 login.
2.  **API Key**: Used for programmatic access by external services or applications.
    *   **Header**: `X-API-Key: <your_api_key>`
    *   **Usage**: Generated via the `/keys/create` endpoint. Provides granular permissions.

### Endpoints

#### GET /
**Overview**: A simple health check endpoint.
**Request**:
```
No payload required.
```
**Response**:
```json
"Hello World!"
```

#### GET /auth/google
**Overview**: Initiates the Google OAuth2 authentication flow. Users will be redirected to Google for sign-in.
**Request**:
```
No payload required.
```
**Response**:
```
Redirects to Google's authentication page.
```

#### GET /auth/google/callback
**Overview**: Callback URL for Google OAuth2. After successful authentication with Google, users are redirected here.
**Request**:
```
No payload required. (Handled by Google's redirect)
```
**Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
**Errors**:
-   `401 Unauthorized`: If Google authentication fails.

#### POST /keys/create
**Overview**: Creates a new API key for the authenticated user with specified name, permissions, and expiry.
**Authentication**: JWT (`Authorization: Bearer <token>`)
**Request**:
```json
{
  "name": "My Payment Service Key",
  "permissions": ["deposit", "read"],
  "expiry": "1M"
}
```
**Required Fields**:
-   `name`: `string` - A descriptive name for the API key.
-   `permissions`: `string[]` - An array of allowed actions (`"deposit"`, `"transfer"`, `"read"`).
-   `expiry`: `string` - Expiry duration (`"1H"`, `"1D"`, `"1M"`, `"1Y"`).
**Response**:
```json
{
  "id": "c6a1e3b2-4d5f-6a7b-8c9d-0e1f2a3b4c5d",
  "api_key": "your_api_key",
  "expires_at": "2024-10-26T10:00:00.000Z"
}
```
**Errors**:
-   `400 Bad Request`: Invalid `expiry` value, expiry too short or too long.
-   `401 Unauthorized`: No valid JWT provided.
-   `403 Forbidden`: User has reached the maximum number of active API keys (5).

#### POST /keys/rollover
**Overview**: Generates a new API key to replace an expired one, reusing its name and permissions. The old key is marked as revoked.
**Authentication**: JWT (`Authorization: Bearer <token>`)
**Request**:
```json
{
  "expired_key_id": "c6a1e3b2-4d5f-6a7b-8c9d-0e1f2a3b4c5d",
  "expiry": "1Y"
}
```
**Required Fields**:
-   `expired_key_id`: `string` (UUID) - The ID of the API key to be rolled over.
-   `expiry`: `string` - New expiry duration for the new key (`"1H"`, `"1D"`, `"1M"`, `"1Y"`).
**Response**:
```json
{
  "id": "f5d4c3b2-a1b2-c3d4-e5f6-a7b8c9d0e1f2",
  "api_key": "your_api_key",
  "expires_at": "2025-09-26T10:00:00.000Z"
}
```
**Errors**:
-   `400 Bad Request`: Key is not yet expired, invalid `expiry` value, expiry too short or too long.
-   `401 Unauthorized`: No valid JWT provided.
-   `403 Forbidden`: User has reached the maximum number of active API keys (5).
-   `404 Not Found`: Specified `expired_key_id` does not exist or does not belong to the user.

#### POST /keys/revoke
**Overview**: Revokes an active API key, making it unusable.
**Authentication**: JWT (`Authorization: Bearer <token>`)
**Request**:
```json
{
  "key_id": "c6a1e3b2-4d5f-6a7b-8c9d-0e1f2a3b4c5d"
}
```
**Required Fields**:
-   `key_id`: `string` (UUID) - The ID of the API key to be revoked.
**Response**:
```json
{
  "message": "API key 'My Payment Service Key' has been successfully revoked."
}
```
**Errors**:
-   `401 Unauthorized`: No valid JWT provided.
-   `404 Not Found`: Specified `key_id` does not exist or does not belong to the user.

#### POST /wallet/deposit
**Overview**: Initiates a deposit into the authenticated user's wallet via Paystack. Returns Paystack's transaction initialization details.
**Authentication**: JWT (`Authorization: Bearer <token>`) or API Key (`X-API-Key: <key>`) with `deposit` permission.
**Request**:
```json
{
  "amount": 5000
}
```
**Required Fields**:
-   `amount`: `number` - The amount to deposit in your local currency unit (e.g., 5000 for NGN 50.00). Must be at least 100.
**Response**:
```json
{
  "authorization_url": "https://checkout.paystack.com/abcdef123",
  "access_code": "abcdef123",
  "reference": "deposit_a1b2c3d4e5f6g7h8"
}
```
**Errors**:
-   `400 Bad Request`: Invalid `amount` (e.g., below minimum).
-   `401 Unauthorized`: No valid authentication provided.
-   `403 Forbidden`: Authenticated API key does not have `deposit` permission.
-   `500 Internal Server Error`: Paystack API call failed.

#### POST /wallet/paystack/webhook
**Overview**: Receives and processes Paystack webhook events, specifically `charge.success` events to credit user wallets.
**Authentication**: Paystack Signature (`x-paystack-signature` header)
**Request**:
```json
{
  "event": "charge.success",
  "data": {
    "reference": "deposit_a1b2c3d4e5f6g7h8",
    "amount": 500000,
    "currency": "NGN",
    "status": "success",
    "customer": {
      "email": "user@example.com"
    },
    "...": "other paystack data"
  }
}
```
**Required Headers**:
-   `x-paystack-signature`: `string` - The HMAC SHA512 signature of the raw request body.
**Response**:
```json
{
  "status": "success"
}
```
**Errors**:
-   `400 Bad Request`: Invalid Paystack signature, transaction reference not found, or webhook processing failed.

#### POST /wallet/transfer
**Overview**: Transfers funds from the authenticated user's wallet to another internal wallet.
**Authentication**: JWT (`Authorization: Bearer <token>`) or API Key (`X-API-Key: <key>`) with `transfer` permission.
**Request**:
```json
{
  "wallet_number": "1234567890",
  "amount": 1000
}
```
**Required Fields**:
-   `wallet_number`: `string` - The wallet number of the recipient.
-   `amount`: `number` - The amount to transfer. Must be at least 1.
**Response**:
```json
{
  "message": "Transfer completed successfully"
}
```
**Errors**:
-   `400 Bad Request`: Invalid `amount`, insufficient wallet balance, or attempting to transfer to one's own wallet.
-   `401 Unauthorized`: No valid authentication provided.
-   `403 Forbidden`: Authenticated API key does not have `transfer` permission.
-   `404 Not Found`: Recipient wallet not found.

#### GET /wallet/balance
**Overview**: Retrieves the current balance of the authenticated user's wallet.
**Authentication**: JWT (`Authorization: Bearer <token>`) or API Key (`X-API-Key: <key>`) with `read` permission.
**Request**:
```
No payload required.
```
**Response**:
```json
{
  "balance": 2500.75
}
```
**Errors**:
-   `401 Unauthorized`: No valid authentication provided.
-   `403 Forbidden`: Authenticated API key does not have `read` permission.

#### GET /wallet/transactions
**Overview**: Fetches the transaction history for the authenticated user's wallet.
**Authentication**: JWT (`Authorization: Bearer <token>`) or API Key (`X-API-Key: <key>`) with `read` permission.
**Request**:
```
No payload required.
```
**Response**:
```json
[
  {
    "id": "transaction-uuid-1",
    "type": "deposit",
    "amount": 1000.00,
    "status": "success",
    "reference": "deposit_ref_123",
    "description": "Wallet deposit",
    "walletId": "wallet-uuid",
    "createdAt": "2024-09-26T10:00:00.000Z",
    "updatedAt": "2024-09-26T10:00:05.000Z"
  },
  {
    "id": "transaction-uuid-2",
    "type": "transfer",
    "amount": 250.50,
    "status": "success",
    "reference": null,
    "description": "Transfer to wallet 9876543210",
    "walletId": "wallet-uuid",
    "createdAt": "2024-09-26T11:30:00.000Z",
    "updatedAt": "2024-09-26T11:30:02.000Z"
  }
]
```
**Errors**:
-   `401 Unauthorized`: No valid authentication provided.
-   `403 Forbidden`: Authenticated API key does not have `read` permission.

#### GET /wallet/deposit/:reference/status
**Overview**: Retrieves the status of a specific deposit transaction using its reference.
**Authentication**: JWT (`Authorization: Bearer <token>`) or API Key (`X-API-Key: <key>`) with `read` permission.
**Request**:
```
No payload required.
```
**Path Parameters**:
-   `reference`: `string` - The unique reference of the deposit transaction.
**Response**:
```json
{
  "reference": "deposit_a1b2c3d4e5f6g7h8",
  "status": "success",
  "amount": 5000
}
```
**Errors**:
-   `401 Unauthorized`: No valid authentication provided.
-   `403 Forbidden`: Authenticated API key does not have `read` permission.
-   `404 Not Found`: Deposit transaction with the given reference not found for the user's wallet.

## Usage
After starting the application, you can interact with the API using tools like Postman, Insomnia, or `curl`.

### 1. Google Authentication & JWT Acquisition
To get a JWT, first initiate the Google OAuth flow:

```bash
# Open this URL in your browser
open "http://localhost:3000/auth/google"
```
After successfully logging in with Google, you will be redirected to `http://localhost:3000/auth/google/callback`, and the response will contain your `access_token`.

Example `curl` for the callback (you'll typically handle this via browser redirect after Google login):
```bash
curl -v -X GET "http://localhost:3000/auth/google/callback"
# The response will contain {"access_token": "..."}
```

### 2. Managing API Keys (Using JWT)
Once you have your `access_token`, you can create an API key:

```bash
# Replace <YOUR_JWT_TOKEN> with your actual token
# Replace <YOUR_API_KEY_NAME> with a descriptive name
# Replace <PERMISSIONS_ARRAY> and <EXPIRY_DURATION> as needed
curl -X POST "http://localhost:3000/keys/create" \
-H "Content-Type: application/json" \
-H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
-d '{
  "name": "My Frontend Access Key",
  "permissions": ["read"],
  "expiry": "1D"
}'
```
The response will include your `api_key` which you should store securely.

### 3. Making Wallet Operations (Using API Key)
Now you can use your generated API key to interact with wallet endpoints.

```bash
# Replace <YOUR_API_KEY> with your actual API key
curl -X GET "http://localhost:3000/wallet/balance" \
-H "X-API-Key: <YOUR_API_KEY>"
```

Example Deposit Initialization:
```bash
# Replace <YOUR_API_KEY> and <AMOUNT>
curl -X POST "http://localhost:3000/wallet/deposit" \
-H "Content-Type: application/json" \
-H "X-API-Key: <YOUR_API_KEY>" \
-d '{
  "amount": 2500
}'
```

Example Funds Transfer:
```bash
# Replace <YOUR_API_KEY>, <RECIPIENT_WALLET_NUMBER>, and <AMOUNT>
curl -X POST "http://localhost:3000/wallet/transfer" \
-H "Content-Type: application/json" \
-H "X-API-Key: <YOUR_API_KEY>" \
-d '{
  "wallet_number": "9876543210",
  "amount": 500
}'
```

## Technologies Used

| Technology | Description                                  | Version  | Link                                                                        |
| :--------- | :------------------------------------------- | :------- | :-------------------------------------------------------------------------- |
| Node.js    | JavaScript runtime                           | ^20.x    | [Node.js](https://nodejs.org/en/)                                           |
| TypeScript | Superset of JavaScript with type safety      | ^5.x     | [TypeScript](https://www.typescriptlang.org/)                               |
| NestJS     | Progressive Node.js framework                | ^11.x    | [NestJS](https://nestjs.com/)                                               |
| TypeORM    | ORM for TypeScript and JavaScript            | ^0.3.x   | [TypeORM](https://typeorm.io/)                                              |
| PostgreSQL | Powerful open-source relational database     | 14       | [PostgreSQL](https://www.postgresql.org/)                                   |
| Docker     | Containerization platform                    | ^3.8     | [Docker](https://www.docker.com/)                                           |
| Passport.js| Authentication middleware for Node.js        | ^0.7.x   | [Passport.js](https://www.passportjs.org/)                                  |
| Paystack   | Online payment gateway for Africa            | External | [Paystack](https://paystack.com/)                                           |
| Axios      | Promise-based HTTP client                    | ^1.x     | [Axios](https://axios-http.com/)                                            |
| Bcrypt     | Library for hashing passwords                | ^5.x     | [bcrypt.js](https://github.com/dcodeIO/bcrypt.js)                           |
| class-validator | Validation decorators for classes         | ^0.14.x  | [class-validator](https://github.com/typestack/class-validator)             |

## Contributing
Contributions are welcome! If you have suggestions or want to improve the project, please follow these steps:

1.  🍴 **Fork the repository.**
2.  🌿 **Create a new branch** (`git checkout -b feature/your-feature-name`).
3.  ✨ **Make your changes** and ensure they adhere to the project's coding style (run `npm run format` and `npm run lint`).
4.  🧪 **Write and run tests** to cover your changes.
5.  ➕ **Commit your changes** (`git commit -m 'feat: Add new feature'`).
6.  ⬆️ **Push to the branch** (`git push origin feature/your-feature-name`).
7.  📝 **Open a Pull Request** describing your changes and their benefits.

## License
This project is currently unlicensed. Please contact the author for licensing information.

## Author Info
**Your Name**
*   LinkedIn: [Your LinkedIn Profile](https://linkedin.com/in/yourprofile)
*   Twitter: [Your Twitter Handle](https://twitter.com/yourhandle)
*   Portfolio: [Your Portfolio Site](https://yourportfolio.com)

---
[![NestJS](https://img.shields.io/badge/NestJS-ff297b?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![License: Unlicensed](https://img.shields.io/badge/License-Unlicensed-lightgrey.svg)](https://choosealicense.com/licenses/unlicense/)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen)](https://github.com/your-username/wallet-service/actions)

[![Readme was generated by Dokugen](https://img.shields.io/badge/Readme%20was%20generated%20by-Dokugen-brightgreen)](https://www.npmjs.com/package/dokugen)