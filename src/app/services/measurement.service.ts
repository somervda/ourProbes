import { Injectable } from "@angular/core";
import { Measurement } from "../models/measurement.model";
import { Observable } from "rxjs";
import { AngularFirestore } from "@angular/fire/firestore";
import { map, take } from "rxjs/operators";
import { convertSnaps } from "./db-utils";

@Injectable({
  providedIn: "root"
})
export class MeasurementService {
  constructor(private afs: AngularFirestore) {}

  findLastHoursMeasurments(
    to: Date,
    type: string,
    pageSize
  ): Observable<Measurement[]> {
    // console.log( "findDevices",  sortField, sortOrder  ,pageSize  );
    const from = new Date(to.getTime() - 1000 * 500);
    return this.afs
      .collection("measurements", ref =>
        ref
          .where("UMT", ">=", from)
          .where("UMT", "<=", to)
          .where("type", "==", type)
          .limit(pageSize)
      )
      .snapshotChanges()
      .pipe(
        map(snaps => {
          // console.log("findDevices", convertSnaps<Device>(snaps));
          return convertSnaps<Measurement>(snaps);
        }),
        // Not sure why this is needed but 2 sets of results are emitted with this query
        take(2)
      );
  }
}
