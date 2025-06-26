export interface CreateServerRequest {
    serverName: string;
}

export interface ServerSummary {
    id: bigint;
    name: string;
    ownerId: bigint;
    channels: ChannelSummary[];
}

export interface ServerDetails {
    id: bigint;
    name: string;
    ownerId: bigint;
    channels: ChannelSummary[];
    members: UserSummary[];
}

export interface InviteUserRequest {
    serverId: bigint;
    userId: bigint;
}

export interface ServerJoinEvent {
    serverId: bigint;
    user: UserSummary;
}

export interface ServerLeaveEvent {
    serverId: bigint;
    userId: bigint;
}

export interface CreateChannelRequest {
    serverId: bigint;
    channelName: string;
    channelType: string; // TEXT, VOICE (enum ChannelType)
}

export interface ChannelSummary {
    id: bigint;
    name: string;
    type: string; // TEXT, VOICE
}

export interface UserSummary {
    id: bigint;
    username: string;
    online: boolean;
}

export interface VoiceChannelUsersResponse {
    channelId: bigint;
    users: UserSummary[];
}

export interface VoicePresenceEvent {
    type: string; // JOIN, LEAVE
    channelId: bigint;
    user: UserSummary;
}