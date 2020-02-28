import {
  MeasurementSummary,
  measurementSummaryPeriod
} from "./../models/measurementSummary.model";
import { Injectable } from "@angular/core";
import { AngularFirestore, DocumentReference } from "@angular/fire/firestore";
import { Observable } from "rxjs";
import { map, first, take } from "rxjs/operators";
import { convertSnaps } from "./db-utils";

@Injectable({
  providedIn: "root"
})
export class MeasurementSummaryService {
  constructor(private afs: AngularFirestore) {}

  getMeasurementSummaryData(
    from: Date,
    to: Date,
    period: measurementSummaryPeriod,
    pagesize: number
  ): Observable<MeasurementSummary[]> {
    return this.afs
      .collection("measurementSummaries", ref =>
        ref
          .where("umt", ">=", from)
          .where("umt", "<=", to)
          .where("period", "==", period)
          .limit(pagesize)
      )
      .snapshotChanges()
      .pipe(
        map(snaps => {
          // console.log("findDevices", convertSnaps<Device>(snaps));
          return convertSnaps<MeasurementSummary>(snaps);
        }),
        // Not sure why this is needed but 2 sets of results are emitted with this query
        take(2)
      );
  }

  getChartSeries(
    from: Date,
    to: Date,
    period: measurementSummaryPeriod,
    deviceId: string,
    probeId: string,
    type: string,
    series: string[]
  ): Observable<any> {
    return this.afs
      .collection("measurementSummaries", ref =>
        ref
          .where("umt", ">=", from)
          .where("umt", "<=", to)
          .where("period", "==", period)
          .where("deviceId", "==", deviceId)
          .where("probeId", "==", probeId)
          .where("type", "==", type)
      )
      .snapshotChanges()
      .pipe(
        map(snaps => {
          return series.reduce((chartMultiSeries, seriesName) => {
            const chartSeries = snaps.reduce(
              (a, s) =>
                a.concat({
                  name: s.payload.doc.data()["umt"].toDate(),
                  value: Math.round(s.payload.doc.data()[seriesName])
                }),
              []
            );
            chartMultiSeries.push({ name: seriesName, series: chartSeries });
            return chartMultiSeries;
          }, []);
        })
      );
  }
}
