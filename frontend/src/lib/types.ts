export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export type BackendStatus = "connecting" | "connected" | "offline";
