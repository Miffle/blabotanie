export interface Offer {
    initiatorUuid: string; // UUID инициатора
    initiatorUsername: string; // Отображаемое имя инициатора
    calledUuid: string; // UUID получателя
    calledUsername: string; // Отображаемое имя получателя
    sdp: string;         // SDP-описание
    startTime: string;         // Время начала звонка
}


export interface Answer {
    initiatorUuid: string; // UUID инициатора
    initiatorUsername: string; // Отображаемое имя инициатора
    calledUuid: string; // UUID получателя
    calledUsername: string; // Отображаемое имя получателя
    sdp: string;         // SDP-ответ
}


export interface IceCandidate {
    initiatorUuid: string;  // UUID инициатора
    initiatorUsername: string;  // Отображаемое имя инициатора
    calledUuid: string;  // UUID получателя
    calledUsername: string;  // Отображаемое имя получателя
    sdpMid: string;
    sdpMLineIndex: number;
    sdp: string;
}

export interface MuteAudio {
    senderUuid: string;
    senderUsername: string;
    recipientUuid: string;
    recipientUsername: string;
    device: string;
    isMuted: boolean;
}

export interface EndCall {
    recipientUuid: string; // UUID второго участника
    recipientUsername: string; // Отображаемое имя второго участника
}


export interface Error {
    message: string; // Пример: "Получатель оффлайн"
}


export interface Call {
    initiatorUuid: string;
    initiatorUsername: string;
    calledUuid: string;
    calledUsername: string;
    duration: bigint;
    callStatus: string;
    endTime: string[];
}