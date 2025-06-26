import {Answer, EndCall, IceCandidate, Offer} from '../dto/CallDTO';
import {Message} from '../dto/ChatDTO';
import {UserOnlineChange} from '../dto/PresenceDTO';

let refreshHandler: (() => void) | null = null;
let presenceHandler: ((presence: UserOnlineChange) => void) | null = null;
let chatMessageHandler: ((msg: Message) => void) | null = null;
let chatHistoryHandler: ((history: any) => void) | null = null;


export const WebSocketEventsRouter = {
    setRefreshHandler: (fn: () => void) => {
        refreshHandler = fn;
    },
    setPresenceHandler: (fn: (presence: UserOnlineChange) => void) => {
        presenceHandler = fn;
    },
    setChatHandler: (fn: (msg: Message) => void) => {
        chatMessageHandler = fn;
    },
    setChatHistoryHandler: (fn: (history: any) => void) => {
        chatHistoryHandler = fn;
    },
    handleMessage: (destination: string, body: any) => {
        switch (destination) {
            case '/user/queue/presence':
                const presence: UserOnlineChange = body;
                console.log('[WS] presence:', presence);
                presenceHandler(presence);
                // можно обновить store/контекст
                break;

            case '/user/queue/offer':
                const offer: Offer = body;
                console.log('[WS] call:', offer);
                // вызвать модалку/звонок
                break;
            case '/user/queue/answer':
                const answer: Answer = body;
                console.log('[WS] call:', answer);
                // вызвать модалку/звонок
                break;
            case '/user/queue/ice-candidate':
                const iceCandidate: IceCandidate = body;
                console.log('[WS] call:', iceCandidate);
                // вызвать модалку/звонок
                break;
            case '/user/queue/end':
                const end: EndCall = body;
                console.log('[WS] call:', end);
                // вызвать модалку/звонок
                break;
            case '/user/queue/reject':
                const reject: EndCall = body;
                console.log('[WS] call:', reject);
                // вызвать модалку/звонок
                break;

            case '/user/queue/chat':
                const chat: Message = body;
                console.log('[WS] chat:', chat);
                chatMessageHandler(chat)
                // сохранить в чат
                break;
            case '/user/queue/chat/history':
                const history: Message = body;
                console.log('[WS] chat:', history);
                chatHistoryHandler(history)
                // сохранить в чат
                break;
            case '/user/queue/friend':
                const friend: Message = body;
                console.log('[WS] chat:', friend);
                refreshHandler?.();
                // сохранить в чат
                break;

            default:
                console.warn('[WS] Unknown destination:', destination);
        }
    },
};
