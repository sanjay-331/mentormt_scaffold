import api from "./api";

export async function getCalendarEvents() {
    const response = await api.get("/api/calendar/events");
    return response.data;
}
