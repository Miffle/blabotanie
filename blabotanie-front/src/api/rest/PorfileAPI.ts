// api/rest/ProfileAPI.ts
import axiosInstance from "./axiosInstance";
import {ROUTES} from "../../constants/routes";
import {JwtResponse} from "../../dto/AuthDTO";

export const getUserProfile = async (uuid:string) => {
    const response = await axiosInstance.get(ROUTES.USERS+`/profile/${uuid}`);
    return response.data;
};
export const getPosts = async (uuid:string) => {
    const response = await axiosInstance.get(ROUTES.USERS+`/${uuid}/posts`);
    return response.data;
};
export const createPost = async (postContent:string) => {
    const response = await axiosInstance.post(ROUTES.USERS+`/post`, {
        content: postContent
    });
    return response.data;
};
export const updateUsername = async (newUsername: string): Promise<JwtResponse> => {
    const response = await axiosInstance.put(ROUTES.USERS + "/username", {
        newUsername: newUsername,
    });
    return response.data;
};
export const updateBio = async (newBio: string): Promise<JwtResponse> => {
    const response = await axiosInstance.put(ROUTES.USERS + "/bio", {
        newBio: newBio,
    });
    return response.data;
};