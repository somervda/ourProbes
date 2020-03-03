import { Injectable } from "@angular/core";
import { AngularFirestore, DocumentReference } from "@angular/fire/firestore";
import { Observable } from "rxjs";
import { map, first, take } from "rxjs/operators";
import { convertSnaps, dbFieldUpdate, convertSnap } from "./db-utils";
import { Probe, ProbeStatus } from "../models/probe.model";

@Injectable({
  providedIn: "root"
})
export class ProbeService {
  constructor(private afs: AngularFirestore) {}

  findById(id: string): Observable<Probe> {
    return this.afs
      .doc("/probes/" + id)
      .snapshotChanges()
      .pipe(
        map(snap => {
          return convertSnap<Probe>(snap);
        })
      );
  }

  findProbes(pageSize): Observable<Probe[]> {
    // console.log( "findProbes",  sortField, sortOrder  ,pageSize  );
    // Only get active probes
    return this.afs
      .collection("probes", ref => ref.where("status", "==", 1).limit(pageSize))
      .snapshotChanges()
      .pipe(
        map(snaps => {
          // console.log("findProbes", convertSnaps<Probe>(snaps));
          return convertSnaps<Probe>(snaps);
        }),
        // Not sure why this is needed but 2 sets of results are emitted with this query
        take(2)
      );
  }

  fieldUpdate(docId: string, fieldName: string, newValue: any) {
    if (docId && fieldName) {
      const updateObject = {};
      dbFieldUpdate("/probes/" + docId, fieldName, newValue, this.afs);
    }
  }

  create(probe: Probe): Promise<DocumentReference> {
    return this.afs.collection("probes").add(probe);
  }

  delete(id: string) {
    // Probes can only be logically deleted
    dbFieldUpdate("/probes/" + id, "status", ProbeStatus.deleted, this.afs);
  }
}
