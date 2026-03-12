# Admin Notification System Implementation Plan

This document outlines the plan for implementing a comprehensive notification system for the N-Cafe Admin dashboard. The system will provide real-time alerts for menu changes, new orders, image/category/option updates, and AI RAG status.

## 1. Objectives
* Provide real-time feedback to admins on critical system events.
* Ensure extensibility for future notification types.
* Maintain a history of notifications for auditing and review.
* Use a lightweight delivery mechanism (SSE - Server-Sent Events).

## 2. Notification Types
| Type | Source | Event Triggers |
| :--- | :--- | :--- |
| **MENU** | Backend | Create, Update, Delete of Menu items |
| **CATEGORY** | Backend | Create, Update, Delete of Categories |
| **OPTION** | Backend | Create, Update, Delete of Menu Options |
| **IMAGE** | Backend | New image uploads or deletions |
| **ORDER** | Backend | New order placement, Status changes (Paid, Cancelled) |
| **RAG** | Agent Server | New embedding completed, Knowledge base updated |

## 3. System Architecture

### A. Backend (Spring Boot)
1. **Domain Model**:
    - `Notification`: Stores `id`, `message`, `type`, `targetUrl` (optional), `isRead`, `createdAt`.
2. **Event-Driven Pattern**:
    - Use Spring's `ApplicationEventPublisher` to decouple business logic from notification logic.
    - Create a custom `SystemEvent` and specialized listeners.
3. **Delivery Mechanism**:
    - **SSE (Server-Sent Events)**: Better for admin dashboards than WebSockets due to simplicity and automatic reconnection support for one-way server-to-client updates.
4. **API Endpoints**:
    - `GET /api/admin/notifications/stream`: SSE endpoint for real-time updates.
    - `GET /api/admin/notifications`: Retrieve notification history (paginated).
    - `PATCH /api/admin/notifications/{id}/read`: Mark as read.
    - `POST /api/admin/notifications/external`: (Internal) Endpoint for `agent-server` to trigger RAG notifications.

### B. Agent Server (Python/FastAPI)
1. **Trigger**:
    - After vector embedding is successful, the `agent-server` sends a REST request to the `backend` notification endpoint.

### C. Frontend (Next.js)
1. **Notification Provider**:
    - A React Context to manage the SSE connection and notification state across the admin panel.
2. **Components**:
    - `NotificationBell`: In the Header, showing the count of unread notifications.
    - `NotificationDropdown`: List of recent notifications with links to related pages.
    - `NotificationToast`: Real-time popup alerts using a library like `sonner` or `react-toastify`.

## 4. Implementation Steps

### Phase 1: Foundation (Backend)
1.  **Database Migration**: Add `notifications` table (e.g., using Flyway or Hibernate auto-ddl).
2.  **Entities & Repository**: Create `Notification` entity and its repository.
3.  **SSE Controller**: Implement `SseEmitters` management and the `/stream` endpoint.
4.  **Service Layer**: Create `NotificationService` to handle creation and broadcasting.

### Phase 2: Internal Event Integration (Backend)
1.  **Event Classes**: Define `MenuEvent`, `OrderEvent`, etc.
2.  **Publishers**: Add event publishing logic in existing `Service` or `UseCase` implementations (Menu, Category, Order).
3.  **Handlers**: Create a `@Component` that listens to these events and calls `NotificationService`.

### Phase 3: External Integration (Agent Server & API)
1.  **External Notify API**: Implement the endpoint to receive notifications from the `agent-server`.
2.  **Agent Client**: Update Python logic to call the `backend` upon RAG task completion.

### Phase 4: Frontend Implementation
1.  **SSE Hook**: Create a `useNotifications` hook to subscribe to the SSE stream.
2.  **UI Components**: Build the Bell and Dropdown components in `frontend/app/admin/_components`.
3.  **History Page**: Create `frontend/app/admin/notifications/page.tsx` for full history view.

## 5. Security & Considerations
* **Authorization**: The SSE stream must only be accessible to authenticated Admin users.
* **Resilience**: SSE handles reconnections, but the backend must manage stale/dead emitters to avoid memory leaks.
* **Scaling**: If multiple backend instances are used, a Redis Pub/Sub mechanism will be needed to sync SSE broadcasts across nodes.
