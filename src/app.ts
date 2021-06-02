/* eslint-disable @typescript-eslint/naming-convention */
import * as admin from 'firebase-admin';
import got from 'got';
import { CalenderResponse, Center, User } from './dataModel';
import { compareWithPreferences, detectChanges } from './dataTransforms';

admin.initializeApp({
    credential: admin.credential.cert('./covin-notif-firebase-adminsdk-jv7hz-21fe98fa40.json'),
    databaseURL: 'https://covin-notif-default-rtdb.firebaseio.com/'
});

const dateObj = new Date();
const date = `${dateObj.getDate().toLocaleString('en-IN', {minimumIntegerDigits: 2, useGrouping:false})}-${dateObj.getMonth().toLocaleString('en-IN', {minimumIntegerDigits: 2, useGrouping:false})}-${dateObj.getFullYear()}`;

const pincodes: string[] = [];
const districts: number[] = [];
let previousDistrictCenters: {[district_id: string]: Center[]} = {};
let previousPincodeCenters: {[pincode: string]: Center[]} = {};

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
  return got.get(`https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=${district_id}&date=${date}`).json().then((response) => {
    return (response as CalenderResponse).centers;
  }).catch(() => {
    return null;
  });
};

const getUsersByDistrict = (district_id: number) => {
  return admin.database().ref('users').orderByChild('location_district').equalTo(district_id).once('value').then((snapshot) => {
    return snapshot.val() as {[uid: string]: User};
  });
}
const getUsersByPincode = (pincode: string) => {
  return admin.database().ref('users').orderByChild('location_pincode').equalTo(pincode).once('value').then((snapshot) => {
    return snapshot.val() as {[uid: string]: User};
  });
}

const mainLoop = () => {
  Promise.all(districts.map(district => getCentersByDistrict(district))).then((districtRes) => {
    const districtCenters: {[district_id: string]: Center[]} = districtRes.reduce((obj, cur, curIndex) => ({...obj, [districts[curIndex]]: cur}), {});
    Promise.all(pincodes.map(pincode => getCentersByPincode(pincode))).then((pinRes) => {
      const pincodeCenters: {[pincode: string]: Center[]} = pinRes.reduce((obj, cur, curIndex) => ({...obj, [pincodes[curIndex]]: cur}), {});
      // Detect changes from previous state of data
      const updatedDistrictCenters = detectChanges(previousDistrictCenters, districtCenters);
      const updatedPincodeCenters = detectChanges(previousPincodeCenters, pincodeCenters);
      // Get user preferences corresponding to the changes
      Promise.all(
        [...Object.keys(updatedDistrictCenters).map(districtID => getUsersByDistrict(Number(districtID))), ...Object.keys(updatedPincodeCenters).map(pincode => getUsersByPincode(pincode))]
      ).then((users) => {
        // Match user preferences and updates to get a list of notifications to send
        compareWithPreferences(users.reduce((obj, cur) => ({...obj, ...cur}) ,{}), {...updatedDistrictCenters, ...updatedPincodeCenters})
        // Store current data
        previousDistrictCenters = districtCenters;
        previousPincodeCenters = pincodeCenters;
      }).catch(error => {
        console.log('Error retrieving users', error);
      });
    }).catch((error) => {
      console.log('Error retrieving pincode centers', error);
    });
  }).catch((error) => {
    console.log('Error retrieving district centers', error);
  });
  setTimeout(mainLoop, 10000);
};

mainLoop();