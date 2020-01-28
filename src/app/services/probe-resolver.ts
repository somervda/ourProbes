import { Injectable } from "@angular/core";
import {
  ActivatedRouteSnapshot,
  Resolve,
  RouterStateSnapshot
} from "@angular/router";
import { ProbeService } from "./probe.service";
import { Probe } from "../models/probe.model";
import { Observable } from "rxjs";
import { first } from "rxjs/operators";

@Injectable({
  providedIn: "root"
})
export class DeviceResolver implements Resolve<Probe> {
  constructor(private probeservice: ProbeService) {}

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<Probe> {
    const id = route.paramMap.get("id");
    console.log("probe id", id);
    return this.probeservice.findById(id).pipe(first());
  }
}
