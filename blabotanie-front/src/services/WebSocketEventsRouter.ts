import {Answer, EndCall, IceCandidate, MuteAudio, Offer} from '../dto/CallDTO';
import { Message } from '../dto/ChatDTO';
import { UserOnlineChange } from '../dto/PresenceDTO';

// --- Хендлеры по типам ---
let refreshHandler: ((body:string) => void) | null = null;
let presenceHandler: ((presence: UserOnlineChange) => void) | null = null;

let chatMessageHandler: ((msg: Message) => void) | null = null;
let chatHistoryHandler: ((history: any) => void) | null = null;

// Звонки
let incomingCallHandler: ((offer: Offer) => void) | null = null;
let callAnswerHandler: ((answer: Answer) => void) | null = null;
let iceCandidateHandler: ((candidate: IceCandidate) => void) | null = null;
let callEndHandler: ((end: EndCall) => void) | null = null;
let callRejectHandler: ((reject: EndCall) => void) | null = null;
let muteHandler: ((mute: MuteAudio) => void) | null = null;

// --- API для установки хендлеров ---
export const WebSocketEventsRouter = {
    setRefreshHandler: (fn: (body:string) => void) => { refreshHandler = fn; },
    setPresenceHandler: (fn: (presence: UserOnlineChange) => void) => { presenceHandler = fn; },

    setChatHandler: (fn: (msg: Message) => void) => { chatMessageHandler = fn; },
    setChatHistoryHandler: (fn: (history: any) => void) => { chatHistoryHandler = fn; },

    setIncomingCallHandler: (fn: (offer: Offer) => void) => { incomingCallHandler = fn; },
    setAnswerHandler: (fn: (answer: Answer) => void) => { callAnswerHandler = fn; },
    setIceCandidateHandler: (fn: (ice: IceCandidate) => void) => { iceCandidateHandler = fn; },
    setCallEndHandler: (fn: (end: EndCall) => void) => { callEndHandler = fn; },
    setCallRejectHandler: (fn: (reject: EndCall) => void) => { callRejectHandler = fn; },
    setMuteHandler: (fn: (mute: MuteAudio) => void) => { muteHandler = fn; },

    // --- Главный обработчик сообщений WebSocket ---
    handleMessage: (destination: string, body: any) => {
        switch (destination) {
            case '/user/queue/presence':
                console.log('[WS] presence:', body);
                presenceHandler?.(body);
                break;
            case '/user/queue/call/mute':
                console.log('[WS] mute:', body);
                muteHandler?.(body);
                break;

            case '/user/queue/call/offer':
                console.log('[WS] call offer:', body);
                incomingCallHandler?.(body);
                break;

            case '/user/queue/call/answer':
                console.log('[WS] call answer:', body);
                callAnswerHandler?.(body);
                break;

            case '/user/queue/call/ice-candidate':
                console.log('[WS] ICE candidate:', body);
                iceCandidateHandler?.(body);
                break;

            case '/user/queue/call/end-call':
                console.log('[WS] call end:', body);
                callEndHandler?.(body);
                break;

            case '/user/queue/call/reject-call':
                console.log('[WS] call reject:', body);
                callRejectHandler?.(body);
                break;

            case '/user/queue/chat':
                console.log('[WS] chat message:', body);
                chatMessageHandler?.(body);
                break;

            case '/user/queue/chat/history':
                console.log('[WS] chat history:', body);
                chatHistoryHandler?.(body);
                break;

            case '/user/queue/friend':
                console.log('[WS] friend update:', body);
                refreshHandler?.(body);
                break;

            default:
                console.warn('[WS] Unknown destination:', destination);
        }
    },
};
