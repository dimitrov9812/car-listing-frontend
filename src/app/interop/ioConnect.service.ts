import { Injectable } from '@angular/core';
import { IOConnectStore } from '@interopio/ng';

@Injectable({
  providedIn: 'root'
})
export class IoConnectService {
  constructor(public readonly ioConnectStore: IOConnectStore) {}
}