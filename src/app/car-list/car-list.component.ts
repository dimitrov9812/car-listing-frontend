import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CarService } from './car.service';
import { Car } from './interfaces/car.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'car-list',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './car-list.component.html',
  styleUrl: './car-list.component.scss'
})
export class CarListComponent implements OnInit {
    cars = signal<Car[]>([]);
    
    constructor(private _carService: CarService) { };

    public ngOnInit(): void {
        this.loadCars();
    }

    public loadCars(): void {
        this._carService.getCars().subscribe(data => {
          this.cars.set(data);
        });
    }
    
    // public addCar(): void {
    //     const completeCar: Car = {
    //         ...this.newCar,
    //         features: this.generateEmptyFeatures(),
    //         pictures: [],
    //         publisher: {
    //         id: crypto.randomUUID(),
    //         firstName: 'John',
    //         lastName: 'Doe',
    //         displayName: 'JohnD',
    //         phone: '+123456789',
    //         address: 'Some Street 123',
    //         profilePicture: ''
    //         }
    //     } as Car;

    //     this._carService.createCar(completeCar).subscribe(created => {
    //         this.cars.update(cars => [...cars, created]);
    //         this.resetForm();
    //     });
    // }

    public deleteCar(id: string): void {
        this._carService.deleteCar(id).subscribe(() => {
            this.cars.update(cars => cars.filter(car => car.id !== id));
        });
    }

    // public resetForm() {
    //     this.newCar = {
    //         make: '',
    //         model: '',
    //         type: '',
    //         features: {},
    //         pictures: [],
    //         publisher: {
    //         id: '',
    //         firstName: '',
    //         lastName: '',
    //         displayName: '',
    //         phone: '',
    //         address: '',
    //         profilePicture: ''
    //         }
    //     };
    // }

    // private generateEmptyFeatures(): { [key: string]: boolean } {
    //     const keys = [
    //         "airConditioning", "sunroof", "heatedSeats", "bluetooth",
    //         "backupCamera", "cruiseControl", "laneAssist", "parkingSensors",
    //         "keylessEntry", "remoteStart", "leatherSeats", "navigationSystem",
    //         "appleCarPlay", "androidAuto", "blindSpotMonitor", "adaptiveHeadlights",
    //         "fogLights", "alloyWheels", "tintedWindows", "sportPackage"
    //     ];
    //     return Object.fromEntries(keys.map(k => [k, false]));
    // }
}
