# Firestore Security Specification

## 1. Data Invariants
- A user can only read, create, update, and delete their own user profile document at `/users/{userId}` where `userId == request.auth.uid`.
- Chat sessions at `/users/{userId}/chats/{chatId}` must belong to the authenticated user.
- Chat messages at `/users/{userId}/chats/{chatId}/messages/{messageId}` must be written by the session owner and contain valid roles ('user' | 'model').
- User FinOps settings at `/users/{userId}/settings/{settingId}` are strictly accessible only by the owning user.
- No public unauthenticated reads or writes are permitted across any collection.

## 2. The "Dirty Dozen" Payloads (Must Return PERMISSION_DENIED)
1. **Unauthenticated Read**: Reading `/users/victim_123` with `request.auth == null`.
2. **Unauthenticated Write**: Creating `/users/attacker_123` without auth.
3. **Cross-User Profile Spoof**: User A attempting to update `/users/user_B`.
4. **Chat Hijack**: User A reading `/users/user_B/chats/chat_1`.
5. **Message Injection**: User A writing into `/users/user_B/chats/chat_1/messages/msg_99`.
6. **Oversized String Attack**: User sending a message with content exceeding 50,000 characters.
7. **Invalid Document ID**: Using an ID containing invalid characters or length > 128 (e.g. path traversal or script injection).
8. **Role Privilege Escalation**: User attempting to self-assign an admin role or bypass permissions.
9. **Chat Document Deletion by Non-Owner**: User A attempting to delete User B's chat thread.
10. **Ghost Field / Shadow Key Attack**: Inserting unauthorized schema fields into a message or chat record.
11. **Future Timestamp Attack**: Providing a forged client timestamp that does not match `request.time`.
12. **Settings Extraction Attack**: Attempting to list all users' settings via collectionGroup or unfiltered queries.

## 3. Test Runner Design
The rules will be enforced via rule version 2 with default deny, path variable validation with `isValidId`, and entity-level schema validation.
