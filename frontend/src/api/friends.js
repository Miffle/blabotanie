const API_URL = "http://193.233.113.180:8087/api";

export async function getAllFriends() {
  const response = await fetch(`${API_URL}/friends/getAll`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    }
  });
  return response.json();
}

export async function getIncomingRequests() {
  const response = await fetch(`${API_URL}/friends/requests/incoming`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    }
  });
  return response.json();
}

export async function getOutgoingRequests() {
  const response = await fetch(`${API_URL}/friends/requests/outgoing`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    }
  });
  return response.json();
}

export async function removeFriend(id) {
  const response = await fetch(`${API_URL}/friends/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    }
  });
  return response.ok;
}

export async function cancelRequest(id) {
  const response = await fetch(`${API_URL}/friends/requests/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    }
  });
  return response.ok;
}

export async function acceptRequest(id) {
  const response = await fetch(`${API_URL}/friends/accept/${id}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    }
  });
  return response.ok;
}

export async function declineRequest(id) {
  const response = await fetch(`${API_URL}/friends/decline/${id}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    }
  });
  return response.ok;
}

export async function sendFriendRequest(username) {
  const response = await fetch(`${API_URL}/friends/request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    },
    body: JSON.stringify({ recipientUsername: username })
  });
  return response.ok;
}



