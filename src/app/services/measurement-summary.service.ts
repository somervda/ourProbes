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
    type: string,
    pagesize: number
  ): Observable<MeasurementSummary[]> {
    console.log("getMeasurementSummaryData", from, to, period, pagesize);
    return this.afs
      .collection("measurementSummaries", ref => {
        let retVal = ref as any;
        retVal = retVal.where("umt", ">=", from);
        retVal = retVal.where("umt", "<=", to);
        retVal = retVal.where("period", "==", period);
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
            convertSnaps<MeasurementSummary>(snaps)
          );
          return convertSnaps<MeasurementSummary>(snaps);
        })
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
