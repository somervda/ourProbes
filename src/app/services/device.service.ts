import { Injectable } from "@angular/core";
import { AngularFirestore, DocumentReference } from "@angular/fire/firestore";
import { Observable } from "rxjs";
import { map, first, take } from "rxjs/operators";
import { convertSnaps, dbFieldUpdate, convertSnap } from "./db-utils";
import { Device } from "../models/device.model";
import OrderByDirection = firebase.firestore.OrderByDirection;

@Injectable({
  providedIn: "root"
})
export class DeviceService {
  constructor(private afs: AngularFirestore) {}

  findById(id: string): Observable<Device> {
    return this.afs
      .doc("/devices/" + id)
      .snapshotChanges()
      .pipe(
        map(snap => {
          return convertSnap<Device>(snap);
        })
      );
  }

  findDevices(pageSize): Observable<Device[]> {
    // console.log( "findDevices",  sortField, sortOrder  ,pageSize  );
    return this.afs
      .collection("devices", ref => ref.limit(pageSize))
      .snapshotChanges()
      .pipe(
        map(snaps => {
          console.log("findDevices", convertSnaps<Device>(snaps));
          return convertSnaps<Device>(snaps);
        }),
        // Not sure why this is needed but 2 sets of results are emitted with this query
        take(2)
      );
  }

  fieldUpdate(docId: string, fieldName: string, newValue: any) {
    if (docId && fieldName) {
      const updateObject = {};
      dbFieldUpdate("/devices/" + docId, fieldName, newValue, this.afs);
    }
  }

  create(device: Device): Promise<void> {
    // Todo - check for id existence and fail if it already exists
    const id = device.id;
    delete device.id;
    return this.afs
      .collection("devices")
      .doc(id)
      .set(device);
  }

  delete(id: string): Promise<void> {
    return this.afs
      .collection("devices")
      .doc(id)
      .delete();
  }
}
