/* eslint-disable @typescript-eslint/naming-convention */
import * as admin from 'firebase-admin';
import got from 'got';
import { CalenderResponse } from './dataModel';

admin.initializeApp({
    credential: admin.credential.cert('./covin-notif-firebase-adminsdk-jv7hz-21fe98fa40.json'),
    databaseURL: 'https://covin-notif-default-rtdb.firebaseio.com/'
});

const dateObj = new Date();
const date = `${dateObj.getDate().toLocaleString('en-IN', {minimumIntegerDigits: 2, useGrouping:false})}-${dateObj.getMonth().toLocaleString('en-IN', {minimumIntegerDigits: 2, useGrouping:false})}-${dateObj.getFullYear()}`;

const pincodes: string[] = [];
const districts: number[] = [];

admin.database().ref('locations').on('child_added', (snapshot) => {
  if(snapshot.key?.length===6) {
    pincodes.push(snapshot.key);
  }
  else {
    districts.push(Number(snapshot.key));
  }
});

const getCentersByPincode = (pincode: string) => {
  return got.get(`https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByPin?pincode=${pincode}&date=${date}`).json().then((response) => {
    return (response as CalenderResponse).centers;
  }).catch(() => {
    return null;
  });
};

const getCentersByDistrict = (district_id: number) => {
  return got.get(`https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByPin?pincode=${district_id}&date=${date}`).json().then((response) => {
    return (response as CalenderResponse).centers;
  }).catch(() => {
    return null;
  });
};

const mainLoop = () => {
  pincodes.map(pincode => getCentersByPincode(pincode));
};

setInterval(mainLoop, 10000);