import { Center, Session, User } from "./dataModel";

export const detectChanges = (previous: {[loc_id: string]: Center[]}, current: {[loc_id: string]: Center[]}): {[loc_id: string]: Center[]} => {
    const updatedLocationCenters: {[loc_id: string]: Center[]} = {}
    Object.keys(current).forEach((location) => {
        if(previous[location]) {
            updatedLocationCenters[location] = compareCenters(previous[location], current[location]);
        }
        else {
            updatedLocationCenters[location] = current[location];
        }
    });
    return updatedLocationCenters;
}

const compareCenters = (previous: Center[], current: Center[]) => {
    return current.map((center) => {
        const cSessions = center.sessions;
        const pSessions = previous.find(pCenter => pCenter.center_id===center.center_id)?.sessions;
        if(pSessions) {
            const updatedSessions = compareSessions(pSessions, cSessions);
            if(updatedSessions.length) {
                center.sessions = updatedSessions;
                return center;
            }
            else {
                return null;
            }
        }
        else {
            return center;
        }
    }).filter((center) => center) as Center[];
}

const compareSessions = (previous: Session[], current: Session[]) => {
    return current.filter((cSession) => {
        const pSession = previous.find(pSess => pSess.session_id===cSession.session_id);
        const pDoses = pSession?pSession.available_capacity:0;
        const cDoses = cSession.available_capacity;
        return cDoses>pDoses;
    });
}

export const compareWithPreferences = (users: {[uid: string]: User}, locationCenters: {[loc_id: string]: Center[]}): void => {
    console.log(users);
}