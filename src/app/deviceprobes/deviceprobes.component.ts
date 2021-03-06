import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnDestroy
} from "@angular/core";
import { Observable, Subscription } from "rxjs";
import { Probe, ProbeType } from "../models/probe.model";
import { ProbeService } from "../services/probe.service";
import { ProbeListItem } from "../models/device.model";

@Component({
  selector: "app-deviceprobes",
  templateUrl: "./deviceprobes.component.html",
  styleUrls: ["./deviceprobes.component.scss"]
})
export class DeviceprobesComponent implements OnInit, OnDestroy {
  // Takes a probeList and shows check marks for matching ID
  @Input() probeList: ProbeListItem[];
  // Returns a probeList based on user clicking on checkboxes
  @Output() probeListChange = new EventEmitter();
  probes$: Observable<Probe[]>;
  probes$$: Subscription;
  probes: Probe[];
  displayedColumns: string[] = ["name", "type", "target", "id"];
  ProbeType = ProbeType;
  showDelay = false;

  constructor(private probeservice: ProbeService) {}

  ngOnInit() {
    this.probes$ = this.probeservice.findProbes(100);
    this.probes$$ = this.probes$.subscribe(Probes => (this.probes = Probes));
  }

  inProbeList(id: string) {
    // returns true/false depending if id is in the probeList
    if (this.probeList) {
      const foundItem = this.probeList.find(
        probeListItem => probeListItem.id == id
      );
      if (foundItem) {
        // console.log("inProbeList yes", id);
        return true;
      } else {
        // console.log("inProbeList no", id);
        return false;
      }
    } else {
      return false;
    }
  }

  async onChange($event) {
    // console.log("changeEvent:", $event.checked, $event.source.id);
    if ($event.checked) {
      // add probe to the probeList
      const probe = this.probes.find(
        probeItem => probeItem.id == $event.source.id
      );
      if (probe) {
        // console.log("Probe to add to probe list:", probe);
        let probeListItem: ProbeListItem = {
          id: probe.id,
          name: probe.name,
          target: probe.target,
          type: probe.type
        };
        if (probe.type === ProbeType.webPage) {
          probeListItem.match = probe.match;
        }
        this.probeList.push(probeListItem);
        console.log("probeList:", this.probeList);
      }
    } else {
      // unchecked - remove probeListItem
      // console.log("$event.source.id:", $event.source.id);
      const probeItemIndex = this.probeList.findIndex(
        p => p.id == $event.source.id
      );
      if (probeItemIndex != -1) {
        // console.log("probeItemIndex", probeItemIndex);
        this.probeList.splice(probeItemIndex, 1);
        // console.log("probeList:", this.probeList);
      }
    }
    this.probeListChange.emit(this.probeList);
    // Only one update per second is allowed on the backend for a device config so
    // have added an artificial delay on the client on updates. Seems
    // have to be 3 second delay to work properly
    this.showDelay = true;
    await this.sleep(3000);
    this.showDelay = false;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  ngOnDestroy() {
    if (this.probes$$) this.probes$$.unsubscribe();
  }
}
