# 📡 Client A Service – Real-Time Messaging with RabbitMQ, NestJS & WebSocket

This backend service represents **Client A** in a real-time, bidirectional messaging system, leveraging **RabbitMQ** as a robust message broker and **WebSocket** for pushing messages to the frontend in real-time.

> 🧠 This project is an integral part of a larger real-time client-to-client chat system. It facilitates communication with the [Client B Service](https://github.com/your-username/client-b-service) and interacts with a [React + Vite frontend app](https://github.com/your-username/realtime-chat-frontend) currently hosted on Vercel.

---

## 🔄 System Workflow

The communication flow within the chat system is designed for real-time interaction:

1.  The frontend application allows a user to select either **Client A** or **Client B** for messaging.
2.  If the user selects **Client A** and sends a message, the React app dispatches a `POST` request to this backend service (Client A) at the `/message-to-b` endpoint, containing the message payload.
3.  This backend service (Client A) then publishes the received message to the `to-clientB` queue within RabbitMQ.
4.  The **Client B backend service** consumes the message from the `to-clientB` queue. Upon consumption, it performs two actions:
    - Logs the message content on its server console.
    - Emits the message to the **Client B frontend** in real-time via WebSocket, using the event `message-to-client-b`.
5.  In scenarios where message processing by the Client B backend fails, the message is automatically sent to a designated **retry queue** (`to-clientA.retry`). This retry queue is configured with a **10-second TTL (Time-To-Live)**.
6.  After a message has undergone **3 retry attempts** and still fails processing, it is then automatically moved to the **DLQ (Dead Letter Queue)** (`to-clientA.dlq`) for further investigation or manual intervention.
7.  Concurrently, this **Client A backend service** also actively listens for incoming messages on the `to-clientA` queue (which are messages originating from Client B). When a message is received, it emits it to the **Client A frontend** via WebSocket, ensuring bidirectional real-time communication.

---

## 🛠️ Tech Stack

The service is built using the following technologies:

- **NestJS** (v11): A progressive Node.js framework for building efficient, reliable, and scalable server-side applications.
- **RabbitMQ**: Utilized for inter-service communication and message queuing, integrated via `@nestjs/microservices` and `amqplib`.
- **WebSocket Gateway**: Implemented with **Socket.IO** for real-time, bidirectional event-based communication with frontends.
- **TypeScript**: Provides strong typing for enhanced code quality and maintainability.

---

## 📁 Folder Structure

The `src/` directory is organized as follows:
src/
├── app.controller.ts # Handles REST endpoints and RabbitMQ consumer logic.
├── app.module.ts # Configures the main application module, including RabbitMQ client setup.
├── constants.ts # Defines shared constants and message format interfaces.
├── main.ts # The application's entry point, responsible for bootstrapping and microservice binding.
├── socket.gateway.ts # Implements the WebSocket server (Socket.IO Gateway) for real-time communication.
└── rabbit-queue.initializer.ts # Manages the setup and configuration of RabbitMQ queues, including DLQ/Retry queues.

---

## 🚀 Running Locally

To get the Client A Service up and running on your local machine, follow these steps:

> **Prerequisites:**
>
> - **Node.js** (v18 or higher recommended)
> - A **running RabbitMQ instance**. You can run one locally using Docker:
>
>   ```bash
>   docker run -d --hostname my-rabbitmq --name some-rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
>   ```
>
>   (The RabbitMQ Management UI will be available at `http://localhost:15672` with default credentials `guest:guest`).
>   Alternatively, you can use a remote RabbitMQ instance (e.g., `amqp://guest:guest@52.66.253.102:5672`).

### 🔧 Install & Run

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/client-a-service.git
    cd client-a-service
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Start the application:**

    ```bash
    npm run start
    ```

    The application will typically be accessible at: `http://localhost:3000`

### 🌐 REST Endpoint

This service exposes a REST endpoint for sending messages to Client B:

- **Endpoint:** `POST /message-to-b`
- **Content-Type:** `application/json`
- **Example Request Body:**

  ```json
  {
    "sender": "clientA",
    "message": "Hello from A"
  }
  ```

- **Functionality:** This endpoint receives messages from the Client A frontend and publishes them to the `to-clientB` queue in RabbitMQ. These messages are then consumed by the Client B backend and subsequently emitted to the Client B frontend in real-time.

### 📡 WebSocket Communication

The service also manages real-time communication via WebSocket:

- **Listens on:** The `to-clientA` RabbitMQ queue for messages sent by Client B.
- **Emits event:** `message-to-client-a` to the connected Client A frontend, ensuring immediate delivery of messages from Client B.

### 📦 RabbitMQ Queues

The following RabbitMQ queues are used and managed by this service:

| Queue Name         | Purpose                                                                              |
| :----------------- | :----------------------------------------------------------------------------------- |
| `to-clientA`       | Primary queue for messages originating from Client B, consumed by this service.      |
| `to-clientA.retry` | A dedicated retry queue for messages that fail initial processing from `to-clientA`. |
| `to-clientA.dlq`   | The Dead Letter Queue for messages that exhaust their retry attempts.                |
| `to-clientB`       | Outgoing queue for messages sent _to_ Client B, published by this service.           |

**Queue Properties:**

- All queues are **durable**, meaning they will survive a RabbitMQ broker restart.
- **Manual acknowledgment** is enabled for message consumption, ensuring messages are only removed from the queue after successful processing.
- **Retry queues** are configured using RabbitMQ's Dead Letter Exchange (DLX) and Time-To-Live (TTL) mechanisms.

### 🔁 Retry Logic

A robust retry mechanism is implemented for messages consumed by this service:

1.  If a message fails to process within the `handleMessageFromClientB` consumer (e.g., due to an error in business logic or external service unavailability):
2.  It is re-published to the `to-clientA.retry` queue. An `x-retries` header is incremented to track the number of attempts.
3.  The `to-clientA.retry` queue has a **TTL of 10 seconds**. After this duration, the message expires and is automatically routed back to the original `to-clientA` queue via a Dead Letter Exchange.
4.  The message is then re-consumed by the `handleMessageFromClientB` consumer for reprocessing.
5.  This retry cycle continues. If the `x-retries` count exceeds **2** (meaning 3 total attempts: 1 original + 2 retries), the message is no longer sent back to `to-clientA` but is instead routed directly to the `to-clientA.dlq` for manual inspection and troubleshooting.

---

## 🌍 Deployment

This Client A Service is currently deployed on **AWS EC2**.

- Both the WebSocket and REST APIs are exposed on **port 3000**.
- **CORS (Cross-Origin Resource Sharing)** is enabled to allow requests from the frontend application hosted at `https://frontend-for-nest.vercel.app`.
