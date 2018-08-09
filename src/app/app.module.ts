import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { SalesforceHashLocationStrategy } from './util/sf-path-location-strategy';
import { LocationStrategy } from '@angular/common';
import { StaticPathPipe } from './pipes/static-path.pipe';
import { SalesforceApiService } from './sf-api-service';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatCardModule, MatGridListModule, MatToolbarModule, MatButtonModule, MatSidenavModule, MatIconModule, MatListModule, MatMenuModule, MatExpansionPanel, MatExpansionModule, MatFormFieldModule, MatInputModule } from '@angular/material';
import { MainNavComponent } from './main-nav.component';
import { LayoutModule } from '@angular/cdk/layout';
import { TaxasDashboardComponent } from './taxas-dashboard/taxas-dashboard.component';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
    declarations: [
        AppComponent,
        StaticPathPipe,
        MainNavComponent,
        TaxasDashboardComponent
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        MatCardModule,
        MatGridListModule,
        LayoutModule,
        MatToolbarModule,
        MatButtonModule,
        MatSidenavModule,
        MatIconModule,
        MatListModule,
        MatMenuModule,
        MatExpansionModule,
        MatFormFieldModule,
        MatInputModule,
        ReactiveFormsModule
    ],
    providers: [
        SalesforceApiService,
        {
            provide: LocationStrategy,
            useClass: SalesforceHashLocationStrategy
        }
    ],
    bootstrap: [MainNavComponent]
})
export class AppModule { }
