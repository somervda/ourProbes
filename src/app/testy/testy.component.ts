import { Component, OnInit, OnDestroy } from "@angular/core";
import { AngularFirestore } from "@angular/fire/firestore";
import { Subscription } from "rxjs";

@Component({
  selector: "app-testy",
  templateUrl: "./testy.component.html",
  styleUrls: ["./testy.component.scss"]
})
export class TestyComponent implements OnInit, OnDestroy {
  mes$$: Subscription;
  constructor(private afs: AngularFirestore) {}

  ngOnInit(): void {
    const to = new Date();
    const from = new Date(to.getTime() - 1000 * 3600);
    this.mes$$ = this.afs
      .collection("measurements", ref =>
        ref
          .where("UMT", ">=", from)
          .where("UMT", "<=", to)
          .orderBy("deviceId")
          .limit(10)
      )
      .get()
      .subscribe(snaps => snaps.docs.map(m => console.log(m.data())));
  }

  ngOnDestroy() {
    if (this.mes$$) this.mes$$.unsubscribe();
  }
}
