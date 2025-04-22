import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Car } from './interfaces/car.component';

@Injectable({
  providedIn: 'root'
})
export class CarService {
  private apiUrl = 'http://localhost:3000/cars'; // adjust if different

  constructor(private http: HttpClient) {}

  // GET all cars
  getCars(): Observable<Car[]> {
    return this.http.get<Car[]>(this.apiUrl);
  }

  // GET car by ID
  getCarById(id: string): Observable<Car> {
    return this.http.get<Car>(`${this.apiUrl}/${id}`);
  }

  // CREATE a new car
  createCar(car: Car): Observable<Car> {
    return this.http.post<Car>(this.apiUrl, car);
  }

  // UPDATE an existing car
  updateCar(id: string, car: Car): Observable<Car> {
    return this.http.put<Car>(`${this.apiUrl}/${id}`, car);
  }

  // DELETE a car
  deleteCar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
