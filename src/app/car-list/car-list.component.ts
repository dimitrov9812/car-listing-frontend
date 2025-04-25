import { Component, OnInit, signal } from '@angular/core';
import * as Interop from '@interopio/desktop';
import { CarService } from './car.service';
import { Car } from './interfaces/car.component';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { IoConnectService } from '../interop/ioConnect.service';
import { IOConnectWorkspaces } from '@interopio/workspaces-api';
import { IOConnectSearch } from '@interopio/search-api';
import * as IoCore from '@interopio/core';
import { IOConnectCore } from '@interopio/core';

@Component({
  selector: 'car-list',
  imports: [CommonModule, MatTableModule, MatButtonModule],
  templateUrl: './car-list.component.html',
  styleUrl: './car-list.component.scss'
})
export class CarListComponent implements OnInit {
    public cars = signal<Car[]>([]);
    public selectedCarId = signal<string | null>(null as string | null);
    public selectedCarMakeDropdown = signal<string>('Audi');
    public workspaces = signal<IOConnectWorkspaces.API | null>(null);
    public currentWorkspace = signal<IOConnectWorkspaces.Workspace | null>(null);
    public inWorkspace = signal<boolean>(false);
    public ioLogger = signal<IoCore.IOConnectCore.Logger.API | null>(null);

    public displayedColumns = ['id', 'make', 'model', 'price', 'type', 'publisher', 'actions'];
    public carPriceSubscription: IoCore.IOConnectCore.Interop.Subscription | null = null;
    
    
    constructor(private _carService: CarService,
                private _ioConnectService: IoConnectService) { };

    public ngOnInit(): void {
        this.registerMethods();
        this.loadCars();
        this.getWorkspaces();
        this.isInWorkspaceCheck();
        this.subscribeToPriceStream(this.selectedCarMakeDropdown());
        this.registerSearchProvider();
        this.registerLogger();
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

    public onMakeSelected(event: Event) {
        const selectedMake = (event.target as HTMLSelectElement).value;
        this.selectedCarMakeDropdown.set(selectedMake);
        console.log('Selected make signal updated to:', selectedMake);

        this.subscribeToPriceStream(selectedMake);

        // Unsubscribe from the previous subscription if it exists
        if (this.carPriceSubscription) {
            this.carPriceSubscription.close();
            this.carPriceSubscription = null;
        }

        // Subscribe to the new price stream
        this.subscribeToPriceStream(this.selectedCarMakeDropdown())
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

    private subscribeToPriceStream(carMake: string): void {
        const requestArguments = {
            "carMake": (carMake != null || carMake != undefined) ? carMake : this.selectedCarMakeDropdown()
        }

        this._ioConnectService
            .getIoConnect()
            .interop
            .subscribe('Demo.LastTradesStream', {arguments: requestArguments})
            .then((subscription: IoCore.IOConnectCore.Interop.Subscription) => {
                console.log("Subscription to price stream created:", subscription);
                console.log("Request argumets:", subscription.requestArguments);
                this.carPriceSubscription = subscription;
                this.carPriceSubscription.onData((carData) => {
                    // console.log("Price stream data:", carData.data);
                    // console.log(this.cars());
                    console.log(carData.data)

                    this.cars.update(prevCars => {
                        prevCars.forEach((car: any) => {
                            if (car?.make === carData.data.carMake) {
                                const element: any = document.querySelector('.price-box-' + car.id); // or use getElementsByClassName

                                if (element) {
                                    const origStyle = element.style;

                                    element.style.color = 'white';

                                    if (car.price > carData.data.lastPrice) {
                                        element.style.backgroundColor = 'red';
                                        this.raiseNotification(car.price, carData.data.lastPrice, car.make, "smaller", car.id);
                                    } else {
                                        element.style.backgroundColor = 'green';
                                        this.raiseNotification(car.price, carData.data.lastPrice, car.make, "bigger", car.id);
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

    private raiseNotification(oldPrice: string, newPrice: string, make: string, type: "bigger" | "smaller", carId: string): void {
        this._ioConnectService
            .getIoConnect()
            .notifications
            .raise({
                title: "Price change for " + make,
                body: "Price changed from: " + oldPrice + " -> to: " + newPrice + " and is now " + type.toUpperCase(),
                icon: "https://cdn-icons-png.flaticon.com/512/25/25694.png",
                actions: [
                    {
                        action: "carListViewCar",
                        title: "View Car",
                        // interop: {
                        //     method: "DEMO.SyncCars",
                        //     arguments: {
                        //         id: this.selectedCarId()
                        //     }
                        // }
                    },
                    {
                        action: "carListCloseNotification",
                        title: "Close Notification",
                    }
                ]
            }).then((notification: any) => {
                const notific = notification as Interop.IOConnectDesktop.Notifications.Notification;

                notific.onaction = (actionEvent: Interop.IOConnectDesktop.Notifications.ActionEvent) => {
                    console.log("ACTION:", actionEvent);
                    if (actionEvent.action === "carListViewCar") {

                    }


                }
            }).catch((error) => {
                console.error("Error raising notification:", error);
            });
    }

    private registerSearchProvider(): void {
        console.log("HERE");
        const ioSearch: IOConnectSearch.API = (this._ioConnectService.getIoConnect() as any).search;
        console.log("Search provider:", ioSearch);
        console.log(ioSearch.listProviders());
        console.log(ioSearch.listTypes());

        ioSearch
        .registerProvider({
            name: "my-search-provider",
            types: [
                {
                    name: "accounts",
                    displayName: "Accounts"
                }
            ]
        }).then((newProvider) => {
            console.log("Search provider registered:", newProvider);
            newProvider.onQuery((query) => {
                console.log("Search query received:", query);
                return this.cars().forEach((car: any) => {
                    return query.sendResult({
                        id: `${Math.random() * 1000 + Date.now()}`,
                        type: {
                            name: "action",
                            displayName: "Action"
                        },
                        displayName: `View car details: ${car.make} ${car.model}`,
                        description: `This will open the car details for ${car.make} ${car.model} with car id: ${car.id}`,
                        iconURL: "https://cdn-icons-png.flaticon.com/512/25/25694.png",
                        action: {
                            method: "demo.synccarlistsearchprovider",
                            params: {
                                id: car.id
                            }
                        }
                    });
                });
            });

            console.log("List of providers now: ", ioSearch.listProviders());
        }).then((x) => {
            console.log("HERE 2:", x);
        }).catch((error) => {
            console.error("Error registering search provider:", error);
        });
    }

    private registerMethods(): void {
        const methodName = "demo.synccarlistsearchprovider";
        const methodHandler = ({ id }: { id: string }) => {
            this.selectCar(id);
        };

        this._ioConnectService
            .getIoConnect()
            .interop
            .register(methodName, methodHandler);
    }

    private registerLogger(): void {
        const ioLogger = this._ioConnectService
                           .getIoConnect()
                           .logger
                           .subLogger('[APP-COMPONENT]');

        this.ioLogger.set(ioLogger);

        this.ioLogger()?.log("Logger attached to app-component successfully.", "info");
        this.ioLogger()?.info("Logger attached to app-component successfully with logger.info() method instance.")
        this.ioLogger()?.debug("Test debug message from app-component logger.");
        this.ioLogger()?.warn("Test warning message from app-component logger.");
        this.ioLogger()?.error("Test error message from app-component logger 23.");

        console.log(this.ioLogger()?.publishLevel("debug"));

        this.ioLogger()?.log("Logger attached to app-component successfully.", "info");
        this.ioLogger()?.info("Logger attached to app-component successfully with logger.info() method instance.")
        this.ioLogger()?.debug("Test debug message from app-component logger.");
        this.ioLogger()?.warn("Test warning message from app-component logger.");
        this.ioLogger()?.error("Test error message from app-component logger 23.");
    }
}
