import { Component, OnInit, OnDestroy, Input } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { DeviceService } from "../services/device.service";
import { Subscription } from "rxjs";
import { environment } from "src/environments/environment";
import { DeviceType } from "../models/device.model";

@Component({
  selector: "app-deviceconfig",
  templateUrl: "./deviceconfig.component.html",
  styleUrls: ["./deviceconfig.component.scss"]
})
export class DeviceconfigComponent implements OnInit, OnDestroy {
  @Input() id: string;

  fileUrl;

  device_config = {
    led_pin: 33,
    useWiFi: false
  };

  wifi_config = {
    ssid: "",
    password: ""
  };

  google_cloud_config = {
    project_id: "",
    cloud_region: "",
    registry_id: "",
    device_id: "",
    mqtt_bridge_hostname: "",
    mqtt_bridge_port: 8883
  };

  jwt_config = {
    algorithm: "RS256",
    token_ttl: 43200,
    private_key: "ReplaceMePKT"
  };
  deviceSubscription$$: Subscription;
  DeviceType = DeviceType;

  constructor(
    private sanitizer: DomSanitizer,
    private deviceService: DeviceService
  ) {}

  ngOnInit() {
    // console.log("id:", this.id);
    this.google_cloud_config.cloud_region =
      environment.google_cloud_config.cloud_region;
    this.google_cloud_config.mqtt_bridge_hostname =
      environment.google_cloud_config.mqtt_bridge_hostname;
    this.google_cloud_config.mqtt_bridge_port =
      environment.google_cloud_config.mqtt_bridge_port;
    this.google_cloud_config.project_id =
      environment.google_cloud_config.project_id;
    this.google_cloud_config.registry_id =
      environment.google_cloud_config.registry_id;
    this.google_cloud_config.device_id = this.id;

    this.deviceSubscription$$ = this.deviceService
      .findById(this.id)
      .subscribe(device => {
        if (device.type === DeviceType.esp32GatewayOlimex) {
          this.device_config.led_pin = 33;
          this.device_config.useWiFi = false;
        }
        if (device.type === DeviceType.esp32HiLetGo) {
          this.device_config.led_pin = 2;
          this.device_config.useWiFi = true;
        }
        // console.log("deviceSubscription: ", device);
        // Javascript does not support tuples like python so need to manually format the private key tuple
        // Also need to change case for true and false values
        const ReplaceMePKT = "(" + device.privateKeyTuple + ")";
        const configData =
          "device_config = " +
          JSON.stringify(this.device_config)
            .replace("false", "False")
            .replace("true", "True")
            .replace(/,/g, ",\r\n")
            .replace("}", "\r\n}") +
          "\r\n\r\n" +
          "wifi_config = " +
          JSON.stringify(this.wifi_config)
            .replace(/,/g, ",\r\n")
            .replace("}", "\r\n}") +
          "\r\n\r\n" +
          "google_cloud_config = " +
          JSON.stringify(this.google_cloud_config)
            .replace(/,/g, ",\r\n")
            .replace("}", "\r\n}") +
          "\r\n\r\n" +
          "jwt_config = " +
          JSON.stringify(this.jwt_config)
            .replace(/,/g, ",\r\n")
            .replace("}", "\r\n}")
            .replace('"ReplaceMePKT"', ReplaceMePKT);

        // console.log("configData:", configData);

        const configBlob = new Blob([configData], {
          type: "application/octet-stream"
        });

        this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
          window.URL.createObjectURL(configBlob)
        );
      });
  }

  ngOnDestroy() {
    if (this.deviceSubscription$$) this.deviceSubscription$$.unsubscribe();
  }
}
