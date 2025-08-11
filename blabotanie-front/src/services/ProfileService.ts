import {createPost, getPosts, getUserProfile, updateBio, updateUsername} from '../api/rest/PorfileAPI';

export const ProfileService = {
    getProfile: async (uuid: string) => {
        return await getUserProfile(uuid);
    },
    getPosts: async (uuid: string) => {
        return await getPosts(uuid);
    },
    createPost: async (postContent: string) => {
        return await createPost(postContent);
    },
    updateUsername: async (username: string) => {
        const response = await updateUsername(username);
        localStorage.setItem('token', response.token);
        localStorage.setItem('refreshToken', response.refreshToken);
        localStorage.setItem('uuid', response.uuid);
        localStorage.setItem('username', response.username);
        return response;
    },
    updateBio: async (newBio: string) => {
        return await updateBio(newBio);
    },

};
