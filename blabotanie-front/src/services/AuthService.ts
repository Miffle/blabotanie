import {login, refreshToken, register} from '../api/rest/AuthAPI';
import {LoginRequest, RefreshTokenRequest, RegisterRequest} from '../dto/AuthDTO';

export const AuthService = {
    login: async (dto: LoginRequest) => {
        const response = await login(dto);
        localStorage.setItem('token', response.token);
        localStorage.setItem('refreshToken', response.refreshToken);
        localStorage.setItem('uuid', response.uuid);
        localStorage.setItem('username', response.username);
        return response;
    },
    register: async (dto: RegisterRequest) => {
        const response = await register(dto);
        localStorage.setItem('token', response.token);
        localStorage.setItem('refreshToken', response.refreshToken);
        localStorage.setItem('uuid', response.uuid);
        localStorage.setItem('username', response.username);
        return response;
    },
    refreshToken: async (dto: RefreshTokenRequest) => {
        const response = await refreshToken(dto);
        localStorage.setItem('token', response.token);
        localStorage.setItem('refreshToken', response.refreshToken);
        localStorage.setItem('uuid', response.uuid);
        localStorage.setItem('username', response.username);
        return response;
    },
};
