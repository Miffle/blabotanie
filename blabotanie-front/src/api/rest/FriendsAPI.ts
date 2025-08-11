import axiosInstance from './axiosInstance';
import {AllFriendsResponse, FriendRequestResponse, SendRequest} from '../../dto/FriendDTO';
import {ROUTES} from "../../constants/routes";
import {UserResponse} from '../../dto/UserDTO';

export const sendFriendRequest = async (data: SendRequest): Promise<FriendRequestResponse> => {
    const response = await axiosInstance.post(ROUTES.FRIENDS + "/request", data);
    return response.data;
};
export const searchQuery = async (query: string): Promise<UserResponse[]> => {
    const response = await axiosInstance.get(ROUTES.USERS + "/search", {
        params: {
            "query": query
        }
    });
    return response.data;
};
export const getIncomingRequests = async (): Promise<FriendRequestResponse> => {
    const response = await axiosInstance.get(ROUTES.FRIENDS + "/requests/incoming");
    return response.data;
};
export const getOutgoingRequests = async (): Promise<FriendRequestResponse> => {
    const response = await axiosInstance.get(ROUTES.FRIENDS + "/requests/outgoing");
    return response.data;
};
export const getAllFriends = async (): Promise<AllFriendsResponse[]> => {
    const response = await axiosInstance.get(ROUTES.FRIENDS + "/getAll");
    return response.data;
};
export const acceptFriendRequest = async (requestId: bigint): Promise<AllFriendsResponse[]> => {
    const response = await axiosInstance.post(ROUTES.FRIENDS + "/accept/" + requestId);
    return response.data;
};
export const declineFriendRequest = async (requestId: bigint): Promise<AllFriendsResponse[]> => {
    const response = await axiosInstance.post(ROUTES.FRIENDS + "/decline/" + requestId);
    return response.data;
};
export const cancelFriendRequest = async (requestId: bigint): Promise<AllFriendsResponse[]> => {
    const response = await axiosInstance.delete(ROUTES.FRIENDS + "/requests/" + requestId);
    return response.data;
};
export const deleteFriend = async (friendUuid: string): Promise<AllFriendsResponse[]> => {
    const response = await axiosInstance.delete(ROUTES.FRIENDS + "/" + friendUuid);
    return response.data;
};
