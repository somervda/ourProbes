import { Injectable } from "@angular/core";
import { AngularFirestore } from "@angular/fire/firestore";
import { Observable } from "rxjs";
import { map, first, take } from "rxjs/operators";
import { convertSnaps } from "./db-utils";
import { Device } from "../models/device.model";
import OrderByDirection = firebase.firestore.OrderByDirection;

@Injectable({
  providedIn: "root"
})
export class DeviceService {
  constructor(private afs: AngularFirestore) {}

  findUserByUid(uid: string): Observable<Device> {
    return this.afs
      .collection("devices", ref => ref.where("did", "==", did))
      .snapshotChanges()
      .pipe(
        map(snaps => {
          const device = convertSnaps<Device>(snaps);
          return device.length == 1 ? device[0] : undefined;
        }),
        first()
      );
  }

  findUsers(
    filter = "",
    sortField,
    sortOrder: OrderByDirection,
    pageSize
  ): Observable<Device[]> {
    // console.log( "findDevices",  sortField, sortOrder  ,pageSize  );
    return this.afs
      .collection("devices", ref =>
        ref.orderBy(sortField, sortOrder).limit(pageSize)
      )
      .snapshotChanges()
      .pipe(
        map(snaps => {
          return convertSnaps<Device>(snaps);
        }),
        // Not sure why this is needed but 2 sets of results are emitted with this query
        // take(2)
        first()
      );
  }
}
