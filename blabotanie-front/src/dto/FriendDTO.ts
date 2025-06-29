import {UserStatus} from "../types/UserStatus";

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
    status: UserStatus;
}

export interface FriendResponse {
    uuid: string;
    username: string;
    status: UserStatus;
}

export interface AcceptResponse {
    friendshipId: bigint;
    friendsSince: string[];
}


export interface DeclineResponse {
    friendshipId: bigint;
    friendsSince: string[];
}
