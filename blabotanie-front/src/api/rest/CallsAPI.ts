import axiosInstance from './axiosInstance';
import {Call} from '../../dto/CallDTO';
import {ROUTES} from "../../constants/routes";

export interface PageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    number: number; // текущая страница (0-based)
    size: number;
    first: boolean;
    last: boolean;
    empty: boolean;
}

export const getCallsHistory = async (
    page: number,
    size: number = 5
): Promise<PageResponse<Call>> => {
    const response = await axiosInstance.get(ROUTES.CALL + "/history", {
        params: { page, size },
    });
    return response.data;
};
