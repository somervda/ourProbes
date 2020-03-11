import { Injectable } from "@angular/core";
import { AngularFirestore } from "@angular/fire/firestore";
import { map, take } from "rxjs/operators";
import { Observable } from "rxjs";
import { YouTubeVideo } from "../models/youTubeVideo.model";
import { convertSnaps } from "./db-utils";

@Injectable({
  providedIn: "root"
})
export class YoutubevideoService {
  constructor(private afs: AngularFirestore) {}

  findYouTubeVideos(
    collection = "",
    sortAsc: boolean,
    pageSize
  ): Observable<YouTubeVideo[]> {
    // console.log("findYouTubeVideos", collection,  pageSize);
    return this.afs
      .collection("YouTubeVideos", ref =>
        ref
          .where("collection", "==", collection)
          .orderBy("sequence", sortAsc ? "asc" : "desc")
          .limit(pageSize)
      )
      .snapshotChanges()
      .pipe(
        map(snaps => {
          return convertSnaps<YouTubeVideo>(snaps);
        })
      );
  }
}
