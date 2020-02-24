import { Component, OnInit, NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { NgxChartsModule } from "@swimlane/ngx-charts";
import { Observable, Subscription } from "rxjs";
import { AngularFirestore } from "@angular/fire/firestore";
import { MeasurementSummaryService } from "../services/measurement-summary.service";

@Component({
  selector: "app-datrends",
  templateUrl: "./datrends.component.html",
  styleUrls: ["./datrends.component.scss"]
})
export class DatrendsComponent implements OnInit {
  view: any[] = [700, 300];
  chartData$: Observable<any>;
  chartData$$: Subscription;
  chartData: [];
  showChart: boolean = false;

  // options
  legend: boolean = true;
  showLabels: boolean = true;
  animations: boolean = true;
  xAxis: boolean = true;
  yAxis: boolean = true;
  showYAxisLabel: boolean = true;
  showXAxisLabel: boolean = true;
  xAxisLabel: string = "Time";
  yAxisLabel: string = "bps";
  timeline: boolean = false;

  colorScheme = {
    domain: ["#5AA454", "#E44D25", "#CFC0BB", "#7aa3e5", "#a8385d", "#aae3f5"]
  };

  constructor(
    private afs: AngularFirestore,
    private mss: MeasurementSummaryService
  ) {}

  ngOnInit(): void {
    const to = new Date();
    const from = new Date(to.getTime() - 1000 * 40000);
    this.chartData$ = this.mss.getChartSeries(
      from,
      to,
      1,
      "D0002",
      "mF4wmQV6oX58nV5WhYAM",
      "bps",
      ["mean", "p50", "p25", "p75"]
    );

    this.chartData$$ = this.chartData$.subscribe(s => {
      console.log("chartData$:", s);
      this.chartData = s;
      this.showChart = true;
    });
  }

  onSelect(event) {
    console.log(event);
  }

  ngOnDestroy() {
    if (this.chartData$$) this.chartData$$.unsubscribe();
  }
}
