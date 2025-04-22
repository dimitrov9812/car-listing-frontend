import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IOConnectStore } from '@interopio/ng';
import { CarListComponent } from "./car-list/car-list.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CarListComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'Car Listing App';

  constructor(public readonly ioConnectStore: IOConnectStore) { };

  public ngOnInit(): void {
    if (!this.ioConnectStore.getInitError()) {
      const ioConnect = this.ioConnectStore.getIOConnect();
      console.log("Success: Running ioConnect version: " + ioConnect.version)
    } else {
      console.error("Error initializing IOConnect:", this.ioConnectStore.getInitError());
    }
  }
}
