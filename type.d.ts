export interface MockInboxReceiver {
  id: string;
  full_name: string;
  profile_file: string;
  age?: number;
  distance?: string;
}

export interface MockInboxLastMessage {
  text?: string;
  image?: string;
  location?: boolean;
  audio?: boolean;
  created_on: string;
}

export interface MockInboxItem {
  id: string;
  chat_id: string;
  pendingCount?: number;
  receiver: MockInboxReceiver;
  lastMessage: MockInboxLastMessage;
}

export interface InboxScreenProps {
  user?: {
    myProfile?: {
      id?: string;
      full_name?: string;
      is_roaming?: boolean;
      notification_pending_count?: number;
    };
  };
  appState?: {
    currentConfig?: {
      enable_super_gay_from_inbox?: boolean;
    };
  };
}

export interface InboxItemProps {
  item: MockInboxItem;
  onDelete: (id: string) => void;
  onSelect: (item: MockInboxItem) => void;
}
