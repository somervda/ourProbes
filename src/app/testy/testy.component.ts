import { Component, OnInit, OnDestroy } from "@angular/core";
import { AngularFirestore } from "@angular/fire/firestore";
import { Subscription, Observable } from "rxjs";
import { map } from "rxjs/operators";

@Component({
  selector: "app-testy",
  templateUrl: "./testy.component.html",
  styleUrls: ["./testy.component.scss"]
})
export class TestyComponent implements OnInit, OnDestroy {
  mes$$: Subscription;
  mesO$: Observable<any>;
  mesO$$: Subscription;
  constructor(private afs: AngularFirestore) {}

  ngOnInit(): void {
    const to = new Date();
    const from = new Date(to.getTime() - 1000 * 20000);
    console.log("get data", from, to);
    this.mes$$ = this.afs
      .collection("measurementSummaries", ref =>
        ref
          .where("umt", ">=", from)
          .where("umt", "<=", to)
          .where("period", "==", 1)
          .where("deviceId", "==", "D0002")
          .where("probeId", "==", "zHc8RqIk452QxMLo0JKJ")
          .where("type", "==", "bps")
      )
      .get()
      .subscribe(snaps => {
        // Create required series from the measurementSummaries
        const meanSeries = snaps.docs.reduce(
          (a, s) =>
            a.concat({
              umt: s.data().umt.toDate(),
              value: Math.round(s.data().mean)
            }),
          []
        );
        const p50Series = snaps.docs.reduce(
          (a, s) =>
            a.concat({
              umt: s.data().umt.toDate(),
              value: Math.round(s.data().p50)
            }),
          []
        );
        snaps.docs.map(m => console.log("Data:", m.data()));
        console.log("meanSeries:", meanSeries);
        console.log("p50Series:", p50Series);
        // Build the multi series object required by the ngc-chart
        let graphData = [];
        graphData.push({ name: "mean", series: meanSeries });
        graphData.push({ name: "p50", series: p50Series });
        console.log("graphData:", graphData);
      });

    this.mesO$ = this.afs
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
    this.mesO$$ = this.mesO$.subscribe(s => console.log("mesO$:", s));
  }

  ngOnDestroy() {
    if (this.mes$$) this.mes$$.unsubscribe();
    if (this.mesO$$) this.mesO$$.unsubscribe();
  }
}
