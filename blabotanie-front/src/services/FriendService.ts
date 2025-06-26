import {
    acceptFriendRequest, cancelFriendRequest, declineFriendRequest, deleteFriend,
    getAllFriends,
    getIncomingRequests,
    getOutgoingRequests,
    sendFriendRequest
} from '../api/rest/FriendsAPI';
import {LoginRequest} from '../dto/AuthDTO';
import {SendRequest} from "../dto/FriendDTO";

export const FriendService = {
    getAllFriends: async () => {
        return await getAllFriends();
    },
    sendFriendRequest: async (friendUsername: string) => {
        return await sendFriendRequest({recipientUsername: friendUsername});
    },
    getOutgoingRequests: async () => {
        return await getOutgoingRequests();
    },
    getIncomingRequests: async () => {
        return await getIncomingRequests();
    },
    acceptFriendRequest: async (requestId: bigint) => {
        return await acceptFriendRequest(requestId);
    },
    declineFriendRequest: async (requestId: bigint) => {
        return await declineFriendRequest(requestId);
    },
    cancelFriendRequest: async (requestId: bigint) => {
        return await cancelFriendRequest(requestId);
    },
    deleteFriend: async (friendUuid: string) => {
        return await deleteFriend(friendUuid);
    },
};
