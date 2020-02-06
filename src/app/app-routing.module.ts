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
import { AdministrationComponent } from "./administration/administration.component";
import { IsAdminGuard } from "./guards/isAdmin.guard";
import { IsActivatedGuard } from "./guards/isActivated.guard";
import { IsLoggedInGuard } from "./guards/isLoggedIn.guard";
import { NotauthorizedComponent } from "./notauthorized/notauthorized.component";
import { DeviceComponent } from "./device/device.component";
import { DeviceResolver } from "./services/device-resolver";
import { ProbesComponent } from "./probes/probes.component";
import { ProbeComponent } from "./probe/probe.component";
import { ProbeResolver } from "./services/probe-resolver";
import { NotactivatedComponent } from "./notactivated/notactivated.component";

const routes: Routes = [
  { path: "", component: HomeComponent, canActivate: [IsLoggedInGuard] },
  { path: "about", component: AboutComponent },
  { path: "login", component: LoginComponent },
  { path: "notAuthorized", component: NotauthorizedComponent },
  { path: "notActivated", component: NotactivatedComponent },
  {
    path: "administration",
    component: AdministrationComponent,
    canActivate: [IsAdminGuard]
  },
  { path: "users", component: UsersComponent, canActivate: [IsAdminGuard] },
  {
    path: "devices",
    component: DevicesComponent,
    canActivate: [IsActivatedGuard]
  },
  {
    path: "device/create",
    component: DeviceComponent,
    canActivate: [IsActivatedGuard]
  },
  {
    path: "device/delete/:id",
    component: DeviceComponent,
    resolve: { device: DeviceResolver },
    canActivate: [IsActivatedGuard]
  },
  {
    path: "device/:id",
    component: DeviceComponent,
    resolve: { device: DeviceResolver },
    canActivate: [IsActivatedGuard]
  },
  {
    path: "probes",
    component: ProbesComponent,
    canActivate: [IsActivatedGuard]
  },
  {
    path: "probe/create",
    component: ProbeComponent,
    canActivate: [IsActivatedGuard]
  },
  {
    path: "probe/delete/:id",
    component: ProbeComponent,
    resolve: { probe: ProbeResolver },
    canActivate: [IsActivatedGuard]
  },
  {
    path: "probe/:id",
    component: ProbeComponent,
    resolve: { probe: ProbeResolver },
    canActivate: [IsActivatedGuard]
  },
  {
    path: "user/:uid",
    component: UserComponent,
    resolve: { user: UserResolver },
    canActivate: [IsActivatedGuard],
    runGuardsAndResolvers: "always"
  },
  { path: "notfound", component: NotfoundComponent },
  { path: "**", component: NotfoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { onSameUrlNavigation: "reload" })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
