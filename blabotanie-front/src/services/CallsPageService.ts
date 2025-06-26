import {getCallsHistory} from '../api/rest/CallsAPI';

export const CallsPageService = {
    getCallsHistory: async (page) => {
        return await getCallsHistory(page);
    },

};
