import axiosInstance from './axiosInstance';
import {LoginRequest, RegisterRequest, JwtResponse, RefreshTokenRequest} from '../../dto/AuthDTO';
import {ROUTES} from "../../constants/routes";

export const login = async (data: LoginRequest): Promise<JwtResponse> => {
    const response = await axiosInstance.post(ROUTES.LOGIN, data);
    return response.data;
};
export const register = async (data: RegisterRequest): Promise<JwtResponse> => {
    const response = await axiosInstance.post(ROUTES.REGISTER, data);
    return response.data;
};
export const refreshToken = async (data: RefreshTokenRequest): Promise<JwtResponse> => {
    const response = await axiosInstance.post(ROUTES.REFRESH_TOKEN, data);
    return response.data;
};
