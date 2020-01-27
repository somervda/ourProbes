import { Component, OnInit, Input } from "@angular/core";

@Component({
  selector: "app-subheading",
  templateUrl: "./subheading.component.html",
  styleUrls: ["./subheading.component.scss"]
})
export class SubheadingComponent implements OnInit {
  @Input() title: string;
  @Input() returnRoute: string;
  @Input() returnTitle: string;

  constructor() {}

  ngOnInit() {
    console.log("returnRoute: ", this.returnRoute);
  }
}
