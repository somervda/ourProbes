import { Component, OnInit, Input } from "@angular/core";
import { BreakpointObserver } from "@angular/cdk/layout";
import { YoutubevideoService } from "../services/youtubevideo.service";
import { YouTubeVideo } from "../models/youTubeVideo.model";
import { Observable, Subscription } from "rxjs";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { map } from "rxjs/operators";

@Component({
  selector: "youtube",
  templateUrl: "./youtube.component.html",
  styleUrls: ["./youtube.component.scss"]
})
export class YoutubeComponent implements OnInit {
  @Input() collection: string;
  @Input() isAsc: boolean = true;
  isMedium: boolean = false;
  youtubevideos$: Observable<any[]>;

  constructor(
    breakpointObserver: BreakpointObserver,
    private youtubevideoService: YoutubevideoService,
    public sanitizer: DomSanitizer
  ) {
    breakpointObserver.observe(["(max-width: 750px)"]).subscribe(result => {
      this.isMedium = result.matches;
    });
  }

  ngOnInit() {
    this.youtubevideos$ = this.youtubevideoService
      .findYouTubeVideos(this.collection, this.isAsc, 100)
      .pipe(
        map(youtubevideos => {
          // Create an expanded version of the YouTubeVideo[] array
          // and add a safeURL property to each item (need to de-type the YouTubeVideo[] array)
          let youtubevideosMap = <any[]>[...youtubevideos];
          youtubevideosMap.forEach(youtubevideoMap => {
            youtubevideoMap.safeURL = this.youtubeURL(
              youtubevideoMap.youtubeId
            );
            youtubevideoMap.safeImageURL = this.youtubeImageURL(
              youtubevideoMap.youtubeId
            );
            youtubevideoMap.clicked = false;
          });
          return youtubevideosMap;
        })
      );
  }

  youtubeURL(youtubeId: string): SafeResourceUrl {
    // allow the generated URL to be used in angular template
    // need to sanitize the URL to allow angular to present it
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      "https://www.youtube.com/embed/" + youtubeId + "?autoplay=1"
    );
  }

  youtubeImageURL(youtubeId: string): SafeResourceUrl {
    // allow the generated URL to be used in angular template
    // need to sanitize the URL to allow angular to present it
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      "https://img.youtube.com/vi/" + youtubeId + "/mqdefault.jpg"
    );
  }
}
