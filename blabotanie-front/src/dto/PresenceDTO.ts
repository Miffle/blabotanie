import {UserStatus} from "../types/UserStatus";

export interface UserOnlineChange {
    username: string;
    status: UserStatus;
}