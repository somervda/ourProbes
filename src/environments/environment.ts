// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  firebase: {
    apiKey: "AIzaSyBTXGNP8fuSxj8aZTz7VbQ4LduAZ20Jd3o",
    authDomain: "ourprobes-258320.firebaseapp.com",
    databaseURL: "https://ourprobes-258320.firebaseio.com",
    projectId: "ourprobes-258320",
    storageBucket: "ourprobes-258320.appspot.com",
    messagingSenderId: "159351003399",
    appId: "1:159351003399:web:44f1fdcb0fa525fed94da2",
    measurementId: "G-CDZ4QQ81HY"
  },
  google_cloud_config: {
    project_id: "ourprobes-258320",
    cloud_region: "us-central1",
    registry_id: "microcontroller",
    mqtt_bridge_hostname: "mqtt.googleapis.com",
    mqtt_bridge_port: 8883
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
