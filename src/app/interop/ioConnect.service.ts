import { Injectable } from '@angular/core';
import { IOConnectStore } from '@interopio/ng';
import { IOConnectDesktop } from "@interopio/desktop";
import { IOConnectBrowser } from "@interopio/browser";
import { IOConnectWorkspaces } from '@interopio/workspaces-api';
import IOSearch from '@interopio/search-api';

@Injectable({
  providedIn: 'root'
})
export class IoConnectService {
  constructor(public readonly ioConnectStore: IOConnectStore) {}
  
  public getIoConnect(): IOConnectDesktop.API | IOConnectBrowser.API {
    return this.ioConnectStore.getIOConnect();
  }

  public getIoWorkspaces(): IOConnectWorkspaces.API | undefined {
    return this.getIoConnect().workspaces;
  }

  // public getIoSearch(): IOConnectWorkspaces.API | undefined {
  // }
}