// api/rest/ProfileAPI.ts
import axiosInstance from "./axiosInstance";
import {ROUTES} from "../../constants/routes";
import {JwtResponse} from "../../dto/AuthDTO";

export const getUserProfile = async (uuid:string) => {
    const response = await axiosInstance.get(ROUTES.USERS+`/profile/${uuid}`);
    return response.data;
};
export const updateUsername = async (newUsername: string): Promise<JwtResponse> => {
    const response = await axiosInstance.put(ROUTES.USERS + "/username", {
        newUsername: newUsername,
    });
    return response.data;
};