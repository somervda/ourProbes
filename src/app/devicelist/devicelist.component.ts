import { DeviceService } from "./../services/device.service";
import { Component, OnInit, Input } from "@angular/core";
import { Observable, Subscription } from "rxjs";
import { Device } from "../models/device.model";

@Component({
  selector: "app-devicelist",
  templateUrl: "./devicelist.component.html",
  styleUrls: ["./devicelist.component.scss"]
})
export class DevicelistComponent implements OnInit {
  @Input() showDelete: boolean = false;
  devices$: Observable<Device[]>;
  displayedColumns: string[] = ["id", "description"];

  constructor(private deviceservice: DeviceService) {}
  ngOnInit() {
    if (this.showDelete) {
      this.displayedColumns.push("communication");
    }
    // get a observable of all devices
    this.devices$ = this.deviceservice.findDevices(100);
  }
}
