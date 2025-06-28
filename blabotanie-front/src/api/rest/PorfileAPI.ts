// api/rest/ProfileAPI.ts
import axiosInstance from "./axiosInstance";
import {ROUTES} from "../../constants/routes";
import {FriendRequestResponse} from "../../dto/FriendDTO";
import {JwtResponse} from "../../dto/AuthDTO";

export const getUserProfile = async () => {
    const response = await axiosInstance.get(ROUTES.USERS+"/profile");
    return response.data;
};
export const updateUsername = async (newUsername: string): Promise<JwtResponse> => {
    const response = await axiosInstance.put(ROUTES.USERS + "/username", {
        newUsername: newUsername,
    });
    return response.data;
};