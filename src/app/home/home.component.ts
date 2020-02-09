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
  ) {
    // this.router.routeReuseStrategy.shouldReuseRoute = function() {
    //   return false;
    // };
  }

  ngOnInit() {
    this.devices$ = this.deviceservice.findDevices(100);
    if (this.auth.currentUser) {
      const uid = this.auth.currentUser.uid;
      this.user$ = this.afs
        .doc<User>(`users/${this.auth.currentUser.uid}`)
        .valueChanges();
      this.user$$ = this.user$.subscribe(user => {
        if ((user.latitude || user.latitude == 0) && !user.isActivated) {
          this.ngZone.run(() => this.router.navigateByUrl("notActivated"));
        }
        this.latitude = user.latitude;
        this.longitude = user.longitude;
        if (this.latitude == 0 && this.longitude == 0) {
          this.zoom = 2;
        }
      });
    } else {
      // Happens on refresh and user info not ready - show world map
      this.zoom = 2;
    }
  }

  ngOnDestroy() {
    if (this.user$$) this.user$$.unsubscribe();
  }
}
