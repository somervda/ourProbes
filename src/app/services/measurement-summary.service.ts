import { Injectable } from "@angular/core";
import { AngularFirestore, DocumentReference } from "@angular/fire/firestore";
import { Observable } from "rxjs";
import { map, first, take } from "rxjs/operators";

@Injectable({
  providedIn: "root"
})
export class MeasurementSummaryService {
  constructor(private afs: AngularFirestore) {}

  getChartSeries(
    from: Date,
    to: Date,
    period: number,
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
