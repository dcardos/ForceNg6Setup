import { Component } from '@angular/core';
import { SalesforceApiService } from './sf-api-service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
    constructor(private _sfApi: SalesforceApiService) {

    }

    title = 'app';

    ngOnInit() {
        this._sfApi.helloAngular("fellow enthusiast").subscribe((name) => {
            this.title = name;
        });
    }
}
