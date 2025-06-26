export interface UserResponse {
    uuid: string;
    username: string;
    online: boolean;
}

export interface SearchRequest {
    query: string;
}

export interface UpdateUsernameRequest {
    newUsername: string;
}

export interface UserInternalResponse {
    id: bigint;
    uuid: string;
    username: string;
    online: boolean;
}