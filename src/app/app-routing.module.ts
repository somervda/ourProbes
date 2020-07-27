import { DevicesComponent } from "./devices/devices.component";
import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { HomeComponent } from "./home/home.component";
import { NotfoundComponent } from "./notfound/notfound.component";
import { AboutComponent } from "./about/about.component";
import { LoginComponent } from "./login/login.component";
import { UsersComponent } from "./users/users.component";
import { UserComponent } from "./user/user.component";
import { UserResolver } from "./services/user-resolver";
import { IsLoggedInGuard } from "./guards/isLoggedIn.guard";
import { NotauthorizedComponent } from "./notauthorized/notauthorized.component";
import { DeviceComponent } from "./device/device.component";
import { DeviceResolver } from "./services/device-resolver";
import { ProbesComponent } from "./probes/probes.component";
import { ProbeComponent } from "./probe/probe.component";
import { ProbeResolver } from "./services/probe-resolver";
import { NotactivatedComponent } from "./notactivated/notactivated.component";
import { TestyComponent } from "./testy/testy.component";
import { HelpComponent } from "./help/help.component";
import { permissionGuard } from "./guards/permission.guard";
import { DaoverComponent } from "./daover/daover.component";
import { DatrendsComponent } from "./datrends/datrends.component";
import { DaextractComponent } from "./daextract/daextract.component";

const routes: Routes = [
  { path: "testy", component: TestyComponent },
  { path: "", component: DaoverComponent, canActivate: [IsLoggedInGuard] },
  { path: "home", component: HomeComponent, canActivate: [IsLoggedInGuard] },
  { path: "about", component: AboutComponent },
  { path: "login", component: LoginComponent },
  { path: "help", component: HelpComponent },
  { path: "notAuthorized", component: NotauthorizedComponent },
  { path: "notActivated", component: NotactivatedComponent },
  {
    path: "users",
    component: UsersComponent,
    canActivate: [permissionGuard],
    data: { permissions: ["isAdmin"] },
  },
  {
    path: "devices",
    component: DevicesComponent,
    canActivate: [permissionGuard],
    data: { permissions: ["isAdmin", "isManager"] },
  },
  {
    path: "daover",
    component: DaoverComponent,
    canActivate: [permissionGuard],
    data: { permissions: ["isActivated"] },
  },
  {
    path: "datrends",
    component: DatrendsComponent,
    canActivate: [permissionGuard],
    data: { permissions: ["isActivated"] },
  },
  {
    path: "daextract",
    component: DaextractComponent,
    canActivate: [permissionGuard],
    data: { permissions: ["isActivated"] },
  },
  {
    path: "device/create",
    component: DeviceComponent,
    canActivate: [permissionGuard],
    data: { permissions: ["isAdmin", "isManager"] },
  },
  {
    path: "device/delete/:id",
    component: DeviceComponent,
    resolve: { device: DeviceResolver },
    canActivate: [permissionGuard],
    data: { permissions: ["isAdmin", "isManager"] },
  },
  {
    path: "device/:id",
    component: DeviceComponent,
    resolve: { device: DeviceResolver },
    canActivate: [permissionGuard],
    data: { permissions: ["isAdmin", "isManager"] },
  },
  {
    path: "probes",
    component: ProbesComponent,
    canActivate: [permissionGuard],
    data: { permissions: ["isAdmin", "isManager"] },
  },
  {
    path: "probe/create",
    component: ProbeComponent,
    canActivate: [permissionGuard],
    data: { permissions: ["isAdmin", "isManager"] },
  },
  {
    path: "probe/delete/:id",
    component: ProbeComponent,
    resolve: { probe: ProbeResolver },
    canActivate: [permissionGuard],
    data: { permissions: ["isAdmin", "isManager"] },
  },
  {
    path: "probe/:id",
    component: ProbeComponent,
    resolve: { probe: ProbeResolver },
    canActivate: [permissionGuard],
    data: { permissions: ["isAdmin", "isManager"] },
  },
  {
    path: "user/:uid",
    component: UserComponent,
    resolve: { user: UserResolver },
    canActivate: [permissionGuard],
    data: { permissions: ["isActivated"] },
    runGuardsAndResolvers: "always",
  },
  { path: "notfound", component: NotfoundComponent },
  { path: "**", component: NotfoundComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { onSameUrlNavigation: "reload" })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
