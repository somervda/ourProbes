import {
  MeasurementSummary,
  measurementSummaryAvailableTypes
} from "./../models/measurementSummary.model";
import { MeasurementService } from "./../services/measurement.service";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { MeasurementSummaryService } from "../services/measurement-summary.service";
import { Observable, Subscription } from "rxjs";
import { Measurement } from "../models/measurement.model";

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
  availableMaxRows = [10, 50, 100, 200, 1000, 5000];
  selectedMaxRows = 10;
  availableMTypes = measurementSummaryAvailableTypes;
  selectedMType = "";
  selectedRangeHours = this.availableRanges[0].hours;
  fileUrl;
  downLoadReady = false;
  extractName = "data.json";
  showSpinner = false;
  selectedType = 1;
  measurementSummaryData$: Observable<MeasurementSummary[]>;
  measurementSummaryData$$: Subscription;
  measurementData$: Observable<Measurement[]>;
  measurementData$$: Subscription;
  extractRows = 0;

  constructor(
    private sanitizer: DomSanitizer,
    private mss: MeasurementSummaryService,
    private ms: MeasurementService
  ) {}

  ngOnInit(): void {
    this.startDate.setHours(0, 0, 0, 0);
    this.availableMTypes.unshift({ name: "All", value: "" });
    this.availableMTypes.push({ name: "Device Startup", value: "startup" });
  }

  onExtract() {
    this.showSpinner = true;
    console.log(
      "picker:",
      this.startDate,
      this.selectedRangeHours,
      this.selectedType
    );

    const msRange = this.selectedRangeHours * 3600 * 1000;
    const toDate = new Date(this.startDate.getTime() + msRange);

    if (this.selectedType == 0) {
      // ******* Process basic  measurement extract ******
      this.measurementData$ = this.ms.getMeasurementData(
        this.startDate,
        toDate,
        this.selectedMType,
        this.selectedMaxRows
      );

      if (this.measurementData$$) this.measurementData$$.unsubscribe();
      this.measurementData$$ = this.measurementData$.subscribe(d => {
        const bigMd = d.map(md => ({
          ...md,
          localeDate: md.UMT.toDate()
            .toLocaleString()
            .replace(",", ""),
          umtDate: md.UMT.toDate()
            .toLocaleString("en-US", { timeZone: "Etc/UTC" })
            .replace(",", ""),
          umtHour: md.UMT.toDate().getUTCHours(),
          umtMinute: md.UMT.toDate().getUTCMinutes()
        }));
        this.extractRows = bigMd.length;
        this.createBlob(this.toCsv(bigMd));
      });
    } else {
      // ******* Process measurement summary extract ******
      this.measurementSummaryData$ = this.mss.getMeasurementSummaryData(
        this.startDate,
        toDate,
        this.selectedType,
        this.selectedMType,
        this.selectedMaxRows
      );

      if (this.measurementSummaryData$$)
        this.measurementSummaryData$$.unsubscribe();
      this.measurementSummaryData$$ = this.measurementSummaryData$.subscribe(
        d => {
          // Date formats were fiddly so I added some extra fields
          // to the extract that are more excel and power BI friendly
          // I also added a umtHour and umtMinute field because Power BI
          // does not do hierarchy actions on date/time fields as a whole
          const bigMsd = d.map(msd => ({
            ...msd,
            localeDate: msd.umt
              .toDate()
              .toLocaleString()
              .replace(",", ""),
            umtDate: msd.umt
              .toDate()
              .toLocaleString("en-US", { timeZone: "Etc/UTC" })
              .replace(",", ""),
            umtHour: msd.umt.toDate().getUTCHours()
          }));
          this.extractRows = bigMsd.length;
          this.createBlob(this.toCsv(bigMsd));
        }
      );
    }
  }

  createBlob(extractData: string) {
    // const configData = JSON.stringify(this.availableRanges);
    console.log("createBlob:", extractData);
    const extractBlob = new Blob([extractData], {
      type: "application/csv"
    });

    this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      window.URL.createObjectURL(extractBlob)
    );
    this.extractName = "ourProbes-" + new Date().toISOString() + ".csv";
    this.downLoadReady = true;
    this.showSpinner = false;
  }

  toCsv(rows: object[]) {
    if (!rows || !rows.length) {
      return;
    }
    const separator = ",";
    const keys = Object.keys(rows[0]);
    const csvContent =
      keys.join(separator) +
      "\n" +
      rows
        .map(row => {
          return keys
            .map(k => {
              let cell = row[k] === null || row[k] === undefined ? "" : row[k];
              cell =
                cell instanceof Date
                  ? cell.toLocaleString()
                  : cell.toString().replace(/"/g, '""');
              if (cell.search(/("|,|\n)/g) >= 0) {
                cell = `"${cell}"`;
              }
              return cell;
            })
            .join(separator);
        })
        .join("\n");
    return csvContent;
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
    this.selectedType = parseInt(event.srcElement.value);
    this.downLoadReady = false;
  }

  onMTypeChange(event) {
    console.log("onMTypeChange:", event, event.srcElement.value);
    this.selectedMType = event.srcElement.value;
    this.downLoadReady = false;
  }

  onMaxRowsChange(event) {
    console.log("onMaxRowsChange:", event);
    this.selectedMaxRows = parseInt(event.srcElement.value);
    this.downLoadReady = false;
  }

  ngOnDestroy() {
    if (this.measurementSummaryData$$)
      this.measurementSummaryData$$.unsubscribe();
    if (this.measurementData$$) this.measurementData$$.unsubscribe();
  }
}
