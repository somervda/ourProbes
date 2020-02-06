import { Component, OnInit, OnDestroy, NgZone } from "@angular/core";
import { Observable, Subscription } from "rxjs";
import { Device } from "../models/device.model";
import { DeviceService } from "../services/device.service";
import { AuthService } from "../services/auth.service";
import { AngularFirestore } from "@angular/fire/firestore";
import { User } from "../models/user.model";
import { Router } from "@angular/router";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"]
})
export class HomeComponent implements OnInit, OnDestroy {
  latitude: number = 0;
  longitude: number = 0;
  zoom: number = 10;
  devices$: Observable<Device[]>;
  user$: Observable<User>;
  user$$: Subscription;

  constructor(
    private deviceservice: DeviceService,
    private auth: AuthService,
    private afs: AngularFirestore,
    private ngZone: NgZone,
    private router: Router
  ) {}

  ngOnInit() {
    this.user$ = this.afs
      .doc<User>(`users/${this.auth.currentUser.uid}`)
      .valueChanges();
    this.user$$ = this.user$.subscribe(user => {
      this.latitude = user.latitude;
      this.longitude = user.longitude;
      if (!user.isActivated) {
        console.log("activated", user.isActivated);
        this.ngZone.run(() => this.router.navigateByUrl("notActivated"));
      }
      console.log("Lat/Lng update ", user, " ", new Date().getTime());
    });
    this.devices$ = this.deviceservice.findDevices(100);
    console.log("lat/long", this.latitude, this.longitude);
  }

  ngOnDestroy() {
    if (this.user$$) this.user$$.unsubscribe();
  }
}
