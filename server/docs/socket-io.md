# Socket.IO contract

Connect to the same server that serves the HTTP API. Pass the JWT from `/register` or `/login` through the Socket.IO authentication handshake:

```js
io('http://localhost:3001', { auth: { token } });
```

The server validates the token using the same authentication middleware as HTTP. A missing, expired, invalid, or deleted-user token fails the connection with `connect_error` and the message `Authentication required`.

All client payloads are strict Zod objects. A malformed payload causes a `request-error` event with:

```json
{
  "error": "Invalid request data",
  "details": [{ "field": "projectId", "message": "Must be a valid identifier" }]
}
```

## Client events

| Event | Payload | Who may use it | Result |
| --- | --- | --- | --- |
| `join-chat-room` | `{ "projectId": "<24-char ObjectId>" }` | The freelancer assigned to that project | Joins the project's room, ensures a chat exists, and receives `messages-updated`. |
| `join-chat-room-client` | `{ "projectId": "<24-char ObjectId>" }` | The project owner only, after the project is `Assigned` or `Completed` | Joins the project's room, ensures a chat exists, and receives `messages-updated`. |
| `update-messages` | `{ "projectId": "<24-char ObjectId>" }` | Project client, assigned freelancer, or administrator | Ensures a chat exists and emits `messages-updated` to the requesting socket. |
| `new-message` | `{ "projectId": "<24-char ObjectId>", "message": "1-2000 non-blank characters" }` | Project client, assigned freelancer, or administrator | Appends a message and emits `messages-updated` to the sender and joined room members. |

Authorization failures and unavailable projects for otherwise well-formed Socket.IO payloads are currently ignored without a client error event. Consumers must not interpret silence as authorization success.

## Server events

| Event | Payload | Meaning |
| --- | --- | --- |
| `request-error` | `{ error, details }` | The submitted event payload failed Zod validation. |
| `messages-updated` | `{ chat }` | The complete chat document after a join, refresh, or new message. A chat contains a UUID `_id`, canonical `project` ObjectId, and `messages`. |
| `user-joined-room` | No payload | Another socket joined the same project room. |

The server, not the client, writes `messages[].sender` from the authenticated socket user, trims message text, generates message ids, and sets message time. Client payloads that include sender or other unexpected fields are rejected by strict validation.

Chat messages are limited to 20 accepted messages per authenticated user per 10 seconds across all of that user's sockets. A throttled event receives the existing `request-error` event with `error: "Too many messages"`. Each conversation retains only its most recent 100 messages. The cap is applied atomically with MongoDB `$push` and `$slice`, including concurrent message writes; older messages are intentionally discarded and are not recoverable through this API. The in-memory limiter periodically removes expired users, caps tracked users at 10,000, and is process-local rather than distributed across backend instances. Shutdown clears the limiter and its cleanup timer.
