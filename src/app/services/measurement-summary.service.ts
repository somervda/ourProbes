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
        map(
          snaps => {
            // return snaps.map(x => x.payload.doc.data());
            // let graphData = [];
            // Get mean series
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
          }
          // const meanSeries = snaps.reduce(
          //   (a, s) =>
          //     a.concat({
          //       umt: s.payload.doc.data()["umt"].toDate(),
          //       value: Math.round(s.payload.doc.data()["mean"])
          //     }),
          //   []
          // );
          // graphData.push({ name: "mean", series: meanSeries });

          // // get p50 series
          // const p50Series = snaps.reduce(
          //   (a, s) =>
          //     a.concat({
          //       umt: s.payload.doc.data()["umt"].toDate(),
          //       value: Math.round(s.payload.doc.data()["p50"])
          //     }),
          //   []
          // );
          // graphData.push({ name: "p50", series: p50Series });

          // return graphData;
        )
      );
  }
}
