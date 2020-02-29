import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { NgxChartsModule } from "@swimlane/ngx-charts";

import { AngularFireModule } from "@angular/fire";
import { AngularFirePerformanceModule } from "@angular/fire/performance";

import { environment } from "../environments/environment";
import { AngularFireAuthModule } from "@angular/fire/auth";
import { AngularFirestoreModule } from "@angular/fire/firestore";
import { AgmCoreModule } from "@agm/core";
// import { AngularFireStorageModule } from "@angular/fire/storage";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatChipsModule } from "@angular/material/chips";
import { MatDividerModule } from "@angular/material/divider";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatRadioModule } from "@angular/material/radio";
// import { MatGridListModule } from "@angular/material/grid-list";
import { MatInputModule } from "@angular/material/input";
import { MatListModule } from "@angular/material/list";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelectModule } from "@angular/material/select";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core";

import { MatSidenavModule } from "@angular/material/sidenav";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { MatSortModule } from "@angular/material/sort";
import { MatTableModule } from "@angular/material/table";
import { MatTabsModule } from "@angular/material/tabs";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatTooltipModule } from "@angular/material/tooltip";

import { HomeComponent } from "./home/home.component";
import { NotfoundComponent } from "./notfound/notfound.component";
import { AboutComponent } from "./about/about.component";
import { LoginComponent } from "./login/login.component";
import { ServiceWorkerModule } from "@angular/service-worker";
import { AdministrationComponent } from "./administration/administration.component";
import { UsersComponent } from "./users/users.component";
import { UserComponent } from "./user/user.component";
import { NotauthorizedComponent } from "./notauthorized/notauthorized.component";
import { DevicesComponent } from "./devices/devices.component";
import { SubheadingComponent } from "./subheading/subheading.component";
import { DeviceComponent } from "./device/device.component";
import { ProbesComponent } from "./probes/probes.component";
import { ProbeComponent } from "./probe/probe.component";
import { DevicelistComponent } from "./devicelist/devicelist.component";
import { SimplemapComponent } from "./simplemap/simplemap.component";
import { NotactivatedComponent } from "./notactivated/notactivated.component";
import { DeviceprobesComponent } from "./deviceprobes/deviceprobes.component";
import { DeviceconfigComponent } from "./deviceconfig/deviceconfig.component";
import { DataanalysisComponent } from "./dataanalysis/dataanalysis.component";
import { DatrendsComponent } from "./datrends/datrends.component";
import { TestyComponent } from "./testy/testy.component";
import { DaoverComponent } from "./daover/daover.component";
import { DaextractComponent } from "./daextract/daextract.component";

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    NotfoundComponent,
    AboutComponent,
    LoginComponent,
    AdministrationComponent,
    UsersComponent,
    UserComponent,
    NotauthorizedComponent,
    DevicesComponent,
    SubheadingComponent,
    DeviceComponent,
    ProbesComponent,
    ProbeComponent,
    DevicelistComponent,
    SimplemapComponent,
    NotactivatedComponent,
    DeviceprobesComponent,
    DeviceconfigComponent,
    DataanalysisComponent,
    DatrendsComponent,
    TestyComponent,
    DaoverComponent,
    DaextractComponent
  ],
  imports: [
    BrowserModule,
    AgmCoreModule.forRoot({
      apiKey: "AIzaSyBTXGNP8fuSxj8aZTz7VbQ4LduAZ20Jd3o"
    }),
    BrowserAnimationsModule,
    NgxChartsModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSidenavModule,
    MatListModule,
    MatToolbarModule,
    MatChipsModule,
    MatTooltipModule,
    MatTableModule,
    MatSnackBarModule,
    MatDividerModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatRadioModule,
    // MatGridListModule,
    // MatMenuModule,
    // MatDividerModule,
    MatTabsModule,
    MatInputModule,
    MatFormFieldModule,
    // MatTableModule,
    // MatDialogModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    AppRoutingModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirePerformanceModule,
    AngularFireAuthModule,
    // Allow offline operations - useful when used in combination with PWA functionality
    AngularFirestoreModule,
    // AngularFirestoreModule.enablePersistence(),
    ServiceWorkerModule.register("ngsw-worker.js", {
      enabled: environment.production
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
