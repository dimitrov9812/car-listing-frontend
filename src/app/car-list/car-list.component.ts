import { Component, OnInit, signal } from '@angular/core';
import { CarService } from './car.service';
import { Car } from './interfaces/car.component';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { IoConnectService } from '../interop/ioConnect.service';
import { IOConnectWorkspaces } from '@interopio/workspaces-api';

@Component({
  selector: 'car-list',
  imports: [CommonModule, MatTableModule, MatButtonModule],
  templateUrl: './car-list.component.html',
  styleUrl: './car-list.component.scss'
})
export class CarListComponent implements OnInit {
    public cars = signal<Car[]>([]);
    public selectedCarId = signal<string | null>(null as string | null);
    public workspaces = signal<IOConnectWorkspaces.API | null>(null);
    public currentWorkspace = signal<IOConnectWorkspaces.Workspace | null>(null);
    public inWorkspace = signal<boolean>(false);

    public displayedColumns = ['id', 'make', 'model', 'price', 'type', 'publisher', 'actions'];
    
    
    constructor(private _carService: CarService,
                private _ioConnectService: IoConnectService) { };

    public ngOnInit(): void {
        this.loadCars();
        this.getWorkspaces();
        this.isInWorkspaceCheck();
        this.subscribeToPriceStream();
    }

    public loadCars(): void {
        this._carService.getCars().subscribe(data => {
          console.log('cars loaded:', data);
          this.cars.set(data);
        });
    }

    public deleteCar(id: string): void {
        this._carService.deleteCar(id).subscribe(() => {
            this.cars.update(cars => cars.filter(car => car.id !== id));
        });
    }

    public viewCar(event: any, id: string): void {
        // Prevent deselecting the row
        event.stopPropagation();

        console.log("CALLING INTENT");
        this._ioConnectService
            .getIoConnect()
            .intents
            .raise({
                intent: "DEMO.ShowCarDetails",
                target: { app: "car-details-app" },
                context: {
                    type: "CAR",
                    data: {
                        id: id
                    }
                }
            });
        
        if (this.selectedCarId() == id) {
            return;
        }
    
        this.selectedCarId.set(id);
    }

    // Function to handle selection
    public selectCar(id: string): void {        
        if (this.selectedCarId() === id) {
            this.inWorkspace() ?
                this.selectCarByWorkspaceContext(null) :
                this.selectCarByMethod(null);
            
           
            return;
        }

        this.inWorkspace() ?
            this.selectCarByWorkspaceContext(id) :
            this.selectCarByMethod(id);
    }

    // Check if a car is selected
    public isSelected(id: string): boolean {
        return this.selectedCarId() === id;
    }

    private selectCarByMethod(id: string | null): void {
        console.log("Select car by method:", id);
        this.selectedCarId.set(id);
        this._ioConnectService
            .getIoConnect()
            .interop
            .invoke("DEMO.SyncCars", {id: id});
    }

    private selectCarByWorkspaceContext(id: string | null): void {
        this.selectedCarId.set(id);
        console.log("setting workspace context to car id:", id);
        this?.currentWorkspace()?.updateContext({
            type: "CAR",
            data: {
                id: id
            }
        });
    }

    private getWorkspaces(): void {
        const workspaces = this._ioConnectService.getIoWorkspaces();
        if (workspaces) {
            this.workspaces.set(workspaces);

            workspaces.inWorkspace().then((workspace: any) => {
                workspaces.getMyWorkspace().then((workspace: any) => {
                    console.log("Current workspace:", workspace);
                    this.currentWorkspace.set(workspace);
                    
                    this.handleInitialWorkspaceContext();
                    this.subscribeToContextChanges();
                });
            }).catch((error: any) => {
                console.error("Error getting current workspace:", error);
            });
        } else {
            console.error("Workspaces API is not available.");
        }
    }

    private handleInitialWorkspaceContext(): void {
        this.currentWorkspace()
            ?.getContext()
            .then((context: any) => {
                console.log("Initial workspace context:", context);
                if (context.type === "CAR") {
                    this.selectedCarId.set(context.data.id);
                } else {
                    this.selectedCarId.set(null);
                }
            });
    }

    private subscribeToContextChanges(): void {
        this.currentWorkspace()
            ?.onContextUpdated((context: any) => {
                console.log("Workspace context changed:", context);
                if (context.type === "CAR") {
                    this.selectedCarId.set(context.data.id);
                } else {
                    this.selectedCarId.set(null);
                }
            });
    }

    private isInWorkspaceCheck(): void {
        this._ioConnectService.getIoConnect().workspaces?.inWorkspace().then((x) => {
            this.inWorkspace.set(x);
        }).catch(() => {
            console.error("Error checking if in workspace");
        });
    }

    private subscribeToPriceStream(): void {
        this._ioConnectService
            .getIoConnect()
            .interop
            .subscribe('Demo.LastTradesStream')
            .then((subscription) => {
                subscription.onData((carData) => {
                    console.log("Price stream data:", carData.data);
                    console.log(this.cars());

                    this.cars.update(prevCars => {
                        prevCars.forEach((car: any) => {
                            if (car?.make === carData.data.carMake) {
                                console.log("MATCH");
                                const element: any = document.querySelector('.price-box-' + car.id); // or use getElementsByClassName

                                if (element) {
                                    const origStyle = element.style;

                                    element.style.color = 'white';

                                    if (car.price > carData.data.lastPrice) {
                                        element.style.backgroundColor = 'red';
                                    } else {
                                        element.style.backgroundColor = 'green';
                                    }

                                    setTimeout(() => {
                                        element.style = origStyle;
                                    }, 1000); // 1 second
                                }
                                
                                car.price = carData.data.lastPrice;
                            }
                        });

                        return prevCars;
                    })
                });
            });
    }
}
