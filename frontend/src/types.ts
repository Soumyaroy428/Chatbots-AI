export type User = {
  id: string;
  name: string;
  email: string;
  profileImage: string | null;
  theme: "light" | "dark" | "system";
  createdAt: string;
};

export type ConversationSummary = {
  id: string;
  title: string;
  model: string;
  favorited: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Message = {
  id: string;
  conversationId?: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: string;
};

export type Conversation = ConversationSummary & {
  messages: Message[];
};
