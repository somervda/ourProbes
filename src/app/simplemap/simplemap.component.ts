import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";

@Component({
  selector: "app-simplemap",
  templateUrl: "./simplemap.component.html",
  styleUrls: ["./simplemap.component.scss"]
})
export class SimplemapComponent implements OnInit {
  @Input() latitude: number;
  @Input() longitude: number;
  @Output() mapClick = new EventEmitter();
  zoom: number;

  constructor() {}

  ngOnInit() {
    this.zoom = 10;
    if (this.latitude == 0 && this.longitude == 0) {
      this.zoom = 2;
    }
  }

  onChooseLocation(event) {
    console.log("event", event);
    this.latitude = event.coords.lat;
    this.longitude = event.coords.lng;
    this.zoom = 10;

    console.log("lat/lng", this.latitude, this.longitude);
    this.mapClick.emit({ latitude: this.latitude, longitude: this.longitude });
  }
}
