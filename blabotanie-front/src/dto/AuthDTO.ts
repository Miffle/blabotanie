export interface RegisterRequest {
    username: string;
    password: string;
}
export interface LoginRequest {
    username: string;
    password: string;
}
export interface JwtResponse {
    token: string;
    refreshToken: string;
    uuid: string;
    username: string;
}
export interface RefreshTokenRequest {
    refreshToken: string;
}