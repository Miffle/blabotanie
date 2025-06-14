import { API_URL, API_PATHS } from "../config";
import { fetchWithAuth } from './interceptor';

export async function getAllFriends() {
  const response = await fetchWithAuth(`${API_URL}/friends/getAll`);
  return response.json();
}

export async function getIncomingRequests() {
  const response = await fetchWithAuth(`${API_URL}/friends/requests/incoming`);
  return response.json();
}

export async function getOutgoingRequests() {
  const response = await fetchWithAuth(`${API_URL}/friends/requests/outgoing`);
  return response.json();
}

export async function removeFriend(id) {
  const response = await fetchWithAuth(`${API_URL}/friends/${id}`, {
    method: "DELETE"
  });
  return response.ok;
}

export async function cancelRequest(id) {
  const response = await fetchWithAuth(`${API_URL}/friends/requests/${id}`, {
    method: "DELETE"
  });
  return response.ok;
}

export async function acceptRequest(id) {
  const response = await fetchWithAuth(`${API_URL}/friends/accept/${id}`, {
    method: "POST"
  });
  return response.ok;
}

export async function declineRequest(id) {
  const response = await fetchWithAuth(`${API_URL}/friends/decline/${id}`, {
    method: "POST"
  });
  return response.ok;
}

export async function sendFriendRequest(username) {
  const response = await fetchWithAuth(`${API_URL}/friends/request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ recipientUsername: username })
  });
  return response.ok;
}



