import { API_URL } from "../config";
import { getAuthHeader } from "./auth";

export const getCallHistory = async (page = 1, pageSize = 10) => {
  try {
    const response = await fetch(
      `${API_URL}/call/history?page=${page}&size=${pageSize}`,
      {
        method: "GET",
        headers: {
          ...getAuthHeader(),
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch call history");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching call history:", error);
    throw error;
  }
};
  