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
    const from = new Date(to.getTime() - 1000 * 3600);
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
        })
      );
  }

  getMeasurementData(
    from: Date,
    to: Date,
    type: string,
    pagesize: number
  ): Observable<Measurement[]> {
    console.log("getMeasurementData", from, to, type, pagesize);
    return this.afs
      .collection("measurements", ref => {
        let retVal = ref as any;
        retVal = retVal.where("UMT", ">=", from);
        retVal = retVal.where("UMT", "<=", to);
        if (type != "") {
          retVal = retVal.where("type", "==", type);
        }
        retVal = retVal.limit(pagesize);
        return retVal;
      })
      .snapshotChanges()
      .pipe(
        map(snaps => {
          console.log(
            "getMeasurementSummaryData",
            convertSnaps<Measurement>(snaps)
          );
          return convertSnaps<Measurement>(snaps);
        })
      );
  }

  getMeasurementProbeData(
    probeId: string,
    pagesize: number
  ): Observable<Measurement[]> {
    console.log("getMeasurementProbeData", probeId, pagesize);
    return this.afs
      .collection("measurements", ref => {
        let retVal = ref as any;
        retVal = retVal.where("probeId", "==", probeId);
        retVal = retVal.limit(pagesize);
        return retVal;
      })
      .snapshotChanges()
      .pipe(
        map(snaps => {
          return convertSnaps<Measurement>(snaps);
        })
      );
  }
}
