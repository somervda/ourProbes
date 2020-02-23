import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentReference } from "@angular/fire/firestore";
import { Observable } from "rxjs";
import { map, first, take } from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class MeasurementSummaryService {

  constructor(private afs: AngularFirestore) { }

  getChartSeries(from: Date, to: Date, period: number, deviceId: string, probeId: string, type: string): Observable<any> {
  return this.afs
  .collection("measurementSummaries", ref =>
    ref
      .where("umt", ">=", from)
      .where("umt", "<=", to)
      .where("period", "==", 1)
      .where("deviceId", "==", "D0002")
      .where("probeId", "==", "zHc8RqIk452QxMLo0JKJ")
      .where("type", "==", "bps")
  )
  .snapshotChanges()
  .pipe(
    map(snaps => {
      // return snaps.map(x => x.payload.doc.data());
      let graphData = [];
      // Get mean series
      const meanSeries = snaps.reduce(
        (a, s) =>
          a.concat({
            umt: s.payload.doc.data()["umt"].toDate(),
            value: Math.round(s.payload.doc.data()["mean"])
          }),
        []
      );
      graphData.push({ name: "mean", series: meanSeries });

      // get p50 series
      const p50Series = snaps.reduce(
        (a, s) =>
          a.concat({
            umt: s.payload.doc.data()["umt"].toDate(),
            value: Math.round(s.payload.doc.data()["p50"])
          }),
        []
      );
      graphData.push({ name: "p50", series: p50Series });

      return graphData;
    })
  );
}
