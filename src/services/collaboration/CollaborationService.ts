/**
 * Collaboration Service
 * 실시간 협업을 위한 WebSocket 기반 서비스 (구조 정의)
 *
 * TODO: 실제 구현을 위해서는 다음이 필요합니다:
 * 1. Backend collaboration server (Node.js + Socket.io)
 * 2. Yjs CRDT 라이브러리 통합
 * 3. Redis for presence management
 * 4. Conflict resolution logic
 */

import type {
  CollaborationUser,
  CursorPosition,
  CollaborationUpdate,
} from '../../types/collaboration';

export class CollaborationService {
  private socket: any | null = null;
  private currentDocumentId: string | null = null;
  private users: Map<string, CollaborationUser> = new Map();

  /**
   * Connect to collaboration server
   * @param serverUrl - WebSocket server URL
   */
  connect(serverUrl: string): void {
    console.log('TODO: Connect to collaboration server', serverUrl);
    // TODO: Implement socket.io connection
    // this.socket = io(serverUrl);
    // this.setupEventListeners();
  }

  /**
   * Join a document collaboration session
   * @param documentId - Document to collaborate on
   * @param user - Current user info
   */
  joinDocument(documentId: string, user: CollaborationUser): void {
    console.log('TODO: Join document', documentId, user);
    this.currentDocumentId = documentId;
    // TODO: Emit 'join-document' event to server
    // this.socket?.emit('join-document', { documentId, user });
  }

  /**
   * Leave current collaboration session
   */
  leaveDocument(): void {
    console.log('TODO: Leave document');
    // TODO: Emit 'leave-document' event
    // this.socket?.emit('leave-document', { documentId: this.currentDocumentId });
    this.currentDocumentId = null;
  }

  /**
   * Send cell update to other collaborators
   * @param update - Cell update data
   */
  sendUpdate(update: CollaborationUpdate): void {
    console.log('TODO: Send update', update);
    // TODO: Send update through socket
    // this.socket?.emit('update', { documentId: this.currentDocumentId, update });
  }

  /**
   * Update cursor position for other users
   * @param position - Current cursor position
   */
  updateCursor(position: CursorPosition): void {
    console.log('TODO: Update cursor', position);
    // TODO: Emit cursor position
    // this.socket?.emit('cursor-move', { documentId: this.currentDocumentId, position });
  }

  /**
   * Get list of active users
   */
  getActiveUsers(): CollaborationUser[] {
    return Array.from(this.users.values());
  }

  /**
   * Disconnect from collaboration server
   */
  disconnect(): void {
    console.log('TODO: Disconnect');
    // TODO: Close socket connection
    // this.socket?.disconnect();
    this.socket = null;
  }

  /**
   * Setup event listeners (private)
   */
  private setupEventListeners(): void {
    // TODO: Setup socket event listeners
    // this.socket?.on('users-updated', (users: CollaborationUser[]) => {
    //   this.users = new Map(users.map(u => [u.userId, u]));
    // });
    //
    // this.socket?.on('update', (update: CollaborationUpdate) => {
    //   this.handleRemoteUpdate(update);
    // });
    //
    // this.socket?.on('cursor-update', ({ userId, position }) => {
    //   this.handleCursorUpdate(userId, position);
    // });
  }

  /**
   * Handle remote update from other users
   */
  private handleRemoteUpdate(update: CollaborationUpdate): void {
    console.log('TODO: Handle remote update', update);
    // TODO: Apply update to local state
    // Update Zustand store without triggering another socket emit
  }

  /**
   * Handle cursor update from other users
   */
  private handleCursorUpdate(userId: string, position: CursorPosition): void {
    console.log('TODO: Handle cursor update', userId, position);
    // TODO: Render remote cursor on grid
  }
}

// Singleton instance
export const collaborationService = new CollaborationService();
