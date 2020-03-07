import { Component, OnInit } from "@angular/core";

@Component({
  selector: "app-dataanalysis",
  templateUrl: "./dataanalysis.component.html",
  styleUrls: ["./dataanalysis.component.scss"]
})
export class DataanalysisComponent implements OnInit {
  tabIndex: number;
  DeviceId: string;
  ProbeId: string;
  Type: string;
  constructor() {}

  ngOnInit(): void {}

  trendMessage(trendSettings) {
    console.log("tabMessage:", trendSettings);
    this.tabIndex = 1;
    this.DeviceId = trendSettings.DeviceId;
    this.ProbeId = trendSettings.ProbeId;
    this.Type = trendSettings.Type;
  }

  tabIndexChange(data) {
    console.log("TabIndexChange:", data);
    this.tabIndex = data;
    if (data != 1) {
      this.DeviceId = undefined;
      this.ProbeId = undefined;
      this.Type = undefined;
    }
  }
}
