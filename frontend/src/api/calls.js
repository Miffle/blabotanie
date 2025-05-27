const API_URL = "http://193.233.113.180:8087/api";
export async function getCallsHistory() {
    const response = await fetch(`${API_URL}/call/history`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      }
    });
    return response.json();
  }
  