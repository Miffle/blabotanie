import { stompClient } from "./client";

export const subscribeToTopics = ({
  onChatMessage,
  onChatHistory,
  onPresence,
  onCallOffer,
  onCallAnswer,
  onFriendEvent,
  onIceCandidate,
  onCallEnd,
  onCallReject
}) => {
  if (!stompClient) return;

  stompClient.subscribe("/user/queue/chat", (message) => {
    const msg = JSON.parse(message.body);
    console.log(msg)
    onChatMessage && onChatMessage(msg);
  });

  stompClient.subscribe("/user/queue/chat/history", (message) => {
    const msg = JSON.parse(message.body);
    console.log(msg)
    onChatHistory && onChatHistory(msg.messages);
  });

  stompClient.subscribe("/user/queue/presence", (message) => {
    const data = JSON.parse(message.body);
    console.log(data)
    onPresence && onPresence(data);
  });

  stompClient.subscribe("/user/queue/call/offer", (message) => {
    onCallOffer && onCallOffer(JSON.parse(message.body));
  });

  stompClient.subscribe("/user/queue/call/answer", (message) => {
    onCallAnswer && onCallAnswer(JSON.parse(message.body));
  });

  stompClient.subscribe("/user/queue/friend", (message) => {
    onFriendEvent && onFriendEvent(message.body);
  });

  stompClient.subscribe("/user/queue/call/ice-candidate", (message) => {
    onIceCandidate && onIceCandidate(JSON.parse(message.body));
  });

  stompClient.subscribe("/user/queue/call/end-call", () => {
    onCallEnd && onCallEnd();
  });

  stompClient.subscribe("/user/queue/call/reject-call", () => {
    onCallReject && onCallReject();
  });
};
