export interface SendRequest {
    recipientUsername: string;
}

export interface FriendRequestResponse {
    id: bigint;
    senderUuid: string;
    senderUsername: string;
    recipientUuid: string;
    recipientUsername: string;
    status: string; // PENDING, ACCEPTED, DECLINED
}

export interface AllFriendsResponse {
    friendUuid: string;
    friendUsername: string;
    isOnline: boolean;
}

export interface FriendResponse {
    uuid: string;
    username: string;
    online: boolean;
}

export interface AcceptResponse {
    friendshipId: bigint;
    friendsSince: string[];
}


export interface DeclineResponse {
    friendshipId: bigint;
    friendsSince: string[];
}
