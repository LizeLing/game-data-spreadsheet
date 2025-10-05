/**
 * Collaboration Types
 * 실시간 협업 기능을 위한 타입 정의
 */

export interface CollaborationUser {
  userId: string;
  name: string;
  color: string;
  socketId?: string;
}

export interface CursorPosition {
  rowIndex: number;
  columnIndex: number;
  sheetId: string;
}

export interface CollaborationUpdate {
  type: 'cell_update' | 'sheet_add' | 'sheet_delete' | 'row_add' | 'column_add';
  userId: string;
  timestamp: Date;
  data: any;
}

export interface CollaborationSession {
  sessionId: string;
  documentId: string;
  users: CollaborationUser[];
  startedAt: Date;
}
