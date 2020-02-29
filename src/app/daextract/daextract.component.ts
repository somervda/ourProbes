import { Component, OnInit } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";

@Component({
  selector: "app-daextract",
  templateUrl: "./daextract.component.html",
  styleUrls: ["./daextract.component.scss"]
})
export class DaextractComponent implements OnInit {
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

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit(): void {}

  onExtract() {
    console.log("picker:", this.startDate, this.selectedRangeHours);

    const configData = "hi from davis";
    const configBlob = new Blob([configData], {
      type: "application/octet-stream"
    });

    this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      window.URL.createObjectURL(configBlob)
    );
    let link = document.createElement("a");
    link.download = "test.txt";
    link.href = this.fileUrl;
    console.log("button:", this.fileUrl);
    link.click();
  }

  onDateInput(event) {
    console.log("onDateInput:", event);
    this.startDate = event.value;
  }

  onRangeChange(event) {
    console.log("onRangeChange:", event);
    this.selectedRangeHours = event.srcElement.value;
  }
}
