import { Note } from '../../types.ts';

export interface DeleteNoteResult {
    success: boolean;
    message?: string;
}

export interface GetEncryptedNoteResult {
    success: boolean;
    note?: Note;
    message?: string;
}

export interface CreateNoteResult {
    success: boolean;
    noteId?: string;
    authKey?: string;
    message?: string;

    link?: string;
}

export interface CreateNoteData {
    content: string;
    password?: string;
    expiresIn: string;
    manualDeletion?: boolean;
}

export interface StorageProvider {
    create(data: CreateNoteData): Promise<CreateNoteResult>;
    get(noteId: string, authKey?: string, password?: string): Promise<GetEncryptedNoteResult>;
    delete(noteId: string, authKey?: string, password?: string): Promise<DeleteNoteResult>;
}
