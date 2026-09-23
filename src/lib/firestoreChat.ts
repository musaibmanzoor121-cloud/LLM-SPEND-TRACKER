import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  model: string;
  role: string;
  systemInstruction?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  chatId: string;
  role: 'user' | 'model' | 'system';
  content: string;
  createdAt: string;
}

export interface UserFinOpsSettings {
  defaultModel?: string;
  pinnedProviders?: string[];
  alertThresholds?: number[];
  updatedAt?: string;
}

// Manage Chat Sessions
export async function createChatSession(
  userId: string, 
  title: string, 
  model: string, 
  role: string, 
  systemInstruction: string
): Promise<string> {
  const chatId = 'chat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const path = `users/${userId}/chats/${chatId}`;
  try {
    const session: ChatSession = {
      id: chatId,
      userId,
      title: title.slice(0, 200),
      model,
      role,
      systemInstruction: systemInstruction.slice(0, 2000),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'users', userId, 'chats', chatId), session);
    return chatId;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

export function subscribeToChatSessions(
  userId: string, 
  onUpdate: (sessions: ChatSession[]) => void
): () => void {
  const path = `users/${userId}/chats`;
  const q = query(collection(db, 'users', userId, 'chats'), orderBy('updatedAt', 'desc'));
  return onSnapshot(
    q, 
    (snapshot) => {
      const sessions = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ChatSession));
      onUpdate(sessions);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  );
}

export async function deleteChatSession(userId: string, chatId: string): Promise<void> {
  const path = `users/${userId}/chats/${chatId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'chats', chatId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    throw err;
  }
}

// Manage Chat Messages
export async function addChatMessage(
  userId: string, 
  chatId: string, 
  role: 'user' | 'model', 
  content: string
): Promise<string> {
  const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const path = `users/${userId}/chats/${chatId}/messages/${messageId}`;
  try {
    const message: ChatMessage = {
      id: messageId,
      userId,
      chatId,
      role,
      content: content.slice(0, 50000),
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'users', userId, 'chats', chatId, 'messages', messageId), message);

    // Update parent chat's updatedAt timestamp
    await setDoc(doc(db, 'users', userId, 'chats', chatId), {
      updatedAt: new Date().toISOString()
    }, { merge: true }).catch(() => {});

    return messageId;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

export function subscribeToChatMessages(
  userId: string, 
  chatId: string, 
  onUpdate: (messages: ChatMessage[]) => void
): () => void {
  const path = `users/${userId}/chats/${chatId}/messages`;
  const q = query(collection(db, 'users', userId, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc'));
  return onSnapshot(
    q, 
    (snapshot) => {
      const messages = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage));
      onUpdate(messages);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  );
}

// Persist User FinOps Settings in Firestore
export async function saveUserSettings(userId: string, settings: UserFinOpsSettings): Promise<void> {
  const path = `users/${userId}/settings/preferences`;
  try {
    await setDoc(doc(db, 'users', userId, 'settings', 'preferences'), {
      userId,
      ...settings,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function getUserSettings(userId: string): Promise<UserFinOpsSettings | null> {
  const path = `users/${userId}/settings/preferences`;
  try {
    const snap = await getDoc(doc(db, 'users', userId, 'settings', 'preferences'));
    if (snap.exists()) {
      return snap.data() as UserFinOpsSettings;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
}
