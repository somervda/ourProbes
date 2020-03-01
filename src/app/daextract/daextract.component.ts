import { Component, OnInit, OnDestroy } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { MeasurementSummaryService } from "../services/measurement-summary.service";
import { MeasurementSummary } from "../models/measurementSummary.model";
import { Observable, Subscription } from "rxjs";

@Component({
  selector: "app-daextract",
  templateUrl: "./daextract.component.html",
  styleUrls: ["./daextract.component.scss"]
})
export class DaextractComponent implements OnInit, OnDestroy {
  startDate = new Date();
  availableRanges = [
    { name: "4 hours", hours: 4 },
    { name: "12 hours", hours: 12 },
    { name: "24 hours", hours: 24 },
    { name: "7 Days", hours: 168 },
    { name: "14 Days", hours: 336 }
  ];
  selectedRangeHours = this.availableRanges[0].hours;
  fileUrl;
  downLoadReady = false;
  extractName = "data.json";
  showSpinner = false;
  selectedType = 1;
  measurementSummaryData$: Observable<MeasurementSummary[]>;
  measurementSummaryData$$: Subscription;

  constructor(
    private sanitizer: DomSanitizer,
    private mss: MeasurementSummaryService
  ) {}

  ngOnInit(): void {}

  onExtract() {
    this.showSpinner = true;
    console.log(
      "picker:",
      this.startDate,
      this.selectedRangeHours,
      this.selectedType
    );

    let extractData = "";

    if (this.selectedType == 0) {
    } else {
      const msRange = this.selectedRangeHours * 3600 * 1000;
      const toDate = new Date(this.startDate.getTime() + msRange);
      this.measurementSummaryData$ = this.mss.getMeasurementSummaryData(
        this.startDate,
        toDate,
        this.selectedType,
        200
      );
      this.measurementSummaryData$$ = this.measurementSummaryData$.subscribe(
        d => {
          const g = d.map(x => ({
            ...x,
            localeDate: x.umt.toDate().toLocaleString()
          }));
          this.createBlob(JSON.stringify(g));
        }
      );
    }
  }

  createBlob(extractData: string) {
    // const configData = JSON.stringify(this.availableRanges);
    console.log("createBlob:", extractData);
    const extractBlob = new Blob([extractData], {
      type: "application/json"
    });

    this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      window.URL.createObjectURL(extractBlob)
    );
    this.extractName = "ourProbes-" + new Date().toISOString() + ".json";
    this.downLoadReady = true;
    this.showSpinner = false;
  }

  onDateInput(event) {
    console.log("onDateInput:", event);
    this.startDate = event.value;
    this.downLoadReady = false;
  }

  onRangeChange(event) {
    console.log("onRangeChange:", event);
    this.selectedRangeHours = event.srcElement.value;
    this.downLoadReady = false;
  }

  onTypeChange(event) {
    console.log("onTypeChange:", event);
    this.selectedType = event.srcElement.value;
    this.downLoadReady = false;
  }

  ngOnDestroy() {
    if (this.measurementSummaryData$$)
      this.measurementSummaryData$$.unsubscribe();
  }
}
