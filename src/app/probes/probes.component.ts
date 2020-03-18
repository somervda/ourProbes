import { Component, OnInit } from "@angular/core";
import { Probe, ProbeType } from "../models/probe.model";
import { ProbeService } from "../services/probe.service";
import { Observable } from "rxjs";

@Component({
  selector: "app-probes",
  templateUrl: "./probes.component.html",
  styleUrls: ["./probes.component.scss"]
})
export class ProbesComponent implements OnInit {
  probes$: Observable<Probe[]>;
  ProbeType = ProbeType;
  displayedColumns: string[] = ["name", "type", "target", "id"];

  constructor(private probeservice: ProbeService) {}
  ngOnInit() {
    // get a observable of all probes
    this.probes$ = this.probeservice.findProbes(100);
  }
}
