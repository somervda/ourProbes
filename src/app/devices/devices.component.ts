import { DeviceService } from "./../services/device.service";
import { Component, OnInit } from "@angular/core";
import { Observable, Subscription } from "rxjs";
import { Device } from "../models/device.model";

@Component({
  selector: "app-devices",
  templateUrl: "./devices.component.html",
  styleUrls: ["./devices.component.scss"]
})
export class DevicesComponent implements OnInit {
  devices$: Observable<Device[]>;
  displayedColumns: string[] = ["id", "description", "communication"];

  constructor(private deviceservice: DeviceService) {}
  ngOnInit() {
    // get a observable of all devices
    this.devices$ = this.deviceservice.findDevices(100);
  }
}
