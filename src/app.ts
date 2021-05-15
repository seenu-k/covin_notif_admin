import * as admin from 'firebase-admin';
import request from 'request';
import { CalenderResponse } from './dataModel';

admin.initializeApp({
    credential: admin.credential.cert('./covin-notif-firebase-adminsdk-jv7hz-21fe98fa40.json'),
    databaseURL: 'https://covin-notif-default-rtdb.firebaseio.com/'
});

const pincode = '600050';
const date = '14-05-2021';

request(`https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByPin?pincode=${pincode}&date=${date}`, { json: true }, (err, res, body: CalenderResponse) => {
  if (err) { return console.log(err); }
  console.log(body.centers);
});