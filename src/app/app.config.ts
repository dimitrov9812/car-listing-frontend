import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { IOConnectNg } from "@interopio/ng";
import IODesktop from "@interopio/desktop";
import { provideHttpClient } from '@angular/common/http';
import IOConnectWorkspaces from '@interopio/workspaces-api';
import IOSearch from '@interopio/search-api';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(),
    importProvidersFrom(
      IOConnectNg.forRoot({
        holdInit: true,
        desktop: {
          factory: IODesktop,
          config: {
            libraries: [IOConnectWorkspaces, IOSearch]
          }
        },
      })
    )
  ],
};
