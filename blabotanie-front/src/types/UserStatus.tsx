export enum UserStatus {
    OFFLINE = 0,
    ONLINE = 1,
    AWAY = 2,
    IN_CALL = 3
}
export const statusStringToEnum: Record<string, UserStatus> = {
    "OFFLINE": UserStatus.OFFLINE,
    "ONLINE": UserStatus.ONLINE,
    "AWAY": UserStatus.AWAY,
    "IN_CALL": UserStatus.IN_CALL
};