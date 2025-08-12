export interface Message {
    fromUserUuid: string;
    fromUserUsername: string;
    toUserUuid: string;
    toUserUsername: string;
    message: string;
    sentAt: string[];
}

export interface HistoryRequest {
    withUserUuid: string;
    withUserUsername: string;
    page: bigint;
    pageSize: bigint;
}

export interface HistoryResponse {
    withUserUuid: string;
    withUserUsername: string;
    messages: Message[];
    page: bigint;
    hasMore: boolean;
}