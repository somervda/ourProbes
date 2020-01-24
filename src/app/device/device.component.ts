import { Component, OnInit } from "@angular/core";
import { Device } from "../models/device.model";

@Component({
  selector: "app-device",
  templateUrl: "./device.component.html",
  styleUrls: ["./device.component.scss"]
})
export class DeviceComponent implements OnInit {
  device: Device;
  crudAction: Crud;
  // Declare an instance of crud enum to use for checking crudAction value
  Crud = Crud;

  teamForm: FormGroup;
  teamSubscription$$: Subscription;

  constructor(
    private teamService: TeamService,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private ngZone: NgZone,
    private router: Router
  ) {}

  ngOnInit() {
    this.crudAction = Crud.Update;
    if (this.route.routeConfig.path == "team/delete/:id")
      this.crudAction = Crud.Delete;
    if (this.route.routeConfig.path == "team/create")
      this.crudAction = Crud.Create;

    // console.log("team onInit", this.crudAction);
    if (this.crudAction == Crud.Create) {
      this.team = { name: "", description: "" };
    } else {
      this.team = this.route.snapshot.data["team"];
      // Subscribe to team to keep getting live updates
      this.teamSubscription$$ = this.teamService
        .findById(this.team.id)
        .subscribe(team => {
          this.team = team;
          console.log("subscribed team", this.team);
          this.teamForm.patchValue(this.team);
        });
    }

    // Create form group and initalize with team values
    this.teamForm = this.fb.group({
      name: [
        this.team.name,
        [Validators.required, Validators.minLength(3), Validators.maxLength(30)]
      ],
      description: [
        this.team.description,
        [
          Validators.required,
          Validators.minLength(20),
          Validators.maxLength(500)
        ]
      ]
    });

    // Mark all fields as touched to trigger validation on initial entry to the fields
    if (this.crudAction != Crud.Create) {
      for (const field in this.teamForm.controls) {
        this.teamForm.get(field).markAsTouched();
      }
    }
  }

  onCreate() {
    for (const field in this.teamForm.controls) {
      this.team[field] = this.teamForm.get(field).value;
    }
    console.log("create team", this.team);
    this.teamService
      .createTeam(this.team)
      .then(docRef => {
        //console.log("Document written with ID: ", docRef.id);
        this.team.id = docRef.id;
        this.crudAction = Crud.Update;
        this.snackBar.open("Team '" + this.team.name + "' created.", "", {
          duration: 2000
        });
      })
      .catch(function(error) {
        console.error("Error adding document: ", error);
      });
    // console.log("create team", this.team);
  }

  onDelete() {
    console.log("delete", this.team.id);
    const teamName = this.team.name;

    this.teamService
      .deleteTeam(this.team.id)
      .then(() => {
        this.snackBar.open("Team '" + teamName + "' deleted!", "", {
          duration: 2000
        });
        this.ngZone.run(() => this.router.navigateByUrl("/teams"));
      })
      .catch(function(error) {
        console.error("Error deleting team: ", error);
      });
  }

  onFieldUpdate(fieldName: string, toType?: string) {
    if (
      this.teamForm.get(fieldName).valid &&
      this.team.id != "" &&
      this.crudAction != Crud.Delete
    ) {
      let newValue = this.teamForm.get(fieldName).value;
      // Do any type conversions before storing value
      if (toType && toType == "Timestamp")
        newValue = firestore.Timestamp.fromDate(
          this.teamForm.get(fieldName).value
        );
      this.teamService.fieldUpdate(this.team.id, fieldName, newValue);
    }
  }

  ngOnDestroy() {
    if (this.teamSubscription$$) this.teamSubscription$$.unsubscribe();
  }
}
