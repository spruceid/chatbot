import { Dispatch, createContext } from 'react';

import { ActionType } from '@/hooks/useCreateReducer';

import { Conversation } from '@/types/chat';
import { KeyValuePair } from '@/types/data';
import { FolderType } from '@/types/folder';

import { HomeInitialState } from './home.state';

export interface HomeContextProps {
  state: HomeInitialState;
  dispatch: Dispatch<ActionType<HomeInitialState>>;
  handleNewConversation: () => void;
  handleCreateFolder: (name: string, type: FolderType) => void;
  handleDeleteFolder: (folderId: string) => void;
  handleUpdateFolder: (folderId: string, name: string) => void;
  handleSelectConversation: (conversation: Conversation) => void;
  handleUpdateConversation: (
    conversation: Conversation,
    data: KeyValuePair,
  ) => void;
  updateConversationRemote: (conversation: Conversation) => Promise<void>;
  getConversationRemote: (conversationId: string) => Promise<Conversation>;
  getConversationHistoryRemote: () => Promise<Conversation[]>;
  loadLocalAndRemote: () => Promise<void>;
  resetLocal: () => void;
  getRemote: (key: any) => Promise<void>;
  updateRemote: (key: any, value: any) => Promise<void>; 
  deleteRemote: (key: any) => Promise<void>;
}

const HomeContext = createContext<HomeContextProps>(undefined!);

export default HomeContext;
