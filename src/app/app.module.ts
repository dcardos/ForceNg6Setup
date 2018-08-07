import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { SalesforceHashLocationStrategy } from './util/sf-path-location-strategy';
import { LocationStrategy } from '@angular/common';
import { StaticPathPipe } from './pipes/static-path.pipe';
import { SalesforceApiService } from './sf-api-service';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent,
    StaticPathPipe
  ],
  imports: [
    BrowserModule
  ],
  providers: [
      SalesforceApiService,
      {
          provide: LocationStrategy,
          useClass: SalesforceHashLocationStrategy
      }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
