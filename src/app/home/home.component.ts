import { Component, OnInit } from "@angular/core";
import { Observable } from "rxjs";
import { Device } from "../models/device.model";
import { DeviceService } from "../services/device.service";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"]
})
export class HomeComponent implements OnInit {
  latitude: number;
  longitude: number;
  zoom: number;
  devices$: Observable<Device[]>;
  constructor(private deviceservice: DeviceService) {}

  ngOnInit() {
    this.devices$ = this.deviceservice.findDevices(100);
    this.setCurrentLocation();
  }

  // Get Current Location Coordinates
  private setCurrentLocation() {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(position => {
        this.latitude = position.coords.latitude;
        this.longitude = position.coords.longitude;
        this.zoom = 10;
      });
    }
  }
}
