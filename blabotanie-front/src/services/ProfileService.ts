import {getUserProfile, updateUsername} from '../api/rest/PorfileAPI';

export const ProfileService = {
    getProfile: async (uuid:string) => {
        return await getUserProfile(uuid);
    },
    updateUsername: async (username:string) => {
        const response =await updateUsername(username);
        localStorage.setItem('token', response.token);
        localStorage.setItem('refreshToken', response.refreshToken);
        localStorage.setItem('uuid', response.uuid);
        localStorage.setItem('username', response.username);
        return response;
    },

};
