import {
    acceptFriendRequest,
    cancelFriendRequest,
    declineFriendRequest,
    deleteFriend,
    getAllFriends,
    getIncomingRequests,
    getOutgoingRequests,
    searchQuery,
    sendFriendRequest
} from '../api/rest/FriendsAPI';
import {UserResponse} from '../dto/UserDTO';

export const FriendService = {
    getAllFriends: async () => {
        return await getAllFriends();
    },
    sendFriendRequest: async (friendUsername: string) => {
        return await sendFriendRequest({recipientUsername: friendUsername});
    },
    searchByQuery: async (query: string): Promise<UserResponse[]> => {
        return await searchQuery(query);
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
